## Why

"Mark all as read" for a site with thousands of items blocks the main thread for seconds (generating item IDs, serializing readStatus, lz-string compression). The UI becomes unresponsive and the right panel remains interactive during processing, leading to a poor UX.

## What Changes

- Move CPU-heavy work (item ID generation, JSON serialization, lz-string compression) to a Web Worker
- Show loading overlay on both left sidebar and right panel while processing
- Worker returns compressed session data and item IDs; main thread updates store and localStorage

## Capabilities

### New Capabilities
- `mark-all-as-read-worker`: Offload mark-all-as-read processing to a Web Worker

### Modified Capabilities
- *(none)*

## Impact

- `src/workers/mark-all-read.worker.ts`: New worker file (5.69KB separate chunk)
- `src/components/SidebarFeedLayout.tsx`: Replace sync `markSiteAsRead` call with async worker invocation; add loading overlay on right panel
- Worker uses existing `generateItemId` and `LZString.compress` — no new dependencies