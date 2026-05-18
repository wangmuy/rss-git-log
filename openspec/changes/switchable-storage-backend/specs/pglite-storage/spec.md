## ADDED Requirements

### Requirement: PGliteStore uses PGlite with IndexedDB persistence

The system SHALL provide a `PGliteStore` implementing the `ItemStore` interface using PGlite with `idb://` persistence. No compression SHALL be used — PostgreSQL pages and IndexedDB handle storage efficiency natively.

#### Scenario: PGliteStore initializes database
- **WHEN** `init()` is called
- **THEN** it SHALL create a PGlite instance with `idb://rss-reader`
- **THEN** it SHALL run migrations to create the `items` table and indexes
- **THEN** all subsequent operations SHALL use this instance

#### Scenario: PGliteStore batch upserts items
- **WHEN** `upsertItems(siteId, items)` is called
- **THEN** it SHALL execute `INSERT INTO items (...) VALUES (...) ON CONFLICT (item_id) DO UPDATE SET ...`
- **THEN** existing `is_read` and `read_at` values SHALL be preserved on conflict
- **THEN** the operation SHALL happen within a single transaction

#### Scenario: PGliteStore marks items as read
- **WHEN** `markAsRead(siteId, itemId)` is called
- **THEN** it SHALL execute `UPDATE items SET is_read = 1, read_at = datetime('now') WHERE item_id = ?`
- **THEN** it SHALL affect exactly one row

#### Scenario: PGliteStore searches with PostgreSQL FTS
- **WHEN** `search(query)` is called
- **THEN** it SHALL use `to_tsvector`/`plainto_tsquery` for full-text search on `title` and `description`
- **THEN** it SHALL return results ranked by `ts_rank`
- **THEN** it SHALL include a highlighted snippet via `ts_headline`

#### Scenario: PGliteStore provides items for commit
- **WHEN** `getItemsForCommit(siteId)` is called
- **THEN** it SHALL return all items for the site with `itemId`, `title`, `pubDate`, and `readAt` (if read)

### Requirement: PGlite runs in a Worker

The PGlite database instance SHALL run in a separate Worker (not the main thread) to avoid blocking UI rendering.

#### Scenario: Worker is created on init
- **WHEN** `PGliteStore.init()` is called
- **THEN** it SHALL create a new Worker for PGlite operations
- **THEN** all subsequent DB operations SHALL be proxied through this Worker via `postMessage`

### Requirement: pgvector extension loaded for future use

The system SHALL load the `pgvector` extension at database initialization time, even if vector search is not yet exposed in the UI. This ensures the schema is ready for future features.

#### Scenario: pgvector loaded on init
- **WHEN** PGliteStore initializes the database
- **THEN** it SHALL execute `CREATE EXTENSION IF NOT EXISTS vector`
- **THEN** a `items_vec` table SHALL be created with an `embedding vector(384)` column (empty, for future use)