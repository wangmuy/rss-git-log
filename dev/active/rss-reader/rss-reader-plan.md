# RSS Reader SPA - Implementation Status

**Last Updated:** 2025-12-24
**Project Type:** React Static SPA with GitHub API Integration
**Status:** MVP COMPLETED ✅
**Timeline:** Completed in 3 days

---

## 📋 Executive Summary

✅ **PROJECT COMPLETED**: A fully functional React SPA RSS reader with GitHub integration has been successfully implemented. The application features a modern sidebar layout, subscription management, and seamless GitHub synchronization.

### ✅ Implemented Features
- **GitHub API Integration**: Complete read/write functionality for RSS config and logs
- **Sidebar Layout**: Left panel for site selection, right panel for content display
- **Subscription Management**: Full CRUD operations for RSS feeds via UI
- **Browser Storage**: All configuration stored in localStorage (no .env files)
- **Read Status Tracking**: Session-based tracking with GitHub log persistence
- **Auto-commit**: Automatic daily log file generation
- **Modern UI**: MUI v7 components with responsive design

### 🏗️ Technical Implementation
- **Frontend**: React 18+ with TypeScript ✅
- **Build Tool**: Vite ✅
- **Styling**: MUI v7 Material Design ✅
- **State Management**: Zustand ✅
- **RSS Parsing**: Native DOMParser ✅
- **Data Storage**: localStorage + GitHub API ✅
- **Architecture**: Flattened structure (src/components, src/hooks, etc.) ✅

---

## 🎯 Current Architecture

### Project Structure (Final)
```
src/
├── components/          # All UI components
│   ├── SetupPage.tsx           # GitHub repo configuration
│   ├── SidebarFeedLayout.tsx   # Main two-panel layout
│   ├── SubscriptionManager.tsx # RSS feed CRUD
│   ├── ReaderLayout.tsx        # Main app layout
│   ├── FeedItem.tsx           # Individual RSS item
│   └── Header.tsx             # App header
├── hooks/              # Custom React hooks
├── store/              # Zustand state management
├── types/              # TypeScript definitions
├── utils/              # Utility functions
└── App.tsx             # Main application
```

### Data Flow (Implemented)
1. **Setup**: User configures GitHub repo → localStorage
2. **Config Load**: App reads rss-config.json from GitHub
3. **Feed Management**: User adds/edits feeds → SubscriptionManager → GitHub
4. **Feed Display**: Sidebar shows sites, content area shows selected feed items
5. **Read Tracking**: localStorage + auto-commit to GitHub logs

---

## 🚀 Major Achievements

### Architecture Improvements
- ✅ **Eliminated .env files**: Pure browser storage approach
- ✅ **Flattened structure**: Simplified from features/rss-reader to direct src/
- ✅ **Sidebar UX**: Modern two-panel layout like professional RSS readers
- ✅ **Real-time sync**: Changes immediately reflected and saved to GitHub
- ✅ **Site-based logging**: NEW - Organized logs by site with intelligent chunking

### User Experience
- ✅ **Intuitive navigation**: Click site names to switch feeds
- ✅ **Visual feedback**: Selected sites highlighted with colored borders
- ✅ **Subscription management**: Add/edit/delete feeds without manual file editing
- ✅ **Responsive design**: Works on desktop and mobile devices

### Technical Excellence
- ✅ **Type safety**: Full TypeScript implementation
- ✅ **Error handling**: Graceful fallbacks and user feedback
- ✅ **Performance**: Efficient state management and rendering
- ✅ **Browser compatibility**: Works in all modern browsers
- ✅ **Scalable logging**: NEW - Site-based files prevent large file issues
- ✅ **Migration support**: Automatic conversion from old daily logs

