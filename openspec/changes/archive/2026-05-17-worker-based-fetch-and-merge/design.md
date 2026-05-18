## Context

`getLogItemsForSite` in `log-file.ts` lists a GitHub directory, then reads each log file in batches of 6 via `asyncPool`. Each file read involves: cache check (localStorage), fetch from GitHub (async), JSON parse, cache write (lz-string compress). After fetching, `mergeGitHubReadStatus` iterates all items to build a Map, and `addHistoricalItems` filters and adds to the store. These CPU-bound steps (JSON parse, lz-string, Set/Map building) block the main thread.

## Goals / Non-Goals

**Goals:**
- Keep the UI responsive during refresh by moving log file processing to a Web Worker
- Show unread count incrementally as historical files are processed
- Worker communicates with the main thread via `postMessage` with progress events
- Worker uses the existing `GitProvider` interface (config passed as data, no localStorage)
- Backward compatible: no change to store API or UI components

**Non-Goals:**
- Not moving RSS feed fetching to a worker (the feed fetch is one HTTP call, trivial)
- Not changing the store data model or commit flow
- Not adding a new UI component for progress (existing loading state suffices)

## Decisions

### 1. Worker receives config and siteId, returns processed results
The worker is created when `refresh` starts. Main thread sends `{ config, siteId }` to the worker. The worker:
1. Lists the GitHub directory via `GitProvider.listDirectory`
2. Reads each file in batches, checking a local in-memory cache (no localStorage access)
3. For each file batch: sends `{ type: 'batch', items, historicalItems }` to main thread
4. When done: sends `{ type: 'done', githubItems }` with the full map

**Alternatives considered:**
- Single monolithic postMessage at the end — no incremental progress
- Worker accesses localStorage directly — Workers can't access localStorage

### 2. Main thread merges incrementally on each progress event
On each `batch` message from the worker, the main thread:
1. Calls `addHistoricalItems` for the batch (adds to store)
2. Calls `mergeGitHubReadStatus` for the batch (updates read status)
3. Calls `getUnreadCount` and `updateSite` to show the updated count

This gives the user immediate feedback as each batch is processed.

### 3. Worker bundles its own `GitProvider` instance
The worker imports the same `src/utils/git-provider.ts` module. Vite bundles it as a separate chunk via `new Worker(new URL('./workers/fetch-worker.ts', import.meta.url), { type: 'module' })`. The worker receives the config via the initial message.

### 4. No localStorage in the worker
The worker cannot access localStorage. Log file caching (`cacheLogFile`) is done on the main thread when results arrive. The worker reads files fresh from GitHub each time (the main thread caches them on receipt).

## Risks / Trade-offs

- **[Bundle size]** Worker code adds a separate chunk (~5-10KB). Acceptable.
- **[Serialization cost]** Items passed between worker and main thread via structured clone. For thousands of items, serialization could add ~10-50ms per batch. Trade-off is worthwhile against keeping the main thread free.
- **[Cache warmup]** Worker can't access localStorage cache, so the first fetch always hits GitHub. Once results reach the main thread, they're cached for the next request. Acceptable — the cache is a performance optimization, not correctness.
- **[Worker availability]** Web Workers require the page to be served over HTTP(S) with proper MIME types. Dev server and GitHub Pages both satisfy this.