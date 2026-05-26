## ADDED Requirements

### Requirement: Export subscriptions as OPML
The system SHALL provide an "Export OPML" button in the subscription manager that generates an OPML file from the current subscription list and triggers a browser download.

#### Scenario: Successful export
- **WHEN** user clicks "Export OPML"
- **THEN** the system generates a valid OPML 2.0 XML document containing all current subscriptions and triggers a file download

#### Scenario: Empty subscription list
- **WHEN** user clicks "Export OPML" with no subscriptions
- **THEN** the system exports a valid OPML 2.0 document with an empty `<body>` section

#### Scenario: Output format
- **WHEN** export is triggered
- **THEN** the downloaded file SHALL be named `subscriptions.opml` and have MIME type `application/xml`

### Requirement: Preserve site metadata in export
The system SHALL include site name, URL, and color in the exported OPML.

#### Scenario: Basic site attributes
- **WHEN** a site has name and URL
- **THEN** the exported `<outline>` element SHALL have `type="rss"`, `xmlUrl="<site.url>"`, `text="<site.name>"`, and `title="<site.name>"`

#### Scenario: Color included
- **WHEN** a site has a `color` value
- **THEN** the exported `<outline>` element SHALL include `app:color="<color>"`

#### Scenario: Color absent
- **WHEN** a site has no `color` value
- **THEN** the exported `<outline>` element SHALL omit the `app:color` attribute