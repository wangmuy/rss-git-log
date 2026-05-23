## ADDED Requirements

### Requirement: Item table with vector and tsvector columns

The items table SHALL include `embedding vector(384)` and `search_vector tsvector` columns. The `vector` extension SHALL be loaded via `CREATE EXTENSION IF NOT EXISTS vector`.

#### Scenario: Migration creates vector schema

- **WHEN** the worker initializes PGlite
- **THEN** it SHALL run `CREATE EXTENSION IF NOT EXISTS vector` and CREATE TABLE with `embedding vector(384)` and `search_vector tsvector` columns

### Requirement: Three-tier search fallback

The search SHALL attempt tiers in order: vector (model ready) → tsvector → `~*` regex. Each tier SHALL fall through to the next if the tier is unavailable or returns fewer than 20 results.

#### Scenario: Vector search with cosine distance

- **WHEN** the embedding model is loaded AND the user types a search query
- **THEN** the system SHALL generate a 384-dim embedding for the query, compute cosine distance (`embedding <=> $1`), and return the 20 closest items where `embedding IS NOT NULL`

#### Scenario: tsvector full-text search fallback

- **WHEN** the embedding model is NOT loaded AND `to_tsvector`/`to_tsquery` functions are available
- **THEN** the system SHALL search using `search_vector @@ to_tsquery(config, query)` ordered by `ts_rank()` descending

#### Scenario: Regex fallback

- **WHEN** the embedding model is NOT loaded AND tsvector functions are unavailable
- **THEN** the system SHALL search using `title ~* query OR description ~* query`

#### Scenario: Empty results from higher tier fall through

- **WHEN** a search tier returns 0 results
- **THEN** the system SHALL try the next tier
- **WHEN** all tiers return 0 results
- **THEN** the system SHALL return an empty array

### Requirement: Embedding generated as background tail of upsert

Embedding vectors SHALL be generated after the INSERT completes, not before. The INSERT response SHALL be sent to the main thread before embedding begins.

#### Scenario: INSERT returns before embedding

- **WHEN** `upsertItems` is called
- **THEN** the worker SHALL INSERT all items (with `to_tsvector()` computed synchronously) and SHALL post `UPSERT_DONE` before starting any `pipeline()` calls for embedding generation

#### Scenario: Backfill unembedded items on model ready

- **WHEN** the model finishes loading
- **THEN** the worker SHALL query for rows WHERE `embedding IS NULL` and generate embeddings for all unembedded items

### Requirement: Language detection for tsvector config

Each article SHALL have a detected language used to select the tsvector configuration.

#### Scenario: Chinese text uses simple config

- **WHEN** an article title or description contains CJK Unified Ideographs (U+4E00–U+9FFF)
- **THEN** the `lang` field SHALL be set to `'zh'` and `to_tsvector('simple', text)` SHALL be used

#### Scenario: Non-Chinese text uses english config

- **WHEN** an article title or description contains no CJK characters
- **THEN** the `lang` field SHALL be set to `'en'` and `to_tsvector('english', text)` SHALL be used