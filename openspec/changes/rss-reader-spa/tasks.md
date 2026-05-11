## 1. Project Setup

- [x] 1.1 Initialize Vite React TypeScript project with `npm create vite@latest . -- --template react-ts`
- [x] 1.2 Install core dependencies: @mui/material, @emotion/react, @emotion/styled, zustand
- [x] 1.3 Create flattened project structure: src/components, src/hooks, src/store, src/types, src/utils
- [x] 1.4 Configure TypeScript paths in tsconfig.json with baseUrl and @/* path alias
- [x] 1.5 Set up MUI ThemeProvider and CssBaseline in App.tsx
- [x] 1.6 Verify build works with `npm run build`

## 2. GitHub API Integration

- [x] 2.1 Create src/types/config.ts with RSSConfig, GitHubConfig, ReaderSettings interfaces
- [x] 2.2 Create src/utils/github-api.ts with createGitHubClient() function
- [x] 2.3 Implement readFromGitHub<T>() using native fetch with atob base64 decoding
- [x] 2.4 Implement writeToGitHub<T>() using native fetch PUT with btoa base64 encoding
- [x] 2.5 Implement getGitHubFileSha() for update operations
- [x] 2.6 Create config loader: loadConfig() that fetches rss-config.json from GitHub
- [x] 2.7 Add 404 handling for missing files (return null instead of throwing)
- [x] 2.8 Test GitHub API read with public test repo
- [x] 2.9 Test GitHub API write with personal access token
- [x] 2.10 Remove any remaining build-time GitHub owner/repo/branch/token setup from Vite env usage
- [x] 2.11 Ensure GitHub reads and writes always use the same runtime-configured branch
- [x] 2.12 Add GitHub token write-capability check for the configured owner, repo, and branch
- [x] 2.13 Persist or expose token write-capability status for UI gating and error display

## 3. RSS Parsing Engine

- [x] 3.1 Create src/types/rss.ts with RSSItem, RSSFeed interfaces
- [x] 3.2 Implement parseXMLFeed() function using native DOMParser
- [x] 3.3 Add RSS 2.0 detection and parsing (channel, item elements)
- [x] 3.4 Add Atom format detection and parsing (feed, entry elements)
- [x] 3.5 Implement fetchRSS() with direct fetch → corsproxy.io → allorigins.win fallback
- [x] 3.6 Create removeTrackingParams() utility for URL normalization
- [x] 3.7 Test parsing with sample RSS 2.0 and Atom feeds
- [x] 3.8 Add error handling for malformed XML
- [x] 3.9 Refactor fetchRSS() to accept runtime CORS policy from app config
- [x] 3.10 Support direct-only, proxy-fallback, and proxy-only RSS fetch modes
- [x] 3.11 Support configurable proxy template order and per-attempt timeout

## 4. Read Status Tracking

- [x] 4.1 Create src/utils/item-id.ts with generateItemId() function
- [x] 4.2 Implement composite ID: base64(guid|normalizedLink|title|description|pubDate)
- [x] 4.3 Create getSiteId() function using normalized URL
- [x] 4.4 Create Zustand store: src/store/readerStore.ts with readStatus Record<siteId, Set<itemId>>
- [x] 4.5 Implement markAsRead(siteId, itemId) action
- [x] 4.6 Implement markSiteAsRead(siteId) action
- [x] 4.7 Implement markAllAsRead() action
- [x] 4.8 Implement isRead(siteId, itemId) query function
- [x] 4.9 Implement getUnreadCount(siteId) query function
- [x] 4.10 Test ID consistency and state persistence

## 5. Log File Management

- [x] 5.1 Create src/types/log.ts with SiteLogData interface (metadata + items)
- [x] 5.2 Implement getLogFilePath(siteId, date?) returning `logs/{siteId}/YYYY-MM-DD.json`
- [x] 5.3 Create commitReadStatus(siteId, siteName, items) function
- [x] 5.4 Implement merge logic to avoid duplicate items (by itemId)
- [x] 5.5 Add 200-item chunking with automatic new file creation
- [x] 5.6 Implement filename based on oldest item date in chunk
- [x] 5.7 Create commitAllReadItems() for batch commits across sites
- [x] 5.8 Add error handling for network failures and rate limits
- [x] 5.9 Test log file creation, update, and chunking

## 6. Subscription Management UI

- [x] 6.1 Create SubscriptionManager component with add/edit/delete functionality
- [x] 6.2 Implement form validation for RSS feed URL and name
- [x] 6.3 Create saveRSSConfig() function to sync config changes to GitHub
- [x] 6.4 Add LocalStorage wrapper for config state management
- [x] 6.5 Implement auto-refresh feeds after config changes
- [x] 6.6 Add confirmation dialog for delete operations
- [x] 6.7 Test subscription CRUD operations with GitHub sync
- [x] 6.8 Make subscription list collapsible with MUI Collapse component
- [x] 6.9 Set subscription list to collapsed by default for screen space

## 7. Sidebar Layout

- [x] 7.1 Create SidebarFeedLayout component with two-panel design
- [x] 7.2 Implement left panel: site list with unread count badges
- [x] 7.3 Implement right panel: feed item display area
- [x] 7.4 Add site selection with visual feedback (colored border for selected)
- [x] 7.5 Create FeedItem component with read/unread visual distinction
- [x] 7.6 Implement DateTime descending sort for RSS items
- [x] 7.7 Add click handler: mark as read + open link in new tab
- [x] 7.8 Create Header component with refresh, settings, and mark all read buttons
- [x] 7.9 Implement SettingsPanel with show-read toggle and auto-commit settings
- [x] 7.10 Add responsive design for mobile (collapse sidebar on small screens)
- [x] 7.11 Add navigation entry or header action that opens the Config page after first setup
- [x] 7.12 Move auto-commit setup out of transient reader settings and into persisted app config
- [x] 7.13 Add manual commit button in the reader when GitHub write capability is valid
- [x] 7.14 Hide manual commit button when token is missing, invalid, or cannot write to the configured repo

- [x] 7.15 Remove maxWidth constraint from reader Container for full-width layout
- [x] 7.16 Make sidebar width responsive using MUI breakpoint system
- [x] 7.17 Verify feed items list pane expands to fill remaining space
- [x] 7.18 Replace fixed 70vh height with flex-based layout that fills viewport
- [x] 7.19 Ensure root Box uses flex column to distribute header and content vertically
- [x] 7.20 Ensure sidebar site list scrolls independently with flex: 1 overflow: auto
- [x] 7.21 Ensure feed items area scrolls independently with flex: 1 overflow: auto
- [x] 7.22 Create useKeyboardNavigation hook for j/k item selection
- [x] 7.23 Wire j key to select next item (or first unread if none selected)
- [x] 7.24 Wire k key to select previous item
- [x] 7.25 Auto-mark item as read when selected via keyboard
- [x] 7.26 Add visual highlight for keyboard-selected feed item
- [x] 7.27 Prevent keyboard shortcuts from firing when typing in input fields

## 8. Data Management

- [x] 8.4 Create LocalStorage persistence layer for read status cache
- [x] 8.5 Implement data cleanup utilities for old session data
- [x] 8.6 Add merge strategy for LocalStorage + GitHub log data on startup
- [x] 8.7 Add localStorage log-file cache keyed by repo, branch, siteId, and log file path
- [x] 8.8 Add per-site cache eviction that keeps only the configured number of newest log files
- [x] 8.9 Default local log-file cache retention to 1 file per site
- [x] 8.10 Prune existing cached log files when Config lowers the per-site retention value

## 9. Polish & Error Handling

- [x] 9.1 Add ErrorDisplay component for user-friendly error messages
- [x] 9.2 Implement retry logic with exponential backoff for network failures
- [x] 9.3 Add GitHub API rate limit detection (429 errors) with backoff
- [x] 9.4 Create loading indicators (LinearProgress) for async operations
- [x] 9.5 Add empty states: no feeds configured, no unread items
- [x] 9.6 Implement React.memo() for expensive components (FeedItem, FeedList)
- [x] 9.7 Add error boundary wrapper for main app
- [x] 9.8 Add validation and user-facing errors for invalid GitHub repo, branch, token, CORS proxy, and auto-commit interval settings

## 10. Runtime Config UI

- [x] 10.1 Define versioned AppConfig type with sections for GitHub storage, GitHub write capability, CORS policy, auto-commit, local cache retention, and future extension settings
- [x] 10.2 Add config storage utilities for loading, saving, validating, and resetting AppConfig in localStorage
- [x] 10.3 Create ConfigPage component or refactor SetupPage into a full Config page reachable during normal app use
- [x] 10.4 Add GitHub config form fields for owner, repo, branch, and optional token
- [x] 10.5 Enforce a single branch value for both GitHub reads and writes
- [x] 10.6 Add CORS policy controls for fetch mode, ordered proxy templates, custom proxy template, and timeout
- [x] 10.7 Add auto-commit controls for enabled/disabled state and commit interval, defaulting enabled to false
- [x] 10.8 Add local cache retention control for files per site, defaulting to 1
- [x] 10.9 Add section-based layout so future configuration groups can be added without redesigning the page
- [x] 10.10 Wire App startup to require Config page only when required GitHub settings are missing or invalid
- [x] 10.11 Wire GitHub API, RSS fetching, auto-commit hooks, and local cache retention to consume AppConfig instead of scattered localStorage/settings reads
- [x] 10.12 Run token write-capability check after token setup and whenever owner, repo, branch, or token changes
- [x] 10.13 Disable auto-commit and show a config warning when write capability is invalid
- [x] 10.14 Update README setup instructions to describe runtime Config page, default auto-commit off, local cache retention, write-capability checks, and removal of build-time GitHub setup references
- [x] 10.15 Add clearAllLocalStorage utility to remove all app storage keys
- [x] 10.16 Add Clear All Data button to Config page action bar
- [x] 10.17 Add confirmation dialog before clearing data
- [x] 10.18 Reset form state and show success message after clearing

## 11. Testing & Documentation

- [x] 11.1 Set up vitest with React Testing Library
- [x] 11.2 Write unit tests for generateItemId() (consistency, uniqueness)
- [x] 11.3 Write unit tests for removeTrackingParams() URL normalization
- [x] 11.4 Write unit tests for parseXMLFeed() with mock RSS/Atom data
- [x] 11.5 Write component tests for FeedItem, SubscriptionManager, SettingsPanel, and ConfigPage
- [x] 11.6 Write integration test for full read flow (fetch → display → track)
- [x] 11.7 Write tests for AppConfig validation and default values
- [x] 11.8 Write tests for CORS policy mode/proxy selection behavior
- [x] 11.9 Write tests for GitHub token write-capability gating of manual and auto commit
- [x] 11.10 Write tests for localStorage log-cache retention and per-site eviction
- [x] 11.11 Create README.md with installation and GitHub setup instructions
- [x] 11.12 Document CORS proxy usage and limitations
- [x] 11.13 Document security implications of client-side token storage

## 12. On-Demand Feed Fetching with Concurrent Pool

- [x] 12.1 Modify SidebarFeedLayout to render site list immediately without waiting for feed fetches
- [x] 12.2 Add per-site loading state tracking in component or store (isLoading per siteId)
- [x] 12.3 Show loading spinner icon next to each site while its feed is being fetched
- [x] 12.4 Calculate unread count fresh from newest fetched items (not from cached read status)
- [x] 12.5 On page load, start fetching up to 3 feeds in parallel (pool size = 3)
- [x] 12.6 When clicking site already fetched or in fetch pool, do not trigger another fetch
- [x] 12.7 When clicking site not fetched and not in pool, add to pool head for priority fetching
- [x] 12.8 Display right pane feed items immediately once selected site's feed resolves
- [x] 12.9 Test: pool of 3 fetches in parallel on load, clicking queued site triggers no duplicate fetch

## 13. Per-PubDate Log File Grouping

- [x] 13.1 Create `groupByPubDate(itemList): Map<YYYY-MM-DD, LogItem[]>` utility in `src/utils/log-file.ts`
- [x] 13.2 Implement `locateLogFileByDate(siteId, date, cfg): string | null` — lists directory, returns file path matching this date with < 200 items
- [x] 13.3 Implement `findOverflowBucket(siteId, date, cfg): string | null` — returns `date-{N}.json` where N starts from existing overflow count
- [x] 13.4 Rewrite `commitAllFeedItems()` with per-bucket merge: group by pubDate → for each bucket locate→read→dedup→append→write
- [x] 13.5 Overflow logic: when bucket file >= 200 items, create `date-N.json` and write remaining items
- [x] 13.6 Apply the same per-bucket grouping + merge pattern to `commitReadStatus()`
- [x] 13.7 Update `getLatestLogFile()` to return highest-date bucket with space; fall back to overflow
- [x] 13.8 Remove `findOldestItemDate()` (no longer used as filename basis)
- [x] 13.9 Clean up unused `checkAndRenameAllread` function
- [x] 13.10 Write unit tests: `groupByPubDate` grouping, single-date, multi-date, ordering, `parseLogFilename`
- [x] 13.11 Update spec: `specs/log-management/spec.md` — all log-management requirements now describe per-bucket behavior
- [x] 13.12 Verify SPA read flow (`getLogItemsForSite`, `getReadItemsForSite`) still discovers all bucket files

## 14. Item Source Tracing

- [x] 14.1 Add `source?: string` field to `LogItem` interface in `src/types/log.ts`
- [x] 14.2 Add source setting in `mergeItemsIntoBucket()` — after `writeToGitHub` succeeds, mark each new item with `item.source = targetFile`
- [x] 14.3 Verify existing code compiles without `source` (optional field, no breaking change)
- [x] 14.4 Verify unit tests pass with optional `source` field
- [x] 14.5 Add design decision documentation in `design.md` section 20

## 15. Merge-and-Commit: Unified Read-Merge-Dedup Append-Write

- [x] 15.1 Document merge flow in `design.md` section 20: `commitAllFeedItems` receives union of fresh RSS + historical items, groups by pubDate, locate→read→dedup→append→write per bucket
- [x] 15.2 Document source field lifecycle in `design.md`: fresh=no source, GitHub read=source=file path, after commit=source=targetFile
- [x] 15.3 Document source field scope: lives in GitHub files only, not in SPA store interfaces
- [x] 15.4 Document `[Merge Divergence Between Local and Remote]` risk in `design.md` Risks/Trade-offs
- [x] 15.5 Verify existing `mergeItemsIntoBucket` already implements the full merge pattern without separate pre-merge step
- [x] 15.6 Verify `useCommit.ts` passes full item set (`getAllItems` → `commitAllFeedItems`) with `readAt` for read items
- [x] 15.7 Add `source` field documentation in `LogItem` type in `src/types/log.ts` with lifecycle comment
- [x] 15.8 Verify `source` is NOT persisted to JSON: `writeToGitHub` serializes before `item.source` is assigned
- [x] 15.9 Verify store interfaces (`getAllItems`, `getReadItems`) and `useRSSFeeds.ts` strip `source` (interface contracts)

## 16. Per-Site Mark All Read: Right Pane Button

- [x] 16.1 Add `markSiteAsRead` store method to `SidebarFeedLayout` (via `useReaderStore`)
- [x] 16.2 Add "Mark All Read" `IconButton` in the right pane header with `CheckCircleIcon`
- [x] 16.3 Display unread count in the right pane header next to the total count
- [x] 16.4 Pass `isRead` as a prop to `FeedListPane` for keyboard navigation auto-read
- [x] 16.5 Add design decision documentation in `design.md` section 21
- [x] 16.6 Add `[Unread Count Accuracy]` risk entry in `design.md` Risks/Trade-offs

## 17. Hard Refresh (Feed + GitHub Repo)

- [x] 17.1 Implement refresh function in `useRSSFeeds.ts` that fetches both RSS feed and GitHub repo data
- [x] 17.2 Refresh clears current site data before fetching (simulates browser hard refresh)
- [x] 17.3 Refresh fetches RSS feed items via `fetchRSSWithPolicy`
- [x] 17.4 Refresh fetches historical items from GitHub log files via `getLogItemsForSite`
- [x] 17.5 Refresh merges GitHub read status via `mergeGitHubReadStatus`
- [x] 17.6 Refresh calculates final unread count from merged data via `getUnreadCount`
- [x] 17.7 Add design decision documentation in `design.md` section 22

## 18. Live Unread Count Updates

- [x] 18.1 Modify `markAsRead` in `readerStore.ts` to also recalculate and update the site's `unreadCount` when an item is marked as read
- [x] 18.2 Use `getUnreadCount` to compute the new count and call `updateSite` to persist the updated count
- [x] 18.3 Verify left pane unread count badge decreases by 1 when marking read via keyboard `j` key
- [x] 18.4 Verify left pane unread count badge decreases by 1 when marking read via mouse click
- [x] 18.5 Add design decision documentation in `design.md` section 23
- [x] 18.6 Add unit tests in `src/store/readerStore.test.ts` for markAsRead updating unreadCount
- [x] 18.7 Fix `markSiteAsRead` to also update unreadCount to 0
- [x] 18.8 Fix keyboard navigation: replace index-based `kbdIndex` with itemId-based `kbdItemId` so navigating j/k on same items doesn't cause duplicate unread count decrements
- [x] 18.9 Add unit tests verifying `markAsRead` on already-read items does not decrease count (tests 18.8-18.10 in readerStore.test.ts)

## 19. Show All / Show Unread Only Toggle

- [x] 19.1 Add `showReadItems` state in `ReaderLayout.tsx` with default false
- [x] 19.2 Add `showReadItems` and `onShowReadItemsChange` props to `Header.tsx`
- [x] 19.3 Add Switch component with "Show All" label in `Header.tsx`
- [x] 19.4 Pass `showReadItems` to `SidebarFeedLayout` component
- [x] 19.5 Pass `showReadItems` to `FeedListPane` component
- [x] 19.6 Filter items in `FeedListPane` based on `showReadItems` setting
- [x] 19.7 Add `useEffect` to reset `kbdIndex` to -1 when `showReadItems` changes
- [x] 19.8 Update component tests to include new Header props
- [x] 19.9 Add design decision documentation in `design.md` section 23
