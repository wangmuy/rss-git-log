## Architecture Overview

### Implementation Strategy

**REPLACE** - This is a complete replacement of the current commit and fetch implementation. No migration or backward compatibility needed. The old behavior is removed entirely.

### Current Behavior (To Be Replaced)

```
1. Fetch RSS feed → get items
2. User reads items → markAsRead() → stored in local Zustand + LocalStorage
3. Manual Commit → getAllUnreadItems() → commit to GitHub ❌ (commits unread, not read)
4. On reload → fetch RSS feed only → GitHub logs NOT fetched → lose read history
```

### New Behavior (Target)

```
1. Fetch RSS feed → get items
2. After RSS fetch → fetch GitHub logs (non-allread files)
3. Merge: Combine RSS items + GitHub log items → show all in feed list
   - For each item: if has readAt → read, else unread
4. User reads items → markAsRead() → local + LocalStorage
5. Manual Commit → getAllItems() → commit ALL items (read + unread) to GitHub
   - Items have readAt if previously read, no readAt if unread
6. After commit → check if all items in file are read → if yes, rename with -allread suffix
```

## Detailed Design

### 1. Manual Commit Changes

**Current**: `commitAllReadItems(allUnreadItems)` - commits items that are NOT read

**New**: Create `commitAllFeedItems(siteId, items)` that:
- Takes ALL items from current feed (both read and unread)
- Sorts items by pubDate descending
- Incremental commit: reads existing log file, filters duplicates by itemId, appends new items
- Deduplication: skip items that already exist in the log file
- **Max 200 items per file**: if existing file has >= 200 items, create new file
- **Filename**: `logs/{siteId}/YYYY-MM-DD.json` where YYYY-MM-DD is oldest item date

**Log file structure** (contains read status via readAt field):
```json
{
  "metadata": {
    "siteId": "https://techcrunch.com/feed/",
    "siteName": "TechCrunch",
    "oldestItemDate": "2026-05-01",
    "newestItemDate": "2026-05-03",
    "itemCount": 250,
    "generatedAt": "2026-05-03T12:00:00Z"
  },
  "items": [
    { "itemId": "...", "title": "...", "pubDate": "...", "readAt": "2026-05-03T10:00:00Z" },
    { "itemId": "...", "title": "...", "pubDate": "..." },  // no readAt = unread
    ...
  ]
}
```

**Read status in log**:
- Item has `readAt` timestamp → read
- Item has no `readAt` field → unread

### 2. -allread Suffix Logic

After each commit to a log file:
1. Fetch the file to get current items
2. Check which items are marked as read (have `readAt` field)
3. If ALL items in the file have `readAt` (all read):
   - Rename file: `2026-05-01.json` → `2026-05-01-allread.json`
   - Update metadata to reflect all-read status

**Note**: Files with `-allread` suffix are:
- Ignored when fetching logs (skipped)
- No longer updated with new items

### 3. Feed Fetching + GitHub Sync

In `useRSSFeeds` hook, after `doFetch()` completes:

```
1. For each site in the fetched feeds:
   a. Call getLogItemsForSite(siteId) to fetch all non-allread log files
   b. Returns: Map<itemId, LogItem> (contains title, pubDate, readAt?)
   c. Identify historical items: log items NOT in current RSS feed
   d. Add historical items to site.items (these are items previously in feed, now dropped)
   e. For all items (RSS + historical):
      - If has readAt timestamp → mark as read
      - If no readAt → mark as unread

2. Update store with merged read status and combined items
```

**Merge Algorithm**:
```
RSS items from feed: [A, B, C]
GitHub log items:
  - A: { readAt: "2026-05-03T10:00:00Z" }  ← in feed, has readAt = read
  - B: {}  ← in feed, no readAt = unread
  - C: { readAt: "2026-05-01T08:00:00Z" }  ← in feed, has readAt = read
  - X: { readAt: "2026-04-28T12:00:00Z" }  ← NOT in feed, has readAt = read (show as historical)
  - Y: {}  ← NOT in feed, no readAt = unread (show as historical - not read yet, dropped from feed)

Combined result (sorted by pubDate desc):
- A: read (has readAt)
- B: unread (no readAt)
- C: read (has readAt)
- X: read (not in feed, has readAt)
- Y: unread (not in feed, no readAt - still unread, just dropped from feed)
```

### 4. Store Changes

Add/modify store methods:
- `getAllItems(siteId)` - returns all items for a site (from site.items)
- `setSiteItems(siteId, items)` - set combined items (RSS + historical) for a site
- `mergeGitHubReadStatus(siteId, githubItems)` - merges read status from GitHub Map<itemId, LogItem> into local state

### 5. File Naming Convention

| File | Meaning |
|------|---------|
| `logs/techcrunch.com/2026-05-01.json` | Active log - new items can be added |
| `logs/techcrunch.com/2026-05-01-allread.json` | All items read - skipped during fetch and sync |

## API Changes

### log-file.ts

```typescript
// New: commit all feed items (read + unread), sorted by date desc
commitAllFeedItems(
  siteId: string,
  siteName: string,
  items: RSSItem[]
): Promise<boolean>

// New: rename file to add -allread suffix
renameToAllread(filePath: string): Promise<boolean>

// New: fetch all log items from GitHub (excludes allread files)
// Returns map of itemId -> LogItem (contains title, pubDate, readAt)
getLogItemsForSite(
  siteId: string
): Promise<Map<string, LogItem>>  // itemId -> LogItem (title, pubDate, readAt?)
```

### readerStore.ts

```typescript
// New: get all items for a site (read + unread) - from store's site.items
getAllItems(siteId: string): RSSItem[]

// New: add historical items from GitHub (items not in RSS feed)
addHistoricalItems(
  siteId: string,
  items: Array<{ itemId: string; title: string; pubDate: string; readAt?: string }>
): void

// Modified: merge GitHub read status into store
mergeGitHubReadStatus(
  siteId: string,
  githubItems: Map<string, LogItem>
): void
```

### useRSSFeeds.ts

```typescript
// Modified: after fetching feeds, sync with GitHub logs
const doFetch = useCallback(async () => {
  // ... existing fetch logic ...

  // NEW: after fetch, sync with GitHub logs
  for (const site of sitesWithStatus) {
    const githubItems = await getLogItemsForSite(site.siteId);
    
    // Add historical items (in logs but not in RSS feed)
    const historicalItems: RSSItem[] = [];
    const rssItemIds = new Set(site.items.map(i => generateItemIdFromItem(i)));
    for (const [itemId, logItem] of githubItems) {
      if (!rssItemIds.has(itemId)) {
        historicalItems.push({
          title: logItem.title,
          pubDate: logItem.pubDate,
          // other fields as needed
        });
      }
    }
    
    // Merge items and update site
    const allItems = [...site.items, ...historicalItems];
    // Update site with all items, then merge read status
    mergeGitHubReadStatus(site.siteId, githubItems);
  }
}, [...]);
```

## Edge Cases

1. **Empty GitHub logs**: If no logs exist, all RSS items are unread
2. **Log file full (200 items)**: Create new file, continue adding
3. **Item in multiple log files**: Deduplicate by itemId during merge
4. **Item in GitHub logs but not in current RSS feed**: 
   - If has readAt → show as read (historical item)
   - If no readAt → show as unread (reader hasn't read it, feed kept updating so item dropped off)
5. **Offline commit**: Queue commits, sync when online
6. **Concurrent edits**: GitHub SHA-based optimistic locking handles conflicts

## UI Impact

- No UI changes required
- Backend logic only
- Existing manual commit button triggers new behavior
- Auto-commit also benefits from new logic