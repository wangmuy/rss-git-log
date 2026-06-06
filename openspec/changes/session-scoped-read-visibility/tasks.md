## 1. Store changes (readerStore.ts)

- [ ] 1.1 Add `sessionReadItemIdSet: ReadStatus` field (initialized `{}`, not serialized)
- [ ] 1.2 Modify `markAsRead` to also add to `sessionReadItemIdSet[siteId]`
- [ ] 1.3 Modify `markSiteAsRead` to also add site items to `sessionReadItemIdSet[siteId]`
- [ ] 1.4 Add a getter `isReadInSession(siteId, itemId): boolean` for use by FeedListPane

## 2. FeedListPane filter changes

- [ ] 2.1 Update items filter to use `isReadInSession` exception: `!readItemIdSet.has(id) || isReadInSession(site.siteId, id)`
- [ ] 2.2 Remove the `kbdItemId` filter exception (line 387: `if (data.itemId === kbdItemId) return true`)
- [ ] 2.3 Add `key={selectedSite.siteId}` to `<FeedListPane>` if needed for keyboard state reset (still good practice)

## 3. Remove legacy FeedList.tsx

- [ ] 3.1 Delete `src/components/FeedList.tsx`

## 4. Update tests

- [ ] 4.1 Update `FeedListPane.test.tsx` to reflect session-scoped filter behavior (items marked read stay visible until refresh)
- [ ] 4.2 Run `npm test` to verify all tests pass
- [ ] 4.3 Run `npm run build` to verify type-check and build succeed