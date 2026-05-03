## ADDED Requirements

### Requirement: Commit all feed items to GitHub
The system SHALL commit ALL items from current feed (both read and unread) to GitHub log files, sorted by publication date descending.

#### Scenario: Commit all items from feed
- **WHEN** user triggers manual commit with 20 RSS items (10 read, 10 unread)
- **THEN** all 20 items are written to GitHub log file
- **AND** items are sorted by pubDate descending (newest first)

#### Scenario: Deduplicate on subsequent commits
- **WHEN** commit is triggered again with same 20 items + 5 new items
- **THEN** existing 20 items are skipped (by itemId)
- **AND** only 5 new items are appended to log file

#### Scenario: Handle full log file (200 items)
- **WHEN** commit would exceed 200 items in current log file
- **THEN** new log file is created with oldest item date as filename
- **AND** new items are written to new file

### Requirement: Sort items by publication date
The system SHALL sort items by pubDate in descending order (newest first) before committing to GitHub.

#### Scenario: Sort by date desc
- **WHEN** items have dates: 2026-05-01, 2026-05-03, 2026-05-02
- **THEN** commit order is: 2026-05-03, 2026-05-02, 2026-05-01

### Requirement: Store readAt timestamp for all items
The system SHALL include readAt timestamp in log file for all committed items.

#### Scenario: Store read status in log
- **WHEN** item is read (has readAt in local store)
- **THEN** readAt timestamp is included in committed item
- **WHEN** item is unread (no readAt in local store)
- **THEN** readAt field is omitted in committed item