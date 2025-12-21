# RSS Reader SPA - Comprehensive Implementation Plan

**Last Updated:** 2025-12-21
**Project Type:** React Static SPA with GitRows Integration
**Status:** Planning Phase
**Estimated Timeline:** 2-3 weeks (MVP)

---

## 📋 Executive Summary

This plan outlines the development of a lean React Single Page Application (SPA) for reading RSS feeds. The application will use GitRows to fetch RSS configuration and feed data, track read status per user session, and persist reading history to daily log files. The core focus is on creating a minimal, fast, and user-friendly RSS reader without backend dependencies.

### Key Features
- **GitRows Integration**: Read RSS site configurations from a config file via GitRows
- **RSS Feed Fetching**: Parse and display RSS feeds from multiple sources
- **Read Status Tracking**: Track which items have been read per site
- **Daily Log Files**: Persist read status to `logs/YYYY-MM-DD.json`
- **Configurable Display**: Option to show/hide already-read items
- **Clean UI**: Minimal interface focused on reading experience

### Technical Stack
- **Frontend**: React 18+ (TypeScript)
- **Build Tool**: Vite
- **Styling**: MUI v7 (Material Design)
- **State Management**: Zustand (lightweight)
- **RSS Parsing**: rss-parser or XML parsing
- **Data Storage**: LocalStorage + JSON files via GitRows
- **Routing**: TanStack Router or React Router

---

## 🎯 Current State Analysis

### Existing Infrastructure
The project already has:
- ✅ Claude Code agent infrastructure (11 specialized agents)
- ✅ 2 automation hooks (skill activation, file tracking)
- ✅ 2 context-aware skills (Frontend Dev, Skill Developer)
- ✅ Project documentation structure in `dev/`
- ✅ React development guidelines and patterns

### Project State
- **Status**: Fresh project - no existing code
- **Structure**: Ready for new React application
- **Dependencies**: None installed yet
- **Configuration**: Claude settings configured

### Assumptions & Constraints
- **Static Only**: No backend server required
- **Client-Side**: All operations in browser
- **GitRows**: Requires public GitHub repo for config/data storage
- **User Data**: Stored in browser localStorage + GitRows commits
- **RSS Sources**: Publicly accessible RSS feeds (CORS may be an issue)

---

## 🚀 Proposed Future State

### Architecture Overview
```
Browser (React SPA)
    ↓
GitRows API (GitHub repo)
    ↓
Config File (rss-config.json)
    ↓
RSS Feed URLs
    ↓
Fetch & Parse
    ↓
Display UI
    ↓
LocalStorage (session)
    ↓
Commit to logs/YYYY-MM-DD.json
```

### Data Flow
1. **Initialization**: App loads config from GitRows
2. **Fetch Feeds**: Parse RSS from configured URLs
3. **Filter**: Remove read items (unless show-read enabled)
4. **Display**: Render feed items in UI
5. **Interaction**: User reads items
6. **Tracking**: Mark items as read in session
7. **Persistence**: Commit read status to daily log file via GitRows

### User Experience
```
┌─────────────────────────────────────┐
│ RSS Reader - Clean & Fast           │
├─────────────────────────────────────┤
│ [Settings] [Refresh] [Mark All Read]│
├─────────────────────────────────────┤
│ Site 1 (5 unread)                   │
│   ├─ Item 1 ✓                      │
│   ├─ Item 2                        │
│   └─ Item 3                        │
│ Site 2 (12 unread)                  │
│   ├─ Item 1                        │
│   └─ ...                           │
├─────────────────────────────────────┤
│ Show Read Items: [ ]                │
│ Auto-commit: [✓]                   │
└─────────────────────────────────────┘
```

---

## 📊 Implementation Phases

### Phase 1: Foundation & Setup (Days 1-2)

#### 1.1 Project Initialization
**Tasks:**
- [ ] Initialize Vite React TypeScript project
- [ ] Install core dependencies (React, MUI v7, Zustand, rss-parser)
- [ ] Set up project structure following guidelines
- [ ] Configure TypeScript paths and aliases
- [ ] Set up ESLint + Prettier
- [ ] Create basic App.tsx structure

**Acceptance Criteria:**
- ✅ Project builds without errors
- ✅ TypeScript strict mode enabled
- ✅ Basic routing configured
- ✅ MUI theme provider set up

