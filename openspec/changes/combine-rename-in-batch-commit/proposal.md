## Why

After a batch commit, `renameToAllread` currently performs 2 separate GitHub API requests (read + delete) for each fully-read file being renamed to `-allread.json`. These renames happen **after** the batch commit, wasting 2 API calls per renamed file. Since the batch `createCommit` already constructs a Git tree, we can handle renames (file addition + deletion) in the same tree, eliminating the extra round-trips entirely.

## What Changes

- Add `deletePaths: string[]` parameter to `GitProvider.createCommit` (and `createCommitWithProvider`) so callers can specify file paths to delete in the same commit.
- Modify `GitHubProvider.createCommit` to exclude deleted paths from the new tree (no blob needed for deletions – simply omit them).
- Update `renameToAllread` / `renameFullyReadCachedFiles` to produce a combined set of writes and deletes, passed to a single `createCommitWithProvider` call instead of separate `writeToGitHubWithProvider` + `deleteFileWithProvider`.
- Remove the now-unnecessary post-commit `renameToAllread` calls in `commitAllFeedItems` and `commitReadStatus`.

## Capabilities

### New Capabilities
- `batch-delete-in-commit`: Support deletion of file paths within a batch `createCommit` call, eliminating separate DELETE API requests.

### Modified Capabilities
<!-- No existing specs to modify -->

## Impact

- `GitProvider` interface: adds `deletePaths` to `createCommit` signature.
- `GitHubProvider.createCommit`: tree construction changes to exclude deleted paths.
- `createCommitWithProvider` (github-api.ts): propagates new parameter.
- `log-file.ts`: `renameToAllread` reworked to use batch commit; `commitAllFeedItems` / `commitReadStatus` simplified.
- API calls per full-site commit with N renames: 6 → 6 (batch commit already replaces individual writes; renames fold in at zero extra cost).
