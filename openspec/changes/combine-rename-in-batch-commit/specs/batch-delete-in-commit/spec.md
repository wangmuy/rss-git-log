## ADDED Requirements

### Requirement: Batch commit supports file deletions

The `createCommit` method SHALL accept an optional `deletePaths` array of file path strings. Files listed in `deletePaths` SHALL be omitted from the new Git tree, effectively deleting them when the commit is applied.

This SHALL be handled purely through tree manipulation — no separate Contents API calls are needed for deletions.

#### Scenario: Commit with mixed creates, updates, and deletes

- **WHEN** caller invokes `createCommit` with both `changes` (new/updated files) and `deletePaths` (files to remove)
- **THEN** the resulting commit SHALL contain the new/updated file content from `changes`
- **AND** the resulting commit SHALL NOT contain any files listed in `deletePaths`
- **AND** the commit SHALL succeed in a single request sequence (blobs → tree → commit → ref update)

#### Scenario: Commit with only deletes

- **WHEN** caller invokes `createCommit` with empty `changes` and non-empty `deletePaths`
- **THEN** the commit SHALL only remove the specified files, with no new blobs created

#### Scenario: Delete of non-existent file is a no-op

- **WHEN** a path in `deletePaths` does not exist in the current tree
- **THEN** the commit SHALL still succeed, treating the missing path as already deleted

#### Scenario: Backward compatibility with existing callers

- **WHEN** caller invokes `createCommit` without `deletePaths` (omitted or undefined)
- **THEN** the behavior SHALL be identical to the current implementation (only `changes` processed)

### Requirement: Rename-to-allread folds into batch commit

The rename flow SHALL produce a combined set of writes (new `-allread.json` file) and deletes (old `.json` file) that callers pass directly to `createCommitWithProvider`, instead of issuing separate post-commit Contents API requests.

The function SHALL accept the already-cached `SiteLogData` to avoid an extra read.

#### Scenario: Rename is part of batch commit

- **WHEN** a commit produces items for a fully-read earlier-date file
- **THEN** the caller SHALL include the `-allread.json` write and the original file deletion in the same `createCommitWithProvider` call
- **AND** no separate `writeToGitHubWithProvider` or `deleteFileWithProvider` SHALL be issued for that rename

#### Scenario: No rename for today's file

- **WHEN** a fully-read file is today's file (not an earlier date)
- **THEN** the rename SHALL NOT occur (consistent with current behavior — today's file is still being written to)
