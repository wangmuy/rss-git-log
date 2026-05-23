import { PGlite } from '@electric-sql/pglite';
import { vector } from '@electric-sql/pglite/vector';

let db: PGlite | null = null;
let dbPort: MessagePort | null = null;
let embedPipeline: any = null;

// ── Init ──────────────────────────────────────────────
async function handleInit(payload: any) {
  console.log('[W2] init start');
  dbPort = payload.dbPort;

  // Listen for incoming embed requests from W1 via MessageChannel
  if (dbPort) {
    dbPort.onmessage = async (ev: MessageEvent) => {
      if (ev.data?.type === 'embed') {
        await handleEmbedFromChannel(ev.data.items || []);
      }
    };
    console.log('[W2] MessageChannel from W1 established');
  }

  db = new PGlite('idb://rss-vectors', { extensions: { vector } });
  await db.waitReady;
  await db.exec(`
    CREATE TABLE IF NOT EXISTS embeddings (
      item_id TEXT PRIMARY KEY,
      embedding vector(384)
    )
  `);
  console.log('[W2] schema ready');

  self.postMessage({ seq: payload.seq, type: 'DB_READY' });

  // Start model download in background
  startModelDownload();
}

async function startModelDownload() {
  try {
    // Use a dynamic import with type assertion for Transformers.js
    const transformers = await import('@xenova/transformers');
    const pipeline = transformers.pipeline;
    embedPipeline = await pipeline('feature-extraction', 'Xenova/m2v-potion-base-8m', {
      progress_callback: (progress: any) => {
        if (progress.status === 'progress' && typeof progress.progress === 'number') {
          const pct = Math.round(progress.progress * 100);
          self.postMessage({ type: 'STATUS', status: 'MODEL_LOADING', progress: pct });
          console.log(`[W2] model loading: ${pct}%`);
        }
      }
    });
    console.log('[W2] model ready');
    self.postMessage({ type: 'STATUS', status: 'MODEL_READY' });
  } catch (e: any) {
    console.error('[W2] model download failed:', e?.message || e);
    self.postMessage({ type: 'STATUS', status: 'MODEL_ERROR', error: e?.message || String(e) });
  }
}

function arrayToVectorString(arr: number[]): string {
  return `[${arr.join(',')}]`;
}

// ── Embed Items (from W1 via MessageChannel) ─────────
async function handleEmbedFromChannel(items: Array<{ id: string; text: string }>) {
  if (!db || !embedPipeline) return;
  console.log(`[W2] embedding ${items.length} items from W1 channel`);
  for (const item of items) {
    try {
      const output = await embedPipeline(item.text, { pooling: 'mean', normalize: true });
      const vector = arrayToVectorString(Array.from(output.data));
      await db.query(
        `INSERT INTO embeddings (item_id, embedding) VALUES ($1, $2)
         ON CONFLICT (item_id) DO UPDATE SET embedding = $2`,
        [item.id, vector]
      );
    } catch (e: any) {
      console.error('[W2] embed error for', item.id?.slice(0, 20), e?.message?.slice(0, 60));
    }
  }
  console.log(`[W2] done embedding ${items.length} items`);
}

// ── Vector Search ────────────────────────────────────
async function handleVectorSearch(payload: any) {
  if (!db || !embedPipeline) return;
  const { text } = payload;
  const t0 = performance.now();
  try {
    const output = await embedPipeline(text, { pooling: 'mean', normalize: true });
    const vector = arrayToVectorString(Array.from(output.data));
    const res = await db.query<{ item_id: string }>(
      `SELECT item_id FROM embeddings ORDER BY embedding <=> $1 ASC LIMIT 30`,
      [vector]
    );
    const ids = (res.rows ?? []).map(r => r.item_id);
    console.log(`[W2] vectorSearch "${text}" found ${ids.length} results (${(performance.now() - t0).toFixed(0)}ms)`);
    self.postMessage({ seq: payload.seq, type: 'VECTOR_SEARCH', ids });
  } catch (e: any) {
    console.error('[W2] vectorSearch error:', e?.message || e);
    self.postMessage({ seq: payload.seq, type: 'VECTOR_SEARCH', ids: [] });
  }
}

// ── Clear ─────────────────────────────────────────────
async function handleClear(payload: any) {
  if (!db) return;
  await db.exec('DROP TABLE IF EXISTS embeddings CASCADE');
  await db.exec(`
    CREATE TABLE IF NOT EXISTS embeddings (
      item_id TEXT PRIMARY KEY,
      embedding vector(384)
    )
  `);
  console.log('[W2] cleared (model cache preserved)');
  self.postMessage({ seq: payload.seq, type: 'CLEAR_DONE' });
}

// ── Message Router (main thread) ─────────────────────
self.onmessage = async (e: MessageEvent) => {
  const { seq, type, ...payload } = e.data;

  try {
    switch (type) {
      case 'init': await handleInit({ seq, ...payload }); break;
      case 'vectorSearch': await handleVectorSearch({ seq, ...payload }); break;
      case 'clear': await handleClear({ seq, ...payload }); break;
      default:
        console.warn('[W2] unknown message type:', type);
    }
  } catch (err: any) {
    console.error('[W2] handler error:', type, err?.message || err);
    self.postMessage({ seq, type: 'ERROR', error: err?.message || String(err) });
  }
};

console.log('[W2] loaded');