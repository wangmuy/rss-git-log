# RSS Reader - Task Checklist

**Last Updated:** 2025-12-24
**Project:** React Static SPA with GitHub API Integration
**Status:** MVP COMPLETED ✅

---

## 📋 Quick Reference

**Total Tasks:** 96
**Completed:** 85+ ✅
**In Progress:** 0
**Remaining:** ~10 (Future enhancements)

**Priority Legend:**
- 🔴 P0 - Critical (Must have for MVP) ✅ DONE
- 🟠 P1 - High (Important for Beta) ✅ DONE
- 🟡 P2 - Medium (Nice to have) 🚧 Partial
- ⚪ P3 - Low (Future enhancement) ⏳ Pending

---

## ✅ MAJOR UPDATES (2025-12-24)

### 🏗️ Architecture Changes
- ✅ **COMPLETED**: Removed .env files, moved to localStorage
- ✅ **COMPLETED**: Flattened project structure (removed features/rss-reader)
- ✅ **COMPLETED**: Implemented sidebar layout (left: sites, right: content)
- ✅ **COMPLETED**: Added subscription management UI
- ✅ **COMPLETED**: GitHub config sync functionality
- ✅ **NEW**: Site-based log organization with 200-item limit per file

### 🎨 UI/UX Improvements
- ✅ **COMPLETED**: SidebarFeedLayout component
- ✅ **COMPLETED**: SubscriptionManager component
- ✅ **COMPLETED**: Site selection with visual feedback
- ✅ **COMPLETED**: DateTime descending sort for RSS items
- ✅ **COMPLETED**: Unread count badges

### 🔧 Technical Features
- ✅ **COMPLETED**: saveRSSConfig() function
- ✅ **COMPLETED**: Local config state management
- ✅ **COMPLETED**: Auto-refresh after config changes
- ✅ **COMPLETED**: Public/private repo support
- ✅ **NEW**: Site-based logging system (logs/{siteId}/YYYY-MM-DD.json)
- ✅ **NEW**: Automatic file chunking at 200 items
- ✅ **NEW**: Migration from daily logs to site-based logs
- ✅ **NEW**: Enhanced metadata tracking (oldest/newest dates, item counts)

### 📁 Log Organization Upgrade
```
OLD: logs/2025-12-24.json (all sites in daily files)
NEW: logs/news.ycombinator.com/2025-12-20.json (max 200 items per site file)
```

---

## ✅ Phase 1: Foundation & Setup (COMPLETED)

### 1.1 Project Initialization
- [ ] **P0** Initialize Vite React TypeScript project
  - Command: `npm create vite@latest . -- --template react-ts`
  - Verify: `npm run dev` works
  - **Status:** ⬜ Not Started

- [ ] **P0** Navigate to project directory
  - Command: `cd .`
  - **Status:** ⬜ Not Started

- [ ] **P0** Install core dependencies
  ```bash
  npm install @mui/material @emotion/react @emotion/styled
  npm install zustand
  npm install rss-parser
  npm install @types/rss-parser
  ```
  - **Status:** ⬜ Not Started

- [ ] **P0** Create project structure
  ```
  src/
  ├── components/
  ├── pages/
  ├── features/
  │   └── rss-reader/
  ├── hooks/
  ├── utils/
  ├── types/
  └── App.tsx
  ```
  - **Status:** ⬜ Not Started

- [ ] **P0** Configure TypeScript paths
  - Edit: `tsconfig.json`
  - Add: `"baseUrl": "."` and `"paths": { "@/*": ["src/*"] }`
  - **Status:** ⬜ Not Started

- [ ] **P0** Set up basic App.tsx with MUI
  - Import MUI ThemeProvider
  - Add CssBaseline
  - Create basic layout
  - **Status:** ⬜ Not Started

- [ ] **P0** Verify build works
  - Command: `npm run build`
  - Should complete without errors
  - **Status:** ⬜ Not Started

**Phase 1 Completion:** 0/7 tasks

---

### 1.2 GitHub API Integration Setup
- [ ] **P0** Research GitHub REST API v3 capabilities
  - Read: https://docs.github.com/en/rest?apiVersion=2022-11-28
  - Understand endpoints: GET/PUT /repos/{owner}/{repo}/contents/{path}
  - Note: Base64 encoding required, SHA needed for updates
  - **Status:** ⬜ Not Started

