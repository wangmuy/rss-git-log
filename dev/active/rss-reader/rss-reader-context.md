# RSS Reader - Context & Decisions

**Last Updated:** 2025-12-22
**Document Type:** Context Reference
**Status:** Active - Updated for Browser Compatibility

---

## 🎯 Project Overview

### Core Requirements
- **Type**: Static React SPA (no backend)
- **Purpose**: RSS feed reader with read status tracking
- **Data Source**: Native GitHub REST API v3
- **Storage**: LocalStorage + GitHub commits
- **Key Feature**: Daily log files with layered structure

### Unique Value Proposition
- **Zero Backend**: Pure client-side, no server required
- **Browser-Native**: No Node.js dependencies
- **Git-Powered**: Uses GitHub API for config and persistence
- **Privacy-Focused**: User controls their data
- **Daily Logs**: Automatic daily read history

### Browser Compatibility
- ✅ Works in all modern browsers
- ✅ No Node.js modules required
- ✅ Uses native fetch, DOMParser, atob/btoa
- ✅ Pure client-side implementation

---

## 📋 Key Decisions Made

### Architecture Decisions

#### 1. **State Management: Zustand**
**Decision:** Use Zustand over Context API or Redux
**Rationale:**
- Lightweight (1kb) - perfect for static SPA
- Simple API, no boilerplate
- Good performance
- Easy TypeScript integration
- No provider wrapping needed

