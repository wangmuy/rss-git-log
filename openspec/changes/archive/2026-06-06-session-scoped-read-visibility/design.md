## Context

The `FeedListPane` component in `SidebarFeedLayout.tsx` currently filters items using a live `readItemIdSet` derived from the Zustand store's `readStatus`. Whenever `markAsRead` is called, the store updates, the memoized set recalculates, and the filter immediately removes the item from view. This causes a jarring UX where items vanish mid-session.

The app already supports visual distinction for read items (`FeedItem.tsx`: opacity 0.6, lighter font weight, checkmark icon). Users can tell which items are read — they don't need items to disappear.

## Goals / Non-Goals

**Goals:**
- Items marked read during the current session remain visible until page refresh
- Unread count reflects live state (decreases immediately on mark-as-read)
- Read items remain visually distinct (greyed out) — already implemented, unchanged
- Mark-all-as-read greys out all items in the current site without removing them
- Keyboard navigation (`j`/`k`) continues to work: `j` auto-marks the next item as read, item stays visible
- Remove the `kbdItemId` filter exception (no longer needed)
- Remove dead legacy `FeedList.tsx`

**Non-Goals:**
- No changes to persistence (localStorage format unchanged)
- No changes to `FeedItem.tsx`
- No changes to `useRSSFeeds.ts` hook signature

## Decisions

### 1. Session read tracking via store-level `sessionReadItemIdSet`

**Decision**: Add a non-persisted `sessionReadItemIdSet` field to the Zustand store (`readerStore.ts`). User-initiated mark actions (`markAsRead`, `markSiteAsRead`) add to BOTH `readStatus` (persisted) and `sessionReadItemIdSet` (ephemeral). `mergeGitHubReadStatus` only adds to `readStatus` (not session set).

**Rationale**: This distinguishes "user read this session" from "system discovered this was read elsewhere" (GitHub merge, localStorage load). The distinction matters because batch merges can arrive at any time, adding items to `readStatus` that should be hidden.

```
Filter rule (FeedListPane):
  show if (!readItemIdSet.has(id)) || sessionReadItemIdSet.has(id)

Pre-read (localStorage load)     → readStatus=✓, session=✗ → hidden  ✓
GitHub-merged read items          → readStatus=✓, session=✗ → hidden  ✓
User clicked this session         → readStatus=✓, session=✓ → visible ✓
Mark-all-as-read this session     → readStatus=✓, session=✓ → visible ✓
Unread items                      → readStatus=✗, session=✗ → visible ✓
```

**Alternatives considered:**
- **`useState` snapshot on mount**: Breaks when batch merges (GitHub) add items to `readStatus` after mount — those items would be missing from the snapshot and show as visible.
- **`useEffect` detecting new readStatus items**: Cannot distinguish between store changes from user action vs. GitHub merge.

### 2. Store changes (`readerStore.ts`)

| Change | Detail |
|---|---|
| Add `sessionReadItemIdSet: ReadStatus` field | Initialized as `{}`, NOT serialized to localStorage |
| `markAsRead(siteId, itemId)` | Also adds `itemId` to `sessionReadItemIdSet[siteId]` |
| `markSiteAsRead(siteId)` | Adds all of the site's item IDs to `sessionReadItemIdSet[siteId]` (via `getUnreadItems(siteId)`) |
| `mergeGitHubReadStatus(siteId, ...)` | NO change — only updates `readStatus`, not session set |
| `loadFromLocalStorage()` | NO change — `sessionReadItemIdSet` starts empty on load |
| `saveToLocalStorage()` | NO change — `sessionReadItemIdSet` is NOT persisted |

A helper getter `isReadInSession(siteId, itemId): boolean` exposes the session set for the filter.

### 3. Filter change in FeedListPane

```
// Before:
return !readItemIdSet.has(data.itemId);

// After:
return !readItemIdSet.has(data.itemId) || isReadInSession(site.siteId, data.itemId);
```

The `kbdItemId` filter exception (line 387) is removed entirely — no longer needed since user-read items already stay visible via the session set.

### 4. Unread count

Unchanged. The unread count uses `getUnreadCount` which lives on `readStatus` only, not `sessionReadItemIdSet`. So the count drops immediately when items are read, matching live state.

### 5. Mark-all-as-read

`markSiteAsRead` in the store is updated to also add items to `sessionReadItemIdSet`. The existing Web Worker flow is unchanged — it calls `markSiteAsRead` on the store, which now handles both sets.

## Risks / Trade-offs

- **[Race] GitHub merge and user mark-as-read in same render cycle**: Items from GitHub merge are added to `readStatus` but NOT session set. If the user happens to mark an item as read that arrived via GitHub merge, `markAsRead` adds it to both sets — item stays visible. Correct behavior.
- **[State] Session set grows**: `sessionReadItemIdSet` accumulates items over the session. **Mitigation**: It's cleared on page refresh (not persisted). Memory impact is negligible (Set of string IDs).
- **[Behavior change] Items stay visible**: Existing muscle memory of "items vanish on read" will break. **Mitigation**: Items grey out immediately — the visual change is clear. This is the desired behavior.