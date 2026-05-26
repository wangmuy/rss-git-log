## Why

localStorage has a ~5MB per-origin quota and forces compression tax (decompress → modify → re-compress entire blob on every write). A PGlite-backed store solves both: IndexedDB storage has effectively unlimited quota, and row-level updates avoid serialization overhead entirely. PGlite also unlocks PostgreSQL-grade capabilities: full-text search via FTS5/tsvector, and vector search via pgvector for future "more like this" / semantic search features.

Both backends should coexist behind a common interface, switchable via the Config page, so users can choose based on their needs and browser support.

## What Changes

- Define a common `ItemStore` interface encapsulating all item read/write/search operations
- Implement `LocalStorageStore` wrapping the current localStorage + lz-string per-entry compression — search via MiniSearch (~8KB pure JS FTS)
- Implement `PGliteStore` using PGlite with `idb://` IndexedDB persistence — no compression needed, native PostgreSQL FTS via tsvector, pgvector support for future vector search
- Add `storeProvider` field to `AppConfig` with `'localstorage' | 'pglite'` options
- Add storage provider selector to the Config page
- Wire `useItemStore()` hook throughout the app, replacing direct `readerStore` readStatus + `log-cache` access
- PGlite mode uses a per-tab Worker (SharedWorker can be added later for multi-tab)

## Capabilities

### New Capabilities
- `item-store-interface`: Common interface for item storage with switchable localStorage/PGlite backends
- `pglite-storage`: PGlite-backed item storage with IndexedDB persistence, FTS search, and pgvector support
- `search-ui`: Full-text search bar in the sidebar with results pane (FTS5/tsvector when on PGlite, MiniSearch when on localStorage)

### Modified Capabilities
- *(none)*

## Impact

- `src/stores/item-store.ts` (new): `ItemStore` interface definition
- `src/stores/localstorage-store.ts` (new): `LocalStorageStore` implementing `ItemStore` using existing localStorage + lz-string per-entry compression + MiniSearch
- `src/stores/pglite-store.ts` (new): `PGliteStore` implementing `ItemStore` using PGlite with idb:// persistence — no compression, native FTS
- `src/stores/use-item-store.ts` (new): Hook returning the active store based on config
- `src/hooks/useRSSFeeds.ts`: Use `ItemStore` instead of direct `getLogItemsForSite`/`addHistoricalItems`/`mergeGitHubReadStatus`
- `src/components/ConfigPage.tsx`: Add storage provider selector
- `src/components/SidebarFeedLayout.tsx` / `FeedListPane.tsx`: Use `ItemStore` for `isRead`/`unreadCount` queries
- `src/types/config.ts`: Add `storeProvider: 'localstorage' | 'pglite'` to `AppConfig`
- `src/utils/log-file.ts`: `commitAllFeedItems` continues writing to GitHub directly (not through ItemStore)
- `package.json`: Add `@electric-sql/pglite`, `@electric-sql/pglite-worker`, `minisearch`
- Worker chunk: PGlite adds ~3MB gzipped WASM binary (separate chunk, cached by browser)