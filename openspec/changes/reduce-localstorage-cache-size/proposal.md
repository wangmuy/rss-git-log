## Why

localStorage has a ~5MB per-origin quota. The app stores both `rss-reader-session` (read status) and `rss-reader-log-cache` (cached log file data) in localStorage. With thousands of items across multiple sites, the combined data frequently exceeds the quota, causing warnings and commit failures. The cache stores full item data (title, description, link) which is never needed after initial merge — only itemId, pubDate, and readAt are used for commit dedup.

## What Changes

- Strip unnecessary fields (title, description, link, source) from log items before caching in `rss-reader-log-cache`, keeping only fields needed for commit dedup (itemId, pubDate, readAt)
- Apply lz-string compression to both `rss-reader-session` and `rss-reader-log-cache` localStorage entries to further reduce footprint
- Add `lz-string` as a dependency
- Wrap read/write through compression helpers so existing uncompressed data is handled gracefully (backward compatibility)

## Capabilities

### New Capabilities
- `compressed-local-storage`: Transparent read/write compression for localStorage entries used by the app, with automatic fallback for existing uncompressed data.

### Modified Capabilities
- *(none — no existing spec-level behavior changes)*

## Impact

- `src/utils/log-cache.ts`: Strip item fields before caching; use compressed storage helpers
- `src/store/readerStore.ts`: Use compressed storage helpers for session persistence
- `package.json`: Add `lz-string` dependency
- All localStorage entries (`rss-reader-session`, `rss-reader-log-cache`) will be compressed