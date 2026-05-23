## Context

The current `PGliteStore` runs a single `PGlite` instance on the main thread. Every `ItemStore` method calls `this.db.query()` directly on the main thread. The `~*` regex search blocks the UI for 400-600ms because PGlite's WASM execution is synchronous under the async API.

The search currently uses `~*` (case-insensitive regex) because `ILIKE`, `LOWER()`, and parameterized `LIKE` with `%` patterns all proved unreliable in PGlite v0.4.5. This is substring-only matching — it cannot find semantically related content.

## Goals / Non-Goals

**Goals:**
- Move all PGlite database operations off the main thread into Web Workers
- Add semantic search via pglite-vector embedding model (m2v-potion-base-8m, 384-dim)
- Implement three-tier search fallback: vector → tsvector → `~*`
- Separate concerns: text DB (W1) and vector DB (W2) in independent workers with separate IndexedDB databases
- Fire-and-forget embedding: W1 INSERTs text + tsvector, relays embed request to W2 via MessageChannel (no ack needed)
- Show model download progress in the search field
- Cache the 30MB model in the browser Cache API

**Non-Goals:**
- Backward compatibility with existing IndexedDB databases
- Supporting the localStorage provider's search (unchanged)
- HNSW indexes for vector search
- Multi-language support beyond zh/en for tsvector
- W2 crash detection or auto-restart

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          Main Thread                                     │
│                                                                          │
│  PGliteStore (ItemStore proxy)                                           │
│    init()      ──► new Worker('db.worker.ts')                           │
│                  ──► new Worker('embed.worker.ts')                      │
│                  ──► MessageChannel(W1 ↔ W2)                            │
│                  ──► await W1 reply(DB_READY)                           │
│                  ──► await W2 reply(DB_READY)                           │
│                                                                          │
│    upsertItems(items)                                                    │
│      ──► W1: INSERT items + to_tsvector()                               │
│      ──► await W1 reply(UPSERT_DONE)                                    │
│      W1 ──channel──► W2: { embed: items }  (fire-and-forget, no ack)    │
│                                                                          │
│    search(query)                                                         │
│      if modelReady:                                                      │
│        ──► W2: vectorSearch(text) → embed query + search → item_id[]    │
│        ──► W1: fetchDetails(item_ids) → return results                  │
│      else (text-only search):                                            │
│        ──► W1: tsvector query                                            │
│        ──► if tsvector fails: W1 ~* regex query                          │
│                                                                          │
│    markAsRead / isRead / getUnreadCount / getItemsForCommit              │
│      ──► W1 only                                                         │
│                                                                          │
│    clear()                                                               │
│      ──► W1: DROP + CREATE items table                                  │
│      ──► W2: DROP + CREATE embeddings table                              │
│      ──► await both, then terminate both workers                         │
│      (model stays in Cache API)                                          │
│                                                                          │
│  SidebarFeedLayout · SearchBox                                           │
│    └── model progress bar during download (from W2)                      │
│    └── search tier badge (vector / text / regex)                         │
│                                                                          │
└──────────┬────────────────────────────────────┬──────────────────────────┘
           │ postMessage                        │ postMessage
           ▼                                    ▼
