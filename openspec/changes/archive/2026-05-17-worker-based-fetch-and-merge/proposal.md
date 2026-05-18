## Why

During page refresh with large unread counts, the page becomes unresponsive for multiple seconds. The unread count shows 0 for a long time while historical log files are fetched from GitHub, parsed, cached (lz-string compression), and merged into the store — all on the main thread. This creates a poor UX where the user sees "Loading feeds..." or stale count 0 for 10+ seconds.

## What Changes

- Move `getLogItemsForSite` (fetching, parsing, compressing log files) to a Web Worker so the main thread stays free for UI rendering
- Add progress reporting from the worker so the store can update the unread count incrementally as each batch of historical files is processed
- The worker receives `GitProviderConfig` and `siteId`, fetches files via the `GitProvider` interface, processes them, and posts results back to the main thread
- Main thread merges results incrementally (update count after each batch) instead of atomically at the end

## Capabilities

### New Capabilities
- `worker-based-fetching`: Web Worker that handles log file fetching, parsing, caching, and returns processed results to the main thread with progress updates

### Modified Capabilities
- *(none)*

## Impact

- `src/utils/git-provider.ts`: The `GitProvider` interface and `GitHubProvider` class need to be usable inside a Worker (no localStorage access — config passed as data)
- `src/utils/log-cache.ts`: Caching with lz-string happens in the worker, results sent back to main thread
- `src/hooks/useRSSFeeds.ts`: `getLogItemsForSite` call replaced with worker invocation; results merged incrementally
- `src/utils/log-file.ts`: `getLogItemsForSite` may need to be split into worker-compatible chunks
- Bundle size increases by the worker code (separate chunk via `?worker` import)