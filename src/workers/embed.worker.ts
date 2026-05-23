// @ts-ignore
import { PGlite } from 'https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.4.5/dist/index.min.js';
// @ts-ignore
import { vector } from 'https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.4.5/dist/vector/index.min.js';
// @ts-ignore
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0/dist/transformers.min.js';

let db: PGlite | null = null;
let dbPort: MessagePort | null = null;
let embedPipeline: any = null;
let pendingEmbeds: Array<{ id: string; text: string }> = [];

// ── Init ──────────────────────────────────────────────
async function handleInit(payload: any) {
  if (db) {
    console.log('[W2] already initialized, skipping duplicate init');
    self.postMessage({ seq: payload.seq, type: 'DB_READY' });
    return;
  }
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
  await db.exec('CREATE EXTENSION IF NOT EXISTS vector');
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
    embedPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      progress_callback: (progress: any) => {
        if (progress.status === 'progress' && typeof progress.progress === 'number') {
          const pct = Math.min(Math.round((progress.progress || 0) * 100), 100);
          self.postMessage({ type: 'STATUS', status: 'MODEL_LOADING', progress: pct });
          console.log(`[W2] model loading: ${pct}%`);
        }
      }
    });
    console.log('[W2] model ready');
    self.postMessage({ type: 'STATUS', status: 'MODEL_READY' });
    // Drain pending queue — embed items that arrived before model was ready
    if (pendingEmbeds.length > 0) {
      const batch = pendingEmbeds.splice(0);
      console.log(`[W2] draining ${batch.length} pending embeds`);
      handleEmbedFromChannel(batch).then(() => {
        console.log(`[W2] drain complete, all ${batch.length} pending requests processed`);
        self.postMessage({ type: 'STATUS', status: 'DRAIN_COMPLETE' });
      });
    }
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
  if (!db) return;
  if (!embedPipeline) {
    // Model not loaded yet — queue for later processing
    pendingEmbeds.push(...items);
    console.log(`[W2] queued ${items.length} items for later embedding (pending: ${pendingEmbeds.length})`);
    return;
  }
  console.log(`[W2] embedding ${items.length} items from W1 channel`);
  let skipped = 0;
  let embedded = 0;
  for (const [idx, item] of items.entries()) {
    try {
      // Skip if already embedded (embeddings are expensive — compute once per item)
      const exists = await db.query(
        `SELECT 1 FROM embeddings WHERE item_id = $1`,
        [item.id]
      );
      if (exists.rows && exists.rows.length > 0) {
        skipped++;
        continue;
      }
      const output = await embedPipeline(item.text, { pooling: 'mean', normalize: true });
      const vector = arrayToVectorString(Array.from(output.data));
      await db.query(
        `INSERT INTO embeddings (item_id, embedding) VALUES ($1, $2)`,
        [item.id, vector]
      );
      embedded++;
      if (embedded % 10 === 0 || embedded === 1) {
        console.log(`[W2] embed progress: ${embedded}/${items.length - skipped} (${idx + 1}/${items.length} total)`);
      }
    } catch (e: any) {
      console.error('[W2] embed error for', item.id?.slice(0, 20), e?.message?.slice(0, 60));
    }
  }
  if (skipped > 0) console.log(`[W2] skipped ${skipped} already-embedded items`);
  console.log(`[W2] done embedding ${embedded} new items`);
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
    const ids = (res.rows ?? []).map((r: any) => r.item_id);
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