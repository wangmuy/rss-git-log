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
- [ ] 2.10 Remove any remaining build-time GitHub owner/repo/branch/token setup from Vite env usage
- [ ] 2.11 Ensure GitHub reads and writes always use the same runtime-configured branch
- [ ] 2.12 Add GitHub token write-capability check for the configured owner, repo, and branch
- [ ] 2.13 Persist or expose token write-capability status for UI gating and error display

## 3. RSS Parsing Engine

- [x] 3.1 Create src/types/rss.ts with RSSItem, RSSFeed interfaces
- [x] 3.2 Implement parseXMLFeed() function using native DOMParser
- [x] 3.3 Add RSS 2.0 detection and parsing (channel, item elements)
- [x] 3.4 Add Atom format detection and parsing (feed, entry elements)
- [x] 3.5 Implement fetchRSS() with direct fetch → corsproxy.io → allorigins.win fallback
- [x] 3.6 Create removeTrackingParams() utility for URL normalization
- [x] 3.7 Test parsing with sample RSS 2.0 and Atom feeds
- [x] 3.8 Add error handling for malformed XML
- [ ] 3.9 Refactor fetchRSS() to accept runtime CORS policy from app config
- [ ] 3.10 Support direct-only, proxy-fallback, and proxy-only RSS fetch modes
- [ ] 3.11 Support configurable proxy template order and per-attempt timeout

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
- [ ] 7.11 Add navigation entry or header action that opens the Config page after first setup
- [ ] 7.12 Move auto-commit setup out of transient reader settings and into persisted app config
- [ ] 7.13 Add manual commit button in the reader when GitHub write capability is valid
- [ ] 7.14 Hide manual commit button when token is missing, invalid, or cannot write to the configured repo

## 8. Data Management

- [x] 8.4 Create LocalStorage persistence layer for read status cache
- [x] 8.5 Implement data cleanup utilities for old session data
- [x] 8.6 Add merge strategy for LocalStorage + GitHub log data on startup
- [ ] 8.7 Add localStorage log-file cache keyed by repo, branch, siteId, and log file path
- [ ] 8.8 Add per-site cache eviction that keeps only the configured number of newest log files
- [ ] 8.9 Default local log-file cache retention to 1 file per site
- [ ] 8.10 Prune existing cached log files when Config lowers the per-site retention value

## 9. Polish & Error Handling

- [x] 9.1 Add ErrorDisplay component for user-friendly error messages
- [x] 9.2 Implement retry logic with exponential backoff for network failures
- [x] 9.3 Add GitHub API rate limit detection (429 errors) with backoff
- [x] 9.4 Create loading indicators (LinearProgress) for async operations
- [x] 9.5 Add empty states: no feeds configured, no unread items
- [x] 9.6 Implement React.memo() for expensive components (FeedItem, FeedList)
- [x] 9.7 Add error boundary wrapper for main app
- [ ] 9.8 Add validation and user-facing errors for invalid GitHub repo, branch, token, CORS proxy, and auto-commit interval settings

## 10. Runtime Config UI

- [ ] 10.1 Define versioned AppConfig type with sections for GitHub storage, GitHub write capability, CORS policy, auto-commit, local cache retention, and future extension settings
- [ ] 10.2 Add config storage utilities for loading, saving, validating, and resetting AppConfig in localStorage
- [ ] 10.3 Create ConfigPage component or refactor SetupPage into a full Config page reachable during normal app use
- [ ] 10.4 Add GitHub config form fields for owner, repo, branch, and optional token
- [ ] 10.5 Enforce a single branch value for both GitHub reads and writes
- [ ] 10.6 Add CORS policy controls for fetch mode, ordered proxy templates, custom proxy template, and timeout
- [ ] 10.7 Add auto-commit controls for enabled/disabled state and commit interval, defaulting enabled to false
- [ ] 10.8 Add local cache retention control for files per site, defaulting to 1
- [ ] 10.9 Add section-based layout so future configuration groups can be added without redesigning the page
- [ ] 10.10 Wire App startup to require Config page only when required GitHub settings are missing or invalid
- [ ] 10.11 Wire GitHub API, RSS fetching, auto-commit hooks, and local cache retention to consume AppConfig instead of scattered localStorage/settings reads
- [ ] 10.12 Run token write-capability check after token setup and whenever owner, repo, branch, or token changes
- [ ] 10.13 Disable auto-commit and show a config warning when write capability is invalid
- [ ] 10.14 Update README setup instructions to describe runtime Config page, default auto-commit off, local cache retention, write-capability checks, and removal of build-time GitHub setup references

## 11. Testing & Documentation

- [ ] 11.1 Set up vitest with React Testing Library
- [ ] 11.2 Write unit tests for generateItemId() (consistency, uniqueness)
- [ ] 11.3 Write unit tests for removeTrackingParams() URL normalization
- [ ] 11.4 Write unit tests for parseXMLFeed() with mock RSS/Atom data
- [ ] 11.5 Write component tests for FeedItem, SubscriptionManager, SettingsPanel, and ConfigPage
- [ ] 11.6 Write integration test for full read flow (fetch → display → track)
- [ ] 11.7 Write tests for AppConfig validation and default values
- [ ] 11.8 Write tests for CORS policy mode/proxy selection behavior
- [ ] 11.9 Write tests for GitHub token write-capability gating of manual and auto commit
- [ ] 11.10 Write tests for localStorage log-cache retention and per-site eviction
- [x] 11.11 Create README.md with installation and GitHub setup instructions
- [x] 11.12 Document CORS proxy usage and limitations
- [x] 11.13 Document security implications of client-side token storage
