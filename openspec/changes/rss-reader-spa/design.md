## Context

RSS Reader is a static React SPA that uses GitHub as a backend replacement. The application:
- Runs purely in the browser (no Node.js server)
- Uses GitHub REST API v3 for reading/writing config and log files
- Stores read status in browser LocalStorage for session persistence
- Commits site-based read logs to GitHub as JSON files

**Current State (as of 2025-12-24):**
- MVP completed with all core features
- Architecture flattened from `src/features/rss-reader/*` to `src/*`
- Site-based log organization implemented (`logs/{siteId}/YYYY-MM-DD.json`)
- Subscription management UI added
- Sidebar layout with two-panel design
- Runtime setup is required for deployments because GitHub repo, branch, CORS, and auto-commit settings must be editable without rebuilding the app

**Constraints:**
- Browser-native only (no Node.js modules like `stream`, `Buffer`, `fs`)
- Must use native `fetch`, `DOMParser`, `atob`/`btoa`
- GitHub tokens visible in client bundle (use public repos recommended)
- GitHub API rate limits: 60/hour (unauthenticated), 5000/hour (authenticated)
- No build-time GitHub repository or branch configuration; deployed builds must be reusable across repos and users

## Goals / Non-Goals

**Goals:**
- Provide a zero-backend RSS reading experience
- Persist read status via GitHub commits
- Support multiple RSS feeds with subscription management
- Modern, responsive UI using MUI v7
- Site-based log organization with 200-item chunking
- Provide a dedicated Config UI page for runtime setup of GitHub storage, RSS CORS behavior, auto-commit behavior, and future settings

**Non-Goals:**
- Server-side rendering or backend API
- User authentication system (uses GitHub personal access tokens)
- Real-time updates or WebSocket connections
- Advanced RSS features (full-text search, categories/tags)
- PWA/offline mode (future enhancement)
- Multiple read/write branches for one repo; reads and writes use the same configured branch

## Decisions

### 1. State Management: Zustand over Redux/Context API
**Decision:** Use Zustand for state management
**Rationale:**
- Lightweight (~1kb) - critical for static SPA
- Simple API with minimal boilerplate
- Good TypeScript integration
- No provider wrapping needed
**Alternatives Considered:**
- Context API: More boilerplate, less performant
- Redux: Overkill for this use case, larger bundle

### 2. RSS Parsing: Native DOMParser over rss-parser library
**Decision:** Use browser-native DOMParser
**Rationale:**
- rss-parser depends on Node.js `stream` module (incompatible with browsers)
- DOMParser built into all modern browsers
- Handles both RSS 2.0 and Atom formats
- Zero external dependencies for parsing
**Alternatives Considered:**
- rss-parser: Rejected due to Node.js dependency
- Custom regex parsing: Too error-prone

### 3. URL Normalization: Remove Tracking Parameters
**Decision:** Strip common tracking params (`utm_*`, `fbclid`, `gclid`) for item ID generation
**Rationale:**
- Same article with different UTM params should have same ID
- Prevents duplicate read tracking
- More stable item identifiers
**Implementation:** URL object with searchParams.delete() for known tracking params

### 4. Item ID Generation: Composite Base64 Hash
**Decision:** `base64(guid|normalizedLink|title|description|pubDate)` truncated to 32 chars
**Rationale:**
- GUID alone may not be unique across feeds
- Composite approach ensures uniqueness
- Base64 is browser-native (btoa)
**Alternative Considered:**
- SHA-256: Overkill, requires crypto API or library

### 5. Log File Structure: Site-Based with Chunking
**Decision:** `logs/{siteId}/YYYY-MM-DD.json` with max 200 items per file
**Rationale:**
- Prevents large file issues
- Site-isolated for better organization
- Filename based on oldest item date
- Automatic chunking when limit reached

### 6. GitHub API: Native Fetch with Base64 Encoding
**Decision:** Use native `fetch()` API with manual base64 encoding/decoding
**Rationale:**
- Works in all modern browsers
- No external HTTP library needed
- Full control over requests
- GitHub API requires base64 for file content
**Implementation:**
- Read: `GET /repos/{owner}/{repo}/contents/{path}` → atob(response.content)
- Write: `PUT /repos/{owner}/{repo}/contents/{path}` → btoa(JSON.stringify(data))
- SHA required for updates (get from read response)