┌──────────────────────────┐   ┌────────────────────────────────┐
│  Worker 1: db.worker.ts  │   │  Worker 2: embed.worker.ts      │
│                          │   │                                │
│  PGlite('idb://rss-reader')│  │  PGlite('idb://rss-vectors')  │
│  ext: fts                 │   │  ext: vector                  │
│                          │   │  + Transformers.js             │
│  CREATE TABLE items (    │   │                                │
│    id TEXT PRIMARY KEY,  │   │  CREATE TABLE embeddings (     │
│    item_id TEXT NOT NULL,│   │    item_id TEXT PRIMARY KEY,   │
│    site_id TEXT NOT NULL,│   │    embedding vector(384)       │
│    guid, title, link,    │   │  )                             │
│    description, pub_date,│   │                                │
│    is_read, read_at,     │   │  Message Router:               │
│    created_at timestamp       │                                 │
│  )                            │                                 │
│  idx_items_fts GIN            │                                 │
│                               │                                 │
│  Message Router:              │  Message Router:                │
│    init → PGlite.create()     │    init → PGlite.create()       │
│         + ext + schema        │         + CREATE EXTENSION      │
│         + post DB_READY       │         + CREATE TABLE          │
│                               │         + post DB_READY         │
│    upsert → INSERT items      │         + start model download  │
│           + to_tsvector()     │         + post MODEL_LOADING..  │
│           + UPSERT_DONE       │         + post MODEL_READY      │
│           + channel → W2      │                                 │
│                               │    embed → pipeline(text)       │
│    search → tsvector $1       │           → vector              │
│           → regex ~*          │           → INSERT embedding    │
│                               │           (fire-and-forget)     │
│    fetchDetails → SELECT      │                                 │
│       WHERE item_id IN        │    vectorSearch → pipeline(q)   │
│                               │                 → SELECT       │
│    markRead, isRead,          │                   item_id,      │
│    unread, commit, clear      │                   embedding <=> │
│                               │                   $1 LIMIT 30   │
│                               │                 → return        │
│                               │                   item_id[]     │
│                               │                                 │
│                               │    clear → DROP + CREATE        │
│                               │           (model NOT cleared)   │
│  ╔══ MessageChannel ═══╗│   │  ╔══ MessageChannel ═══╗      │
│  ║                      ║│   │  ║                      ║      │
│  ║  Receive embed items ║│   │  ║  Receive embed items ║      │
│  ║  → channel → W2      ║│   │  ║  ← channel from W1  ║      │
│  ║                      ║│   │  ║                      ║      │
│  └──────────────────────────┘  └──────────────────────────╝      │
└──────────────────────────┘   └────────────────────────────────┘
```

## Flow Diagrams

### Upsert Flow

```
upsertItems(siteId, [itemA, itemB])
       │
       ▼
  Main ──► W1: { type: 'upsert', siteId, items }
       │
       ▼
  W1: INSERT INTO items (...) VALUES (...)
      ON CONFLICT DO UPDATE ...
      to_tsvector() computed synchronously per row
      lang detected via CJK regex
       │
       ├── ──► main: { UPSERT_DONE }
       │   main thread unblocks, UI shows items
       │
       └── channel ──► W2: { embed: [{ id, text }] }
           (fire-and-forget, no ack expected)
           
           W2: for each item:
               vector = await pipeline(text, { pooling: 'mean', normalize: true })
               INSERT INTO embeddings (item_id, embedding) VALUES (id, $vector)
               ON CONFLICT DO UPDATE SET embedding = $vector
```

### Search Flow

```
search("neural networks")
       │
       ▼
  Main ──► W2: { type: 'vectorSearch', text: "neural networks" }
  W2: vector = pipeline("neural networks", ...)
  W2: SELECT item_id FROM embeddings
      ORDER BY embedding <=> $1 ASC
      LIMIT 30
  W2 ──► main: [item_id_1, item_id_2, ...]
       │
       ▼
  Main ──► W1: { type: 'fetchDetails', ids: [...] }
  W1: SELECT item_id, site_id, title, description, pub_date
      FROM items WHERE item_id = ANY($1)
  W1 ──► main: [{ title, description, score, ... }]
       │
       ▼
  main returns SearchResult[]
```

Text-only search (model not ready):

```
  Main ──► W1: { type: 'search', query: "neural networks" }
  W1: try tsvector:
        SELECT ... WHERE search_vector @@ to_tsquery(config, $1)
        ORDER BY ts_rank() DESC LIMIT 20
      catch:
        SELECT ... WHERE title ~* $1 OR description ~* $1 LIMIT 20
  W1 ──► main: SearchResult[]
```

### Combined Search Decision

```
search("neural networks")
       │
       ▼
  modelReady? (from W2 status)
  ┌────┴────┐
 YES        NO
  │          │
  ▼          ▼
 vector    W1: try tsvector
 search      │ catch
  │          ▼
  │         W1: ~* regex
  │
  2 hops (embed → vectorSearch)
  │   + 1 hop (fetchDetails)
  ▼
 return merged results
```

### Clear Flow

```
clear()
  Main ──► W1: { type: 'clear' }
  Main ──► W2: { type: 'clear' }
  await W1 reply(CLEAR_DONE)
  await W2 reply(CLEAR_DONE)
  terminate W1, terminate W2
