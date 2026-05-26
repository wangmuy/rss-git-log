## ADDED Requirements

### Requirement: ItemStore interface defines all item operations

The system SHALL define an `ItemStore` interface with methods for item CRUD, read status, search, and commit data export.

#### Scenario: Interface defines lifecycle methods
- **WHEN** `init()` is called
- **THEN** the store SHALL initialize its backend (open DB, run migrations, load indexes)
- **WHEN** `clear()` is called
- **THEN** the store SHALL remove all local item data

#### Scenario: Interface defines batch upsert
- **WHEN** `upsertItems(siteId, items)` is called
- **THEN** each item SHALL be inserted or updated (if itemId already exists)
- **THEN** `is_read` SHALL be preserved for existing items (not reset to 0)

#### Scenario: Interface defines read status
- **WHEN** `markAsRead(siteId, itemId)` is called
- **THEN** the item SHALL have `is_read = 1` and `read_at` set to current timestamp
- **WHEN** `isRead(siteId, itemId)` is called
- **THEN** it SHALL return `true` if the item has `is_read = 1`, `false` otherwise
- **WHEN** `getUnreadCount(siteId)` is called
- **THEN** it SHALL return the count of items with `is_read = 0` for that site

#### Scenario: Interface defines search
- **WHEN** `search(query, siteId?)` is called
- **THEN** it SHALL return matching items ranked by relevance
- **THEN** each result SHALL include a text snippet from title or description

#### Scenario: Interface defines commit export
- **WHEN** `getItemsForCommit(siteId)` is called
- **THEN** it SHALL return all items for the site with their read status for GitHub commit

### Requirement: useItemStore hook provides active store

The system SHALL provide a `useItemStore()` hook that returns the active `ItemStore` implementation based on the current config.

#### Scenario: Hook returns LocalStorageStore by default
- **WHEN** `useItemStore()` is called and config has `storeProvider: 'localstorage'`
- **THEN** it SHALL return a `LocalStorageStore` instance

#### Scenario: Hook returns PGliteStore when configured
- **WHEN** `useItemStore()` is called and config has `storeProvider: 'pglite'`
- **THEN** it SHALL return a `PGliteStore` instance

### Requirement: Switching provider clears state

The system SHALL clear all local item data when the storage provider is switched in the Config page, and trigger a full re-sync from GitHub.

#### Scenario: Switch shows warning and reloads
- **WHEN** user changes the storage provider in Config page
- **THEN** a dialog SHALL warn that all local data will be cleared
- **THEN** the switch SHALL only proceed on user confirmation
- **WHEN** user confirms
- **THEN** `clear()` SHALL be called on the current store
- **THEN** the new provider SHALL be saved to config
- **THEN** the page SHALL reload to re-initialize with the new store and re-sync from GitHub