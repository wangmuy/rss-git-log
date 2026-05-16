## 1. Inline allread Rename in mergeItemsIntoBucket

- [x] 1.1 After `writeToGitHubWithProvider` succeeds in `mergeItemsIntoBucket`, check if `siteLogData.items.every(i => i.readAt)` (fully read)
- [x] 1.2 Also check the file's date — skip rename if the file date is today (extract date from `targetFile` path, compare to today's date)
- [x] 1.3 If fully read AND not today's file, call `renameToAllread(targetFile)` — best-effort, log errors but don't fail the write
- [x] 1.4 Rename happens immediately per file, not deferred after all buckets finish

## 2. Rename Fully-Read Files During Fetch

- [x] 2.1 In `getLogItemsForSite`, after reading each log file's data, check if all items have `readAt` AND the file date is not today
- [x] 2.2 If so, call `renameToAllread(filePath)` — best-effort, log errors but don't fail the fetch
- [x] 2.3 This handles existing historical files that are already fully read but never got renamed

## 3. Tests

- [x] 3.1 Add unit test for `mergeItemsIntoBucket` verifying files with all-readat items trigger `renameToAllread`
- [x] 3.2 Add unit test verifying files with unread items do not trigger rename
- [x] 3.3 Add unit test verifying `-allread` files are skipped by `getLogItemsForSite` (confirms existing behavior)
- [x] 3.4 Add unit test for fetch-phase rename of fully-read files

## 4. Build & Verify

- [x] 4.1 Full build & test pass
- [ ] 4.2 Verify on deploy that previously-read log files are renamed and no longer fetched on refresh