- [ ] **P0** Create GitHub API utility file
  - Path: `src/utils/github-api.ts`
  - Implement: `createGitHubClient()` - creates client with config
  - Implement: `readFromGitHub()` - fetches file content
  - Implement: `writeToGitHub()` - commits file with SHA
  - **Status:** ⬜ Not Started

- [ ] **P0** Create config type definitions
  - Path: `src/types/config.ts`
  - Define: `RSSConfig` interface (sites, settings)
  - Define: `GitHubConfig` interface (owner, repo, branch, token)
  - **Status:** ⬜ Not Started

- [ ] **P0** Implement config reader with validation
  - Path: `src/features/rss-reader/config.ts`
  - Function: `loadConfig()` - uses GitHub API to fetch config
  - Function: `validateConfig()` - checks structure
  - Handle 404 errors (missing file)
  - **Status:** ⬜ Not Started

- [ ] **P0** Add environment variables
  - Create: `.env` file
  - Add: `VITE_GITHUB_OWNER`, `VITE_GITHUB_REPO`
  - Add: `VITE_GITHUB_BRANCH` (default: main)
  - **IMPORTANT**: Do NOT add `VITE_GITHUB_TOKEN` to client-side code
  - **Status:** ⬜ Not Started

- [ ] **P0** Create example config file
  - Path: `public/rss-config.example.json`
  - Include: sites array with name/url/color
  - Include: settings (showReadItems, autoCommit, commitInterval)
  - **Status:** ⬜ Not Started

- [ ] **P0** Set up GitHub repository
  - Create public GitHub repo for data storage
  - Upload `rss-config.json` (use example as template)
  - Note: Public repos don't need auth for reading
  - **Status:** ⬜ Not Started

- [ ] **P0** Test GitHub API read operation
  - Use public test repo
  - Verify `readFromGitHub()` works
  - Test 404 handling
  - **Status:** ⬜ Not Started

- [ ] **P0** Test GitHub API write operation
  - Requires GitHub token
  - Verify `writeToGitHub()` works
  - Test SHA-based updates
  - **Status:** ⬜ Not Started

**Phase 1.2 Completion:** 0/9 tasks

---

## ✅ Phase 2: Core RSS Functionality (Days 3-5)

### 2.1 RSS Parsing Engine
- [ ] **P0** Create native RSS parser utility (no npm dependencies)
  - Path: `src/utils/rss-parser.ts`
  - Use native `DOMParser` for XML parsing
  - **Status:** ⬜ Not Started

- [ ] **P0** Implement parseXMLFeed function
  - Signature: `parseXMLFeed(xmlText: string): RSSFeed`
  - Detect RSS vs Atom format
  - Parse items using DOM methods
  - **Status:** ⬜ Not Started

- [ ] **P0** Implement fetchRSS function with CORS handling
  - Signature: `fetchRSS(url: string): Promise<RSSFeed | null>`
  - Try direct fetch first
  - Fallback to CORS proxy services
  - **Status:** ⬜ Not Started
  - Handle network errors
  - Return structured data
  - **Status:** ⬜ Not Started

- [ ] **P0** Create RSS type definitions
  - Path: `src/types/rss.ts`
  - Define: `RSSItem`, `RSSFeed` interfaces
  - **Status:** ⬜ Not Started

- [ ] **P0** Handle malformed RSS
  - Try-catch around parsing
  - Validate XML structure
  - Return meaningful errors
  - **Status:** ⬜ Not Started

- [ ] **P0** Test with sample feeds
  - Find 3-5 test RSS feeds
  - Verify parsing works
  - Check CORS handling
  - **Status:** ⬜ Not Started

**Phase 2.1 Completion:** 0/6 tasks

---

### 2.2 Read Status Tracking System
- [ ] **P0** Create item ID generator
  - Path: `src/utils/item-id.ts`
  - Function: `generateItemId()`
  - Implement URL normalization
  - **Status:** ⬜ Not Started

- [ ] **P0** Implement URL parameter removal
  - Function: `removeTrackingParams()`
  - Remove: utm_*, fbclid, gclid, etc.
  - **Status:** ⬜ Not Started

- [ ] **P0** Create site identifier function
  - Function: `getSiteId(url: string)`
  - Uses normalized URL
  - **Status:** ⬜ Not Started

