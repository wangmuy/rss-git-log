## ADDED Requirements

### Requirement: Worker processes mark-all-as-read off main thread

The system SHALL provide a Web Worker that receives items, existing readStatus, and settings; generates item IDs; builds the new readStatus; serializes and compresses it; and returns the result to the main thread.

#### Scenario: Worker generates item IDs and compresses
- **WHEN** the worker receives items and existing readStatus
- **THEN** it SHALL generate item IDs for all items via `generateItemId`
- **THEN** it SHALL build the new readStatus object (deduplicated)
- **THEN** it SHALL `JSON.stringify` and `LZString.compress` the result
- **THEN** it SHALL post back `{ siteId, compressed, itemIds }`

### Requirement: Right panel shows loading overlay during processing

The system SHALL display a semi-transparent overlay with a spinner over the FeedListPane when a site is being marked as read. This prevents interaction with feed items during processing.

#### Scenario: Overlay blocks interaction
- **WHEN** "Mark all as read" is clicked for a site
- **THEN** the right panel SHALL show an overlay with a `CircularProgress` spinner
- **THEN** clicks and keyboard events SHALL NOT reach the feed items
- **WHEN** processing completes
- **THEN** the overlay SHALL be removed