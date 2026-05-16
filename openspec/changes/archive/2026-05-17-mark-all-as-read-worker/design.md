## Context

`markSiteAsRead` in `readerStore.ts` synchronously iterates all items, generates IDs, serializes the entire readStatus to JSON, and compresses it with lz-string — all inside a Zustand `set()` callback. This blocks the main thread for seconds with thousands of items.

## Goals / Non-Goals

**Goals:**
- Move item ID generation, JSON serialization, and lz-string compression to a Web Worker
- Show a loading overlay on the right panel to block interaction during processing
- Reuse the existing `setSiteLoading` / `loadingSites` infrastructure for the sidebar spinner
- Worker returns both compressed data (for localStorage) and item IDs (for store update)

**Non-Goals:**
- Not changing the store's public API — worker invocation is handled in the component
- Not modifying the underlying readStatus data model or localStorage format

## Decisions

### 1. Worker handles all CPU-bound work
The worker receives items, existing readStatus (serialized as arrays), and settings. It generates all item IDs via `generateItemId`, builds the new readStatus object, JSON.stringify's it, and lz-string compresses it. Returns the compressed string + list of item IDs.

### 2. Component manages worker lifecycle
The `handleMarkAllAsRead` callback in `SidebarFeedLayout` creates the worker, posts data, awaits the response, updates the store and localStorage, then terminates the worker. Loading state is set via `setSiteLoading` before and cleared after.

### 3. Right panel overlay blocks interaction
When `loadingSites[selectedSite.siteId]` is true, a semi-transparent overlay with a centered `CircularProgress` is rendered over the `FeedListPane`. This prevents clicks and keyboard events from reaching the feed items.

## Risks / Trade-offs

- **[Worker availability]** Web Workers require proper MIME types. Dev server and GitHub Pages both satisfy this.
- **[Extra chunk]** The worker adds a 5.69KB separate bundle chunk. Acceptable.