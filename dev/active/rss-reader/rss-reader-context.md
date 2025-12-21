# RSS Reader - Context & Decisions

**Last Updated:** 2025-12-21
**Document Type:** Context Reference
**Status:** Active

---

## 🎯 Project Overview

### Core Requirements
- **Type**: Static React SPA (no backend)
- **Purpose**: RSS feed reader with read status tracking
- **Data Source**: GitRows (GitHub-based storage)
- **Storage**: LocalStorage + GitRows commits
- **Key Feature**: Daily log files with layered structure

### Unique Value Proposition
- **Zero Backend**: Pure client-side, no server required
- **Git-Powered**: Uses GitRows for config and persistence
- **Privacy-Focused**: User controls their data
- **Daily Logs**: Automatic daily read history

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

#### 2. **RSS Parsing: rss-parser Library**
**Decision:** Use rss-parser over manual XML parsing
**Rationale:**
- Handles multiple formats (RSS 2.0, Atom, etc.)
- Normalizes data structure
- Well-maintained (1M+ weekly downloads)
- TypeScript support available

**Alternative Considered:**
- Manual XML parsing with DOMParser
- Lighter but more error-prone

**Implementation:**
```typescript
import Parser from 'rss-parser';
const parser = new Parser({ /* config */ });
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

#### 6. **GitRows Integration: NPM Module Approach**
**Decision:** Use GitRows NPM module instead of direct API calls
**Rationale:**
- Official library with full CRUD support
- Handles path parsing and endpoint construction
- Supports JSON, CSV, YAML formats
- Built-in validation and error handling
- Works in both Node.js and browser environments

**Key Features:**
- **Path Format**: `@namespace/owner/repository:branch/directory/file.json`
  - Namespace: `github` (default) or `gitlab`
  - Branch: `HEAD` (default) or custom branch
  - File extension: `.json`, `.csv`, `.yaml`
- **Methods**: `get()`, `put()`, `update()`, `replace()`, `delete()`, `create()`, `drop()`
- **Modes**: `fetch` (raw, slower but reliable) or `pull` (API, faster)

**Authentication:**
- **Reading public repos**: No authentication needed ✅
- **Writing to repos**: Requires `username` and `token` (GitHub personal access token)
- **Security Warning**: Never expose tokens in client-side production code

**Rate Limits & Performance:**
- `fetch` mode: Uses raw GitHub endpoints, may have 2-3 second caching latency
- `pull` mode: Uses GitHub API directly, faster but may hit rate limits
- Recommendation: Use `fetch` mode for reliability in client-side apps

**Important Limitations:**
- GitHub returns 404 for both missing files AND private files without access
- Write operations require authentication token
- Update/delete operations need an `id` property or filter object
- CSV support has limited delimiter configuration

**Implementation:**
```typescript
import gitrows from 'gitrows';

const git = gitrows({
  path: '@github/username/repo:main/data',
  token: process.env.VITE_GITHUB_TOKEN // optional
});

// Read config
const config = await git.get('rss-config.json');

// Write log
await git.put('logs/2025-12-21.json', logData);
```

**Configuration Needed:**
- GitHub owner/repo
- Branch (default: main)
- Optional: GitHub token for write operations
- Path namespace (github/gitlab)

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
    return await tryDirectFetch(url);
  } catch (corsError) {
    return await tryProxyFetch(url);
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
- Respects GitRows rate limits

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
**Decision:** LocalStorage for session + GitRows for persistence
**Rationale:**
- LocalStorage: Fast, offline-capable
- GitRows: Permanent, shareable across devices
- Hybrid: Best of both worlds

**Flow:**
1. Read status → LocalStorage (immediate)
2. User triggers commit → GitRows (persistent)
3. On load → Merge LocalStorage + GitRows

**Implementation:**
```typescript
// On app load
const localStatus = loadFromLocalStorage();
const remoteStatus = await loadFromGitRows();
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
| rss-parser | ^3.13.0 | RSS parsing | ~50kb |
| gitrows | ^0.5.0 | GitHub file operations | ~30kb |

