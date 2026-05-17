## ADDED Requirements

### Requirement: Generate unique item ID using composite hash
The system SHALL generate a unique item ID using base64-encoded composite string of guid, normalized link, title, description, and pubDate.

#### Scenario: Consistent ID generation
- **WHEN** same item data is provided multiple times
- **THEN** system generates identical 32-character base64 ID each time

#### Scenario: Unique IDs across feeds
- **WHEN** items from different feeds have same title but different guids
- **THEN** system generates different IDs for each item

### Requirement: Track read status in Zustand store
The system SHALL maintain read status using Zustand store with siteId → Set<itemId> mapping.

#### Scenario: Mark item as read
- **WHEN** user clicks on an unread item
- **THEN** item ID is added to read status set for that site

#### Scenario: Check if item is read
- **WHEN** system queries read status for an item
- **THEN** system returns boolean based on store state

#### Scenario: Get unread count for site
- **WHEN** system queries unread count for a site
- **THEN** system returns number of items not in read status set

### Requirement: Persist read status to LocalStorage
The system SHALL save read status to browser LocalStorage for session persistence.

#### Scenario: Auto-save on change
- **WHEN** read status changes (item marked as read)
- **THEN** updated status is saved to LocalStorage immediately

#### Scenario: Load on app start
- **WHEN** application initializes
- **THEN** read status is loaded from LocalStorage if available

### Requirement: Bulk mark as read operations
The system SHALL support marking all items in a site or all sites as read.

#### Scenario: Mark site as read
- **WHEN** user triggers mark site as read
- **THEN** all items in that site are added to read status

#### Scenario: Mark all as read
- **WHEN** user triggers mark all as read
- **THEN** all items in all sites are added to read status
