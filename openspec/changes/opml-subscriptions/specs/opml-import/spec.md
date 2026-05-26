## ADDED Requirements

### Requirement: Import OPML via file upload
The system SHALL provide an "Import OPML" button in the subscription manager that allows users to upload an OPML file from their local filesystem.

#### Scenario: Successful import
- **WHEN** user clicks "Import OPML" and selects a valid `.opml` or `.xml` file
- **THEN** the system parses the file, extracts all sites, and adds them to the subscription list

#### Scenario: Input file type
- **WHEN** the import dialog opens
- **THEN** it SHALL accept files with extensions `.opml` and `.xml`

#### Scenario: Invalid file
- **WHEN** user uploads a file that is not valid XML or not valid OPML 2.0
- **THEN** the system shows an error message and does not modify the subscription list

### Requirement: Flatten nested outlines
The system SHALL flatten nested OPML `<outline>` elements when importing, producing a flat list of sites.

#### Scenario: Single-level outlines
- **WHEN** all `<outline>` elements with `xmlUrl` are direct children of `<body>`
- **THEN** each site's name is used as-is from the `title` or `text` attribute

#### Scenario: Nested folder structure
- **WHEN** an `<outline>` without `xmlUrl` contains child `<outline>` elements with `xmlUrl`
- **THEN** each child site's name is prefixed with the parent folder name followed by " / "

#### Scenario: Deeply nested folders
- **WHEN** folders are nested more than one level deep
- **THEN** the prefix includes the full path: `"Outer / Inner / SiteName"`

#### Scenario: No name attribute
- **WHEN** an `<outline>` with `xmlUrl` has neither `title` nor `text` attribute
- **THEN** the `xmlUrl` value is used as the site name

### Requirement: Deduplicate by URL
The system SHALL skip sites with URLs that already exist in the current subscription list during import.

#### Scenario: Duplicate detected
- **WHEN** an imported `<outline>` has an `xmlUrl` matching an existing site's `url` (case-insensitive)
- **THEN** the duplicate is skipped and not added to the list

#### Scenario: Duplicate warning
- **WHEN** one or more duplicates are skipped during import
- **THEN** the system shows a warning message listing the URLs that were skipped

### Requirement: Parse custom color attribute
The system SHALL read the `app:color` attribute from `<outline>` elements during import.

#### Scenario: Color attribute present
- **WHEN** an `<outline>` has an `app:color` attribute
- **THEN** the imported site's `color` field is set to that value

#### Scenario: Color attribute absent
- **WHEN** an `<outline>` does not have an `app:color` attribute
- **THEN** the imported site uses the default color `#1976d2`