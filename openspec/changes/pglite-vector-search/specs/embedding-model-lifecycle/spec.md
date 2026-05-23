## ADDED Requirements

### Requirement: Model download on first init

The worker SHALL download the m2v-potion-base-8m embedding model from Hugging Face on the first `init` after the `DB_READY` status is sent. Subsequent page loads SHALL load the model from the browser Cache API with no network request.

#### Scenario: Model downloads once, cached on reload

- **WHEN** the worker inits for the first time (no cached model)
- **THEN** it SHALL call `pipeline('feature-extraction', 'Xenova/m2v-potion-base-8m')` which SHALL download model files to the browser Cache API
- **WHEN** the page is reloaded
- **THEN** Transformers.js SHALL load the model from Cache API with no additional network requests

### Requirement: Model download progress reporting

The worker SHALL report download progress to the main thread so the UI can show a loading indicator.

#### Scenario: Progress reported during download

- **WHEN** the model is downloading
- **THEN** the worker SHALL post `{ type: 'STATUS', status: 'MODEL_LOADING', progress: <0-100> }` at regular intervals

#### Scenario: Model ready notification

- **WHEN** the model download completes
- **THEN** the worker SHALL post `{ type: 'STATUS', status: 'MODEL_READY' }`

### Requirement: Model not cleared on data clear

Clearing the RSS reader data (dropping the items table) SHALL NOT remove the cached model from the browser Cache API.

#### Scenario: Clear preserves model cache

- **WHEN** `PGliteStore.clear()` is called
- **THEN** the worker SHALL drop the items table and recreate it, but SHALL NOT call any API to delete the cached model files