```

## Database Schemas

### W1: `idb://rss-reader` — items table

```sql
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
);

CREATE INDEX IF NOT EXISTS idx_items_site ON items(site_id);
CREATE INDEX IF NOT EXISTS idx_items_read ON items(is_read);
CREATE INDEX IF NOT EXISTS idx_items_pub_date ON items(pub_date DESC);
CREATE INDEX IF NOT EXISTS idx_items_fts ON items USING gin(search_vector);
```

### W2: `idb://rss-vectors` — embeddings table

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS embeddings (
  item_id TEXT PRIMARY KEY,
  embedding vector(384)
);
```

## Request/Response Bridge (Main Thread → Workers)

```typescript
class PGliteStore implements ItemStore {
  private dbWorker: Worker;        // W1
  private embedWorker: Worker;      // W2
  private pending = new Map<number, { resolve, reject }>();
  private seq = 0;

  async init() {
    this.dbWorker = new Worker(/* db.worker.ts */);
    this.embedWorker = new Worker(/* embed.worker.ts */);

    // Wire response handler for both workers
    const handler = (e: MessageEvent) => {
      const { seq, type, error, ...data } = e.data;
      if (seq != null) {
        const p = this.pending.get(seq);
        if (!p) return;
        this.pending.delete(seq);
        error ? p.reject(new Error(error)) : p.resolve(data);
      } else if (type === 'STATUS') {
        if (data.status === 'MODEL_LOADING') this.onProgress?.(data.progress);
        if (data.status === 'MODEL_READY') this.onModelReady?.();
      }
    };
    this.dbWorker.onmessage = handler;
    this.embedWorker.onmessage = handler;

    // Create MessageChannel between workers (main thread relays the ports)
    const channel = new MessageChannel();
    this.dbWorker.postMessage({ type: 'init', embedPort: channel.port1 }, [channel.port1]);
    this.embedWorker.postMessage({ type: 'init', dbPort: channel.port2 }, [channel.port2]);

    await Promise.all([
      this.request('init', { worker: this.dbWorker }),
      this.request('init', { worker: this.embedWorker }),
    ]);
  }

  private request(worker: Worker, type: string, payload?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const seq = ++this.seq;
      this.pending.set(seq, { resolve, reject });
      worker.postMessage({ seq, type, ...payload });
    });
  }

  upsertItems(siteId, items) {
    return this.request(this.dbWorker, 'upsert', { siteId, items });
  }

  async search(query: string, siteId?: string): Promise<SearchResult[]> {
    // Try vector search if model is ready
    if (this._modelReady) {
      try {
        const idsResp = await this.request(this.embedWorker, 'vectorSearch', { text: query });
        if (idsResp.ids.length > 0) {
          const details = await this.request(this.dbWorker, 'fetchDetails', { ids: idsResp.ids });
          return details.items;
        }
      } catch { /* fall through */ }
    }

    // Text search on W1 (tsvector → ~*)
    const textResp = await this.request(this.dbWorker, 'search', { query, siteId });
    return textResp.items;
  }

  clear() {
    return Promise.all([
      this.request(this.dbWorker, 'clear'),
      this.request(this.embedWorker, 'clear'),
    ]);
  }
}
```

## MessageChannel Between Workers

The main thread creates a `MessageChannel` and transfers one port to each worker during init:

```typescript
// Main thread
const channel = new MessageChannel();
dbWorker.postMessage({ type: 'init', embedPort: channel.port1 }, [channel.port1]);
embedWorker.postMessage({ type: 'init', dbPort: channel.port2 }, [channel.port2]);
```

W1 receives the port and uses it to send embed requests:

```typescript
// db.worker.ts — after upsert INSERT succeeds
self.onmessage = async (e) => {
  if (e.data.type === 'init') {
    embedPort = e.data.embedPort;  // MessagePort for W2
    // ... init PGlite ...
  }
  if (e.data.type === 'upsert') {
    // ... INSERT items ...
    self.postMessage({ seq: e.data.seq, type: 'UPSERT_DONE' });
    // Fire-and-forget: send items to W2 for embedding
    embedPort.postMessage({
      type: 'embed',
      items: e.data.items.map(item => ({
        id: item.itemId,
        text: `${item.title} ${item.description || ''}`
      }))
    });
  }
};
```

W2 receives the port and listens for embed requests on it:

```typescript
// embed.worker.ts
self.onmessage = async (e) => {
  if (e.data.type === 'init') {
    dbPort = e.data.dbPort;  // MessagePort from W1 (not used for ack)
    // ... init PGlite + model ...
  }
};