### 📁 Advanced Log Organization
```
NEW STRUCTURE:
logs/
├── news.ycombinator.com/
│   ├── 2025-12-20.json  # ≤200 items, oldest from Dec 20
│   └── 2025-12-22.json  # Next 200 items
├── techcrunch.com/
│   └── 2025-12-19.json  # ≤200 items, oldest from Dec 19

FEATURES:
- Max 200 items per file (prevents large files)
- Filename based on oldest item date
- Site-isolated for better organization
- Automatic chunking when limit reached
- Migration from old daily structure
```

---

## 📊 Implementation Status

### Core Features: 100% Complete ✅
- [x] GitHub API integration (read/write)
- [x] RSS feed fetching and parsing
- [x] Read status tracking
- [x] Site-based log file generation (NEW)
- [x] Subscription management UI
- [x] Sidebar layout implementation
- [x] Auto-commit functionality
- [x] Browser-only storage
- [x] Public/private repo support
- [x] DateTime descending sort
- [x] Log migration system (NEW)

### Advanced Features: 100% Complete ✅
- [x] Site-based log organization
- [x] 200-item file chunking
- [x] Intelligent filename generation
- [x] Metadata tracking (dates, counts)
- [x] Migration from daily logs
- [x] Enhanced read history tracking

### Future Enhancements (Optional)
- [ ] Search/filter functionality
- [ ] Keyboard shortcuts
- [ ] Export capabilities
- [ ] PWA features
- [ ] Dark mode theme
- [ ] Feed categories/tags

---

## 🎉 Project Success Metrics

### ✅ All MVP Requirements Met
- **Zero Backend**: Pure client-side implementation
- **GitHub Integration**: Full read/write functionality
- **Modern UI**: Professional RSS reader experience
- **User Control**: Complete subscription management
- **Data Persistence**: Reliable GitHub-based storage
- **Scalable Logging**: NEW - Site-based organization prevents file bloat

### ✅ Technical Quality
- **Clean Code**: Well-structured, maintainable codebase
- **Type Safety**: Full TypeScript coverage
- **Performance**: Fast loading and smooth interactions
- **Responsive**: Works across device sizes
- **Error Handling**: Robust error management
- **Data Organization**: NEW - Intelligent log file management

---

**Project Status:** ✅ COMPLETED - Ready for Production
**Latest Update:** Site-based logging system implemented
**Next Steps:** Optional enhancements based on user feedback
**Maintainer:** RSS Reader Development Team
- **Client-Side**: All operations in browser
- **GitHub API**: Requires public GitHub repo for config/data storage
- **User Data**: Stored in browser localStorage + GitHub commits
- **RSS Sources**: Publicly accessible RSS feeds (CORS may be an issue)
- **Browser Native**: No Node.js dependencies, uses native fetch/DOMParser

---

## 🚀 Proposed Future State

### Architecture Overview
```
Browser (React SPA)
    ↓
Native fetch() API
    ↓
GitHub REST API v3
    ↓
Config File (rss-config.json)
    ↓
RSS Feed URLs
    ↓
DOMParser (XML)
    ↓
Display UI
    ↓
LocalStorage (session)
    ↓
Commit to logs/YYYY-MM-DD.json
```

### Data Flow
1. **Initialization**: App loads config from GitHub via native fetch
2. **Fetch Feeds**: Parse RSS from configured URLs using DOMParser
3. **Filter**: Remove read items (unless show-read enabled)
4. **Display**: Render feed items in UI
5. **Interaction**: User reads items
6. **Tracking**: Mark items as read in session
7. **Persistence**: Commit read status to daily log file via GitHub API

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

#### 1.2 GitHub API Integration Setup
**Tasks:**
- [ ] Research GitHub REST API v3 endpoints and authentication
- [ ] Create utility functions for GitHub API operations (native fetch)
- [ ] Implement config file reader (rss-config.json)
- [ ] Create error handling for network failures
- [ ] Add loading states for async operations
- [ ] Implement base64 encoding/decoding for file content

