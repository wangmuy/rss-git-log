## Context

The app currently stores all data in localStorage with three keys: `rss-reader-app-config`, `rss-reader-session` (read status, lz-string compressed), and `rss-reader-log-cache` (cached log file data, per-entry lz-string compressed). Each write to `rss-reader-session` requires decompressing the entire blob, modifying one entry, and re-compressing — the **compression tax**. Despite compression, the 5MB quota can be exceeded with many items.

PGlite embeds PostgreSQL in WASM with IndexedDB persistence (`idb://`), no COOP/COEP headers needed, and no compression required. It supports full-text search via `tsvector`/`tsquery` and vector search via `pgvector`.

## Goals / Non-Goals

**Goals:**
- Define `ItemStore` interface covering all item CRUD, read status, search, and commit operations
- Implement `LocalStorageStore` wrapping existing localStorage code with per-entry lz-string compression; add MiniSearch for FTS
- Implement `PGliteStore` using PGlite with idb://; no compression; native PostgreSQL FTS; pgvector ready
- Add config toggle between backends
- Switch clears local state and re-syncs from GitHub
- All components use `useItemStore()` hook — no direct storage access outside the interface

**Non-Goals:**
- Not changing the GitHub commit flow (`commitAllFeedItems` still writes directly to GitHub)
- Not adding SharedWorker initially (per-tab Worker suffices for 99% of usage)
- Not implementing vector search UI yet (pgvector support is structural only)

## Decisions

### 1. ItemStore interface — the contract

```typescript
interface ItemRecord {
  itemId: string; siteId: string; title: string; link: string;
  description: string; pubDate: string; isRead: boolean; readAt?: string;
}

interface SearchResult {
  itemId: string; siteId: string; title: string; snippet: string;
  pubDate: string; rank: number;
}

interface ItemStore {
  init(): Promise<void>;
  clear(): Promise<void>;
  upsertItems(siteId: string, items: ItemRecord[]): Promise<void>;
  markAsRead(siteId: string, itemId: string): Promise<void>;
  markSiteAsRead(siteId: string): Promise<void>;
  markAllAsRead(): Promise<void>;
  isRead(siteId: string, itemId: string): Promise<boolean>;
  getUnreadCount(siteId: string): Promise<number>;
  getAllUnreadCounts(): Promise<Record<string, number>>;
  search(query: string, siteId?: string): Promise<SearchResult[]>;
  getItemsForCommit(siteId: string): Promise<Array<{itemId, title, pubDate, readAt?}>>;
}
```

All methods are async (both backends need async). The keyboard handler (`isRead` check) currently makes synchronous Set lookups — this needs to become an async call, which means the keyboard handler needs to be async-aware.

**Alternatives considered:**
- Sync `isRead` with an in-memory cache + lazy DB sync — adds cache invalidation complexity
- Blocking WASM calls — not possible with PGlite's async API

### 2. LocalStorageStore — wraps existing code + MiniSearch

```
Storage:
  rss-reader-session:     lz-string compressed, per-entry (unchanged)
  rss-reader-log-cache:   per-entry lz-string compressed (unchanged)
  rss-reader-app-config:  uncompressed (unchanged)

Search:
  MiniSearch instance rebuilt from items on init()
  ~8KB gzipped, pure JS, no WASM
  Indexes title + description

Compression:
  Per-entry lz-string on session items and cache entries.
  Same as current implementation.
```

`LocalStorageStore` essentially wraps the existing `readerStore` actions + `log-cache` functions into the interface. `search()` builds a MiniSearch index from the in-memory items.

### 3. PGliteStore — new storage backend

```
Storage:
  IndexedDB via idb:// prefix
  Tables: items, items_fts (tsvector), items_vec (future)

Compression:
  None. PostgreSQL pages are efficient; IndexedDB compression is handled by the browser.

Search:
  Native PostgreSQL FTS via tsvector/tsquery
  SELECT item_id, title, ts_headline(description, query) AS snippet
  FROM items, to_tsvector('english', title || ' ' || description) @@ plainto_tsquery('english', ?)
  ORDER BY ts_rank(...) DESC LIMIT 20

Migrations:
  CREATE TABLE IF NOT EXISTS items (...)
  CREATE INDEX IF NOT EXISTS ...
  -- ALTER TABLE for schema upgrades (versioned)
```

### 4. Config toggle — switch clears, no migration

A new `storeProvider` field in `AppConfig`:

```typescript
interface AppConfig {
  ...
  itemStore: {
    provider: 'localstorage' | 'pglite';
  };
}
```

The Config page shows a radio/dropdown. Switching providers:
1. Shows a warning dialog ("This will clear all local data and re-sync from GitHub")
2. Calls `currentStore.clear()`
3. Saves new config
4. Triggers a full page reload — on next load, `init()` runs on the new store, syncs all data from GitHub afresh

No data is migrated between backends. GitHub is the source of truth — a full re-sync restores everything. This avoids migration complexity, PGlite version compatibility issues (see issue #874), and keeps both backends independent.

The default is `'localstorage'` for backward compatibility.

### 5. Per-tab Worker (not SharedWorker initially)

PGlite runs in a Worker to avoid blocking the main thread. Each tab gets its own Worker + its own PGlite instance. For the common case (one tab), this is identical to a SharedWorker. For multiple tabs, each tab has its own IndexedDB connection which is safe (IDB handles concurrent access).

SharedWorker can be added later if multi-tab write concurrency becomes an issue.

### 6. Keyboard handler async adaptation

The `FeedListPane` keyboard handler currently checks `unreadItemIdSet.has(itemId)` synchronously. With the async `ItemStore`, this needs to change. The `unreadItemIdSet` is precomputed in a `useMemo` — this becomes a `useEffect` that rebuilds the Set asynchronously when the store updates.

### 7. GitHub commit path unchanged

`commitAllFeedItems` in `log-file.ts` reads from the store via `getItemsForCommit(siteId)` and writes to GitHub. The write path remains the same — the ItemStore only changes how data is stored locally, not how it's synced to GitHub.

## Risks / Trade-offs

- **[Bundle size] PGlite adds ~3MB gzipped WASM.** Only loaded when `provider === 'pglite'`. Lazy-loaded on first toggle or on app init if PGlite is the configured provider.
- **[Perf regression] `isRead` becomes async.** The keyboard handler currently does synchronous Set lookup. Async overhead is negligible (~1ms for IDB), but the code change is non-trivial (effect → rebuild Set).
- **[Data loss on switch] Switching providers clears local state.** Mitigated by warning dialog and full page reload — GitHub is the source of truth, re-sync restores everything.
- **[PGlite maturity] PGlite is early-stage (frequent breaking changes, see issue #874).** Mitigated by keeping localStorage as the default and making PGlite opt-in.