// Listen for incoming embed requests from W1
dbPort.onmessage = async (e) => {
  if (e.data.type === 'embed') {
    for (const item of e.data.items) {
      const output = await pipeline(item.text, { pooling: 'mean', normalize: true });
      const vector = `[${Array.from(output.data).join(',')}]`;
      await db.query(
        `INSERT INTO embeddings (item_id, embedding) VALUES ($1, $2)
         ON CONFLICT (item_id) DO UPDATE SET embedding = $2`,
        [item.id, vector]
      );
    }
  }
};
```

## Language Detection

Applied in W1 at upsert time:

```typescript
function detectLang(text: string): 'en' | 'zh' {
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  return 'en';
}
```

```sql
INSERT INTO items (..., lang, search_vector)
VALUES (..., $lang,
  to_tsvector(
    CASE WHEN $lang = 'zh' THEN 'simple' ELSE 'english' END,
    title || ' ' || description
  )
)
```

## Search Progress UX

W2 reports model download progress to the main thread:

```
W2 ──► Main: { type: 'STATUS', status: 'MODEL_LOADING', progress: <0-100> }
W2 ──► Main: { type: 'STATUS', status: 'MODEL_READY' }
```

SearchBox shows:
- Mini progress bar during download (replaces search icon)
- ✦ icon when vector search active ("Semantic search")
- "Aa" icon when tsvector active ("Full-text search")
- `.*` icon when regex active ("Regex search")

## Decisions

| Decision | Choice | Alternatives |
|---|---|---|
| Worker count | Two workers (W1: text DB, W2: vector DB + model) | Single worker (blocks search during bulk embed) |
| W1↔W2 communication | MessageChannel, fire-and-forget embed | Main thread relay (extra coordination), W2→W1 ack (useless signal) |
| Embedding timing | After INSERT, via channel, no ack | Pre-embed (blocks upsert), inline (blocks search) |
| Database isolation | Separate IndexedDB per worker | Shared DB (sync issues, schema coupling) |
| W2 vector search output | Returns `item_id[]`, W1 fetches details | W2 joins to items table (needs shared DB) |
| Search fallback order | vector → tsvector → `~*` | vector → `~*` only |
| Model | m2v-potion-base-8m (384-dim, multilingual) | all-MiniLM-L6-v2 (en-only) |
| Language detection | Simple CJK regex in W1 | NLP library, user-specified |
| Model persistence | Browser Cache API (Transformers.js default) | IndexedDB, Service Worker |
| Vector index | Sequential scan (`ORDER BY <=>`) | HNSW (overhead for <5000 items) |

## Risks / Trade-offs

- **[Risk] Two PGlite WASM instances increase memory** → ~10-20MB overhead beyond data. Acceptable on desktop.
- **[Risk] W2 model download fails** → Vector search unavailable. Text search (tsvector/~*) on W1 still works. SearchBox shows tier badge indicating which search is active.
- **[Risk] W2 crashes (OOM, model error)** → W2 terminates silently, no automatic restart. `PGliteStore._modelReady` stays false. Text search continues on W1. User can refresh to restart.
- **[Risk] MessageChannel buffer overflow with large batch** → W1 batches embed requests (max 5 items per channel message) to avoid flooding W2 before it processes them.
- **[Trade-off] Vector search requires 3 message hops** → ~3ms overhead on top of ~50ms for actual vector search. Negligible.
- **[Trade-off] No backward compatibility** → Both IndexedDB databases are recreated. Acceptable for non-production use.
- **[Trade-off] Sequential vector scan O(n)** → Acceptable for <5000 items (~50ms). HNSW can be added later.
- **[Risk] `to_tsvector()` fails in PGlite** → Caught and falls through to `~*` regex. Same pattern as current LOWER/ILIKE handling.