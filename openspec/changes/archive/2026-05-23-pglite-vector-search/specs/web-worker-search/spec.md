## ADDED Requirements

### Requirement: Worker-based PGliteStore

The system SHALL provide a `PGliteStore` implementation of the `ItemStore` interface that dispatches all database operations to a dedicated Web Worker instead of executing them on the main thread.

#### Scenario: Main thread PGliteStore proxies all methods to worker

- **WHEN** any `ItemStore` method is called (`search`, `upsertItems`, `markAsRead`, `isRead`, `getUnreadCount`, `getAllUnreadCounts`, `getItemsForCommit`, `clear`)
- **THEN** the method SHALL serialize the call as a `postMessage` to the worker and SHALL resolve with the worker's response

#### Scenario: Worker processes messages sequentially

- **WHEN** the worker receives multiple messages
- **THEN** it SHALL process them in FIFO order, returning responses in the same order

#### Scenario: Request/response matching by sequence ID

- **WHEN** the main thread sends a message
- **THEN** it SHALL include a unique sequence number. The worker SHALL echo the sequence number in its response so the main thread can match replies to callers.

#### Scenario: Worker init blocks until DB_READY

- **WHEN** `PGliteStore.init()` is called
- **THEN** it SHALL spawn the worker, send an `init` message, and SHALL NOT resolve until the worker replies with `DB_READY`

#### Scenario: Worker termination on store clear

- **WHEN** `PGliteStore.clear()` is called
- **THEN** the worker SHALL drop the `items` table, SHALL NOT clear the model cache, and the main thread SHALL terminate the worker instance

### Requirement: Main thread does not block during worker operations

No `ItemStore` method SHALL use synchronous wait or busy-loop on the main thread while the worker processes a request.

#### Scenario: Search does not block keystroke handling

- **WHEN** the user types in the search box while a search request is pending in the worker
- **THEN** keystroke events SHALL be processed immediately (no lag, no dropped characters)

### Requirement: Worker lifecycle matches PGliteStore lifecycle

#### Scenario: Worker is created once

- **WHEN** `PGliteStore.init()` succeeds on first call
- **THEN** the same worker SHALL be reused for all subsequent method calls (singleton, matches existing `getItemStore()` behavior)

#### Scenario: Worker re-creation on store reset

- **WHEN** `resetItemStore()` is called (provider switch or data clear)
- **THEN** the existing worker SHALL be terminated and a new one SHALL be created on the next `getItemStore()` call