## ADDED Requirements

### Requirement: tsvector column populated on INSERT

Every item INSERT SHALL compute `search_vector` via `to_tsvector()` using the detected language config. The tsvector column SHALL be populated synchronously as part of the INSERT statement.

#### Scenario: tsvector computed with language-specific config

- **WHEN** an item is inserted with `lang = 'en'`
- **THEN** `search_vector` SHALL be set to `to_tsvector('english', title || ' ' || description)`
- **WHEN** an item is inserted with `lang = 'zh'`
- **THEN** `search_vector` SHALL be set to `to_tsvector('simple', title || ' ' || description)`

### Requirement: tsvector GIN index for search performance

A GIN index SHALL be created on the `search_vector` column to accelerate `@@` queries.

#### Scenario: GIN index exists on search_vector

- **WHEN** the worker initializes the schema
- **THEN** it SHALL execute `CREATE INDEX IF NOT EXISTS idx_items_fts ON items USING gin(search_vector)`

### Requirement: tsvector graceful degradation

If `to_tsvector` or `@@` operators are unavailable in the PGlite build (e.g., `fts` extension fails), the search SHALL skip the tsvector tier and fall through to `~*` regex.

#### Scenario: Missing tsvector functions skip to regex

- **WHEN** a `to_tsvector` or `@@` call throws an error
- **THEN** the worker SHALL catch the error, log it, and SHALL NOT retry tsvector for subsequent searches in the same session