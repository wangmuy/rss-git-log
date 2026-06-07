// @ts-ignore
import { PGlite } from 'https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.4.5/dist/index.min.js';

let db: PGlite | null = null;
let embedPort: MessagePort | null = null;

// ── Init ──────────────────────────────────────────────
async function handleInit(payload: any) {
  if (db) {
    console.log('[W1] already initialized, skipping duplicate init');
    self.postMessage({ seq: payload.seq, type: 'DB_READY' });
    return;
  }
  console.log('[W1] init start');
  embedPort = payload.embedPort;

db = new PGlite('idb://rss-reader');
  await db.waitReady;

  console.log('[W1] PGlite ready');

  await db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      site_id TEXT NOT NULL,
      guid TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL DEFAULT '',
      link TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      pub_date TEXT NOT NULL DEFAULT '',
      is_read INTEGER NOT NULL DEFAULT 0,
      read_at TEXT,
      fetched_at TEXT NOT NULL DEFAULT (now()),
      lang TEXT NOT NULL DEFAULT 'en',
      search_vector tsvector
    )
  `);
  await db.exec('CREATE INDEX IF NOT EXISTS idx_items_site ON items(site_id)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_items_read ON items(is_read)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_items_pub_date ON items(pub_date DESC)');
  try {
    await db.exec('CREATE INDEX IF NOT EXISTS idx_items_fts ON items USING gin(search_vector)');
    console.log('[W1] GIN index created');
  } catch {
    console.log('[W1] GIN index not supported, tsvector may be unavailable');
  }

  console.log('[W1] init done');
  self.postMessage({ seq: payload.seq, type: 'DB_READY' });
}

// ── Language Detection ────────────────────────────────
function detectLang(text: string): 'en' | 'zh' {
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  return 'en';
}

// ── Upsert ────────────────────────────────────────────
async function handleUpsert(payload: any) {
  if (!db) return;
  const { siteId, items } = payload;

  // Deduplicate by itemId to avoid PGlite's "ON CONFLICT DO UPDATE cannot affect row a second time"
  const seen = new Set<string>();
  const deduped = items.filter((item: any) => {
    if (seen.has(item.itemId)) return false;
    seen.add(item.itemId);
    return true;
  });

  if (deduped.length !== items.length) {
    console.log(`[W1] upsertItems: deduped ${items.length - deduped.length} duplicates for ${siteId}`);
  }

  console.log(`[W1] upsertItems: ${deduped.length} items for ${siteId}`);

  const BATCH = 20;
  for (let i = 0; i < deduped.length; i += BATCH) {
    const batch = deduped.slice(i, i + BATCH);
    const values: string[] = [];
    const params: any[] = [];
    let idx = 1;

    for (const item of batch) {
      const lang = detectLang((item.title || '') + ' ' + (item.description || ''));
      const text = `${item.title || ''} ${item.description || ''}`;
      values.push(`(md5($${idx}),$${idx},$${idx + 1},$${idx + 2},$${idx + 3},$${idx + 4},$${idx + 5},$${idx + 6},$${idx + 7},$${idx + 8},$${idx + 9},
        CASE WHEN $${idx + 10} = 'zh' THEN to_tsvector('simple', $${idx + 10}) ELSE to_tsvector('english', $${idx + 10}) END
      )`);
      params.push(
        item.itemId, siteId, item.itemId, item.title || '',
        item.link || '', item.description || '', item.pubDate || '',
        item.readAt ? 1 : 0, item.readAt || null, lang, text
      );
      idx += 11;
    }

    try {
      await db.query(
        `INSERT INTO items (id, item_id, site_id, guid, title, link, description, pub_date, is_read, read_at, lang, search_vector)
         VALUES ${values.join(',')}
         ON CONFLICT (id) DO UPDATE SET
           title = COALESCE(NULLIF(EXCLUDED.title, ''), items.title),
           link = COALESCE(NULLIF(EXCLUDED.link, ''), items.link),
           description = COALESCE(NULLIF(EXCLUDED.description, ''), items.description),
           pub_date = COALESCE(NULLIF(EXCLUDED.pub_date, ''), items.pub_date),
           is_read = items.is_read,
           read_at = items.read_at`,
        params
      );
    } catch (e: any) {
      console.error('[W1] batch insert error:', e?.message || e);
      for (const item of batch) {
        try {
          const lang = detectLang((item.title || '') + ' ' + (item.description || ''));
          const text = `${item.title || ''} ${item.description || ''}`;
          await db.query(
            `INSERT INTO items (id, item_id, site_id, guid, title, link, description, pub_date, is_read, read_at, lang, search_vector)
             VALUES (md5($1), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
               CASE WHEN $10 = 'zh' THEN to_tsvector('simple', $11) ELSE to_tsvector('english', $11) END)
             ON CONFLICT (id) DO UPDATE SET
               is_read = items.is_read,
               read_at = items.read_at`,
            [item.itemId, siteId, item.itemId, item.title || '',
             item.link || '', item.description || '', item.pubDate || '',
             item.readAt ? 1 : 0, item.readAt || null, lang, text]
          );
        } catch (e2: any) {
          console.error('[W1] individual insert error:', e2?.message || e2, 'itemId:', item.itemId?.slice(0, 40));
        }
      }
    }
  }

  console.log(`[W1] UPSERT_DONE for ${siteId}: ${deduped.length} items`);
  self.postMessage({ seq: payload.seq, type: 'UPSERT_DONE' });

  // Fire-and-forget: relay items to W2 for embedding
  if (embedPort) {
    embedPort.postMessage({
      type: 'embed',
      items: deduped.map((item: any) => ({
        id: item.itemId,
        text: `${item.title || ''} ${item.description || ''}`
      }))
    });
    console.log(`[W1] relayed ${deduped.length} items to W2 for embedding`);
  } else {
    console.warn(`[W1] embedPort is null, cannot relay ${deduped.length} items to W2`);
  }
}

// ── Search (tsvector → ~*) ───────────────────────────
async function handleSearch(payload: any) {
  if (!db) return;
  const { query, siteId } = payload;
  const t0 = performance.now();
  let rows: any[] = [];

  // Tier 1: try tsvector
  try {
    const lang = detectLang(query);
    const config = lang === 'zh' ? 'simple' : 'english';
    const formattedQuery = query.trim().replace(/\s+/g, ' & ');
    const params: any[] = [formattedQuery, config];  // $1 = formattedQuery, $2 = config
    let sql = `SELECT item_id, site_id, title, description, pub_date
       FROM items
       WHERE search_vector @@ to_tsquery($2, $1)
       ORDER BY ts_rank(search_vector, to_tsquery($2, $1)) DESC
       LIMIT 20`;
    if (siteId) {
      sql = `SELECT item_id, site_id, title, description, pub_date
         FROM items
         WHERE site_id = $3 AND search_vector @@ to_tsquery($2, $1)
         ORDER BY ts_rank(search_vector, to_tsquery($2, $1)) DESC
         LIMIT 20`;
      params.push(siteId);
    }
    const res = await db.query(sql, params);
    rows = res.rows as any[];
    if (rows.length > 0) {
      console.log(`[W1] tsvector search "${query}" found ${rows.length} results (${(performance.now() - t0).toFixed(0)}ms)`);
    }
  } catch (e: any) {
    console.log('[W1] tsvector search failed, falling back to ~*:', e?.message?.slice(0, 60));
  }

  // Tier 2: ~* regex fallback
  if (rows.length === 0) {
    try {
      const escPattern = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "''");
      const siteFilterSql = siteId ? ` AND site_id = '${siteId.replace(/'/g, "''")}'` : '';
      const res = await db.query(
        `SELECT item_id, site_id, title, description, pub_date
         FROM items
         WHERE (title ~* '${escPattern}' OR description ~* '${escPattern}')
         ${siteFilterSql}
         LIMIT 20`
      );
      rows = res.rows as any[];
    } catch (e: any) {
      console.error('[W1] ~* search error:', e?.message || e);
    }
  }

  self.postMessage({
    seq: payload.seq,
    type: 'SEARCH_RESULTS',
    items: rows.map((row: any, i: number) => ({
      itemId: row.item_id,
      siteId: row.site_id,
      title: row.title,
      snippet: (row.description || '').slice(0, 200),
      pubDate: row.pub_date,
      rank: i + 1
    }))
  });
}