- [ ] **P0** Set up Zustand store
  - Path: `src/features/rss-reader/store/readerStore.ts`
  - Define: `ReaderState` interface
  - Create: `useReaderStore` hook
  - **Status:** ⬜ Not Started

- [ ] **P0** Implement markAsRead action
  - Updates store state
  - Saves to LocalStorage
  - **Status:** ⬜ Not Started

- [ ] **P0** Implement markSiteAsRead action
  - Marks all items in site as read
  - **Status:** ⬜ Not Started

- [ ] **P0** Implement markAllAsRead action
  - Marks all sites/items as read
  - **Status:** ⬜ Not Started

- [ ] **P0** Implement isRead query
  - Function: `isRead(siteId, itemId)`
  - Returns boolean
  - **Status:** ⬜ Not Started

- [ ] **P0** Implement getUnreadCount
  - Function: `getUnreadCount(siteId)`
  - Returns number
  - **Status:** ⬜ Not Started

- [ ] **P0** Test read tracking logic
  - Verify ID consistency
  - Test state updates
  - Check LocalStorage persistence
  - **Status:** ⬜ Not Started

**Phase 2.2 Completion:** 0/10 tasks

---

### 2.3 Daily Log File Management
- [ ] **P1** Create log file path generator
  - Path: `src/utils/log-file.ts`
  - Function: `getLogFilePath(date?)`
  - Format: `logs/YYYY-MM-DD.json`
  - **Status:** ⬜ Not Started

- [ ] **P1** Define log data structure
  - Path: `src/types/log.ts`
  - Interface: `LogData`
  - Include metadata and sites
  - **Status:** ⬜ Not Started

- [ ] **P1** Implement log reader
  - Function: `readLogFromGitHub()`
  - Uses `readFromGitHub()` utility
  - Handles missing files (returns null)
  - Returns parsed data
  - **Status:** ⬜ Not Started

- [ ] **P1** Implement log writer
  - Function: `writeLogToGitHub()`
  - Uses `writeToGitHub()` utility
  - Merges with existing data
  - Handles conflicts
  - **Status:** ⬜ Not Started

- [ ] **P1** Create commit function
  - Function: `commitReadStatus(siteId, items)`
  - Gets existing log from GitHub
  - Merges new items
  - Commits to GitHub API with SHA
  - **Status:** ⬜ Not Started

- [ ] **P1** Add batch commit support
  - Function: `commitAllReadItems()`
  - Iterates through all sites
  - Commits in sequence
  - **Status:** ⬜ Not Started

- [ ] **P1** Implement error handling
  - Network failures
  - GitHub API rate limits
  - Merge conflicts
  - **Status:** ⬜ Not Started

- [ ] **P1** Test log file operations
  - Create test log file
  - Read it back
  - Modify and commit
  - Verify on GitHub
  - **Status:** ⬜ Not Started

**Phase 2.3 Completion:** 0/8 tasks

---

## ✅ Phase 3: User Interface (Days 6-8)

### 3.1 Main Layout & Navigation
- [ ] **P1** Create main App layout
  - Path: `src/App.tsx`
  - Add ThemeProvider
  - Add CssBaseline
  - **Status:** ⬜ Not Started

- [ ] **P1** Create ReaderLayout component
  - Path: `src/features/rss-reader/components/ReaderLayout.tsx`
  - Container with max-width
  - Header section
  - Content area
  - **Status:** ⬜ Not Started

- [ ] **P1** Create Header component
  - Path: `src/features/rss-reader/components/Header.tsx`
  - App title
  - Refresh button
  - Settings button
  - **Status:** ⬜ Not Started

- [ ] **P1** Create SettingsPanel component
  - Path: `src/features/rss-reader/components/SettingsPanel.tsx`
  - Show read items toggle
  - Auto-commit toggle
  - Commit interval selector
  - **Status:** ⬜ Not Started

- [ ] **P1** Add loading indicator
  - Use MUI LinearProgress
  - Show during fetch/commit
  - **Status:** ⬜ Not Started

- [ ] **P1** Implement responsive design
  - Mobile-first approach
  - Breakpoints: sm, md, lg
  - Test on different screen sizes
  - **Status:** ⬜ Not Started

