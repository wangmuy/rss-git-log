## 1. Worker Implementation

- [x] 1.1 Create `src/workers/fetch.worker.ts` that receives `{ config, siteId }`, creates a `GitProvider`, lists directory, reads files in batches, and posts results
- [x] 1.2 Worker reads files in batches (concurrency 6), posts `{ type: 'batch', items }` for each batch
- [x] 1.3 Worker posts `{ type: 'done', items }` when all files are processed
- [x] 1.4 Worker skips individual file failures and continues

## 2. Main Thread Integration

- [x] 2.1 Replace `getLogItemsForSite` call in `useRSSFeeds.ts` refresh function with `fetchWithWorker` helper
- [x] 2.2 On each `batch` message: accumulate items (incremental); on `done`: process with `addHistoricalItems` + `mergeGitHubReadStatus` + update count
- [x] 2.3 On `done` message: finalize count, terminate worker
- [x] 2.4 Worker batches inherently yield between batches (`postMessage` boundary)

## 3. Update processQueue (initial load)

- [x] 3.1 Replace `getLogItemsForSite` call in `processQueue` with `fetchWithWorker` (same pattern as refresh)

## 4. Cleanup

- [x] 4.1 Full build & test pass
- [ ] 4.2 Verify UI stays responsive during worker processing