**Effort:** S
**Dependencies:** None

#### 1.2 GitRows Integration Setup
**Tasks:**
- [ ] Research GitRows API endpoints and authentication
- [ ] Create utility functions for GitRows operations
- [ ] Implement config file reader (rss-config.json)
- [ ] Create error handling for network failures
- [ ] Add loading states for async operations

**Acceptance Criteria:**
- ✅ Can fetch config from GitRows
- ✅ Handles 404/403 errors gracefully
- ✅ Config validation with TypeScript types
- ✅ Retry mechanism for failed requests

**Effort:** M
**Dependencies:** 1.1

### Phase 2: Core RSS Functionality (Days 3-5)

#### 2.1 RSS Parsing Engine
**Tasks:**
- [ ] Install and configure rss-parser library
- [ ] Create RSS feed fetcher utility
- [ ] Implement CORS proxy handling (if needed)
- [ ] Parse feed items with proper TypeScript types
- [ ] Handle malformed RSS gracefully
- [ ] Add feed validation

**Acceptance Criteria:**
- ✅ Successfully parses valid RSS feeds
- ✅ Returns structured data (title, link, guid, pubDate, description)
- ✅ Handles XML parsing errors
- ✅ Supports multiple feed formats (RSS 2.0, Atom)

**Effort:** M
**Dependencies:** 1.2

#### 2.2 Read Status Tracking System
**Tasks:**
- [ ] Design unique identifier generation for items
- [ ] Implement hash function: `hash(guid + link + title+description+pubDate)`
- [ ] Create site identifier (URL without tracking params)
- [ ] Build session state management (Zustand)
- [ ] Implement read/unread toggle logic
- [ ] Add "mark all as read" functionality

**Acceptance Criteria:**
- ✅ Unique IDs generated consistently
- ✅ URL normalization (remove tracking params)
- ✅ Session state persists across page refreshes
- ✅ Read status updates in real-time

**Effort:** L
**Dependencies:** 1.1

#### 2.3 Daily Log File Management
**Tasks:**
- [ ] Design log file structure (layered: site → items)
- [ ] Create log file path generator: `logs/YYYY-MM-DD.json`
- [ ] Implement GitRows commit function
- [ ] Add batch commit for multiple items
- [ ] Handle commit conflicts and rate limits
- [ ] Create log file reader for existing data

**Acceptance Criteria:**
- ✅ Log structure matches specification
- ✅ Daily file naming works correctly
- ✅ GitRows commits succeed
- ✅ Existing logs are merged, not overwritten
- ✅ Error handling for failed commits

**Effort:** L
**Dependencies:** 1.2, 2.2

### Phase 3: User Interface (Days 6-8)

#### 3.1 Main Layout & Navigation
**Tasks:**
- [ ] Create main App layout with MUI
- [ ] Implement header with app title and controls
- [ ] Add settings panel (show-read toggle, auto-commit toggle)
- [ ] Create refresh button with loading indicator
- [ ] Add responsive design for mobile/tablet

**Acceptance Criteria:**
- ✅ Clean, minimal UI following MUI v7 patterns
- ✅ Responsive breakpoints work correctly
- ✅ Loading states visible
- ✅ Settings persist in localStorage

**Effort:** M
**Dependencies:** 1.1

#### 3.2 Feed Display Components
**Tasks:**
- [ ] Create SiteList component (collapsible sections)
- [ ] Create FeedItem component (card layout)
- [ ] Implement unread count badges
- [ ] Add item details (title, description, pubDate, link)
- [ ] Create empty states (no feeds, no unread items)
- [ ] Add error display components

**Acceptance Criteria:**
- ✅ Items display all required fields
- ✅ Read items visually distinct (strikethrough/grayed)
- ✅ Collapsible site sections work
- ✅ Links open in new tab
- ✅ Proper error messages shown

**Effort:** M
**Dependencies:** 2.2

#### 3.3 Interaction & Actions
**Tasks:**
- [ ] Implement click-to-mark-as-read
- [ ] Add bulk operations (mark site read, mark all read)
- [ ] Create manual commit button
- [ ] Add auto-commit timer (configurable)
- [ ] Implement "show read items" toggle
- [ ] Add keyboard shortcuts (optional)