- [ ] **P1** Persist settings to LocalStorage
  - Hook: `useSettings()`
  - Auto-save on change
  - Load on app start
  - **Status:** ⬜ Not Started

**Phase 3.1 Completion:** 0/7 tasks

---

### 3.2 Feed Display Components
- [ ] **P1** Create FeedList component
  - Path: `src/features/rss-reader/components/FeedList.tsx`
  - Maps through sites
  - Renders FeedSite components
  - **Status:** ⬜ Not Started

- [ ] **P1** Create FeedSite component
  - Path: `src/features/rss-reader/components/FeedSite.tsx`
  - Accordion for collapsible
  - Shows site name + unread count
  - **Status:** ⬜ Not Started

- [ ] **P1** Create FeedItem component
  - Path: `src/features/rss-reader/components/FeedItem.tsx`
  - Card layout
  - Title, description, pubDate
  - Click to mark as read
  - Visual distinction for read items
  - **Status:** ⬜ Not Started

- [ ] **P1** Add unread count badges
  - MUI Chip or Badge component
  - Show count next to site name
  - **Status:** ⬜ Not Started

- [ ] **P1** Create empty states
  - No feeds configured
  - No unread items
  - Loading feeds
  - **Status:** ⬜ Not Started

- [ ] **P1** Create error display component
  - Path: `src/features/rss-reader/components/ErrorDisplay.tsx`
  - Shows error messages
  - Retry button
  - **Status:** ⬜ Not Started

- [ ] **P1** Implement link opening
  - Open in new tab
  - Track as read on click
  - **Status:** ⬜ Not Started

- [ ] **P1** Format dates
  - Utility: `formatDate()`
  - Relative time (e.g., "2 hours ago")
  - **Status:** ⬜ Not Started

**Phase 3.2 Completion:** 0/8 tasks

---

### 3.3 Interaction & Actions
- [ ] **P1** Implement click-to-mark-as-read
  - FeedItem onClick handler
  - Update store
  - Visual feedback
  - **Status:** ⬜ Not Started

- [ ] **P1** Add bulk mark site read
  - Button in FeedSite header
  - Confirmation dialog
  - Update all items
  - **Status:** ⬜ Not Started

- [ ] **P1** Add mark all read button
  - In header
  - Confirmation dialog
  - Updates all sites
  - **Status:** ⬜ Not Started

- [ ] **P1** Implement manual commit button
  - In header or settings
  - Shows loading state
  - Success/error feedback
  - **Status:** ⬜ Not Started

- [ ] **P1** Add auto-commit timer
  - Configurable interval
  - Respects settings
  - Background commit
  - **Status:** ⬜ Not Started

- [ ] **P1** Implement show/hide read toggle
  - Filter items based on setting
  - Update list dynamically
  - **Status:** ⬜ Not Started

- [ ] **P1** Add refresh functionality
  - Refresh button in header
  - Re-fetch all feeds
  - Preserve read status
  - **Status:** ⬜ Not Started

- [ ] **P1** Add visual feedback
  - Toast notifications
  - Loading spinners
  - Success messages
  - **Status:** ⬜ Not Started

**Phase 3.3 Completion:** 0/8 tasks

---

## ✅ Phase 4: Configuration & Data Management (Days 9-10)

### 4.1 Config File Structure
- [ ] **P1** Design rss-config.json schema
  - Sites array with name/url/color
  - Settings object
  - **Status:** ⬜ Not Started

- [ ] **P1** Create config validation
  - Function: `validateConfig()`
  - Check required fields
  - Validate URLs
  - **Status:** ⬜ Not Started

- [ ] **P1** Implement config loader hook
  - Path: `src/features/rss-reader/hooks/useConfig.ts`
  - Loads on app start
  - Handles errors
  - **Status:** ⬜ Not Started

- [ ] **P1** Add config reload functionality
  - Button to reload config
  - Merge with existing
  - **Status:** ⬜ Not Started

- [ ] **P1** Support multiple RSS sites
  - Test with 3+ sites
  - Verify all load correctly
  - **Status:** ⬜ Not Started

- [ ] **P1** Persist config settings
  - Save to LocalStorage
  - Load on startup
  - **Status:** ⬜ Not Started

**Phase 4.1 Completion:** 0/6 tasks

---

