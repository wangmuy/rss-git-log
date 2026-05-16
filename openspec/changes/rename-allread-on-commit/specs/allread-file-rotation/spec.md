## ADDED Requirements

### Requirement: Fully-read log files are renamed to -allread after commit

After `commitAllFeedItems` writes log files, the system SHALL check each changed file. If every item has `readAt` set, it SHALL rename the file to `<date>-allread.json`.

#### Scenario: Fully-read file is renamed after commit
- **WHEN** `commitAllFeedItems` finishes for a site
- **AND** a written file has all items with `readAt` set
- **THEN** the system SHALL call `renameToAllread` for that file path
- **THEN** the original file SHALL be replaced with an `-allread.json` copy

#### Scenario: Partially-read file is not renamed
- **WHEN** `commitAllFeedItems` finishes for a site
- **AND** a written file has at least one item without `readAt`
- **THEN** the system SHALL NOT call `renameToAllread` for that file path

#### Scenario: Rename failure does not fail the commit
- **WHEN** `commitAllFeedItems` succeeds
- **AND** `renameToAllread` fails for a file
- **THEN** the commit SHALL still be considered successful
- **THEN** the error SHALL be logged to the console

### Requirement: -allread files are excluded from fetches

The system SHALL continue to skip `-allread` files in `getLogItemsForSite`, `getReadItemsForSite`, and `listSiteFiles` (already implemented, confirmed via test).

#### Scenario: -allread files are skipped on fetch
- **WHEN** `getLogItemsForSite` lists files from the GitHub directory
- **THEN** files with `-allread` in their name SHALL NOT be read or cached