## 1. Dependency & Utility Setup

- [x] 1.1 Install `lz-string` npm package
- [x] 1.2 Create `src/utils/compressed-storage.ts` with `compressedGetItem` and `compressedSetItem` using `::lz::` prefix marker and try-catch fallback
- [x] 1.3 Add unit tests for `compressed-storage.ts` (write compressed, read compressed, read uncompressed legacy, error fallback)

## 2. Strip Unnecessary Fields from Log Cache

- [x] 2.1 Modify `cacheLogFile` in `src/utils/log-cache.ts` to strip `description`, `link`, `source` from each item before caching
- [x] 2.2 Update log-cache tests to verify stripped caching

## 3. Apply Compression to Log Cache

- [x] 3.1 Replace `localStorage.getItem`/`localStorage.setItem` calls in `log-cache.ts` (`saveCache`, `loadCache`) with `compressedGetItem`/`compressedSetItem`
- [x] 3.2 Update log-cache tests to verify compressed storage

## 4. Apply Compression to Session Storage

- [x] 4.1 Replace `localStorage.setItem` in all `readerStore.ts` save points (`markAsRead`, `markSiteAsRead`, `markAllAsRead`, `mergeGitHubReadStatus`, `saveToLocalStorage`) with `compressedSetItem`
- [x] 4.2 Replace `localStorage.getItem` in `loadFromLocalStorage` with `compressedGetItem`