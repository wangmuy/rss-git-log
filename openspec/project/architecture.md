# Architecture

## Bounded Contexts

```
+--------------------+     +----------------------+
|       FEED         |     |    PERSISTENCE        |
|                    |     |                      |
| rss-parser.ts      |     | github-api.ts        |
| feed-parser.ts     |     | git-provider.ts      |
| opml.ts            |     | log-file.ts          |
| types/rss.ts       |     | types/git.ts         |
| SubscriptionManager|     | types/log.ts         |
+---------+----------+     +----------+-----------+
          |                           |
          |  fetch feeds              |  read/write logs + config
          v                           v
+-------------------+       +-------------------+
|       UI          |       |     STORAGE        |
|                   |       |                   |
| components/       |       | stores/           |
| hooks/            |       | compressed-storage |
| App.tsx           |       | log-cache.ts       |
| store/readerStore |       +---------+---------+
+-------------------+                 |
      |                               |
      |  render state                 |  query items
      v                               v
+------------------------------------------+
|              STATE                        |
|                                           |
| Zustand readerStore.ts                    |
| ItemStore interface (localstorage/pglite) |
+------------------------------------------+
```

## Data Flow

```
1. Feed Fetching
   Browser SPA / GitHub Action
        |
        v
   fetch(url) with CORS proxy fallback
        |
        v
   feed-parser.ts (DOMParser / linkedom)
        |
        +---> RSSFeed[] returned to UI
        |
        +---> log-file.ts: commitAllFeedItems()
                  |
                  v
              GitProvider.createCommit()
                  |
                  v
              GitHub REST API v3 (Git Data API)

2. Read Status
   User clicks item
        |
        v
   readerStore.ts: markAsRead(itemId)
        |
        +---> localStorage (session)
        |
        +---> log-file.ts: commitReadStatus() (persist)
                  |
                  v
              GitProvider.createCommit() / writeFile()

3. Storage Provider
   ItemStore interface
        |
        +---> LocalStorageStore (lz-string compressed, ~5MB quota)
        |
        +---> PGliteStore (IndexedDB-backed, WASM PostgreSQL, vector search)
                  |
                  v
              Web Worker (db.worker.ts) — all PGlite ops off main thread
```

## Integration Points

| Integration | Protocol | Auth | Notes |
|------------|----------|------|-------|
| GitHub REST API v3 | HTTPS | Personal Access Token (repo scope) | `git-provider.ts` interface; token in localStorage |
| CORS proxies | HTTPS | None (public) | Configurable via in-app Config: direct-only, proxy-fallback, proxy-only |
| GitHub Actions | YAML workflow + Node.js 18 | GITHUB_TOKEN or PAT | Scheduled every 8h; manual dispatch |

## Global Constraints

- **CORS**: Browser enforces CORS — all feed fetching must go through CORS proxy unless the feed server allows cross-origin requests
- **localStorage quota**: ~5MB per origin — compressed-storage and PGlite provide relief
- **Rate limiting**: GitHub API unauthenticated: 60/hr, authenticated: 5000/hr — batch commits minimize calls
- **PGlite v0.4.5**: `LOWER()` and `ILIKE` are unreliable — use `~*` for case-insensitive search

## Domain Map

| Domain | Repo | Team |
|--------|------|------|
| All | single repo (rss-git-log) | single |