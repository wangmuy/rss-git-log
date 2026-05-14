## ADDED Requirements

### Requirement: Compress localStorage values with lz-string

The system SHALL compress JSON values written to `rss-reader-session` and `rss-reader-log-cache` using lz-string before storage, and decompress on read.

#### Scenario: Write compressed value
- **WHEN** the system writes to `rss-reader-session` or `rss-reader-log-cache`
- **THEN** the raw JSON SHALL be compressed with lz-string.compress()
- **THEN** the compressed string SHALL be stored with a `::lz::` prefix

#### Scenario: Read compressed value
- **WHEN** the system reads from `rss-reader-session` or `rss-reader-log-cache`
- **AND** the stored value starts with `::lz::`
- **THEN** the system SHALL strip the prefix and decompress with lz-string.decompress()

#### Scenario: Read uncompressed legacy value
- **WHEN** the system reads from `rss-reader-session` or `rss-reader-log-cache`
- **AND** the stored value does NOT start with `::lz::`
- **THEN** the system SHALL return the raw string as-is (backward compatibility)

#### Scenario: Compression failure does not crash
- **WHEN** compression or decompression throws
- **THEN** the system SHALL catch the error and fall back to uncompressed read/write
- **THEN** the system SHALL NOT throw or crash

### Requirement: Strip unnecessary fields from cached log items

The system SHALL strip `description`, `link`, and `source` from each `LogItem` before storing in `rss-reader-log-cache`. Only `itemId`, `title`, `pubDate`, and `readAt` SHALL be retained.

#### Scenario: Cache strips fields on write
- **WHEN** `cacheLogFile()` is called with a `SiteLogData` object
- **THEN** each item in `data.items` SHALL have `description`, `link`, `source` removed before caching
- **THEN** `itemId`, `title`, `pubDate`, and `readAt` SHALL be preserved

#### Scenario: Stripped cache does not affect in-memory data
- **WHEN** items are read back from cache
- **AND** they lack `description` / `link` / `source`
- **THEN** the in-memory store and GitHub API payloads SHALL NOT be affected

### Requirement: Compressed storage utility module

The system SHALL provide a `compressed-storage.ts` module with `compressedGetItem(key)` and `compressedSetItem(key, value)` for centralized localStorage I/O with compression.

#### Scenario: Module wraps localStorage
- **WHEN** `compressedSetItem(key, value)` is called
- **THEN** it SHALL compress the value and store via localStorage.setItem
- **WHEN** `compressedGetItem(key)` is called
- **THEN** it SHALL read from localStorage.getItem and decompress if prefixed with `::lz::`