### 7. CORS Handling: Configurable Policy with Multi-Tier Fallback
**Decision:** Use a runtime CORS policy from the Config page. Default policy is direct fetch followed by configured proxy fallbacks (`corsproxy.io`, then `allorigins.win`).
**Rationale:**
- Many RSS feeds don't enable CORS
- Different deployments may prefer direct-only fetching, specific public proxies, or a custom proxy
- Multiple fallbacks increase success rate while still letting users disable third-party proxies
- No server-side proxy is required by default
**Configuration:**
- `mode`: `direct-only`, `proxy-fallback`, or `proxy-only`
- `proxies`: ordered list of proxy templates with the feed URL encoded into each request
- `timeoutMs`: per-attempt timeout for direct and proxy fetches
**Trade-off:** Public proxy reliability and privacy vary. The UI must make the active policy visible and editable.

### 8. Runtime Config Page: localStorage over Build-Time Setup
**Decision:** Add a dedicated Config UI page that stores application setup in localStorage and removes build-time GitHub repo setup.
**Rationale:**
- Pure browser approach (no .env files)
- One deployed build can be reused for any GitHub repo and branch
- User can configure and revise setup via UI after deployment
- Tokens visible in bundle anyway (security implications documented)
**Scope:**
- GitHub storage: owner, repo, branch, and optional token
- Reads and writes use the same branch to avoid split-brain config/log state
- Token capability: after saving a token, the app checks whether it can write to the configured repository and branch
- CORS policy: fetch mode, proxy order, optional custom proxy templates, and timeout
- Auto-commit: enabled/disabled and interval in seconds
- Local storage retention: number of GitHub log files cached per site
- Extensibility: settings are grouped by section and versioned so future sections can be added without changing the storage contract
**Impact:** Replace first-run-only setup behavior with a reusable Config page reachable from app navigation. `SetupPage.tsx` may be renamed or refactored, but configuration must not depend on Vite environment variables.

### 9. UI Framework: MUI v7
**Decision:** Use Material-UI v7 components
**Rationale:**
- Already specified in project guidelines
- Rich component library
- Responsive by default
- Good TypeScript support
**Components Used:** Container, Paper, Accordion, Switch, Button, Chip, LinearProgress, ThemeProvider

### 10. Auto-Commit: Config Page Setting with Manual Option
**Decision:** Auto-commit is controlled by runtime config with enabled/disabled state and configurable interval.
**Rationale:**
- Prevents data loss
- Reduces manual work
- User controls frequency
- Respects GitHub API rate limits
**Default:** `autoCommit: false`. The user may enable it only when GitHub write capability is valid, with a 300 second (5 minute) default interval.
**Validation:** The Config page prevents invalid intervals and explains that manual commit remains available when auto-commit is disabled.

### 11. Commit Controls: Token Capability Gates Write UI
**Decision:** Check GitHub write capability after token setup and expose write controls only when the token can write to the configured repo and branch.
**Rationale:**
- Avoids presenting commit actions that cannot succeed
- Makes token scope/repo permission problems visible during setup
- Supports public read-only repos without confusing write failures
**Implementation:**
- After saving GitHub settings with a token, call a lightweight GitHub API capability check against the configured owner, repo, and branch
- Store the latest write-capability result in runtime config or derived app state, including status and last error message
- Show a manual commit button in the reader only when write capability is valid
- Hide manual commit and keep auto-commit disabled when the token is missing, invalid, or cannot write to the repo
- Re-run the capability check when owner, repo, branch, or token changes

### 12. Local Storage Strategy: Bounded Per-Site Log Cache
**Decision:** Cache GitHub log data in localStorage with a bounded per-site retention policy. Default retention is one log file per site, configurable from the Config page.
**Rationale:**
- Keeps startup and read-state checks fast without repeatedly fetching the latest GitHub log file for every interaction
- Limits localStorage growth across long-running usage and many feeds
- Matches the existing site-based log layout while giving users control when they want more local history
**Configuration:**
- `localCache.filesPerSite`: number of log files to retain locally for each site
- Default: `1`
- Minimum: `0` to disable local log-file caching while keeping required app config/session state
- Maximum: bounded by validation to avoid exceeding browser localStorage limits
**Storage Shape:**
- Store runtime app config separately from cached log data
- Store cached logs by repo identity, branch, siteId, and log file path so switching repos or branches cannot mix state
- Track cache metadata including fetched time, source SHA when available, and item count
**Eviction:**
- After loading or committing logs for a site, keep only the newest `localCache.filesPerSite` log files for that site
- Evict older cached log files deterministically by log date/file path
- When the retention value is lowered in Config, prune existing cached files on save
**Trade-off:** Keeping only one file per site minimizes browser storage use but may require GitHub reads for older history. Users can increase the limit when they want more offline/local history.

