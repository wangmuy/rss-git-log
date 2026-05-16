## Context

`renameToAllread(filePath)` already exists in `log-file.ts` (copies file content to `<date>-allread.json`, then overwrites the original). `getLogItemsForSite`, `getReadItemsForSite`, and `listSiteFiles` all skip `-allread` files. The missing piece is calling `renameToAllread` when a log file becomes fully read during the commit flow.

## Goals / Non-Goals

**Goals:**
- After each individual file write in `mergeItemsIntoBucket`, check if the file is now fully read
- If all items in that file have `readAt` set, call `renameToAllread` immediately
- Files are independent — no need to wait for other buckets to complete
- No change to the existing commit success/failure handling

**Non-Goals:**
- Not changing the commit's write path — rename is a post-commit step
- Not retrying failed renames — they're best-effort

## Decisions

### 1. Inline check in mergeItemsIntoBucket
After `writeToGitHubWithProvider` succeeds inside `mergeItemsIntoBucket`, check the updated `siteLogData`. If every item has `readAt` set, call `renameToAllread` immediately. This runs as soon as each bucket is written, not waiting for other buckets to finish.

### 2. Best-effort — rename failure doesn't fail the write
If `renameToAllread` fails (network error, race condition), the write already succeeded. The rename failure is logged but not propagated. The file will be fetched again next time and potentially renamed then.

### 3. Check is on the merged result, not a separate fetch
The `siteLogData` object after merging already contains all items for that file. Check `siteLogData.items.every(i => i.readAt)` — no extra read needed.

### 4. Skip today's files (date-based guard)
Files whose date matches today's date (derived from `filePath`) are NOT renamed, even if fully read. New items may arrive for today later in the day, and renaming would force them into a new overflow bucket. Only files from earlier dates are safe to rename.

### 5. Also rename during fetch phase
During `getLogItemsForSite`, after reading each log file's content, check if it's fully read (all items have `readAt`) and not today's file. If so, call `renameToAllread`. This handles historical files that were already fully read before this feature existed — they get renamed on the first fetch after deployment, without waiting for a commit.

### 6. Delete original file after rename
`renameToAllread` currently copies content to `<date>-allread.json` but only overwrites the original file (not truly delete). It SHALL use the GitHub Contents API DELETE method to remove the original file after the `-allread` copy succeeds. This prevents stale `.json` files from lingering and being fetched on subsequent loads.

### 7. Skip regular file if -allread counterpart exists
When listing files in `getLogItemsForSite` and `listSiteFiles`, if both `<date>.json` and `<date>-allread.json` exist (e.g. from a previously interrupted rename), the regular `<date>.json` SHALL also be skipped. The regular file is a leftover — only the `-allread` version is authoritative. This is enforced by building a Set of all existing `-allread` base names and excluding their regular counterparts.

## Risks / Trade-offs

- **[Extra API calls]** Each rename does one read (of the just-written file, so likely cached) + one write (allread copy) + one write (delete original). This overhead is outweighed by the saved reads on future page loads.
- **[Race condition]** If two tabs commit simultaneously, both might try to rename the same file. Mitigated by best-effort approach — one will succeed, the other logs a warning.