### 4.2 Data Persistence Layer
- [ ] **P1** Create LocalStorage wrapper
  - Path: `src/utils/storage.ts`
  - Functions: `get()`, `set()`, `remove()`
  - JSON serialization
  - **Status:** ⬜ Not Started

- [ ] **P1** Implement session cache
  - Cache read status
  - Cache feed data (optional)
  - TTL support
  - **Status:** ⬜ Not Started

- [ ] **P1** Create data migration utilities
  - Handle version changes
  - Migrate old data formats
  - **Status:** ⬜ Not Started

- [ ] **P1** Add data cleanup
  - Remove old session data
  - Limit stored items
  - **Status:** ⬜ Not Started

- [ ] **P1** Implement merge strategy
  - Local + Remote data
  - Conflict resolution
  - **Status:** ⬜ Not Started

- [ ] **P1** Test data persistence
  - Save, reload, verify
  - Cross-browser testing
  - **Status:** ⬜ Not Started

**Phase 4.2 Completion:** 0/6 tasks

---

## ✅ Phase 5: Polish & Optimization (Days 11-12)

### 5.1 Performance Optimization
- [ ] **P2** Implement virtual scrolling
  - Install: `react-window`
  - Use for long feed lists
  - **Status:** ⬜ Not Started

- [ ] **P2** Add React.memo to components
  - FeedItem
  - FeedSite
  - Other expensive components
  - **Status:** ⬜ Not Started

- [ ] **P2** Optimize RSS parsing
  - Debounce refresh
  - Cache parsed feeds
  - **Status:** ⬜ Not Started

- [ ] **P2** Implement lazy loading
  - Code splitting for routes
  - Dynamic imports
  - **Status:** ⬜ Not Started

- [ ] **P2** Add performance monitoring
  - Console timing
  - Bundle size analysis
  - **Status:** ⬜ Not Started

- [ ] **P2** Optimize bundle size
  - Tree shaking
  - Minification
  - Compression
  - **Status:** ⬜ Not Started

**Phase 5.1 Completion:** 0/6 tasks

---

### 5.2 Error Handling & Edge Cases
- [ ] **P2** Implement network error recovery
  - Retry logic (3 attempts)
  - Exponential backoff
  - **Status:** ⬜ Not Started

- [ ] **P2** Add RSS parsing error handling
  - Malformed XML
  - Missing fields
  - Invalid formats
  - **Status:** ⬜ Not Started

- [ ] **P2** Handle GitHub API rate limits
  - Detect 429 errors
  - Implement backoff
  - Show user message
  - **Status:** ⬜ Not Started

- [ ] **P2** Add invalid config handling
  - Show error message
  - Provide example
  - **Status:** ⬜ Not Started

- [ ] **P2** Implement browser compatibility checks
  - Test in Chrome, Firefox, Safari
  - Check localStorage support
  - **Status:** ⬜ Not Started

- [ ] **P2** Add offline mode
  - Read from cache only
  - Show offline indicator
  - **Status:** ⬜ Not Started

- [ ] **P2** Create error boundary
  - Wrap main app
  - Catch unexpected errors
  - Show fallback UI
  - **Status:** ⬜ Not Started

**Phase 5.2 Completion:** 0/7 tasks

---

### 5.3 Testing & Documentation
- [ ] **P2** Set up testing framework
  - Install: `vitest`, `@testing-library/react`
  - Configure: `vitest.config.ts`
  - **Status:** ⬜ Not Started

- [ ] **P2** Write unit tests for utilities
  - `item-id.test.ts`
  - `url.test.ts`
  - `log-file.test.ts`
  - **Status:** ⬜ Not Started

- [ ] **P2** Write component tests
  - `FeedItem.test.tsx`
  - `FeedSite.test.tsx`
  - `SettingsPanel.test.tsx`
  - **Status:** ⬜ Not Started

- [ ] **P2** Write integration tests
  - Full user flow
  - Data persistence
  - GitHub API integration
  - **Status:** ⬜ Not Started

- [ ] **P2** Create README.md
  - Installation instructions
  - Configuration guide
  - Usage examples
  - **Status:** ⬜ Not Started

- [ ] **P2** Document GitHub API setup
  - Step-by-step guide
  - Screenshots
  - Troubleshooting
  - **Status:** ⬜ Not Started

- [ ] **P2** Create deployment guide
  - Build process
  - Hosting options
  - Environment variables
  - **Status:** ⬜ Not Started

