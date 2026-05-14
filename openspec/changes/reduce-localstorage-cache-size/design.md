## Context

The app uses two localStorage keys: `rss-reader-session` (read status + settings) and `rss-reader-log-cache` (cached GitHub log file data). Combined they frequently exceed the ~5MB browser quota.

The log cache stores full `SiteLogData` which includes `items` with `title`, `description`, `link`, `source` — fields only needed during the initial merge-to-store phase, not for cache lookup. Only `itemId`, `pubDate`, `readAt` (and `title` for historical items) are needed after caching.

## Goals / Non-Goals

**Goals:**
- Reduce per-file log cache entry size by stripping unused fields before caching
- Compress all localStorage entries with lz-string for additional savings
- Backward compatible: existing uncompressed data is read correctly
- Graceful degradation if compression fails or quota is still exceeded

**Non-Goals:**
- Not changing the in-memory data structures or GitHub API payloads
- Not compressing in-memory Zustand state (only localStorage persistence)
- Not adding a compression progress UI or user-visible settings

## Decisions

### 1. Strip cached items to essential fields only
`LogItem` has fields: `itemId`, `title`, `pubDate`, `readAt`, `description`, `link`, `source`. The cache is read by `listSiteFiles()` → `mergeItemsIntoBucket()` during commit dedup — only `itemId` is checked. `title` and `pubDate` are used by `getLogItemsForSite()` only during the initial merge (before caching). Strip `description`, `link`, `source` from each cached `LogItem` in `cacheLogFile()`.

**Alternatives considered:**
- Strip to only `itemId` — but `title` and `pubDate` are small and may be useful for debugging/logging
- No stripping — simpler but doesn't reduce cache size

### 2. Use lz-string for compression
[lz-string](https://github.com/pieroxy/lz-string) is a well-maintained library designed specifically for localStorage compression. It provides synchronous `compress`/`decompress` methods that return strings directly storable in localStorage. ~3KB minified.

**Alternatives considered:**
- `pako` (gzip) — larger library, async API, overkill for this use case
- Native `CompressionStreams` — async, not universally supported, requires extra buffering
- No compression — insufficient; stripping alone may not bring data under quota

### 3. Prefix compressed values with a magic marker
Write compressed data with a leading `::lz::` prefix. On read, check for the prefix. If present, strip and decompress. If absent, return raw JSON (backward compatibility with existing uncompressed data). This avoids the need for migration scripts.

### 4. Wrap localStorage I/O in a single utility module
Create `src/utils/compressed-storage.ts` with `compressedGetItem(key)`, `compressedSetItem(key, value)` functions. Both `log-cache.ts` and `readerStore.ts` import from this module instead of calling `localStorage.*` directly.

## Risks / Trade-offs

- **[CPU overhead] Compression/decompression adds ~1ms per read/write.** Unnoticeable at human timescales (only runs on refresh/commit).
- **[Backward compat] Uncompressed data from prior sessions must be readable.** Mitigated by the `::lz::` prefix check — raw JSON is returned as-is.
- **[lz-string size] Adds ~3KB to bundle.** Minimal impact; the vendor chunk is already ~145KB.
- **[Quota still exceeded] Stripping + compression may not be enough for extreme datasets.** Mitigated by existing try-catch wrappers that gracefully degrade.