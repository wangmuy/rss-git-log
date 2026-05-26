## ADDED Requirements

### Requirement: Model download progress in SearchBox

The SearchBox SHALL show a visual indicator when the embedding model is downloading.

#### Scenario: Progress bar during model download

- **WHEN** `MODEL_LOADING` with `progress` is received
- **THEN** the SearchBox SHALL display a mini linear progress bar below the input field, filled to the reported percentage

#### Scenario: Progress bar hidden on model ready

- **WHEN** `MODEL_READY` is received
- **THEN** the progress bar SHALL be replaced with a search tier badge

### Requirement: Search tier badge

The SearchBox SHALL display the current active search tier as an icon or badge.

#### Scenario: Active tier shown as icon

- **WHEN** vector search is active (model ready)
- **THEN** the SearchBox SHALL show the search icon with an ✦ badge
- **WHEN** tsvector search is active (model not ready, tsvector works)
- **THEN** the SearchBox SHALL show the search icon with an "Aa" badge
- **WHEN** regex search is active (tsvector unavailable)
- **THEN** the SearchBox SHALL show the `` .* `` badge

#### Scenario: Tier badge has tooltip

- **WHEN** the user hovers over the search tier badge
- **THEN** a tooltip SHALL display the tier name: "Semantic search", "Full-text search", or "Regex search"