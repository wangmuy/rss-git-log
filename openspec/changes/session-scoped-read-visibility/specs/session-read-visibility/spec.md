## ADDED Requirements

### Requirement: Session-scoped read visibility

When `showReadItems` is `false`, the system SHALL hide items that were read before the current session (from any source: localStorage, GitHub merge). Items the user marks as read during the current session SHALL remain visible (greyed out) until page refresh. This SHALL hold regardless of when batch operations (feed fetch, GitHub merge) arrive relative to the session.

#### Scenario: Item marked read stays visible

- **WHEN** a user views a feed in "Show Only Unread" mode and clicks an unread item to mark it as read
- **THEN** the item SHALL remain visible in the list, rendered with read-item styling (greyed out, lighter text, checkmark icon)

#### Scenario: Pre-read items are hidden on page load

- **WHEN** a user refreshes the page and views a feed in "Show Only Unread" mode
- **THEN** items that were marked as read in a previous session SHALL be hidden

#### Scenario: Pre-read items stay hidden after marking another item as read

- **WHEN** a user views a feed in "Show Only Unread" mode, sees a pre-read item is hidden, and marks another unread item as read
- **THEN** the pre-read item SHALL remain hidden (not affected by the new mark-as-read)

#### Scenario: GitHub-merged read items are hidden

- **WHEN** a GitHub data merge adds items to the feed site, some of which have `readAt` timestamps
- **THEN** those items SHALL be hidden (not visible in "Show Only Unread" mode), even though the merge occurred after the session started

#### Scenario: Batch merge unread items are visible alongside session-unread items

- **WHEN** a feed fetch adds 30 items (10 pre-read, 20 unread) and a subsequent GitHub merge adds 25 items (20 pre-read, 5 unread)
- **THEN** the visible count SHALL be 20 (from feed) + 5 (from GitHub) = 25 unread items
- **AND** the sidebar unread count SHALL display 25

### Requirement: Unread count reflects live state

The unread count in the site sidebar SHALL decrease immediately when items are marked as read, regardless of whether they remain visible in the list.

#### Scenario: Unread count decreases on mark-as-read

- **WHEN** a user marks an item as read
- **THEN** the sidebar unread count for that site SHALL decrement by one

### Requirement: Mark-all-as-read greys out all items

Clicking "Mark all as read" for a feed site SHALL grey out all items in that site (read visual styling). All items SHALL remain visible until page refresh.

#### Scenario: Mark-all-as-read keeps items visible

- **WHEN** a user clicks "Mark all as read" for a feed site in "Show Only Unread" mode
- **THEN** all items in that site SHALL remain visible with read-item styling (greyed out)

#### Scenario: Mark-all-as-read sets unread count to zero

- **WHEN** a user clicks "Mark all as read"
- **THEN** the sidebar unread count for that site SHALL display 0

### Requirement: Keyboard j/k navigation

Pressing `j` SHALL navigate to the next item and auto-mark it as read. The navigated item SHALL remain visible (greyed out). Pressing `k` SHALL navigate to the previous item without marking it as read.

#### Scenario: j navigates and marks as read, item stays visible

- **WHEN** a user presses `j` in a feed with "Show Only Unread" mode active
- **THEN** the next item SHALL be selected with an orange visual border, marked as read, and remain visible with read-item styling

#### Scenario: k navigates up without marking

- **WHEN** a user presses `k` in a feed
- **THEN** the previous item SHALL be selected with an orange visual border, SHALL NOT be marked as read

### Requirement: Visual selection on keyboard focus

The `kbdItemId` state SHALL be retained for the orange visual selection border. The filter exception that kept `kbdItemId` items visible when read SHALL be removed.

#### Scenario: Keyboard-selected item shows orange border

- **WHEN** a user navigates to an item via `j` or `k`
- **THEN** the item SHALL display an orange left border and an outline

### Requirement: Legacy FeedList removed

The `FeedList.tsx` component SHALL be removed from the codebase as it is dead code (no imports reference it).

#### Scenario: FeedList.tsx deleted

- **WHEN** the codebase is examined after implementation
- **THEN** `src/components/FeedList.tsx` SHALL NOT exist and no imports shall reference it