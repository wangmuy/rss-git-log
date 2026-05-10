## ADDED Requirements

### Requirement: Parse RSS/Atom XML using DOM-compatible Document
The system SHALL provide shared RSS/Atom XML parsing functions that operate on any DOM-compatible Document and Element objects, with no dependency on a specific DOMParser implementation.

#### Scenario: Parse RSS 2.0 from Document
- **WHEN** a Document contains `<channel>` with `<item>` elements
- **THEN** system returns RSSFeed with title, link, and items array containing guid, title, link, pubDate, description

#### Scenario: Parse Atom from Document
- **WHEN** a Document contains `<feed>` with `<entry>` elements
- **THEN** system returns RSSFeed with title, link, and items array containing guid, title, link, pubDate, description

#### Scenario: Detect parser errors
- **WHEN** Document contains a `<parsererror>` element
- **THEN** system throws an error indicating XML parse failure

#### Scenario: Unknown feed format
- **WHEN** Document contains neither `<channel>` nor `<feed>` elements
- **THEN** system throws an error indicating unknown feed format

### Requirement: Browser parser remains backward-compatible
The existing `parseXMLFeed(xml: string)` function SHALL continue to work identically, creating a native DOMParser and delegating to the shared parser.

#### Scenario: Browser parseXMLFeed unchanged
- **WHEN** browser code calls `parseXMLFeed(xml)` with an RSS or Atom string
- **THEN** behavior is identical to before the extraction