#### Development Dependencies
| Library | Version | Purpose |
|---------|---------|---------|
| vite | ^5.0.0 | Build tool |
| typescript | ^5.0.0 | Type checking |
| @vitejs/plugin-react | ^4.0.0 | Vite React plugin |
| vitest | ^1.0.0 | Testing |
| @testing-library/react | ^14.0.0 | Component testing |

### External Services

#### 1. GitRows
**URL:** `https://gitrows.com` | `https://github.com/gitrows/gitrows`
**NPM:** `npm install gitrows`
**Purpose:** Read/write files to GitHub/GitLab repos via NPM module
**Authentication:**
- Read public repos: No auth needed ✅
- Write operations: Requires GitHub personal access token
- **Security**: Never expose tokens in client-side production code

**Rate Limit & Performance:**
- `fetch` mode: Uses raw GitHub endpoints, 2-3s caching latency (recommended for client-side)
- `pull` mode: Uses GitHub API directly, faster but may hit rate limits
- GitHub API limits: 60 requests/hour (unauthenticated), 5000/hour (authenticated)

**Cost:** Free (uses your GitHub account)

**Setup Required:**
```bash
# 1. Create GitHub repo (public recommended for client-side)
# 2. Install: npm install gitrows
# 3. Add config file: rss-config.json
# 4. Optional: Create .gitignore for log files
```

**Important Limitations:**
- GitHub returns 404 for both missing files AND private files without access
- Write operations need `username` and `token`
- Update/delete require `id` property or filter object
- Path format: `@github/owner/repo:branch/path/file.json`

#### 2. CORS Proxy (if needed)
**Primary:** `https://corsproxy.io/`
**Fallback:** `https://api.allorigins.win/`
**Purpose:** Bypass CORS restrictions
**Cost:** Free
**Limitations:** May have rate limits

**Usage:**
```typescript
const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(rssUrl)}`;
```

#### 3. GitHub
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
│   │   ├── gitrows.ts       # GitRows API
│   │   ├── rss-parser.ts    # RSS parsing
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

#### 2. GitRows Configuration
```typescript
// src/config/gitrows.ts
export const GITROWS_CONFIG = {
  owner: import.meta.env.VITE_GITHUB_OWNER || 'your-username',
  repo: import.meta.env.VITE_GITHUB_REPO || 'rss-reader-data',
  branch: import.meta.env.VITE_GITHUB_BRANCH || 'main',
  token: import.meta.env.VITE_GITHUB_TOKEN // optional
};
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
│ Load Config from GitRows                │
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
│ Load Daily Log from GitRows             │
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
│ Queue for GitRows Commit                │
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
│ Read Existing Log from GitRows          │
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
│ Commit to GitRows                       │
│ (POST to /repos/{owner}/{repo}/path)    │
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
- Accept that GitRows API is public
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
**Issue:** GitRows + GitHub API limits
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
- ✅ GitRows API (mock responses)

### Integration Tests (Priority: Medium)
- ✅ Full read flow (click → track → display)
- ✅ Config loading → Feed fetching → Display
- ✅ Commit flow (session → GitRows)
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

### Issue 2: GitRows Authentication
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
**Symptom:** 429 errors from GitRows/GitHub
**Solution:** Implement backoff, reduce commit frequency
**Implementation:**
```typescript
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
await delay(1000 * (retryCount + 1));
```

---

## 🎯 Success Criteria

### MVP Checklist
- [ ] Can load config from GitRows
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
- [GitRows API docs](https://gitrows.com/)
- [RSS parser docs](https://www.npmjs.com/package/rss-parser)
- [Vite config guide](https://vitejs.dev/config/)

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-21 | Initial plan creation |
| - | - | - |

---

**Document Status:** Active
**Next Update:** After implementation begins
**Owner:** [To be assigned]
