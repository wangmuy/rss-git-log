## 1. Core Interface & Types

- [x] 1.1 Define `ItemRecord`, `SearchResult`, `ItemStore` interface in `src/stores/item-store.ts`
- [x] 1.2 Add `storeProvider: 'localstorage' | 'pglite'` field to `AppConfig` in `src/types/config.ts`
- [x] 1.3 Create `useItemStore()` hook in `src/stores/use-item-store.ts` that reads config and returns the active store

## 2. LocalStorageStore Implementation

- [x] 2.1 Implement `LocalStorageStore` in `src/stores/localstorage-store.ts` wrapping existing `readerStore` actions + `log-cache`
- [x] 2.2 Implement `search()` using MiniSearch (~8KB), rebuilding index from in-memory items on `init()`
- [x] 2.3 Wire `LocalStorageStore` into `useItemStore()` as default provider

## 3. PGliteStore Implementation

- [x] 3.1 Add `@electric-sql/pglite` dependency
- [x] 3.2 Implement `PGliteStore` in `src/stores/pglite-store.ts` with PGlite `idb://rss-reader`, migrations, and all `ItemStore` methods
- [x] 3.3 No compression — PostgreSQL pages handle storage efficiency
- [x] 3.4 Load `pgvector` extension and create `items_vec` table (empty, for future use)
- [x] 3.5 Run PGlite in a Worker (two-worker architecture in pglite-vector-search change)
- [x] 3.6 Wire `PGliteStore` into `useItemStore()` for `provider === 'pglite'`

## 4. Config Page Integration

- [x] 4.1 Add storage provider selector (radio/dropdown) to Config page
- [x] 4.2 Add warning dialog when switching providers ("local read history will be cleared")
- [x] 4.3 On confirmed switch: clear current store, save config, reload page (re-init with new store syncs from GitHub)

## 5. App Wiring

- [x] 5.1 Update `useRSSFeeds` to use `ItemStore.upsertItems` instead of `addHistoricalItems` + `mergeGitHubReadStatus`
- [x] 5.2 Update `SidebarFeedLayout` to use `ItemStore.getUnreadCount` for sidebar counts (handled via Zustand sync after upsert)
- [x] 5.3 Update `FeedListPane` to use `ItemStore.isRead` for item read status (handled via Zustand sync after upsert)
- [x] 5.4 Update `useCommit` to use `ItemStore.getItemsForCommit`

## 6. Search UI

- [x] 6.1 Add `minisearch` dependency
- [x] 6.2 Add search bar component at top of sidebar
- [x] 6.3 Add search results pane
- [x] 6.4 Wire search input to `ItemStore.search()`
- [x] 6.5 Clicking a result navigates to the item's site and highlights it

## 7. Cleanup

- [x] 7.1 Full build & test pass
- [x] 7.2 Verify localStorage → PGlite switch works end-to-end
- [x] 7.3 Verify PGlite → localStorage switch works end-to-end
- [x] 7.4 Verify search works in both modes