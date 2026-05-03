## Why

**REPLACE** - This is a complete replacement of the current implementation. No migration or backward compatibility needed.

The current implementation has two issues:
1. **Manual commit commits unread items** - The commit function currently commits items that are NOT yet read (via `getAllUnreadItems`), which is backwards. It should commit items that HAVE been read to persist read history.
2. **GitHub logs not fetched on load** - When feeds are fetched, the app doesn't load existing read history from GitHub, so it loses track of previously read items across sessions.

## What Changes

- **Modify**: Manual commit to commit all items (read + unread) from current feed, ordered by pubDate desc, with incremental deduplication
- **Modify**: Log file naming - when all items in a log file are marked read, rename the file with `-allread` suffix
- **Modify**: Feed fetching - after fetching current feed items, also fetch GitHub logs (excluding `-allread` files) and merge with local items, setting read status based on log data

## Impact

- **Code**: Modify `log-file.ts` commit functions and `useRSSFeeds` hook
- **Data Flow**: Feeds now sync read status bidirectionally with GitHub
- **Storage**: Log files accumulate full feed history, with `-allread` suffix indicating fully read files