## Why

Every page load or refresh fetches ALL historical log files from GitHub, even those where every item has been marked as read. With months of daily log files, this can be hundreds of files. The code already has `renameToAllread` and filters out `-allread` files during fetch, but `renameToAllread` is never called — so no files ever get the `-allread` suffix and all are fetched every time.

## What Changes

- After `mergeItemsIntoBucket` writes a log file and if every item now has `readAt` set (fully read), immediately call `renameToAllread` to rename it to `<date>-allread.json` and remove the original
- On subsequent page loads/refreshes, `getLogItemsForSite` skips `-allread` files, reducing the number of fetches for sites with large backlogs of read items

## Capabilities

### New Capabilities
- `allread-file-rotation`: Automatic renaming of fully-read log files to `-allread` suffix so they are excluded from future fetches

### Modified Capabilities
- *(none)*

## Impact

- `src/utils/log-file.ts`: `commitAllFeedItems` will iterate changed files after write, check if fully read, and call `renameToAllread`
- `renameToAllread` already exists and is functional, just never called
- The `-allread` filtering in `getLogItemsForSite`, `getReadItemsForSite`, and `listSiteFiles` already works — just needs files to actually have the suffix