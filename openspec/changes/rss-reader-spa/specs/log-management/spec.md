## MODIFIED Requirements

### Requirement: Organize log files by per-pubDate buckets
The system SHALL store read logs in site-based directory structure: `logs/{siteId}/{YYYY-MM-DD}.json`, grouped by each item's publication date.

#### Scenario: Generate log file path for a specific date
- **WHEN** system needs to save logs for a site on `2025-05-09`
- **THEN** system returns path `logs/{normalizedSiteUrl}/2025-05-09.json`

#### Scenario: Site ID normalization
- **WHEN** generating site ID from URL
- **THEN** system uses normalized URL (with tracking params removed) as site ID

#### Scenario: Items from different dates land in separate files
- **WHEN** committing items with pubDates spanning 2025-05-07, 2025-05-08, and 2025-05-09
- **THEN** items are placed in three separate files: `2025-05-07.json`, `2025-05-08.json`, `2025-05-09.json`

#### Scenario: Subsequent runs append to correct date buckets
- **WHEN** a new run fetches items from 2025-05-08 and 2025-05-09
- **THEN** items are appended to the existing `2025-05-08.json` and `2025-05-09.json` files (not overwritten)

### Requirement: Limit log files to 200 items with overflow bucketing
The system SHALL limit each log file to maximum 200 items, creating overflow files with date-N suffix when limit is reached.

#### Scenario: Create overflow bucket when limit reached
- **WHEN** a date bucket file has 200 items and new items need to be logged for that date
- **THEN** system creates a new file named `YYYY-MM-DD-1.json` (next overflow: `-2`, etc.) and writes new items there

#### Scenario: Overflow bucket numbering
- **WHEN** overflow files `2025-05-09.json`, `2025-05-09-1.json`, and `2025-05-09-2.json` already exist with 200+ items
- **THEN** next overflow creates `2025-05-09-3.json`

#### Scenario: Overflow items are deduplicated per bucket
- **WHEN** writing to an overflow bucket that already has items
- **THEN** dedup is performed within that file only (same as main bucket behavior)

### Requirement: Merge logs with read-merge-dedup-append-write pattern
The system SHALL use a per-bucket read→dedup→append→write pattern when committing log items.

#### Scenario: Read existing bucket and merge
- **WHEN** committing items to a date that already has a file with < 200 items
- **THEN** system reads the existing file, dedups by `itemId`, appends new items, and writes the merged result

#### Scenario: Dedup scope — only within target bucket
- **WHEN** an item with the same `itemId` exists in a different date bucket
- **THEN** the item IS written to the current bucket (no cross-bucket dedup)

#### Scenario: New date bucket — no existing file
- **WHEN** committing items for a date with no existing file
- **THEN** system creates a new file with metadata (siteId, siteName, date range, item count) and writes items

### Requirement: Support getLatestLogFile that prefers most recent date with space
The system SHALL return the file with the highest date that has < 200 items (most recent date bucket with room), falling back to an overflow file if the main date bucket is full.

#### Scenario: Latest log for date with space
- **WHEN** `2025-05-09.json` has 150 items and `2025-05-08.json` has 190 items
- **THEN** `getLatestLogFile` returns `2025-05-09.json` (newest date with available space)

#### Scenario: Latest log falls back to overflow
- **WHEN** `2025-05-09.json` is full (200 items) and `2025-05-08.json` has space
- **THEN** `getLatestLogFile` returns `2025-05-08.json`

### Requirement: Grouping utility for pubDate-based buckets
The system SHALL provide a `groupByPubDate()` utility that groups an array of log items by their publication date into a Map with keys ordered by date descending.

#### Scenario: Group items across multiple dates
- **WHEN** given a mix of items from 3 different dates
- **THEN** system returns a Map with 3 entries, date keys sorted descending (newest first)

#### Scenario: Group single-date items
- **WHEN** all items share the same pubDate
- **THEN** system returns a Map with a single date entry

### Requirement: SPA read flow discovers all date buckets
The SPA read queries (`getLogItemsForSite`, `getReadItemsForSite`) SHALL discover all `.json` files in a site's directory, regardless of date bucket naming.

#### Scenario: Read items across multiple date buckets
- **WHEN** a site has log files for 2025-05-07, 2025-05-08, and 2025-05-09
- **THEN** `getLogItemsForSite` returns items from all three files merged into a single Map

## ADDED Requirements

<!-- (All requirements are modifications of existing log-management specs) -->
