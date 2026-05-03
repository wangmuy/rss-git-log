## ADDED Requirements

### Requirement: Rename log file when all items are read
The system SHALL rename log files to add `-allread` suffix when all items in the file have been read.

#### Scenario: All items in file are read
- **WHEN** commit completes and all 200 items in log file have readAt timestamp
- **THEN** file is renamed from `2026-05-01.json` to `2026-05-01-allread.json`
- **AND** file is no longer updated with new items

#### Scenario: Not all items are read
- **WHEN** commit completes and only 150 of 200 items have readAt timestamp
- **THEN** file remains as `2026-05-01.json`
- **AND** file continues to accept new items

#### Scenario: Check allread status after each commit
- **WHEN** commit writes to a log file
- **THEN** system checks if all items now have readAt
- **AND** triggers rename if all items are read

### Requirement: Skip allread files during fetch
The system SHALL skip log files with `-allread` suffix when fetching read history from GitHub.

#### Scenario: Fetch skips allread files
- **WHEN** system fetches read history for a site
- **THEN** files matching pattern `*-allread.json` are ignored
- **AND** only active log files are read and merged

#### Scenario: Allread files are immutable
- **WHEN** new RSS items arrive for a site with allread files
- **THEN** new items are written to new log files (not allread files)
- **AND** existing allread files remain unchanged