## Implementation Notes

**REPLACE** - This replaces the current implementation entirely. Remove old code, no backward compatibility or migration needed.

- Remove old `getAllUnreadItems()` usage
- Remove old `commitAllReadItems()` that commits unread items
- Remove any adaptation layer for old format

## 1. Store Updates

- [ ] 1.1 Add `getAllItems(siteId)` method to readerStore.ts that returns all items (read + unread) for a site
- [ ] 1.2 Add `getReadItems(siteId)` method that returns only items with readAt timestamp
- [ ] 1.3 Add `mergeGitHubReadStatus(siteId, githubItemIds)` method to update read status from GitHub data

## 2. Log File Management Updates

- [ ] 2.1 Modify `commitReadStatus()` to accept ALL items (read + unread) instead of only unread
- [ ] 2.2 Add sorting by pubDate descending before committing
- [ ] 2.3 Ensure deduplication: skip items already in log file (by itemId)
- [ ] 2.4 Create `commitAllFeedItems(siteId, siteName, items)` function that commits complete feed
- [ ] 2.5 Create `renameToAllread(filePath)` function to rename file with -allread suffix
- [ ] 2.6 Add logic to check if all items in a file are read after commit, trigger rename if true

## 3. Fetch + Sync Integration

- [ ] 3.1 Modify `useRSSFeeds.ts` to call `getReadItemsForSite()` after feed fetch completes
- [ ] 3.2 Implement merge logic: for each RSS item, check if itemId exists in GitHub logs
- [ ] 3.3 Update local read status based on GitHub data (if exists → read, if not → unread)
- [ ] 3.4 Handle multiple log files per site (iterate through date range)

## 4. Commit Flow Updates

- [ ] 4.1 Modify `useCommit.ts` to use `getAllItems()` instead of `getAllUnreadItems()`
- [ ] 4.2 Update `commitAllReadItems()` to `commitAllFeedItems()` with new signature
- [ ] 4.3 Wire commit to check for all-read files and trigger rename

## 5. Testing

- [ ] 5.1 Write unit tests for commitAllFeedItems deduplication
- [ ] 5.2 Write unit tests for merge logic (RSS items + GitHub read status)
- [ ] 5.3 Write integration test for full fetch + sync flow
- [ ] 5.4 Test -allread file rename logic
- [ ] 5.5 Verify no regression in existing tests

## 6. Cleanup

- [ ] 6.1 Remove unused `markAllAsRead` from store if no longer needed
- [ ] 6.2 Clean up any debug logging added during development
- [ ] 6.3 Verify build passes with no TypeScript errors