## ADDED Requirements

### Requirement: Sync GitHub log data on feed fetch
The system SHALL fetch existing read history from GitHub after fetching RSS feed and merge with local items.

#### Scenario: Fetch and merge read history
- **WHEN** feeds are fetched for a site
- **THEN** after RSS fetch completes, GitHub log files are fetched (excluding -allread)
- **AND** for each RSS item: if itemId exists in GitHub logs → mark as read
- **AND** for each RSS item: if itemId not in GitHub logs → mark as unread

#### Scenario: Multiple log files per site
- **WHEN** site has multiple log files (e.g., 2026-05-01.json, 2026-05-02.json)
- **THEN** all non-allread files are fetched and merged
- **AND** item read status is aggregated across all files

#### Scenario: No existing logs
- **WHEN** site has no log files in GitHub
- **THEN** all RSS items are treated as unread

### Requirement: Merge algorithm for read status
The system SHALL implement deterministic merge between RSS feed items and GitHub log data.

#### Scenario: Item exists in logs
- **WHEN** RSS item itemId matches an item in GitHub logs
- **THEN** item is marked as read in local store

#### Scenario: Item not in logs
- **WHEN** RSS item itemId does not match any item in GitHub logs
- **THEN** item is marked as unread in local store

#### Scenario: Item in logs but not in current feed
- **WHEN** GitHub log contains item that is no longer in RSS feed
- **THEN** item is kept in GitHub but not shown in UI (filtered out by feed)

### Requirement: Bidirectional sync
The system SHALL sync read status both ways: GitHub → local on fetch, local → GitHub on commit.

#### Scenario: Online sync
- **WHEN** user reads item while online
- **THEN** item is marked read locally AND committed to GitHub on next manual/auto commit

#### Scenario: Offline read + online later
- **WHEN** user reads items while offline
- **THEN** items are marked read locally
- **AND** on next commit (when online), all read items are synced to GitHub