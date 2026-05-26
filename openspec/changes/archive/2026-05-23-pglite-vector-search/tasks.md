## 1. W1: db.worker.ts — Text Database Worker

- [x] 1.1 Create `src/workers/db.worker.ts` with message router handling init, upsert, search (tsvector + ~*), fetchDetails, markRead, isRead, getUnreadCount, getAllUnreadCounts, getItemsForCommit, clear
- [x] 1.2 Implement `handleInit()` in W1: PGlite.create('idb://rss-reader') + fts extension + CREATE TABLE items (with search_vector tsvector, lang) + indexes + receive MessageChannel port from main thread + post DB_READY
- [x] 1.3 Implement `handleUpsert()` in W1: batch INSERT items with `to_tsvector()` computed inline, `lang` detected via CJK regex. Post UPSERT_DONE. Relay embed request to W2 via MessageChannel (fire-and-forget, no ack)
- [x] 1.4 Implement `handleSearch()` in W1: try tsvector (`search_vector @@ to_tsquery(config, $1) ORDER BY ts_rank() DESC`), catch → `~*` regex fallback
- [x] 1.5 Implement `handleFetchDetails()` in W1: SELECT from items WHERE item_id IN (list) — used by vector search to fetch details after W2 returns IDs
- [x] 1.6 Implement remaining W1 handlers: markRead, isRead, getUnreadCount, getAllUnreadCounts, getItemsForCommit, clear

## 2. W2: embed.worker.ts — Vector Database Worker

- [x] 2.1 Create `src/workers/embed.worker.ts` with message router handling init, vectorSearch, clear
- [x] 2.2 Implement `handleInit()` in W2: PGlite.create('idb://rss-vectors') + vector extension + CREATE TABLE embeddings (item_id TEXT PK, embedding vector(384)) + receive MessageChannel port from main thread + start model download via Transformers.js pipeline() + post DB_READY
- [x] 2.3 Implement model download with progress reporting: post `{ type: 'STATUS', status: 'MODEL_LOADING', progress }` to main thread at intervals
- [x] 2.4 Listen on MessageChannel for incoming embed requests from W1: iterate items, call `pipeline(text, { pooling: 'mean', normalize: true })`, INSERT INTO embeddings
- [x] 2.5 Implement `handleVectorSearch()`: pipeline(user query) → vector → SELECT item_id FROM embeddings ORDER BY embedding <=> $1 ASC LIMIT 30 → return item_id[] to main thread
- [x] 2.6 Implement `handleClear()`: DROP + CREATE embeddings table (model NOT cleared from Cache API)

## 3. Main Thread PGliteStore Rewrite

- [x] 3.1 Add `@xenova/transformers` and `@electric-sql/pglite/vector` to `package.json` dependencies
- [x] 3.2 Rewrite `PGliteStore.init()`: spawn W1 + W2, wire shared response handler, create MessageChannel and transfer ports to both workers, await both DB_READY
- [x] 3.3 Implement generic `request(worker, type, payload)` with sequence ID tracking and pending promise map
- [x] 3.4 Implement `upsertItems()`: dispatch to W1 only. W1 handles text INSERT + relays embed to W2
- [x] 3.5 Implement `search()`: if `_modelReady`, dispatch to W2 (`vectorSearch` → ids), then W1 (`fetchDetails`). Else dispatch to W1 (text search with tsvector/~*)
- [x] 3.6 Implement remaining methods as W1-only dispatches: markAsRead, isRead, getUnreadCount, getAllUnreadCounts, getItemsForCommit
- [x] 3.7 Implement `clear()`: dispatch to both W1 and W2, await both, terminate both workers
- [x] 3.8 Wire `onProgress` and `onModelReady` callbacks from W2 status messages
- [x] 3.9 Ensure `resetItemStore()` cleans up both worker references

## 4. Search UX

- [x] 4.1 Add progress bar to SearchBox when MODEL_LOADING is active from W2
- [x] 4.2 Add search tier badge (✦ / Aa / .\*) to SearchBox input adornment
- [x] 4.3 Add tooltip: "Semantic search" / "Full-text search" / "Regex search"
- [x] 4.4 Wire `PGliteStore.onProgress` and `onModelReady` from SidebarFeedLayout to SearchBox props

## 5. Cleanup & Verification

- [x] 5.1 Rewrite `src/stores/pglite-store.ts` — replaced by worker-proxy implementation
- [x] 5.2 Remove `pg_textsearch` import from old pglite-store — integrated into W1 init
- [x] 5.3 Remove diagnostic queries from search path — search runs in worker
- [x] 5.4 Verify `getItemStore()` returns new two-worker PGliteStore without API breakage
- [x] 5.5 Add `worker.format: 'es'` to Vite config for dynamic import support in workers
- [x] 5.6 Add `@xenova/transformers` type declaration for TypeScript
- [x] 5.7 Verify localStorage provider is unaffected (no code changes to localstorage-store.ts)
- [x] 5.8 Verify `useRSSFeeds.ts` calls work correctly with async item store