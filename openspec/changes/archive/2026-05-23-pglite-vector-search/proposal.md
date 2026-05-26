## Why

The current PGlite search uses `~*` regex on the main thread, blocking the UI for 400-600ms per query. It's substring-only — searching "AI conference" won't find "machine learning summit". Moving all PGlite operations to a Web Worker and adding vector embeddings via pglite-vector would eliminate main-thread blocking and enable semantic search.

## What Changes

- **Two Web Workers** — W1 (PGlite + fts, handles text ops: upsert text/tsvector, markRead, tsvector/~* search, fetch details). W2 (PGlite + vector + Transformers.js, handles embeddings and vector search). Main thread PGliteStore dispatches to both.
- **Separate IndexedDB databases** — W1 uses `idb://rss-reader` for the items table. W2 uses `idb://rss-vectors` for a minimal embeddings table (`item_id TEXT PK, embedding vector(384)`). No shared database between workers.
- **MessageChannel between workers** — W1 relays embed requests to W2 via a direct MessageChannel (fire-and-forget, no ack needed). Main thread is not a relay for embedding traffic.
- **Vector search path** — Main → W2 (embed query → vector) → W2 returns `item_id[]` → Main → W1 (fetch details by IDs). Vector model stays in W2 only.
- **Three-tier search fallback** — vector (W2, model ready) → tsvector (W1, always) → `~*` regex (W1, last resort).
- **Asynchronous embedding** — W1 INSERTs items + computes `to_tsvector()` → sends fire-and-forget embed request to W2 via MessageChannel. W2 pipelines + INSERTs embedding asynchronously. No coordination signal back to W1.
- **Model caching with progress UX** — 30MB model downloads once in W2 (browser Cache API), shows loading progress in the search field.
- **Language detection** — simple regex on article text for `to_tsvector()` config (zh → simple, en → english), runs in W1.
- **No backward compatibility** — existing IndexedDB data is recreated on first init. New schemas for both databases.

## Capabilities

### New Capabilities
- `web-worker-search`: Move all PGliteStore operations to a dedicated Web Worker, keeping the main thread responsive
- `semantic-vector-search`: Semantic search using embedding vectors with pgvector extension (pglite-vector)
- `tsvector-fulltext-search`: tsvector-based full-text search as middle-tier fallback
- `embedding-model-lifecycle`: Download, cache, and lifecycle management of the static embedding model
- `search-progress-ux`: User-facing indicators for model download progress and search tier status

### Modified Capabilities

- `< existing>`: no requirement changes — existing functionality is replaced in-place, no external API changes

## Impact

- `src/stores/pglite-store.ts` — rewritten from direct PGlite calls to Worker proxy. Dispatches to both W1 and W2.
- `src/stores/item-store.ts` — `upsertItems` input extended with optional `lang` field. `SearchResult` may gain `score` and `searchType` fields.
- `src/workers/db.worker.ts` — new Web Worker (W1) with PGlite + fts extension. Items table with `search_vector tsvector`. Handles INSERT, markRead, tsvector/~* search, commit queries, fetchDetails by IDs. 
- `src/workers/embed.worker.ts` — new Web Worker (W2) with PGlite + vector extension + Transformers.js. Minimal embeddings table. Handles `pipeline()` embedding generation, `INSERT INTO embeddings`, vector search.
- `src/components/SidebarFeedLayout.tsx` — SearchBox updated to show model download progress and active search tier.
- `package.json` — added dependency: `@electric-sql/pglite/vector`, `@xenova/transformers`.
- Build config — ESM-compatible import path for Transformers.js in W2. No new stubs needed.
- IndexedDB — two databases: `idb://rss-reader` (W1) and `idb://rss-vectors` (W2). Both recreated on init. No migration.