**Trade-offs:**
- Less ecosystem than Redux
- Manual persistence (we'll handle this)

**Implementation:**
```typescript
// src/features/rss-reader/store/readerStore.ts
import { create } from 'zustand';

interface ReaderState {
  readStatus: Record<string, Set<string>>;
  // ... other state
}
```

---

#### 2. **RSS Parsing: Native DOMParser**
**Decision:** Use native DOMParser over rss-parser library
**Rationale:**
- rss-parser uses Node.js `stream` module (incompatible with browsers)
- DOMParser is built into all modern browsers
- Handles both RSS 2.0 and Atom formats
- No external dependencies needed
- Lighter bundle size

**Trade-off:**
- Manual parsing vs library convenience
- But maintains full functionality

**Implementation:**
```typescript
const parser = new DOMParser();
const xml = parser.parseFromString(feedXml, 'text/xml');
// Extract items manually
```

---

#### 3. **URL Normalization: Tracking Parameter Removal**
**Decision:** Remove common tracking params from URLs for ID generation
**Rationale:**
- Same article with different UTM params should have same ID
- Prevents duplicate read tracking
- Makes IDs more stable

**Parameters Removed:**
- `utm_source`, `utm_medium`, `utm_campaign`
- `fbclid`, `gclid`
- `ref`, `referer`
- Any other common tracking params

**Implementation:**
```typescript
function removeTrackingParams(url: string): string {
  const urlObj = new URL(url);
  ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid']
    .forEach(p => urlObj.searchParams.delete(p));
  return urlObj.toString();
}
```

---

#### 4. **Item ID Generation: Composite Hash**
**Decision:** Use base64-encoded composite string as item ID
**Rationale:**
- GUID alone might not be unique across feeds
- Link alone might change or be missing
- Title+description might be duplicated
- Composite approach ensures uniqueness

**Formula:**
```
ID = base64(guid + "|" + normalizedLink + "|" + title + "|" + description + "|" + pubDate)
```

**Trade-offs:**
- Longer IDs (32 chars)
- But ensures 100% uniqueness

**Alternative Considered:**
- SHA-256 hash
- Overkill for this use case

---

#### 5. **Log File Structure: Layered by Site**
**Decision:** Daily log files with site-level nesting
**Rationale:**
- Easy to read and understand
- Supports multiple sites per day
- Can aggregate across sites
- Git-friendly (JSON format)

**Structure:**
```json
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

**Alternative Considered:**
- Flat structure with site ID in each item
- More verbose, harder to aggregate

---

#### 6. **GitHub API Integration: Native Browser Implementation**
**Decision:** Use native fetch API to call GitHub REST API directly
**Rationale:**
- Native fetch is built into all modern browsers
- Direct GitHub API gives full control
- No external dependencies = smaller bundle, no compatibility issues
- Works purely client-side
- No Node.js modules needed

**Key Features:**
- **GitHub REST API v3**: Standard HTTP endpoints
- **Read Endpoint**: `GET /repos/{owner}/{repo}/contents/{path}`
- **Write Endpoint**: `PUT /repos/{owner}/{repo}/contents/{path}`
- **Authentication**: GitHub Personal Access Token (optional for public repos)
- **Content Encoding**: Base64 (GitHub requirement)

**Implementation:**
```typescript
// Read file
const response = await fetch(
  `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
  { headers: { 'Authorization': `token ${token}` } }
);
const data = await response.json();
const content = atob(data.content); // Decode base64
const json = JSON.parse(content);

// Write file
const response = await fetch(
  `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
  {
    method: 'PUT',
    headers: { 'Authorization': `token ${token}` },
    body: JSON.stringify({
      message: `Update ${path}`,
      content: btoa(JSON.stringify(data)), // Encode to base64
      branch: 'main',
      sha: existingFileSha // Required for updates
    })
  }
);
```

**Authentication:**
- **Public repos**: No token needed for reading ✅
- **Private repos**: Token required for all operations
- **Write operations**: Token always required
- **Security**: Token stored in environment variables (visible in bundle)

**Rate Limits:**
- Unauthenticated: 60 requests/hour
- Authenticated: 5000 requests/hour
- **Recommendation**: Use public repos, batch operations, implement caching

**Important Limitations:**
- GitHub returns 404 for missing files AND private files without access
- Write operations need SHA for updates (get it from read operation)
- Base64 encoding required for all file content
- Branch must be specified (default: main)

**Browser Compatibility:**
- ✅ fetch() - All modern browsers
- ✅ atob/btoa - All modern browsers
- ✅ Headers API - All modern browsers
- ✅ JSON methods - All modern browsers

---

#### 7. **CORS Handling: Proxy Fallback**
**Decision:** Implement CORS proxy as fallback option
**Rationale:**
- Many RSS feeds don't allow CORS
- Browser security blocks direct fetch
- Proxy allows cross-origin requests

**Options:**
1. Primary: Direct fetch (if CORS enabled)
2. Fallback 1: `https://corsproxy.io/?{encoded_url}`
3. Fallback 2: `https://api.allorigins.win/raw?url={encoded_url}`

**Implementation:**
```typescript
async function fetchRSS(url: string): Promise<RSSFeed> {
  try {
    // Try direct fetch first
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xmlText = await response.text();
    return parseXMLFeed(xmlText);
  } catch (error) {
    // Try proxy services
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    const xmlText = await response.text();
    return parseXMLFeed(xmlText);
  }
}
```

---

#### 8. **Auto-Commit Strategy: Configurable Timer**
**Decision:** Optional auto-commit with configurable interval
**Rationale:**
- Prevents data loss
- Reduces manual work
- User controls frequency
- Respects GitHub API rate limits

**Default:** 300 seconds (5 minutes)
**Options:** Off, 60s, 300s, 900s

**Implementation:**
```typescript
useEffect(() => {
  if (!settings.autoCommit) return;

  const interval = setInterval(() => {
    commitAllReadItems();
  }, settings.commitInterval * 1000);

  return () => clearInterval(interval);
}, [settings.autoCommit, settings.commitInterval]);
```

---

#### 9. **UI Framework: MUI v7**
**Decision:** Use Material-UI v7 components
**Rationale:**
- Already in project guidelines
- Rich component library
- Responsive by default
- Professional appearance
- Good TypeScript support

**Components to Use:**
- Container, Paper, Card
- Accordion (for collapsible sites)
- Switch, Button, Chip
- LinearProgress, Alert
- Theme provider

**Alternative Considered:**
- Tailwind CSS
- More customization but more setup

---

#### 10. **Read Status Storage: Hybrid Approach**
**Decision:** LocalStorage for session + GitHub API for persistence
**Rationale:**
- LocalStorage: Fast, offline-capable
- GitHub API: Permanent, shareable across devices
- Hybrid: Best of both worlds

**Flow:**
1. Read status → LocalStorage (immediate)
2. User triggers commit → GitHub API (persistent)
3. On load → Merge LocalStorage + GitHub logs

**Implementation:**
```typescript
// On app load
const localStatus = loadFromLocalStorage();
const remoteStatus = await loadFromGitHubLogs();
const merged = mergeStatuses(localStatus, remoteStatus);
```

---

## 🔗 Dependencies & Integrations

### External Dependencies

#### Core Libraries
| Library | Version | Purpose | Size |
|---------|---------|---------|------|
| react | ^18.2.0 | UI framework | 42kb |
| react-dom | ^18.2.0 | DOM renderer | 30kb |
| @mui/material | ^7.0.0 | Component library | ~200kb |
| zustand | ^4.3.0 | State management | 1kb |
| **Total** | - | **Browser-native only** | **~273kb** |

#### Removed Dependencies (Node.js incompatible)
| Library | Reason Removed |
|---------|----------------|
| gitrows (removed) | Uses `csv-parse`, `stream`, `Buffer` - Node.js only |
| rss-parser | Uses `stream` module - Node.js only |
| csv-parse | Node.js only |

#### Development Dependencies
| Library | Version | Purpose |
|---------|---------|---------|
| vite | ^5.0.0 | Build tool |
| typescript | ^5.0.0 | Type checking |
| @vitejs/plugin-react | ^4.0.0 | Vite React plugin |
| vitest | ^1.0.0 | Testing |
| @testing-library/react | ^14.0.0 | Component testing |

### External Services

#### 1. GitHub API
**URL:** `https://api.github.com`
**Purpose:** Read/write files to GitHub repos via REST API
**Authentication:**
- Read public repos: No auth needed ✅
- Write operations: Requires GitHub personal access token
- **Security**: Token stored in environment variables

**Rate Limits:**
- Unauthenticated: 60 requests/hour
- Authenticated: 5000 requests/hour
- **Recommendation**: Use public repos for reads, batch operations

**Cost:** Free (uses your GitHub account)

**Setup Required:**
```bash
# 1. Create GitHub repo (public recommended)
# 2. Add config file: rss-config.json
# 3. Set environment variables
# 4. Optional: Create .gitignore for log files
```

**Important Limitations:**
- GitHub returns 404 for missing files AND private files without access
- Write operations need SHA for updates
- Base64 encoding required for all content
- Branch must be specified

**API Endpoints Used:**
- Read: `GET /repos/{owner}/{repo}/contents/{path}`
- Write: `PUT /repos/{owner}/{repo}/contents/{path}`

#### 2. CORS Proxy (for RSS feeds)
**Primary:** `https://corsproxy.io/`
**Fallback:** `https://api.allorigins.win/`
**Purpose:** Bypass CORS restrictions on RSS feeds
**Cost:** Free
**Limitations:** May have rate limits

**Usage:**
```typescript
const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(rssUrl)}`;
```

#### 3. GitHub (Repository)
**Purpose:** Host config and log files
**Account:** Required (free tier sufficient)
**Repository:** Public or private
**Branch:** main (configurable)

---

## 📁 File Structure

### Project Structure
```
rss-reader/
├── src/
│   ├── components/
│   │   ├── common/          # Reusable UI components
│   │   └── layout/          # Layout components
│   ├── features/
│   │   └── rss-reader/
│   │       ├── components/  # Reader-specific components
│   │       ├── hooks/       # Custom hooks
│   │       ├── store/       # Zustand stores
│   │       └── types/       # TypeScript types
│   ├── hooks/               # Global custom hooks
│   ├── utils/               # Utility functions
│   │   ├── github-api.ts    # GitHub API (native)
│   │   ├── rss-parser.ts    # RSS parsing (DOMParser)
│   │   ├── item-id.ts       # ID generation
│   │   ├── log-file.ts      # Log management
│   │   └── url.ts           # URL utilities
│   ├── types/               # Global TypeScript types
│   ├── styles/              # Global styles, theme
│   └── App.tsx              # Main app
├── public/
│   └── config.example.json  # Example config
├── dev/                     # Documentation
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### Key Files to Create

#### 1. Type Definitions
```typescript
// src/types/rss.ts
export interface RSSItem {
  guid: string;
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

export interface RSSFeed {
  title: string;
  link: string;
  items: RSSItem[];
}

export interface RSSConfig {
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

export interface LogData {
  metadata: {
    date: string;
    generatedAt: string;
  };
  sites: Record<string, {
    name: string;
    readItems: Array<{
      itemId: string;
      title: string;
      pubDate: string;
      readAt: string;
    }>;
  }>;
}
```

#### 2. GitHub API Configuration
```typescript
// src/utils/github-api.ts
export function getEnvConfig(): GitHubConfig {
  return {
    owner: import.meta.env.VITE_GITHUB_OWNER,
    repo: import.meta.env.VITE_GITHUB_REPO,
    branch: import.meta.env.VITE_GITHUB_BRANCH,
    token: import.meta.env.VITE_GITHUB_TOKEN
  };
}

export function createGitHubClient(config: GitHubConfig): GitHubClient {
  return {
    config,
    baseUrl: `https://api.github.com/repos/${config.owner}/${config.repo}`
  };
}
```

#### 3. Environment Variables
```env
# .env
VITE_GITHUB_OWNER=your-username
VITE_GITHUB_REPO=rss-reader-data
VITE_GITHUB_BRANCH=main
VITE_GITHUB_TOKEN=ghp_xxxxxxxx  # optional, for private repos
```

---

## 🔄 Data Flow Diagrams

### 1. Application Startup
```
┌─────────────────────────────────────────┐
│ App Loads                               │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Load Config from GitHub API             │
│ (rss-config.json)                       │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Load LocalStorage Session               │
│ (read status cache)                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Load Daily Log from GitHub API          │
│ (logs/2025-12-21.json)                  │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Merge All Data Sources                  │
│ (Local + Remote + Config)               │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Display UI                              │
└─────────────────────────────────────────┘
```

### 2. Reading Flow
```
┌─────────────────────────────────────────┐
│ User Clicks Item                        │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Generate Item ID                        │
│ (hash of composite fields)              │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Update LocalStorage                     │
│ (immediate feedback)                    │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Update UI (mark as read)                │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ [If Auto-Commit]                        │
│ Queue for GitHub API Commit             │
└─────────────────────────────────────────┘
```

### 3. Commit Flow
```
┌─────────────────────────────────────────┐
│ Trigger Commit                          │
│ (Timer / Manual / Page Close)           │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Get All Read Items from Session         │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Read Existing Log from GitHub API       │
│ (if exists)                             │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Merge New Items with Existing           │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Commit to GitHub API                    │
│ (PUT /repos/{owner}/{repo}/contents/{path})
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Handle Response                         │
│ - Success: Show confirmation            │
│ - Error: Retry / Save locally           │
└─────────────────────────────────────────┘
```

---

## 🔐 Security Considerations

### 1. GitHub Token Storage
**Issue:** Token in client-side code is visible
**Solutions:**
- Use public repo (no token needed)
- Environment variables (still visible in bundle)
- Accept that GitHub API is public
- **Recommendation:** Use public repo for config, no sensitive data

### 2. Data Privacy
**Issue:** Read history stored in public GitHub
**Solutions:**
- Use private repo (requires token)
- Encrypt data before commit (complex)
- Accept public visibility
- **Recommendation:** Clear disclosure to users

### 3. XSS Prevention
**Issue:** RSS content may contain malicious HTML
**Solutions:**
- Sanitize all HTML from RSS feeds
- Use DOMPurify library
- Render as text, not HTML
- **Implementation:**
```typescript
import DOMPurify from 'dompurify';
const cleanDescription = DOMPurify.sanitize(item.description);
```

### 4. Rate Limiting
**Issue:** GitHub API limits
**Solutions:**
- Cache responses
- Batch commits
- Exponential backoff
- User-configurable commit interval
- **Limits:** 60 requests/hour (unauthenticated)

---

## 🧪 Testing Strategy

### Unit Tests (Priority: High)
- ✅ ID generation (consistency, uniqueness)
- ✅ URL normalization (tracking param removal)
- ✅ Log file path generation
- ✅ RSS parsing (mock data)
- ✅ GitHub API (mock responses)

### Integration Tests (Priority: Medium)
- ✅ Full read flow (click → track → display)
- ✅ Config loading → Feed fetching → Display
- ✅ Commit flow (session → GitHub API)
- ✅ Settings persistence

### Component Tests (Priority: Medium)
- ✅ FeedItem (render, click, read state)
- ✅ FeedList (collapsible, counts)
- ✅ SettingsPanel (toggles, persistence)
- ✅ ErrorDisplay (error messages)

### E2E Tests (Priority: Low)
- ✅ User reads multiple items
- ✅ User changes settings
- ✅ User commits manually
- ✅ App loads with existing data

---

## 📊 Performance Considerations

### 1. Initial Load Time
**Target:** < 2 seconds
**Optimizations:**
- Code splitting with React.lazy
- Vite tree shaking
- Minimal dependencies
- CDN for common libraries

### 2. Feed Fetching
**Target:** < 500ms per feed
**Optimizations:**
- Parallel fetching (Promise.all)
- Cache feed data (5 min TTL)
- Debounce refresh button

### 3. Rendering Large Lists
**Target:** Smooth scroll with 100+ items
**Optimizations:**
- Virtual scrolling (react-window)
- React.memo on items
- Windowed rendering
- Pagination or "Load More"

### 4. Memory Usage
**Target:** < 50MB total
**Optimizations:**
- Clear old session data
- Limit stored feeds
- Efficient data structures (Sets, Maps)
- Dispose of unused state

---

## 🚀 Deployment Considerations

### Build Configuration
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'es2018',
    minify: 'terser',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'zustand'],
          mui: ['@mui/material', '@emotion/react', '@emotion/styled'],
          rss: ['rss-parser']
        }
      }
    }
  }
});
```