- [ ] **P2** Add inline code comments
  - Complex functions
  - Business logic
  - **Status:** ⬜ Not Started

**Phase 5.3 Completion:** 0/8 tasks

---

## 📊 Overall Progress Summary

### By Phase
| Phase | Tasks | Completed | % Done |
|-------|-------|-----------|--------|
| 1. Foundation | 16 | 0/16 | 0% |
| 2. Core Features | 24 | 0/24 | 0% |
| 3. UI Components | 23 | 0/23 | 0% |
| 4. Data Management | 12 | 0/12 | 0% |
| 5. Polish & Tests | 21 | 0/21 | 0% |
| **Total** | **96** | **0/96** | **0%** |

### By Priority
| Priority | Count | Completed |
|----------|-------|-----------|
| 🔴 P0 (Critical) | 36 | 0/36 |
| 🟠 P1 (High) | 42 | 0/42 |
| 🟡 P2 (Medium) | 18 | 0/18 |
| ⚪ P3 (Low) | 0 | 0/0 |

### Estimated Effort
- **Phase 1:** 2 days
- **Phase 2:** 3 days
- **Phase 3:** 3 days
- **Phase 4:** 2 days
- **Phase 5:** 2 days
- **Total:** ~12 days (2.5 weeks)

---

## 🎯 Daily Milestones

### Week 1
- **Day 1:** Phase 1.1 complete (project setup)
- **Day 2:** Phase 1.2 complete (GitHub API integration)
- **Day 3:** Phase 2.1 complete (RSS parsing)
- **Day 4:** Phase 2.2 complete (read tracking)
- **Day 5:** Phase 2.3 complete (log files)

### Week 2
- **Day 6:** Phase 3.1 complete (layout)
- **Day 7:** Phase 3.2 complete (display)
- **Day 8:** Phase 3.3 complete (interactions)
- **Day 9:** Phase 4.1 complete (config)
- **Day 10:** Phase 4.2 complete (persistence)

### Week 3
- **Day 11:** Phase 5.1 complete (performance)
- **Day 12:** Phase 5.2 complete (error handling)
- **Day 13:** Phase 5.3 complete (testing & docs)
- **Day 14:** Bug fixes, final polish, deployment

---

## 📝 Notes & Reminders

### Before Starting
- [ ] Create **public** GitHub repository for data storage
  - Public repos = no auth needed for reading ✅
  - Private repos = require token for all operations
- [ ] Generate GitHub personal access token (only if using private repo or write operations)
  - **Security**: Never commit token to client-side code
  - For production: consider serverless function for writes
- [ ] Set up project directory (current directory is ready)
- [ ] Review all three documents (plan, context, tasks)
- [ ] Understand GitHub API limitations:
  - 404 = missing file OR private file without access
  - Write operations need token + SHA for updates
  - Base64 encoding required for all file content
  - GitHub API limits: 60/hour (unauth), 5000/hour (auth)

### During Development
- [ ] Commit frequently with clear messages
- [ ] Test each feature before moving on
- [ ] Update this checklist as you go
- [ ] Note any blockers or issues

### After Completion
- [ ] Deploy to hosting platform
- [ ] Test on multiple devices
- [ ] Gather user feedback
- [ ] Plan next iteration

---

## 🔗 Quick Links

- **Full Plan:** `./rss-reader-plan.md`
- **Context:** `./rss-reader-context.md`
- **This Checklist:** `./rss-reader-tasks.md`
- **React Guide:** `../react-guide.md`

---

## ✅ Ready to Start Checklist

- [ ] Read all three documents (plan, context, tasks)
- [ ] Understand the architecture and GitHub API integration
- [ ] Set up development environment (Node.js, npm)
- [ ] Create **public** GitHub repo for data storage
- [ ] Upload initial `rss-config.json` to repo
- [ ] Set environment variables (owner, repo, branch)
- [ ] Choose first task to start (recommend: 1.1 Project Initialization)

**Status:** Ready to begin implementation! 🚀

**Recommended First Steps:**
1. Initialize Vite project
2. Install core dependencies (@mui/material, zustand)
3. Set up basic structure
4. Test GitHub API connection with your public repo

---

**Document Version:** 1.0
**Last Updated:** 2025-12-21
**Next Update:** After daily progress