**Acceptance Criteria:**
- ✅ Single click marks item as read
- ✅ Bulk operations work correctly
- ✅ Manual commit triggers GitRows API
- ✅ Auto-commit respects user settings
- ✅ Visual feedback for all actions

**Effort:** M
**Dependencies:** 2.2, 2.3, 3.2

### Phase 4: Configuration & Data Management (Days 9-10)

#### 4.1 Config File Structure
**Tasks:**
- [ ] Design rss-config.json schema
- [ ] Create config editor UI (optional)
- [ ] Implement config validation
- [ ] Add config reload functionality
- [ ] Support multiple RSS sites

**Config Schema:**
```json
{
  "sites": [
    {
      "name": "Tech News",
      "url": "https://example.com/rss",
      "color": "#2196F3"
    }
  ],
  "settings": {
    "showReadItems": false,
    "autoCommit": true,
    "commitInterval": 300
  }
}
```

**Acceptance Criteria:**
- ✅ Schema validation with TypeScript
- ✅ Multiple sites supported
- ✅ Config can be updated via GitRows
- ✅ Settings persist in localStorage

**Effort:** S
**Dependencies:** 1.2

#### 4.2 Data Persistence Layer
**Tasks:**
- [ ] Create localStorage wrapper for session data
- [ ] Implement read status cache
- [ ] Add data migration utilities
- [ ] Create backup/restore functionality
- [ ] Handle storage quota limits

**Acceptance Criteria:**
- ✅ Session data persists correctly
- ✅ Cache invalidation works
- ✅ No data loss on refresh
- ✅ Graceful handling of storage limits

**Effort:** S
**Dependencies:** 2.2

### Phase 5: Polish & Optimization (Days 11-12)

#### 5.1 Performance Optimization
**Tasks:**
- [ ] Implement virtual scrolling for large feed lists
- [ ] Add React.memo to expensive components
- [ ] Optimize RSS parsing (debounce/throttle)
- [ ] Implement lazy loading for feed items
- [ ] Add performance monitoring

**Acceptance Criteria:**
- ✅ Renders 100+ items without lag
- ✅ Fast initial load time (<2s)
- ✅ Efficient re-renders
- ✅ Memory usage optimized

**Effort:** M
**Dependencies:** 3.2

#### 5.2 Error Handling & Edge Cases
**Tasks:**
- [ ] Network failure recovery
- [ ] RSS parsing error handling
- [ ] GitRows API rate limit handling
- [ ] Invalid config handling
- [ ] Browser compatibility checks
- [ ] Offline mode (read-only)

**Acceptance Criteria:**
- ✅ All errors caught and displayed
- ✅ Retry logic for transient failures
- ✅ Graceful degradation
- ✅ No unhandled exceptions

**Effort:** M
**Dependencies:** 2.1, 2.3

#### 5.3 Testing & Documentation
**Tasks:**
- [ ] Unit tests for utilities (hashing, parsing)
- [ ] Component tests for UI elements
- [ ] Integration tests for data flow
- [ ] Create README with setup instructions
- [ ] Document GitRows configuration
- [ ] Add deployment guide

**Acceptance Criteria:**
- ✅ 80%+ code coverage
- ✅ All critical paths tested
- ✅ Documentation complete
- ✅ Deployment steps clear

**Effort:** L
**Dependencies:** All previous phases

---

## 📝 Detailed Task Breakdown

### Task 1: Project Setup
**Priority:** P0 (Critical)
**Effort:** S
**Type:** Setup

**Sub-tasks:**
1. Create Vite React TypeScript project
   ```bash
   npm create vite@latest rss-reader -- --template react-ts
   cd rss-reader
   npm install
   ```

2. Install core dependencies
   ```bash
   npm install @mui/material @emotion/react @emotion/styled
   npm install zustand
   npm install rss-parser
   npm install @types/rss-parser
   ```

3. Set up project structure
   ```
   src/
   ├── components/
   ├── pages/
   ├── features/
   │   ├── rss-reader/
   │   │   ├── components/
   │   │   ├── hooks/
   │   │   └── store/
   ├── hooks/
   ├── utils/
   ├── types/
   └── App.tsx
   ```