### Hosting Options
1. **Vercel** (Recommended)
   - Automatic deployments
   - Edge caching
   - Free tier sufficient

2. **Netlify**
   - Similar to Vercel
   - Good for static sites

3. **GitHub Pages**
   - Completely free
   - Manual deployment
   - Simple setup

4. **Cloudflare Pages**
   - Fast CDN
   - Free tier
   - Good performance

### Environment Variables
```bash
# Production
VITE_GITHUB_OWNER=your-username
VITE_GITHUB_REPO=rss-reader-data
VITE_GITHUB_BRANCH=main
# VITE_GITHUB_TOKEN=ghp_xxxxxxxx  # Only if using private repo
```

---

## 📝 Common Issues & Solutions

### Issue 1: CORS Errors
**Symptom:** "Failed to fetch" from RSS feeds
**Solution:** Use CORS proxy or browser extension
**Code:**
```typescript
const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(feedUrl)}`;
```

### Issue 2: GitHub Authentication
**Symptom:** 401/403 errors on commit
**Solution:** Check GitHub token or use public repo
**Verification:**
```bash
curl -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/user
```

### Issue 3: RSS Parsing Failures
**Symptom:** Empty feeds or parsing errors
**Solution:** Validate XML, check feed format
**Debug:**
```typescript
console.log('Raw XML:', await fetch(feedUrl).then(r => r.text()));
```

### Issue 4: Duplicate Items
**Symptom:** Same article appears multiple times
**Solution:** Verify ID generation logic
**Check:**
```typescript
console.log(generateItemId(guid, link, title, desc, pubDate));
```

### Issue 5: Rate Limits
**Symptom:** 429 errors from GitHub API
**Solution:** Implement backoff, reduce commit frequency
**Implementation:**
```typescript
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
await delay(1000 * (retryCount + 1));
```

---

## 🎯 Success Criteria

### MVP Checklist
- [ ] Can load config from GitHub API
- [ ] Can fetch and parse RSS feeds
- [ ] Can display feed items
- [ ] Can mark items as read
- [ ] Read status persists in session
- [ ] Can commit to daily log file
- [ ] Settings toggle works
- [ ] Error handling works

### Beta Checklist
- [ ] All MVP features stable
- [ ] 80% test coverage
- [ ] Mobile responsive
- [ ] Performance targets met
- [ ] Documentation complete
- [ ] User testing passed

### Production Checklist
- [ ] All beta features
- [ ] CI/CD pipeline
- [ ] Error monitoring
- [ ] User analytics (optional)
- [ ] Deployment guide
- [ ] Support documentation

---

## 📚 Additional Resources

### Code Examples
- [Complete component examples](./rss-reader-plan.md#task-6)
- [Utility functions](./rss-reader-plan.md#task-4)
- [Store implementations](./rss-reader-plan.md#task-4)

### Documentation
- [React patterns](../react-guide.md)
- [MUI v7 guide](https://mui.com/material-ui/)
- [Zustand examples](https://zustand-demo.pmnd.rs/)

### Tools
- [GitHub REST API docs](https://docs.github.com/en/rest?apiVersion=2022-11-28)
- [DOMParser API docs](https://developer.mozilla.org/en-US/docs/Web/API/DOMParser)
- [Vite config guide](https://vitejs.dev/config/)

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-21 | Initial plan creation |
| 2.0 | 2025-12-24 | **MAJOR UPDATE**: Project restructure and feature completion |

---

## 📊 CURRENT STATUS (2025-12-24)

### ✅ COMPLETED FEATURES
- **Browser-only storage**: Removed .env files, all config in localStorage
- **Flattened structure**: Moved from `src/features/rss-reader/*` to `src/*`
- **Sidebar layout**: Left panel (site list) + right panel (content)
- **Subscription management**: Add/edit/delete RSS feeds via UI
- **GitHub sync**: Save RSS config changes back to GitHub
- **DateTime sorting**: RSS items sorted newest first
- **Site selection**: Click sidebar to switch between feeds

### 🏗️ ARCHITECTURE CHANGES
```
OLD: src/features/rss-reader/{components,hooks,store,types}/
NEW: src/{components,hooks,store,types}/
```

### 🎨 UI IMPROVEMENTS
- **SidebarFeedLayout**: Replaced accordion with two-panel layout
- **SubscriptionManager**: Full CRUD for RSS feeds
- **SetupPage**: No longer mentions .env files
- **Visual feedback**: Selected site highlighted with colored border

### 🔧 TECHNICAL UPDATES
- **GitHub API**: Added `saveRSSConfig()` function
- **State management**: Local config state for subscription changes
- **Auto-refresh**: Feeds reload after config updates
- **Error handling**: Better validation for placeholder values

---

**Document Status:** Active - Fully Updated
**Next Update:** As needed for new features
**Owner:** RSS Reader Development Team
