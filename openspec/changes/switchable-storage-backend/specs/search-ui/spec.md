## ADDED Requirements

### Requirement: Search bar in sidebar

The system SHALL provide a search bar at the top of the sidebar that allows full-text search across all feed items.

#### Scenario: Search bar renders in sidebar
- **WHEN** the sidebar is visible
- **THEN** it SHALL render a text input with placeholder "Search feeds..."
- **THEN** it SHALL render a search icon button

#### Scenario: Search queries the active store
- **WHEN** the user types a query and presses Enter
- **THEN** the system SHALL call `search(query)` on the active `ItemStore`
- **THEN** results SHALL be displayed in a results pane below the search bar
- **THEN** each result SHALL show title, site name, date, and a text snippet

#### Scenario: Search results navigate to items
- **WHEN** the user clicks a search result
- **THEN** the system SHALL navigate to the source feed site
- **THEN** the specific item SHALL be highlighted in the feed list
- **THEN** the search results SHALL be dismissed

### Requirement: Search behavior differs by backend

The search implementation SHALL use the appropriate backend: MiniSearch for `localstorage` provider, PostgreSQL FTS for `pglite` provider.

#### Scenario: LocalStorageStore uses MiniSearch
- **WHEN** `search()` is called on `LocalStorageStore`
- **THEN** it SHALL query the MiniSearch index built from in-memory items
- **THEN** it SHALL return results ranked by fuzzy match score

#### Scenario: PGliteStore uses PostgreSQL FTS
- **WHEN** `search()` is called on `PGliteStore`
- **THEN** it SHALL execute `SELECT ... WHERE to_tsvector('english', title || ' ' || description) @@ plainto_tsquery('english', $1)`
- **THEN** it SHALL return results ranked by `ts_rank`