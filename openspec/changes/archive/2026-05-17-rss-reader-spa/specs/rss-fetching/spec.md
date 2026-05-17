## ADDED Requirements

### Requirement: Fetch RSS feed from URL
The system SHALL fetch RSS/Atom feed content from a given URL using native browser fetch API.

#### Scenario: Successful RSS 2.0 feed fetch
- **WHEN** user provides a valid RSS 2.0 feed URL
- **THEN** system returns parsed feed with title, link, and items array

#### Scenario: Successful Atom feed fetch
- **WHEN** user provides a valid Atom feed URL
- **THEN** system returns parsed feed with title, link, and items array

#### Scenario: CORS blocking fallback
- **WHEN** direct fetch fails due to CORS restrictions
- **THEN** system retries using corsproxy.io proxy service

#### Scenario: Double CORS fallback
- **WHEN** corsproxy.io fails or is unavailable
- **THEN** system retries using allorigins.win proxy service

### Requirement: Parse RSS XML using DOMParser
The system SHALL parse RSS and Atom XML using native browser DOMParser (no Node.js dependencies).

#### Scenario: Parse RSS 2.0 format
- **WHEN** XML contains `<rss>` or `<channel>` elements
- **THEN** system extracts items from `<item>` elements with guid, title, link, pubDate, description

#### Scenario: Parse Atom format
- **WHEN** XML contains `<feed>` element
- **THEN** system extracts entries from `<entry>` elements with id, title, link, updated, summary

#### Scenario: Handle malformed XML
- **WHEN** XML is malformed or not a valid feed
- **THEN** system returns null and logs appropriate error message

### Requirement: Normalize URLs by removing tracking parameters
The system SHALL remove common tracking parameters from URLs for consistent item ID generation.

#### Scenario: Remove UTM parameters
- **WHEN** URL contains `utm_source`, `utm_medium`, or `utm_campaign` parameters
- **THEN** system returns URL without these parameters

#### Scenario: Remove social tracking parameters
- **WHEN** URL contains `fbclid` or `gclid` parameters
- **THEN** system returns URL without these parameters

#### Scenario: Remove ref parameters
- **WHEN** URL contains `ref` or `referer` parameters
- **THEN** system returns URL without these parameters
