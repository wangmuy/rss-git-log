## Why

Currently, marking an item as read in "Show Only Unread" mode immediately removes it from view. This is jarring — items jump away mid-session, and the user loses context. Instead, read items should remain visible (greyed out) until the next page refresh, matching the mental model of "reading session" vs "persisted history."

## What Changes

- **Session-scoped read visibility**: When `showReadItems` is `false`, items marked as read during the current session stay visible until page refresh. The filter hides only items that were already read *before* the session started (i.e., persisted from a previous session).
- **Unread count reflects live state**: The count decreases immediately when items are read, even though they stay visible.
- **Read items appear greyed out**: Already implemented — `opacity: 0.6`, lighter text weight, checkmark icon. Visual distinction remains.
- **Mark-all-as-read greys out all items**: Clicking "Mark all as read" in a feed site greys out every item in that site but keeps them visible until refresh.
- **Keyboard `j` navigation**: Moving to the next item auto-marks it as read (behaviour unchanged), but the item stays visible (greyed out) rather than disappearing.
- **Keyboard `kbdItemId` filter exception removed**: No longer needed since nothing disappears mid-session. The visual selection border (orange) is retained.
- **Legacy `FeedList.tsx` removed**: Dead code — not imported anywhere.

## Capabilities

### New Capabilities
- `session-read-visibility`: Items marked read during the session remain visible (greyed out) until page refresh. The filter uses a mount-time snapshot of read status. Mark-all-as-read also greys out all items without removing them.

### Modified Capabilities
<!-- None — no existing capabilities to modify. -->

## Impact

- **Affected file**: `src/components/SidebarFeedLayout.tsx` — `FeedListPane` component (filter logic, snapshot capture, keyboard handler simplification)
- **Removed file**: `src/components/FeedList.tsx` — dead code, no longer imported
- **No change to**: `FeedItem.tsx`, `readerStore.ts`, `useRSSFeeds.ts`, `types/`
- **Tests**: `src/components/FeedListPane.test.tsx` — update filter expectations; existing tests for visual `isRead` behaviour remain valid
