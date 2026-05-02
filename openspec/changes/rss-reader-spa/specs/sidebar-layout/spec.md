## ADDED Requirements

### Requirement: Two-panel sidebar layout
The system SHALL display a left panel with site list and right panel with content using SidebarFeedLayout component.

#### Scenario: Render sidebar and content panels
- **WHEN** application loads with configured sites
- **THEN** left panel shows site list, right panel shows selected site's feed items

#### Scenario: Responsive layout on mobile
- **WHEN** screen width is below md breakpoint
- **THEN** sidebar collapses or stacks vertically for mobile viewing

### Requirement: Site selection with visual feedback
The system SHALL highlight selected site and display its feed items in content panel.

#### Scenario: Click site to select
- **WHEN** user clicks on a site in sidebar
- **THEN** site is highlighted with colored border and its items display in content panel

#### Scenario: Unread count badge
- **WHEN** site has unread items
- **THEN** site name displays with unread count badge

### Requirement: Display feed items sorted by date
The system SHALL sort RSS items by pubDate in descending order (newest first).

#### Scenario: Sort items on load
- **WHEN** feed items are loaded for a site
- **THEN** items are displayed sorted by pubDate descending

#### Scenario: Re-sort after refresh
- **WHEN** user refreshes feed
- **THEN** items are re-sorted by pubDate descending

### Requirement: Visual distinction for read items
The system SHALL display read items with visual distinction (grayed out, strikethrough, or dimmed).

#### Scenario: Read item appearance
- **WHEN** item is marked as read
- **THEN** item appears visually distinct (grayed/strikethrough) from unread items

#### Scenario: Toggle show read items
- **WHEN** user toggles "show read items" setting
- **THEN** read items are shown or hidden accordingly

### Requirement: Item click marks as read
The system SHALL mark item as read when user clicks on it, and open the link in new tab.

#### Scenario: Click item to read
- **WHEN** user clicks on an unread item
- **THEN** item is marked as read and link opens in new tab

#### Scenario: Click already-read item
- **WHEN** user clicks on an already-read item
- **THEN** link opens in new tab without changing read status