4. Configure TypeScript paths in tsconfig.json
   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "@/*": ["src/*"]
       }
     }
   }
   ```

**Acceptance Criteria:**
- Project builds: `npm run build` succeeds
- TypeScript compiles without errors
- MUI components render correctly
- Basic routing works

**Risks:** None
**Mitigation:** Standard setup process

---

### Task 2: GitRows Integration
**Priority:** P0 (Critical)
**Effort:** M
**Type:** Core Feature

**Sub-tasks:**
1. Install GitRows NPM module
   ```bash
   npm install gitrows
   ```

2. Research GitRows capabilities
   - **Path format**: `@github/owner/repo:branch/path/file.json`
   - **Authentication**: Read public repos = no auth needed; Write = requires token
   - **Modes**: `fetch` (recommended for client-side) vs `pull`
   - **Methods**: `get()`, `put()`, `update()`, `replace()`, `delete()`
   - **Important**: GitHub returns 404 for missing AND private files

3. Create utility functions
   ```typescript
   // src/utils/gitrows.ts
   import gitrows from 'gitrows';

   interface GitRowsConfig {
     owner: string;
     repo: string;
     branch?: string;
     token?: string;
   }

   export function createGitRowsClient(config: GitRowsConfig) {
     const path = `@github/${config.owner}/${config.repo}:${config.branch || 'main'}`;
     return gitrows({ path, token: config.token, mode: 'fetch' });
   }

   export async function readFromGitRows<T>(client: any, path: string): Promise<T> {
     return await client.get(path);
   }

   export async function writeToGitRows<T>(client: any, path: string, data: T): Promise<boolean> {
     return await client.put(path, data);
   }
   ```

4. Implement config reader
   ```typescript
   // src/features/rss-reader/config.ts
   import { createGitRowsClient } from '@/utils/gitrows';

   interface RSSConfig {
     sites: Array<{
       name: string;
       url: string;
       color?: string;
     }>;
     settings: {
       showReadItems: boolean;
       autoCommit: boolean;
       commitInterval: number;
     };
   }

   export async function loadConfig(): Promise<RSSConfig> {
     const client = createGitRowsClient({
       owner: import.meta.env.VITE_GITHUB_OWNER,
       repo: import.meta.env.VITE_GITHUB_REPO,
       branch: import.meta.env.VITE_GITHUB_BRANCH
     });

     const config = await client.get('rss-config.json');
     return validateConfig(config);
   }
   ```

5. Security considerations
   - **Never** commit tokens to client-side code
   - Use public repos for read-only access
   - For write operations: consider serverless function or accept public visibility
   - Document security implications to users

**Acceptance Criteria:**
- ✅ GitRows module installed and configured
- ✅ Can fetch config from public GitHub repo
- ✅ Handles 404 errors (missing files) gracefully
- ✅ Path format correctly constructed
- ✅ Config validation implemented
- ✅ Security implications documented

**Risks:**
- Token exposure in client code (mitigation: use public repos only)
- GitHub 404 ambiguity (mitigation: explicit error messages)
- Rate limits (mitigation: fetch mode + caching)

**Mitigation:** Use public repos, fetch mode, clear error messages

---

### Task 3: RSS Parsing Engine
**Priority:** P0 (Critical)
**Effort:** M
**Type:** Core Feature

**Sub-tasks:**
1. Install rss-parser
   ```bash
   npm install rss-parser
   ```

2. Create parser wrapper
   ```typescript
   // src/utils/rss-parser.ts
   import Parser from 'rss-parser';

   const parser = new Parser({
     customFields: {
       item: ['guid', 'pubDate', 'description']
     }
   });

   export async function fetchRSS(url: string): Promise<RSSFeed> {
     const feed = await parser.parseURL(url);
     return {
       title: feed.title,
       link: feed.link,
       items: feed.items.map(item => ({
         guid: item.guid || '',
         title: item.title || '',
         link: item.link || '',
         pubDate: item.pubDate || '',
         description: item.description || ''
       }))
     };
   }
   ```

3. Handle CORS (if needed)
   - Use CORS proxy: `https://corsproxy.io/?{encoded_url}`
   - Or: `https://api.allorigins.win/raw?url={encoded_url}`

**Acceptance Criteria:**
- Parses RSS 2.0 and Atom
- Returns structured data
- Handles malformed XML
- CORS workarounds functional