// ── Fetch Details (for vector search results) ─────────
async function handleFetchDetails(payload: any) {
  if (!db) return;
  console.log(`[W1] fetchDetails: ${payload.ids?.length} IDs`);
  try {
    const placeholders = payload.ids.map((_: any, i: number) => `$${i + 1}`).join(',');
    const res = await db.query(
      `SELECT item_id, site_id, title, description, pub_date
       FROM items
       WHERE item_id IN (${placeholders})`,
      payload.ids
    );
    self.postMessage({
      seq: payload.seq,
      type: 'FETCH_DETAILS',
      items: (res.rows as any[]).map((row: any, i: number) => ({
        itemId: row.item_id,
        siteId: row.site_id,
        title: row.title,
        snippet: (row.description || '').slice(0, 200),
        pubDate: row.pub_date,
        rank: i + 1
      }))
    });
  } catch (e: any) {
    console.error('[W1] fetchDetails error:', e?.message || e);
    self.postMessage({ seq: payload.seq, type: 'FETCH_DETAILS', items: [] });
  }
}

// ── Mark Read ─────────────────────────────────────────
async function handleMarkRead(payload: any) {
  if (!db) return;
  await db.query('UPDATE items SET is_read = 1, read_at = now() WHERE id = md5($1)', [payload.itemId]);
  self.postMessage({ seq: payload.seq, type: 'MARK_READ_DONE' });
}

async function handleMarkSiteRead(payload: any) {
  if (!db) return;
  await db.query('UPDATE items SET is_read = 1, read_at = now() WHERE site_id = $1', [payload.siteId]);
  self.postMessage({ seq: payload.seq, type: 'MARK_SITE_READ_DONE' });
}

