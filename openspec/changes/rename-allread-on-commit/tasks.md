## 1. Inline allread Rename in mergeItemsIntoBucket

- [x] 1.1 After `writeToGitHubWithProvider` succeeds in `mergeItemsIntoBucket`, check if `siteLogData.items.every(i => i.readAt)` (fully read)
- [x] 1.2 Also check the file's date — skip rename if the file date is today (extract date from `targetFile` path, compare to today's date)
- [x] 1.3 If fully read AND not today's file, call `renameToAllread(targetFile)` — best-effort, log errors but don't fail the write
- [x] 1.4 Rename happens immediately per file, not deferred after all buckets finish

## 2. Rename Fully-Read Files During Fetch

- [x] 2.1 In `getLogItemsForSite`, after reading each log file's data, check if all items have `readAt` AND the file date is not today
- [x] 2.2 If so, call `renameToAllread(filePath)` — best-effort, log errors but don't fail the fetch
- [x] 2.3 This handles existing historical files that are already fully read but never got renamed

## 3. Fix renameToAllread to Actually Delete the Original

- [x] 3.1 Update `renameToAllread` to use GitHub Contents API DELETE method after the `-allread.json` copy succeeds (currently just overwrites with same content)
- [x] 3.2 Handle delete failure gracefully — log error but don't fail the overall operation

## 4. Skip Regular File When -allread Counterpart Exists

- [x] 4.1 In `getLogItemsForSite` filtering, build a Set of all `-allread` base names (e.g., `2026-01-01` from `2026-01-01-allread.json`)
- [x] 4.2 Exclude regular `.json` files whose base name is in that Set
- [x] 4.3 Same fix in `listSiteFiles` for consistency

## 5. Tests

- [x] 5.1 Add unit test for `isFullyRead` helper (pure function)
- [x] 5.2 Add unit test for `isFileFromEarlierDate` helper (pure function)
- [x] 5.3 Update existing tests for the new delete behavior

## 6. Build & Verify

- [x] 6.1 Full build & test pass
- [ ] 6.2 Verify on deploy that previously-read log files are renamed and no longer fetched on refresh