**Acceptance Criteria:**
- ✅ Can fetch config from GitHub using native fetch
- ✅ Handles 404/403 errors gracefully
- ✅ Config validation with TypeScript types
- ✅ Retry mechanism for failed requests
- ✅ No Node.js dependencies used

**Effort:** M
**Dependencies:** 1.1

### Phase 2: Core RSS Functionality (Days 3-5)

#### 2.1 RSS Parsing Engine
**Tasks:**
- [ ] Create RSS feed fetcher utility using native fetch
- [ ] Implement DOMParser for XML parsing (no rss-parser dependency)
- [ ] Implement CORS proxy handling (if needed)
- [ ] Parse feed items with proper TypeScript types
- [ ] Handle malformed RSS gracefully
- [ ] Add feed validation
- [ ] Support both RSS 2.0 and Atom formats

**Acceptance Criteria:**
- ✅ Successfully parses valid RSS feeds using DOMParser
- ✅ Returns structured data (title, link, guid, pubDate, description)
- ✅ Handles XML parsing errors
- ✅ Supports multiple feed formats (RSS 2.0, Atom)
- ✅ No Node.js dependencies used

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
- [ ] Implement GitHub API commit function (native fetch)
- [ ] Add batch commit for multiple items
- [ ] Handle commit conflicts and rate limits
- [ ] Create log file reader for existing data
- [ ] Implement SHA-based file updates

**Acceptance Criteria:**
- ✅ Log structure matches specification
- ✅ Daily file naming works correctly
- ✅ GitHub API commits succeed
- ✅ Existing logs are merged, not overwritten
- ✅ Error handling for failed commits
- ✅ Base64 encoding/decoding works correctly

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
- ✅ Manual commit triggers GitHub API
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
- ✅ Config can be updated via GitHub API
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
- [ ] GitHub API rate limit handling
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
- [ ] Document GitHub API configuration
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

### Task 2: GitHub API Integration
**Priority:** P0 (Critical)
**Effort:** M
**Type:** Core Feature

**Sub-tasks:**
1. Research GitHub REST API v3 endpoints
   - **Read endpoint**: `GET /repos/{owner}/{repo}/contents/{path}`
   - **Write endpoint**: `PUT /repos/{owner}/{repo}/contents/{path}`
   - **Authentication**: Read public repos = no auth needed; Write = requires token
   - **Content encoding**: Base64 required for all file operations
   - **Important**: GitHub returns 404 for missing AND private files
   - **Rate limits**: 60/hour (unauth), 5000/hour (auth)

