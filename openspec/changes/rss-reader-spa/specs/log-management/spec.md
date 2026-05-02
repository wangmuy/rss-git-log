## ADDED Requirements

### Requirement: Organize log files by site
The system SHALL store read logs in site-based directory structure: `logs/{siteId}/YYYY-MM-DD.json`.

#### Scenario: Generate log file path
- **WHEN** system needs to save logs for a site on a specific date
- **THEN** system returns path in format `logs/{normalizedSiteUrl}/YYYY-MM-DD.json`

#### Scenario: Site ID normalization
- **WHEN** generating site ID from URL
- **THEN** system uses normalized URL (with tracking params removed) as site ID

### Requirement: Limit log files to 200 items with chunking
The system SHALL limit each log file to maximum 200 items, creating new chunk files when limit is reached.

#### Scenario: Create new chunk when limit reached
- **WHEN** site has 200 items and new item needs to be logged
- **THEN** system creates new file with next date, keeping oldest item date as filename

#### Scenario: Filename based on oldest item
- **WHEN** creating log file with multiple items
- **THEN** filename uses the date of the oldest item in the file

### Requirement: Merge logs with existing data
The system SHALL merge new read items with existing log data, avoiding duplicates.

#### Scenario: Add new items to existing log
- **WHEN** committing read status and log file already exists
- **THEN** new items are appended, duplicates (by itemId) are skipped

#### Scenario: Create new log if not exists
- **WHEN** committing read status and log file doesn't exist
- **THEN** new log file is created with metadata and items array

### Requirement: Migrate from daily logs to site-based logs
The system SHALL provide automatic migration from old `logs/YYYY-MM-DD.json` structure to new site-based structure.

#### Scenario: Detect old log structure
- **WHEN** application starts and old log files exist
- **THEN** system detects old structure and triggers migration

#### Scenario: Convert daily logs to site-based
- **WHEN** migration runs
- **THEN** items from daily logs are reorganized by site with 200-item chunking

### Requirement: Include metadata in log files
The system SHALL include metadata (date, generatedAt, item counts) in log files.

#### Scenario: Write metadata on commit
- **WHEN** system writes log file
- **THEN** file includes metadata with date, generatedAt timestamp, and optionally item counts
