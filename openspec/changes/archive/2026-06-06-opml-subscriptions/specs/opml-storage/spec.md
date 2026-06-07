## ADDED Requirements

### Requirement: Read subscriptions from OPML
The system SHALL read the subscription list from `subscriptions.opml` on the GitHub data branch.

#### Scenario: Successful read
- **WHEN** `subscriptions.opml` exists on the configured GitHub branch and contains valid OPML 2.0
- **THEN** the system parses all `<outline>` elements with an `xmlUrl` attribute and returns them as `RSSSite[]`

#### Scenario: File not found
- **WHEN** `subscriptions.opml` does not exist on the configured GitHub branch
- **THEN** the system returns an empty site list

#### Scenario: Invalid XML
- **WHEN** `subscriptions.opml` contains malformed XML
- **THEN** the system throws a parse error and displays an error message

#### Scenario: No outline elements with xmlUrl
- **WHEN** `subscriptions.opml` exists but contains no `<outline>` elements with `xmlUrl`
- **THEN** the system returns an empty site list

### Requirement: Write subscriptions to OPML
The system SHALL write the current subscription list to `subscriptions.opml` on the GitHub data branch in OPML 2.0 format. If the file does not exist yet, it SHALL be created.

#### Scenario: Successful write (existing file)
- **WHEN** user saves subscriptions to GitHub and `subscriptions.opml` already exists
- **THEN** the system serializes all sites to OPML 2.0 XML and updates the file via the GitHub API

#### Scenario: Create new file on first save
- **WHEN** user saves subscriptions to GitHub and `subscriptions.opml` does not exist yet on the data branch
- **THEN** the system creates a new `subscriptions.opml` file via the GitHub API

#### Scenario: OPML structure
- **WHEN** writing subscriptions.opml
- **THEN** the output SHALL include an OPML 2.0 XML declaration, `<opml version="2.0">` root, `<head>` with title, and `<body>` containing one `<outline type="rss">` per site

#### Scenario: Color attribute is preserved
- **WHEN** a site has a `color` value
- **THEN** the serialized `<outline>` element SHALL include `app:color="<value>"`

### Requirement: Settings removed from GitHub file
The system SHALL NOT include reader settings in `subscriptions.opml`. Reader settings SHALL be read from localStorage only.

#### Scenario: No settings in OPML
- **WHEN** reading or writing `subscriptions.opml`
- **THEN** no settings data (`showReadItems`, `autoCommit`, `commitInterval`) appears in the file

#### Scenario: Settings read from localStorage
- **WHEN** the reader displays sites
- **THEN** `showReadItems` is read from the localStorage `AppConfig`, not from GitHub

### Requirement: ConfigPage validates subscriptions.opml
The system SHALL verify `subscriptions.opml` is readable on the data branch before allowing navigation to the reader.

#### Scenario: File exists
- **WHEN** user saves GitHub configuration and `subscriptions.opml` is readable
- **THEN** navigation to the reader is allowed

#### Scenario: File missing
- **WHEN** user saves GitHub configuration but `subscriptions.opml` is not found
- **THEN** an error is shown and navigation is blocked

### Requirement: fetch-feeds reads OPML
The GitHub Action script SHALL read `subscriptions.opml` instead of `rss-config.json`.

#### Scenario: Script reads subscriptions.opml
- **WHEN** `fetch-feeds.ts` runs
- **THEN** it reads `subscriptions.opml` from the working directory and parses it to extract the site list

#### Scenario: Missing OPML file
- **WHEN** `subscriptions.opml` is not found on disk
- **THEN** the script exits with an error