### 13. Full-Height Adaptive Panes with Independent Scrolling
**Decision:** The reader layout fills the full viewport height (minus the header) and both panes scroll independently within their allocated space.
**Rationale:**
- Fixed `70vh` height wasted vertical space on tall screens
- Users expect a desktop-like RSS reader that fills the window
- Each pane should scroll independently so site list and feed items scroll separately
**Implementation:**
- Root Box uses `display: flex, flexDirection: column, minHeight: 100vh`
- Header sits at top with its natural height
- Container uses `flex: 1, minHeight: 0` to fill remaining vertical space
- `SidebarFeedLayout` container uses `flex: 1, minHeight: 0` to fill remaining space below subscription manager
- `SidebarFeedLayout` inner Box uses `flex: 1, minHeight: 0` to stretch to parent
- Sidebar site list uses `flex: 1, overflow: auto` for independent scrolling
- Feed items area uses `flex: 1, overflow: auto` for independent scrolling

### 14. Responsive Layout: Full-Width Adaptive Panes
**Decision:** The reader layout and its two-panel feed view expand to fill the browser's full width when maximized, with a proportional sidebar that scales responsively.
**Rationale:**
- `Container maxWidth="lg"` caps content at 1200px, wasting horizontal space on wide screens
- Fixed 300px sidebar is too narrow on large monitors, too wide on small ones
- Users expect a desktop RSS reader to utilize available screen real estate
**Implementation:**
- Remove `maxWidth` constraint from the reader `Container` (use `maxWidth={false}` or remove entirely)
- Sidebar width set to a percentage-based or breakpoint-responsive value (e.g., 280px on mobile, 320px on desktop)
- Feed items list pane uses `flex: 1` to consume remaining space (already in place)
- No max-width on the overall layout container

### 15. Collapsible Subscription Manager: Minimized by Default
**Decision:** The subscription list in the sidebar is minimized (collapsed) by default, showing only the section header with an expand/collapse chevron. Expanding reveals the site list and add/edit/delete controls.
**Rationale:**
- Saves vertical screen space for the main feed content area
- Subscription management is used infrequently compared to reading feeds
- Chevron icon provides clear affordance for expanding
- State is local component state (no persistence needed across sessions)
**Implementation:**
- MUI `Collapse` component wraps the subscription list body
- Header row contains site count badge + expand/collapse IconButton
- Default state: `collapsed = true`
- Clicking the header or chevron toggles the collapsed state

### 16. Clear All Data Button on Config Page
**Decision:** Add a "Clear All Data" button to the Config page that removes all app-local localStorage keys (app config, session data, log cache) with a confirmation dialog.
**Rationale:**
- Users need a way to reset the app without manually clearing browser storage
- Useful when switching GitHub repos, debugging, or starting fresh
- Confirmation dialog prevents accidental data loss
**Implementation:**
- Button placed in the bottom action bar, left-aligned, with `color="error"` styling
- MUI `Dialog` warns that all configuration, read status, and cached logs will be deleted
- `clearAllLocalStorage()` utility removes `rss-reader-app-config`, `rss-reader-session`, `rss-reader-log-cache`
- After clearing, shows success message and resets form state to defaults