**Risks:** CORS blocking, malformed feeds
**Mitigation:** Multiple proxy options, error handling

---

### Task 4: Read Status Tracking
**Priority:** P0 (Critical)
**Effort:** L
**Type:** Core Feature

**Sub-tasks:**
1. Create unique identifier generator
   ```typescript
   // src/utils/item-id.ts
   export function generateItemId(
     guid: string,
     link: string,
     title: string,
     description: string,
     pubDate: string
   ): string {
     const normalizedLink = removeTrackingParams(link);
     const combined = `${guid}|${normalizedLink}|${title}|${description}|${pubDate}`;
     return btoa(combined).substring(0, 32); // Base64 hash
   }

   function removeTrackingParams(url: string): string {
     try {
       const urlObj = new URL(url);
       // Remove common tracking params
       const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid'];
       trackingParams.forEach(param => urlObj.searchParams.delete(param));
       return urlObj.toString();
     } catch {
       return url;
     }
   }
   ```

2. Create site identifier
   ```typescript
   export function getSiteId(url: string): string {
     return removeTrackingParams(url);
   }
   ```

3. Zustand store for session state
   ```typescript
   // src/features/rss-reader/store/readerStore.ts
   interface ReaderState {
     readStatus: Record<string, Set<string>>; // siteId -> Set<itemId>
     currentFeeds: RSSFeed[];
     settings: ReaderSettings;

     markAsRead: (siteId: string, itemId: string) => void;
     markSiteAsRead: (siteId: string) => void;
     markAllAsRead: () => void;
     isRead: (siteId: string, itemId: string) => boolean;
     getUnreadCount: (siteId: string) => number;
   }
   ```

**Acceptance Criteria:**
- IDs are consistent (same input = same output)
- URL normalization works correctly
- State updates correctly
- Unread counts accurate

**Risks:** Hash collisions (extremely unlikely)
**Mitigation:** Use full composite key

---

### Task 5: Log File Management
**Priority:** P1 (High)
**Effort:** L
**Type:** Core Feature

**Sub-tasks:**
1. Design log structure
   ```typescript
   // logs/2025-12-21.json
   {
     "metadata": {
       "date": "2025-12-21",
       "generatedAt": "2025-12-21T10:30:00Z"
     },
     "sites": {
       "https://example.com/rss": {
         "name": "Tech News",
         "readItems": [
           {
             "itemId": "abc123...",
             "title": "Article Title",
             "pubDate": "2025-12-21T08:00:00Z",
             "readAt": "2025-12-21T10:30:00Z"
           }
         ]
       }
     }
   }
   ```

2. Log file path generator
   ```typescript
   // src/utils/log-file.ts
   export function getLogFilePath(date: Date = new Date()): string {
     const dateStr = date.toISOString().split('T')[0];
     return `logs/${dateStr}.json`;
   }
   ```

3. Commit to GitRows
   ```typescript
   // src/utils/log-file.ts
   import { createGitRowsClient } from '@/utils/gitrows';

   export async function commitReadStatus(
     siteId: string,
     siteName: string,
     items: Array<{ itemId: string; title: string; pubDate: string }>
   ): Promise<boolean> {
     const path = getLogFilePath();

     // Create GitRows client
     const client = createGitRowsClient({
       owner: import.meta.env.VITE_GITHUB_OWNER,
       repo: import.meta.env.VITE_GITHUB_REPO,
       branch: import.meta.env.VITE_GITHUB_BRANCH,
       token: import.meta.env.VITE_GITHUB_TOKEN // Required for write
     });

     // Read existing log (handle 404 for missing files)
     let existing: LogData | null = null;
     try {
       existing = await client.get(path);
     } catch (error) {
       // 404 means file doesn't exist yet - that's OK
       if (!error.message.includes('404')) {
         throw error;
       }
     }

     // Create or merge log data
     const logData: LogData = existing || {
       metadata: {
         date: path.split('/')[1].replace('.json', ''),
         generatedAt: new Date().toISOString()
       },
       sites: {}
     };

     // Initialize site if needed
     if (!logData.sites[siteId]) {
       logData.sites[siteId] = { name: siteName, readItems: [] };
     }

     // Merge new items (avoid duplicates)
     const newItems = items.map(item => ({
       ...item,
       readAt: new Date().toISOString()
     }));

     // Filter out already logged items
     const existingItemIds = new Set(logData.sites[siteId].readItems.map(i => i.itemId));
     const itemsToAdd = newItems.filter(item => !existingItemIds.has(item.itemId));

     logData.sites[siteId].readItems.push(...itemsToAdd);

     // Write back to GitRows
     try {
       await client.put(path, logData);
       return true;
     } catch (error) {
       console.error('Failed to commit to GitRows:', error);
       return false;
     }
   }
   ```

