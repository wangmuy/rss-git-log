## 1. Worker Implementation

- [ ] 1.1 Create `src/workers/fetch.worker.ts` that receives `{ config, siteId }`, creates a `GitProvider`, lists directory, reads files in batches, and posts results
- [ ] 1.2 Worker reads files in batches (concurrency 6), posts `{ type: 'batch', items, historicalItems }` for each batch
- [ ] 1.3 Worker posts `{ type: 'done', githubItems }` when all files are processed
- [ ] 1.4 Worker skips individual file failures and continues

## 2. Main Thread Integration

- [ ] 2.1 Replace `getLogItemsForSite` call in `useRSSFeeds.ts` refresh function with worker creation
- [ ] 2.2 On each `batch` message: call `addHistoricalItems` + `mergeGitHubReadStatus` + update unread count
- [ ] 2.3 On `done` message: finalize count, terminate worker
- [ ] 2.4 Add `yieldToMain()` between batches on the main thread

## 3. Update processQueue (initial load)

- [ ] 3.1 Replace `getLogItemsForSite` call in `processQueue` with worker invocation (same pattern as refresh)

## 4. Cleanup

- [ ] 4.1 Build & test pass
- [ ] 4.2 Verify UI stays responsive during worker processing (no unresponsive page)