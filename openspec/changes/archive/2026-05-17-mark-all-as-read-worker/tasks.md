## 1. Worker Implementation

- [x] 1.1 Create `src/workers/mark-all-read.worker.ts` that receives items + readStatus, generates IDs, serializes, compresses, and returns result
- [x] 1.2 Worker returns `{ siteId, compressed, itemIds }` to main thread

## 2. Component Integration

- [x] 2.1 Replace sync `markSiteAsRead` call in `SidebarFeedLayout` with async worker invocation
- [x] 2.2 Set `setSiteLoading(siteId, true)` before worker starts, clear on completion
- [x] 2.3 On worker response: store compressed data in localStorage, update store readStatus + unreadCount
- [x] 2.4 Add semi-transparent overlay with `CircularProgress` over `FeedListPane` during processing

## 3. Cleanup

- [x] 3.1 Verify worker chunk is bundled separately (5.69KB at `dist/assets/mark-all-read.worker-*.js`)
- [x] 3.2 Full build & test pass