async function handleMarkAllRead() {
  if (!db) return;
  await db.query('UPDATE items SET is_read = 1, read_at = now()');
  // no response needed — fire and forget for markAllAsRead
}

async function handleIsRead(payload: any) {
  if (!db) return;
  try {
    const res = await db.query<{ is_read: number }>('SELECT is_read FROM items WHERE id = md5($1)', [payload.itemId]);
    self.postMessage({ seq: payload.seq, type: 'IS_READ', isRead: res.rows?.[0]?.is_read === 1 });
  } catch {
    self.postMessage({ seq: payload.seq, type: 'IS_READ', isRead: false });
  }
}

async function handleGetUnreadCount(payload: any) {
  if (!db) return;
  try {
    const res = await db.query<{ cnt: number }>('SELECT COUNT(*) AS cnt FROM items WHERE site_id = $1 AND is_read = 0', [payload.siteId]);
    self.postMessage({ seq: payload.seq, type: 'UNREAD_COUNT', count: res.rows?.[0]?.cnt ?? 0 });
  } catch {
    self.postMessage({ seq: payload.seq, type: 'UNREAD_COUNT', count: 0 });
  }
}

async function handleGetAllUnreadCounts(seq: number) {
  if (!db) return;
  try {
    const res = await db.query<{ site_id: string; cnt: number }>('SELECT site_id, COUNT(*) AS cnt FROM items WHERE is_read = 0 GROUP BY site_id');
    const counts: Record<string, number> = {};
    for (const row of res.rows ?? []) counts[row.site_id] = row.cnt;
    self.postMessage({ seq, type: 'ALL_UNREAD_COUNTS', counts });
  } catch {
    self.postMessage({ seq, type: 'ALL_UNREAD_COUNTS', counts: {} });
  }
}

async function handleGetItemsForCommit(payload: any) {
  if (!db) return;
  try {
    const res = await db.query<{ item_id: string; title: string; pub_date: string; read_at: string | null }>(
      'SELECT item_id, title, pub_date, read_at FROM items WHERE site_id = $1',
      [payload.siteId]
    );
    self.postMessage({
      seq: payload.seq,
      type: 'ITEMS_FOR_COMMIT',
      items: res.rows.map((row: any) => ({
        itemId: row.item_id,
        title: row.title,
        pubDate: row.pub_date,
        readAt: row.read_at || undefined
      }))
    });
  } catch {
    self.postMessage({ seq: payload.seq, type: 'ITEMS_FOR_COMMIT', items: [] });
  }
}

async function handleClear(payload: any) {
  if (!db) return;
  await db.exec('DROP TABLE IF EXISTS items CASCADE');
  await db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      site_id TEXT NOT NULL,
      guid TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL DEFAULT '',
      link TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      pub_date TEXT NOT NULL DEFAULT '',
      is_read INTEGER NOT NULL DEFAULT 0,
      read_at TEXT,
      fetched_at TEXT NOT NULL DEFAULT (now()),
      lang TEXT NOT NULL DEFAULT 'en',
      search_vector tsvector
    )
  `);
  await db.exec('CREATE INDEX IF NOT EXISTS idx_items_site ON items(site_id)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_items_read ON items(is_read)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_items_pub_date ON items(pub_date DESC)');
  try { await db.exec('CREATE INDEX IF NOT EXISTS idx_items_fts ON items USING gin(search_vector)'); } catch {}
  console.log('[W1] cleared');
  self.postMessage({ seq: payload.seq, type: 'CLEAR_DONE' });
}

// ── Message Router ────────────────────────────────────
self.onmessage = async (e: MessageEvent) => {
  const { seq, type, ...payload } = e.data;

  try {
    switch (type) {
      case 'init': await handleInit({ seq, ...payload }); break;
      case 'upsert': await handleUpsert({ seq, ...payload }); break;
      case 'search': await handleSearch({ seq, ...payload }); break;
      case 'fetchDetails': await handleFetchDetails({ seq, ...payload }); break;
      case 'markRead': await handleMarkRead({ seq, ...payload }); break;
      case 'markSiteRead': await handleMarkSiteRead({ seq, ...payload }); break;
      case 'markAllRead': await handleMarkAllRead(); break;
      case 'isRead': await handleIsRead({ seq, ...payload }); break;
      case 'getUnreadCount': await handleGetUnreadCount({ seq, ...payload }); break;
      case 'getAllUnreadCounts': await handleGetAllUnreadCounts(seq); break;
      case 'getItemsForCommit': await handleGetItemsForCommit({ seq, ...payload }); break;
      case 'clear': await handleClear({ seq, ...payload }); break;
      default:
        console.warn('[W1] unknown message type:', type);
    }
  } catch (err: any) {
    console.error('[W1] handler error:', type, err?.message || err);
    self.postMessage({ seq, type: 'ERROR', error: err?.message || String(err) });
  }
};