4. Batch commit for multiple sites
   ```typescript
   export async function commitAllReadItems(
     allReadItems: Record<string, Array<{ itemId: string; title: string; pubDate: string; siteName: string }>>
   ): Promise<Record<string, boolean>> {
     const results: Record<string, boolean> = {};

     for (const [siteId, items] of Object.entries(allReadItems)) {
       if (items.length > 0) {
         const siteName = items[0].siteName;
         const itemData = items.map(({ itemId, title, pubDate }) => ({ itemId, title, pubDate }));
         results[siteId] = await commitReadStatus(siteId, siteName, itemData);
       }
     }

     return results;
   }
   ```

**Acceptance Criteria:**
- ✅ Correct file path generation (`logs/YYYY-MM-DD.json`)
- ✅ Merges with existing logs (doesn't overwrite)
- ✅ Handles 404 errors (missing file = create new)
- ✅ Commits successfully to GitRows
- ✅ Prevents duplicate entries
- ✅ Batch commit works for multiple sites
- ✅ Handles commit failures gracefully

**Risks:**
- GitRows API failures (mitigation: retry logic, local backup)
- Token not provided for write (mitigation: clear error message)
- Rate limits (mitigation: batch operations, fetch mode)
- Data loss during merge (mitigation: test merge logic thoroughly)

**Mitigation:** Error handling, retry logic, clear user feedback
**Mitigation:** Local backup, retry logic

---

### Task 6: UI Components
**Priority:** P1 (High)
**Effort:** M
**Type:** Feature

**Sub-tasks:**
1. Main App Layout
   ```typescript
   // src/App.tsx
   export const App = () => {
     return (
       <ThemeProvider theme={theme}>
         <CssBaseline />
         <ReaderLayout />
       </ThemeProvider>
     );
   };
   ```

2. Reader Layout
   ```typescript
   // src/features/rss-reader/components/ReaderLayout.tsx
   export const ReaderLayout = () => {
     const { sites, loading, error } = useRSSFeeds();

     return (
       <Container maxWidth="lg">
         <Header />
         <SettingsPanel />
         {loading && <LinearProgress />}
         {error && <ErrorAlert error={error} />}
         <FeedList sites={sites} />
       </Container>
     );
   };
   ```

3. Feed List with collapsible sections
   ```typescript
   // src/features/rss-reader/components/FeedList.tsx
   export const FeedList = ({ sites }) => {
     return (
       <Accordion>
         <AccordionSummary>{site.name} ({unreadCount})</AccordionSummary>
         <AccordionDetails>
           {items.map(item => <FeedItem key={item.id} item={item} />)}
         </AccordionDetails>
       </Accordion>
     );
   };
   ```

**Acceptance Criteria:**
- Clean, responsive layout
- Collapsible sections work
- Loading states visible
- Error messages clear

**Risks:** UI complexity
**Mitigation:** Start simple, iterate

---

### Task 7: User Interactions
**Priority:** P1 (High)
**Effort:** M
**Type:** Feature

**Sub-tasks:**
1. Click to mark as read
   ```typescript
   const handleItemClick = (siteId: string, item: RSSItem) => {
     markAsRead(siteId, generateItemId(...));
     // Optionally commit immediately
     if (settings.autoCommit) {
       commitReadStatus(siteId, [item]);
     }
   };
   ```

2. Settings panel
   ```typescript
   // src/features/rss-reader/components/SettingsPanel.tsx
   export const SettingsPanel = () => {
     const { settings, updateSettings } = useSettings();

     return (
       <Paper sx={{ p: 2, mb: 2 }}>
         <FormControlLabel
           control={<Switch checked={settings.showReadItems}
           onChange={(e) => updateSettings({ showReadItems: e.target.checked })} />}
           label="Show Read Items"
         />
         <FormControlLabel
           control={<Switch checked={settings.autoCommit} />}
           label="Auto-commit to GitRows"
         />
       </Paper>
     );
   };
   ```

3. Manual commit button
   ```typescript
   const handleManualCommit = async () => {
     const allReadItems = getAllReadItems();
     const results = await Promise.all(
       Object.entries(allReadItems).map(([siteId, items]) =>
         commitReadStatus(siteId, items)
       )
     );
     // Show success/failure feedback
   };
   ```

**Acceptance Criteria:**
- Click marks item as read
- Settings toggle works
- Manual commit succeeds
- Visual feedback provided

**Risks:** User confusion
**Mitigation:** Clear UI labels, tooltips

---

### Task 8: Performance & Polish
**Priority:** P2 (Medium)
**Effort:** M
**Type:** Enhancement

**Sub-tasks:**
1. Virtual scrolling for large lists
   ```typescript
   // Use react-window or react-virtualized
   import { FixedSizeList as List } from 'react-window';
   ```

2. Memoization
   ```typescript
   const FeedItem = memo(({ item, isRead, onClick }: FeedItemProps) => {
     // Component implementation
   });
   ```

3. Debounced auto-commit
   ```typescript
   const debouncedCommit = useMemo(
     () => debounce(commitReadStatus, 2000),
     []
   );
   ```

**Acceptance Criteria:**
- Smooth scrolling with 100+ items
- No unnecessary re-renders
- Auto-commit doesn't spam API

**Risks:** Over-optimization
**Mitigation:** Profile first, optimize as needed

---

### Task 9: Error Handling
**Priority:** P2 (Medium)
**Effort:** M
**Type:** Quality

**Sub-tasks:**
1. Network error recovery
   ```typescript
   async function fetchWithRetry<T>(
     fn: () => Promise<T>,
     retries = 3
   ): Promise<T> {
     try {
       return await fn();
     } catch (error) {
       if (retries > 0) {
         await new Promise(r => setTimeout(r, 1000));
         return fetchWithRetry(fn, retries - 1);
       }
       throw error;
     }
   }
   ```

2. User-friendly error messages
   ```typescript
   const ErrorAlert = ({ error }) => {
     const message = getErrorMessage(error);
     return <Alert severity="error">{message}</Alert>;
   };
   ```

**Acceptance Criteria:**
- All errors caught and displayed
- Retry logic works
- No crashes on network failures

**Risks:** Unknown error types
**Mitigation:** Comprehensive error classification

---

### Task 10: Testing
**Priority:** P2 (Medium)
**Effort:** L
**Type:** Quality

**Sub-tasks:**
1. Unit tests for utilities
   ```typescript
   describe('generateItemId', () => {
     it('produces consistent IDs', () => {
       const id1 = generateItemId('guid', 'link', 'title', 'desc', 'date');
       const id2 = generateItemId('guid', 'link', 'title', 'desc', 'date');
       expect(id1).toBe(id2);
     });
   });
   ```

2. Component tests
   ```typescript
   describe('FeedItem', () => {
     it('renders correctly', () => {
       render(<FeedItem item={mockItem} isRead={false} />);
       expect(screen.getByText('Title')).toBeInTheDocument();
     });
   });
   ```

3. Integration tests
   ```typescript
   describe('RSS Reader Flow', () => {
     it('fetches, displays, and tracks read status', async () => {
       // Full user flow test
     });
   });
   ```

**Acceptance Criteria:**
- 80%+ coverage
- All critical paths tested
- Tests pass in CI

**Risks:** Time constraints
**Mitigation:** Focus on critical paths first

---

## ⚠️ Risk Assessment & Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **CORS blocking RSS feeds** | High | High | Use CORS proxy services, implement multiple fallback options |
| **GitRows API rate limits** | Medium | Medium | Implement caching, batch commits, exponential backoff |
| **RSS feed parsing errors** | Medium | Medium | Robust error handling, validate XML before parsing |
| **Browser storage limits** | Low | Medium | Implement data cleanup, compress stored data |
| **Hash collisions** | Very Low | High | Use composite keys, add collision detection |
| **Network timeouts** | Medium | Medium | Retry logic, timeout configuration |

### User Experience Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Slow feed loading** | High | Medium | Virtual scrolling, lazy loading, loading indicators |
| **Confusing UI** | Medium | Medium | User testing, clear labels, tooltips |
| **Data loss** | Low | High | Local backup, auto-save, manual commit option |
| **GitRows auth issues** | Medium | Medium | Clear setup instructions, public repo option |

### Project Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Scope creep** | High | Medium | Strict MVP focus, phased delivery |
| **Time constraints** | Medium | Medium | Prioritize features, cut non-essential items |
| **Dependency issues** | Low | Medium | Pin versions, have backup libraries |

---

## 📊 Success Metrics

### Functional Metrics
- ✅ **Feed Loading**: < 2 seconds for 10 feeds
- ✅ **Parsing Success**: > 95% of valid RSS feeds
- ✅ **Commit Success**: > 98% of GitRows commits
- ✅ **Read Tracking**: 100% accuracy
- ✅ **Error Rate**: < 5% of user sessions

### User Experience Metrics
- ✅ **Time to First Read**: < 30 seconds
- ✅ **Task Completion**: > 90% of users can read and track
- ✅ **Settings Usage**: > 70% configure settings
- ✅ **Mobile Usage**: > 40% on mobile devices

### Code Quality Metrics
- ✅ **Test Coverage**: > 80%
- ✅ **TypeScript Strict**: No `any` types
- ✅ **Build Success**: 100% on main branch
- ✅ **Bundle Size**: < 500KB gzipped

---

## 🔧 Required Resources & Dependencies

### Software Dependencies
```json
{
  "production": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@mui/material": "^7.0.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "zustand": "^4.3.0",
    "rss-parser": "^3.13.0"
  },
  "development": {
    "vite": "^5.0.0",
    "typescript": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/rss-parser": "^3.13.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0"
  }
}
```

### External Services
- **GitRows**: Free tier sufficient
- **CORS Proxy**: corsproxy.io or allorigins.win (free)
- **GitHub**: For config and log storage (public repo)

### Development Environment
- Node.js 18+
- npm or pnpm
- Git
- GitHub account (for GitRows)

---

## 📅 Timeline Estimates

### Week 1: Foundation
- **Day 1**: Project setup, GitRows research
- **Day 2**: GitRows integration, config structure
- **Day 3**: RSS parsing engine
- **Day 4**: Read tracking system
- **Day 5**: Log file management

### Week 2: UI & Features
- **Day 6**: Main layout, navigation
- **Day 7**: Feed display components
- **Day 8**: User interactions
- **Day 9**: Configuration management
- **Day 10**: Data persistence

### Week 3: Polish & Release
- **Day 11**: Performance, error handling
- **Day 12**: Testing, documentation
- **Day 13**: Bug fixes, final polish
- **Day 14**: Deployment, release

### Milestones
- **MVP (Day 7)**: Can read feeds and track manually
- **Beta (Day 12)**: Full feature set, tested
- **Release (Day 14)**: Production ready

---

## 🎯 Next Steps

### Immediate Actions (Next 24 hours)
1. ✅ Create project directory structure
2. ✅ Initialize Vite React TypeScript project
3. ✅ Install core dependencies
4. ✅ Set up basic App structure
5. ✅ Research GitRows API documentation

### This Week
1. Complete Phase 1 (Foundation)
2. Start Phase 2 (Core RSS functionality)
3. Create initial config file for GitRows
4. Set up development environment

### Communication Plan
- Daily progress updates in task checklist
- Blockers reported immediately
- Architecture decisions documented
- User feedback incorporated

---

## 📚 References & Resources

### Documentation
- [React Documentation](https://react.dev/)
- [MUI v7 Documentation](https://mui.com/material-ui/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [RSS Parser Documentation](https://www.npmjs.com/package/rss-parser)
- [GitRows API](https://gitrows.com/)

### Tools
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### Similar Projects
- [RSS Guard](https://github.com/martinrotter/rssguard)
- [Tiny Tiny RSS](https://github.com/TT-RSS/TT-RSS)
- [Feedbin](https://github.com/feedbin/feedbin)

---

**Plan Version:** 1.0
**Last Updated:** 2025-12-21
**Next Review:** After MVP completion

**Approved By:** [Pending]
**Status:** Ready for Implementation