### 17. Vim-Style Keyboard Navigation: j/k for Item Selection
**Decision:** Add vi-style keyboard shortcuts for navigating feed items in the reader pane. Press `j` to move to the next item (or first unread if no selection), press `k` to move to the previous item. Moving to an item automatically marks it as read.
**Rationale:**
- Power users prefer keyboard-driven navigation for speed
- `j`/`k` are standard vim keys for down/up movement, familiar to developers
- Auto-mark-as-read on selection mimics reading flow — selecting an item implies reading it
- Keeps hands on keyboard during high-volume reading sessions
**Implementation:**
- Custom `useKeyboardNavigation` hook manages selected item index and keyboard listener
- `j` key: if no current selection, jumps to first unread item; otherwise moves to next visible item
- `k` key: moves to previous visible item (stops at first)
- On selection change, calls `markAsRead` for the selected item
- Listener attached to `document` with `keydown`, scoped to avoid firing when focus is in input/textarea
- Selected item visually highlighted in the feed list (e.g., background tint, border indicator)
- Only active when `SidebarFeedLayout` is mounted (no global shortcut conflicts)

### 18. On-Demand Feed Fetching with Concurrent Pool
**Decision:** The reader left pane (feed list) displays immediately without waiting for any feed fetches. When a feed is selected, the system uses a pool of 3 concurrent fetchers to fetch feeds on-demand. On first load, up to 3 feeds start fetching in parallel. When clicking a site already fetched or in the fetch queue, no new fetch is triggered. Otherwise, the site is added to the pool's head for priority fetching. Each site shows an unread count badge that is calculated fresh from the newest fetched items, not from cached read status.
**Rationale:**
- Current prefetch-all approach delays showing the site list until all feeds resolve, which is slow when many feeds are configured
- Pool of 3 limits concurrent requests to avoid overwhelming the network or hitting rate limits
- Users want fast site list display and immediate feedback when selecting a feed
- Independent fetching per site prevents slow feeds from blocking others
- Unread count should always reflect the current items; older cached status becomes stale after new items are fetched
**Implementation:**
- Site list renders from config subscriptions immediately on page load with no unread count shown until feed is fetched
- On page load, up to 3 sites start fetching in parallel (pool size = 3)
- Each site shows unread count calculated fresh from the newest fetched items (not from cached read status)
- A loading spinner icon appears next to each site while its feed is being fetched
- Clicking a site that is already fetched or currently in the fetch pool does not trigger another fetch
- Clicking a site not yet fetched and not in the queue adds it to the pool's head for priority fetching
- Right pane displays feed items immediately once the selected site's feed resolves
- Track fetch loading state per site in component or store state

## Risks / Trade-offs

**[CORS Blocking RSS Feeds]** → Use runtime CORS policy with direct and proxy options. Document proxy privacy/reliability limitations and allow users to disable proxies.

**[GitHub API Rate Limits]** → Unauthenticated: 60/hour. Authenticated: 5000/hour. Mitigation: batch commits, cache responses, configurable commit intervals.

**[GitHub Token Exposure]** → Tokens stored in browser localStorage. Mitigation: Use public repos when possible, recommend least-privilege tokens for writes, document security implications clearly.

**[RSS Feed Parsing Errors]** → Malformed XML or unsupported formats. Mitigation: Robust error handling, validate before parsing, user-friendly error messages.

**[Hash Collisions for Item IDs]** → Extremely unlikely with composite key. Mitigation: 32-char base64 provides sufficient entropy. Add collision detection if needed.

**[Browser Storage Limits]** → localStorage ~5-10MB. Mitigation: Limit stored items, cleanup old data, compress if needed.

**[Stale Local Log Cache]** → Cached log files may lag behind GitHub after external edits or use from another browser. Mitigation: key cache by repo/branch/path/SHA when available, refresh latest files during startup, and let users reduce or clear cache from Config.

**[Data Loss During Merge]** → GitHub log merge errors. Mitigation: Test merge logic thoroughly, local backup before commit, retry logic.

**[Network Timeouts]** → Slow or unresponsive feeds. Mitigation: Timeout configuration, retry with exponential backoff.

## Deployment
- Build: `npm run build` (Vite)
- Deploy to: Vercel, Netlify, GitHub Pages, or Cloudflare Pages
- No GitHub repository environment variables needed at build or hosting time
- User configures their own GitHub repo on first use

## Open Questions

- Should we implement search/filter functionality? (Currently out of scope for MVP)
- Should we add dark mode theme? (Nice to have, post-MVP)
- Should we support feed categories/tags? (Future enhancement)
- Should we implement PWA features for offline support? (Future consideration)
- Should CORS proxy presets be hard-coded defaults only, or should users be able to add/remove arbitrary proxy templates in the first Config page version?
