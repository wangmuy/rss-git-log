## 1. Extend createCommit Interface

- [x] 1.1 Add optional `deletePaths?: string[]` parameter to `GitProvider.createCommit` in `git-provider.ts`
- [x] 1.2 Update `GitHubProvider.createCommit` to filter `deletePaths` out of the new tree (extend the existing `.filter()` to also exclude `deletePaths`)
- [x] 1.3 Handle edge case: skip blob creation when `changes` is empty but `deletePaths` is non-empty
- [x] 1.4 Update `createCommit` signature for backward compatibility (default `deletePaths = []`)

## 2. Propagate Through Wrappers

- [x] 2.1 Add `deletePaths` to `createCommitWithProvider` in `github-api.ts`
- [x] 2.2 Update call sites of `createCommit` — verify no existing callers break (they pass no `deletePaths`, which is the default)

## 3. Refactor Rename Logic in log-file.ts

- [x] 3.1 Add `prepareRenameToAllread(filePath: string, data: SiteLogData): { write: BucketWrite; deletePath: string }` — produces the new `-allread.json` content + the old path to delete, without making any API calls
- [x] 3.2 Keep existing `renameToAllread` function unchanged for the read path (`getLogItemsForSite`)

## 4. Fold Renames into Batch Commit in commitAllFeedItems

- [x] 4.1 In `commitAllFeedItems`, collect renames from `isFullyRead` + `isFileFromEarlierDate` checks as additional writes + deletes instead of calling `renameToAllread` in post-commit tasks
- [x] 4.2 Pass both writes and deletes to `createCommitWithProvider` in a single call
- [x] 4.3 Remove the post-commit `renameToAllread` call from the per-bucket task in `commitAllFeedItems`
- [x] 4.4 Remove the `renameFullyReadCachedFiles` call at the end of `commitAllFeedItems`

## 5. Fold Renames into Batch Commit in commitReadStatus

- [x] 5.1 Same pattern as 4.1–4.4 for `commitReadStatus`

## 6. Verify and Clean Up

- [x] 6.1 Run `npm run build` to verify TypeScript compilation
- [x] 6.2 Run `npm test` to verify existing tests pass
- [x] 6.3 Remove `renameFullyReadCachedFiles` function if no longer used anywhere
