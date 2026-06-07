## Context

The batch `createCommit` flow (Git Data API) constructs a Git tree by fetching the current tree, replacing blob SHAs for changed files, and creating a new tree + commit. Currently it only handles "upserts" — files whose content changes. Deletions (like renaming a file from `2025-01-01.json` → `2025-01-01-allread.json`) require a separate `deleteFileWithProvider` call, which is an additional round-trip via the Contents API.

Since Git trees naturally support deletion by simply **omitting** a path from the new tree, we can extend `createCommit` to accept a list of paths to delete. The caller provides new content (blobs) + paths to delete, and the commit handles everything in one batch.

## Goals / Non-Goals

**Goals:**
- Add `deletePaths` to the `createCommit` interface (provider + wrapper).
- Modify tree construction to exclude deleted paths.
- Refactor `renameToAllread` to return a list of writes + deletes that callers fold into the batch commit.
- Remove separate post-commit `renameToAllread` calls from `commitAllFeedItems` and `commitReadStatus`.

**Non-Goals:**
- Changing the per-file `deleteFile` / `writeFile` methods on `GitProvider` (they remain for ad-hoc use).
- Handling partial failures differently than the existing `createCommit` (all-or-nothing by design).

## Decisions

1. **`deletePaths` as a separate array vs. a marker in `GitFileChange`**
   - **Chosen**: Separate `deletePaths: string[]` parameter on `createCommit`.
   - **Rationale**: `GitFileChange` carries `content` + `sha` — a "delete" has neither. Adding a `deleted?: boolean` flag would make the type ambiguous. A separate array is cleaner and makes the intent explicit at the call site.
   - **Alternative**: A `deleted?: boolean` field on `GitFileChange` with content/sha ignored. Rejected because it overloads the type.

2. **Tree construction for deletions**
   - Current: `currentTree.tree.filter(item => !changes.some(c => c.path === item.path))` — already removes replaced paths.
   - Extended: Also filter out `deletePaths`. The existing `filter` already handles this; we just union the two sets.
   - **Rationale**: Minimal diff, no new logic path.

3. **`renameToAllread` refactoring**
   - Current: reads file → writes `-allread.json` → deletes old file (3 API calls).
   - New: accepts cached `SiteLogData` (already in memory from the commit), returns `{ writes: [{path, content}], deletes: [oldPath] }`. Caller folds these into the batch commit.
   - **Rationale**: The file content is already in `siteFileCache` from `mergeItemsIntoBucket` — no need to re-read from GitHub.

## Risks / Trade-offs

- **Risk**: If the batch commit fails, renames are not applied (same as current behavior — rename runs after commit success).
  - **Mitigation**: Keep the same post-commit success gating. If the commit fails, nothing changes.
- **Risk**: `renameToAllread` is also called from `getLogItemsForSite` (read path, not write path). That call site still needs the old per-file approach.
  - **Mitigation**: Keep `renameToAllread` as a standalone function for the read path; add a new `prepareRename` function that returns `{ write, deletes }` for the write path.
- **Trade-off**: `GitProvider.createCommit` signature changes. Any test mocks implementing `GitProvider` must update.
  - **Mitigation**: Add `deletePaths` as optional (`deletePaths?: string[]`) with default `[]` to maintain backward compatibility.
