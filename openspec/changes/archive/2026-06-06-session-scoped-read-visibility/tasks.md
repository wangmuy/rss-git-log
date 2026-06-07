## 1. Store changes (readerStore.ts)

- [x] 1.1 Add `sessionReadItemIdSet: ReadStatus` field (initialized `{}`, not serialized)
- [x] 1.2 Modify `markAsRead` to also add to `sessionReadItemIdSet[siteId]`
- [x] 1.3 Modify `markSiteAsRead` to also add site items to `sessionReadItemIdSet[siteId]`
- [x] 1.4 Add a getter `isReadInSession(siteId, itemId): boolean` for use by FeedListPane

## 2. FeedListPane filter changes

- [x] 2.1 Update items filter to use `isReadInSession` exception: `!readItemIdSet.has(id) || isReadInSession(site.siteId, id)`
- [x] 2.2 Remove the `kbdItemId` filter exception (line 387: `if (data.itemId === kbdItemId) return true`)
- [x] 2.3 Add `key={selectedSite.siteId}` to `<FeedListPane>` if needed for keyboard state reset (still good practice)

## 3. Remove legacy FeedList.tsx

- [x] 3.1 Delete `src/components/FeedList.tsx`

## 4. Update tests

- [x] 4.1 Update `FeedListPane.test.tsx` to reflect session-scoped filter behavior (items marked read stay visible until refresh)
- [x] 4.2 Run `npm test` to verify all tests pass
- [x] 4.3 Run `npm run build` to verify type-check and build succeed