2. Create utility functions (native browser fetch)
   ```typescript
   // src/utils/github-api.ts
   interface GitHubConfig {
     owner: string;
     repo: string;
     branch?: string;
     token?: string;
   }

   interface GitHubClient {
     config: GitHubConfig;
     baseUrl: string;
   }

   export function createGitHubClient(config: GitHubConfig): GitHubClient {
     return {
       config,
       baseUrl: `https://api.github.com/repos/${config.owner}/${config.repo}`
     };
   }

   export async function readFromGitHub<T>(
     client: GitHubClient,
     path: string
   ): Promise<T | null> {
     const url = `${client.baseUrl}/contents/${encodeURIComponent(path)}?ref=${client.config.branch || 'main'}`;
     const response = await fetch(url, { headers: buildHeaders(client.config.token) });
     if (response.status === 404) return null;
     const data = await response.json();
     const content = atob(data.content);
     try { return JSON.parse(content) as T; } catch { return content as unknown as T; }
   }

   export async function writeToGitHub<T>(
     client: GitHubClient,
     path: string,
     data: T,
     message: string,
     sha?: string
   ): Promise<boolean> {
     const url = `${client.baseUrl}/contents/${encodeURIComponent(path)}`;
     const body = {
       message,
       content: btoa(JSON.stringify(data)),
       branch: client.config.branch || 'main',
       ...(sha ? { sha } : {})
     };
     const response = await fetch(url, {
       method: 'PUT',
       headers: buildHeaders(client.config.token),
       body: JSON.stringify(body)
     });
     return response.ok;
   }
   ```

3. Implement config reader
   ```typescript
   // src/features/rss-reader/config.ts
   import { createGitHubClient, readFromGitHub } from '@/utils/github-api';

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

   export async function loadConfig(): Promise<RSSConfig | null> {
     const client = createGitHubClient({
       owner: import.meta.env.VITE_GITHUB_OWNER,
       repo: import.meta.env.VITE_GITHUB_REPO,
       branch: import.meta.env.VITE_GITHUB_BRANCH
     });

     const config = await readFromGitHub<RSSConfig>(client, 'rss-config.json');
     return config ? validateConfig(config) : null;
   }
   ```

4. Security considerations
   - **Never** commit tokens to client-side code (visible in bundle)
   - Use public repos for read-only access (no token needed)
   - For write operations: accept public visibility or use serverless function
   - Document security implications to users

**Acceptance Criteria:**
- ✅ Native browser fetch API implementation
- ✅ Can fetch config from public GitHub repo
- ✅ Handles 404 errors (missing files) gracefully
- ✅ Base64 encoding/decoding works correctly
- ✅ Config validation implemented
- ✅ Security implications documented

**Risks:**
- Token exposure in client code (mitigation: use public repos only)
- GitHub 404 ambiguity (mitigation: explicit error messages)
- Rate limits (mitigation: batch operations, caching)

**Mitigation:** Use public repos, implement caching, clear error messages

---

### Task 3: RSS Parsing Engine
**Priority:** P0 (Critical)
**Effort:** M
**Type:** Core Feature

**Sub-tasks:**
1. No external dependencies needed
   - Uses native `DOMParser` (built into all browsers)
   - No npm packages required

2. Create native parser using DOMParser
   ```typescript
   // src/utils/rss-parser.ts
   export async function fetchRSS(url: string): Promise<RSSFeed | null> {
     try {
       // Try direct fetch first
       const response = await fetch(url);
       if (!response.ok) throw new Error(`HTTP ${response.status}`);
       const xmlText = await response.text();
       return parseXMLFeed(xmlText);
     } catch (error) {
       // Try CORS proxy services
       try {
         const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
         const response = await fetch(proxyUrl);
         const xmlText = await response.text();
         return parseXMLFeed(xmlText);
       } catch (proxyError) {
         // Try fallback proxy
         const fallbackUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
         const response = await fetch(fallbackUrl);
         const xmlText = await response.text();
         return parseXMLFeed(xmlText);
       }
     }
   }

   function parseXMLFeed(xmlText: string): RSSFeed {
     const parser = new DOMParser();
     const xml = parser.parseFromString(xmlText, 'text/xml');

     // Check for RSS 2.0
     const rssChannel = xml.querySelector('channel');
     if (rssChannel) {
       return parseRSSFeed(xml);
     }

     // Check for Atom
     const atomFeed = xml.querySelector('feed');
     if (atomFeed) {
       return parseAtomFeed(xml);
     }

     throw new Error('Unknown RSS format');
   }

   function parseRSSFeed(xml: Document): RSSFeed {
     const channel = xml.querySelector('channel')!;
     return {
       title: channel.querySelector('title')?.textContent || '',
       link: channel.querySelector('link')?.textContent || '',
       items: Array.from(xml.querySelectorAll('item')).map(item => ({
         guid: item.querySelector('guid')?.textContent || '',
         title: item.querySelector('title')?.textContent || '',
         link: item.querySelector('link')?.textContent || '',
         pubDate: item.querySelector('pubDate')?.textContent || '',
         description: item.querySelector('description')?.textContent || ''
       }))
     };
   }

   function parseAtomFeed(xml: Document): RSSFeed {
     const feed = xml.querySelector('feed')!;
     return {
       title: feed.querySelector('title')?.textContent || '',
       link: feed.querySelector('link')?.getAttribute('href') || '',
       items: Array.from(xml.querySelectorAll('entry')).map(entry => ({
         guid: entry.querySelector('id')?.textContent || '',
         title: entry.querySelector('title')?.textContent || '',
         link: entry.querySelector('link')?.getAttribute('href') || '',
         pubDate: entry.querySelector('updated')?.textContent || '',
         description: entry.querySelector('summary')?.textContent || ''
       }))
     };
   }
   ```

3. Handle CORS (built into fetch attempts)
   - Primary: Direct fetch
   - Fallback 1: `https://corsproxy.io/?{encoded_url}`
   - Fallback 2: `https://api.allorigins.win/raw?url={encoded_url}`

**Acceptance Criteria:**
- ✅ Parses RSS 2.0 and Atom using native DOMParser
- ✅ Returns structured data
- ✅ Handles malformed XML
- ✅ CORS proxy fallbacks functional
- ✅ No Node.js dependencies used

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

3. Commit to GitHub API
   ```typescript
   // src/utils/log-file.ts
   import { createGitHubClient, readFromGitHub, writeToGitHub } from '@/utils/github-api';

   export async function commitReadStatus(
     siteId: string,
     siteName: string,
     items: Array<{ itemId: string; title: string; pubDate: string }>
   ): Promise<boolean> {
     const path = getLogFilePath();

     // Create GitHub client
     const client = createGitHubClient({
       owner: import.meta.env.VITE_GITHUB_OWNER,
       repo: import.meta.env.VITE_GITHUB_REPO,
       branch: import.meta.env.VITE_GITHUB_BRANCH,
       token: import.meta.env.VITE_GITHUB_TOKEN // Required for write
     });

     // Read existing log (returns null if 404)
     const existing = await readFromGitHub<LogData>(client, path);

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

     // Write back to GitHub (with SHA for updates)
     try {
       // Get SHA if file exists for update
       const sha = existing ? await getGitHubFileSha(client, path) : undefined;
       return await writeToGitHub(client, path, logData, `Update ${path}`, sha);
     } catch (error) {
       console.error('Failed to commit to GitHub:', error);
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
- ✅ Commits successfully to GitHub API
- ✅ Prevents duplicate entries
- ✅ Batch commit works for multiple sites
- ✅ Handles commit failures gracefully
- ✅ SHA-based file updates work correctly

**Risks:**
- GitHub API failures (mitigation: retry logic, local backup)
- Token not provided for write (mitigation: clear error message)
- Rate limits (mitigation: batch operations, caching)
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
           label="Auto-commit to GitHub"
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
| **GitHub API rate limits** | Medium | Medium | Implement caching, batch commits, exponential backoff |
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
| **GitHub auth issues** | Medium | Medium | Clear setup instructions, public repo option |

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
- ✅ **Commit Success**: > 98% of GitHub API commits
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
    "zustand": "^4.3.0"
  },
  "development": {
    "vite": "^5.0.0",
    "typescript": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0"
  }
}
```

### External Services
- **GitHub API**: Native REST API v3 (no external service needed)
- **CORS Proxy**: corsproxy.io or allorigins.win (free, for RSS feeds)
- **GitHub**: For config and log storage (public repo)

### Development Environment
- Node.js 18+
- npm or pnpm
- Git
- GitHub account (for data storage)

---

## 📅 Timeline Estimates

### Week 1: Foundation
- **Day 1**: Project setup, GitHub API research
- **Day 2**: GitHub API integration, config structure
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
5. ✅ Research GitHub REST API documentation

### This Week
1. Complete Phase 1 (Foundation)
2. Start Phase 2 (Core RSS functionality)
3. Create initial config file for GitHub
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
- [GitHub REST API v3](https://docs.github.com/en/rest?apiVersion=2022-11-28)
- [DOMParser API](https://developer.mozilla.org/en-US/docs/Web/API/DOMParser)

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
