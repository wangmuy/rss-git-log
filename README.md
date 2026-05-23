# RSS Reader - GitHub Powered

A lean React Single Page Application (SPA) for reading RSS feeds with automatic read status tracking and site-based log persistence via GitHub API.

## ✨ Features

- **Zero Backend**: Pure client-side React application
- **GitHub API Integration**: Config and logs stored in GitHub repositories
- **Read Tracking**: Automatic tracking of read items per session
- **Site-Based Logs**: Organized logs by site with 200-item chunking (`logs/{siteId}/YYYY-MM-DD.json`)
- **Runtime Config UI**: No `.env` files - configure GitHub repo, CORS policy, and settings via in-app Config page
- **CORS Policy Control**: Choose direct-only, proxy-fallback, or proxy-only RSS fetching
- **Write Capability Check**: Token validation after setup - commit UI only shown when write access is confirmed
- **Local Cache**: Bounded per-site log cache (default: 1 file per site)
- **Subscription Management**: Add, edit, delete RSS feeds via UI
- **Clean UI**: Minimal, focused reading experience with sidebar layout
- **Configurable**: User settings for display and auto-commit (disabled by default)
- **MUI v7**: Modern Material Design components
- **Browser Native**: No Node.js dependencies, uses native fetch/DOMParser
- **GitHub Action**: Scheduled feed fetching — keep logs up to date without opening the app
- **GitHub Pages**: Deploy as a static site via `npm run deploy`
- **Vim Navigation**: `j`/`k` keys to move between feed items, auto-mark-as-read on selection
- **PGlite Search**: PostgreSQL WASM-backed full-text search with `~*` case-insensitive regex
- **Two Storage Providers**: Choose between localStorage (fast, compressed) and PGlite (scalable, searchable)

## 🚀 Quick Start

### Prerequisites

1. **Node.js 18+** installed
   - Check: `node --version`
   - Download: https://nodejs.org/

2. **GitHub Account**
   - Sign up: https://github.com/join

3. **Git** installed (optional, for uploading config)
   - Check: `git --version`

### Step-by-Step Setup

#### Step 1: Install Dependencies

In the project directory, run:

```bash
npm install
```

This will install:
- React 18
- MUI v7 (Material Design)
- Zustand (state management)
- Browser-native RSS parsing (DOMParser)
- Browser-native GitHub API integration (fetch)

#### Step 2: Create GitHub Repository

1. **Fork this repository** (or create a new one) — the repo hosts both the SPA code and the RSS data:
   - The default branch (`main`) contains the code, workflow, and scripts
   - Create a bare **`rss-reader-data`** branch for config and logs:
     ```bash
     git checkout --orphan rss-reader-data
     git rm -rf .
     ```
   - Add your `rss-config.json` to this branch (see Step 3), commit, and push:
     ```bash
     git push origin rss-reader-data
     ```

2. Note your repository details:
   - Owner: `your-username`
   - Repo: `rss-reader-data` (or your fork's name)

#### Step 3: Create Config File

1. Copy the example config to your repository:

```bash
cp public/rss-config.example.json /tmp/rss-config.json
```

2. Edit with your favorite RSS feeds:

```json
{
  "sites": [
    {
      "name": "Hacker News",
      "url": "https://news.ycombinator.com/rss",
      "color": "#ff6600"
    },
    {
      "name": "TechCrunch",
      "url": "https://techcrunch.com/feed/",
      "color": "#00a562"
    }
  ],
  "settings": {
    "showReadItems": false,
    "autoCommit": false,
    "commitInterval": 300
  }
}
```

3. Upload to GitHub:

```bash
# Option A: Using GitHub Web UI
# Go to your repo → Add file → Upload files → Upload rss-config.json

# Option B: Using Git CLI
git clone https://github.com/your-username/rss-reader-data.git
cd rss-reader-data
cp /tmp/rss-config.json .
git add rss-config.json
git commit -m "Add RSS configuration"
git push
```

#### Step 4: Start Development Server

```bash
npm run dev
```

Open your browser to: `http://localhost:3000`

#### Step 5: Configure via Config Page

On first launch, the app will open the **Config Page** (no `.env` files needed!):

1. **GitHub Storage**:
   - Owner: `your-username`
   - Repo: `rss-reader-data`
   - Branch: `main` (reads and writes use the same branch)
   - Token: Only needed for private repos or write operations

2. **CORS Policy** (for RSS feeds):
   - **Direct Only**: Only use direct fetch (fastest, but may fail due to CORS)
   - **Proxy Fallback** (default): Try direct first, then try proxies
   - **Proxy Only**: Always use proxy (most reliable for CORS-blocked feeds)
   - Configure proxy order and custom proxy templates
   - Set per-attempt timeout (default: 10000ms)

3. **Auto-Commit**: Disabled by default
   - Enable only when write capability is confirmed
   - Interval: 300 seconds (5 minutes) default

4. **Local Cache**: 1 log file per site (default)
   - Adjust to keep more history in localStorage

> **Write Capability Check**: After saving a token, the app automatically checks if it can write to your repo. The manual commit button and auto-commit are only enabled when write access is confirmed.

#### Step 6: Verify Setup

You should see:
1. ✅ Sidebar with site list (left panel)
2. ✅ Content area with feed items (right panel)
3. ✅ Unread count badges on sites
4. ✅ Config page accessible from header

If you see errors:
- Check browser console (F12)
- Verify `rss-config.json` is in your GitHub repo
- Check repo is public (or token is valid)
- Use the Config page to re-check settings

## 📋 Configuration

### RSS Config File (`rss-config.json`)

Stored in your GitHub repository root. See `public/rss-config.example.json` for the full schema.

### Runtime App Config (Config Page)

The app uses a versioned `AppConfig` stored in localStorage:

```typescript
{
  version: 1,
  github: {
    owner: "your-username",
    repo: "rss-reader-data",
    branch: "rss-reader-data",  // Same branch for reads AND writes
    token: "ghp_xxx"        // Optional, for write operations
  },
  githubWriteCapability: {
    canWrite: true,
    checkedAt: "2025-12-24T10:00:00Z",
    reason: undefined
  },
  corsPolicy: {
    mode: "proxy-fallback",  // "direct-only" | "proxy-fallback" | "proxy-only"
    proxies: [
      { name: "CORS Proxy", urlTemplate: "https://corsproxy.io/?{url}" },
      { name: "All Origins", urlTemplate: "https://api.allorigins.win/raw?url={url}" }
    ],
    timeoutMs: 10000
  },
  autoCommit: {
    enabled: false,          // Default: false (requires write capability)
    intervalSeconds: 300       // 5 minutes
  },
  localCache: {
    filesPerSite: 1            // Default: keep 1 log file per site in localStorage
  }
}
```

### Settings Explained

**Display:**
- **showReadItems**: Display already-read items (default: false)

**CORS Policy:**
- **mode**: How to fetch RSS feeds
  - `direct-only`: Direct fetch only (fastest, may fail due to CORS)
  - `proxy-fallback`: Direct first, then try proxies (default)
  - `proxy-only`: Always use proxy (most reliable for CORS-blocked feeds)
- **proxies**: Ordered list of proxy templates with `{url}` placeholder
- **timeoutMs**: Per-attempt timeout for both direct and proxy fetches

**Auto-Commit:**
- **enabled**: Automatically commit to GitHub (default: false, requires write capability)
- **intervalSeconds**: Seconds between auto-commits (default: 300 = 5 minutes)

**Local Cache:**
- **filesPerSite**: Number of log files cached per site in localStorage (default: 1, set to 0 to disable)

## 🏗️ Architecture

### Data Flow

```
Browser (React SPA)
    ↓
Runtime Config (localStorage)
    ↓
Native fetch() API
    ↓
GitHub REST API v3 (same branch for reads & writes)
    ↓
Config File (rss-config.json)
    ↓
RSS Feed URLs
    ↓
DOMParser (XML)
    ↓
Display UI (Sidebar Layout)
    ↓
LocalStorage (session + cache)
    ↓
Commit to logs/{siteId}/YYYY-MM-DD.json
```

### Storage Layers

1. **Session State**: Browser localStorage (immediate, fast)
2. **Persistent Logs**: GitHub API (permanent, shareable)
3. **Runtime Config**: localStorage (GitHub credentials, CORS policy, settings)

### Unique Identifiers

Items are identified by a composite hash:
```
ID = base64(guid | normalizedLink | title | description | pubDate)
```

This ensures:
- Same article from different sources = different IDs
- Same article with different tracking params = same ID
- Stable identification across sessions

### Log File Structure

```
logs/
├── news.ycombinator.com/
│   ├── 2025-12-20.json  # ≤200 items, oldest from Dec 20
│   └── 2025-12-22.json  # Next 200 items
├── techcrunch.com/
│   └── 2025-12-19.json  # ≤200 items, oldest from Dec 19
```

Features:
- Max 200 items per file (prevents large files)
- Filename based on oldest item date
- Site-isolated for better organization
- Automatic chunking when limit reached
- Same branch used for reads and writes

## 📁 Project Structure

```
src/
├── components/           # All UI components
│   ├── ConfigPage.tsx         # Runtime configuration UI
│   ├── SidebarFeedLayout.tsx   # Main two-panel layout
│   ├── SubscriptionManager.tsx # RSS feed CRUD
│   ├── FeedItem.tsx           # Individual RSS item
│   ├── Header.tsx             # App header
│   └── SettingsPanel.tsx      # Reader settings
├── hooks/                # Custom React hooks
│   ├── useConfig.ts           # Config loading/management
│   ├── useRSSFeeds.ts         # RSS feed fetching
│   └── useCommit.ts           # GitHub commit logic
├── store/                # Zustand state management
│   └── readerStore.ts         # Read status, feeds, settings
├── stores/               # Item store implementations
│   ├── pglite-store.ts        # PGlite (PostgreSQL WASM, IndexedDB)
│   ├── localstorage-store.ts  # LocalStorage (lz-string compressed)
│   ├── item-store.ts          # ItemStore interface
│   └── use-item-store.ts      # Singleton factory
├── types/                # TypeScript definitions
│   ├── config.ts              # AppConfig, GitHubConfig, CORSPolicy
│   ├── rss.ts                 # RSSItem, RSSFeed
│   └── log.ts                 # LogData interfaces
├── utils/                # Utility functions
│   ├── app-config.ts          # Runtime config localStorage management
│   ├── github-api.ts          # GitHub API (native fetch)
│   ├── feed-parser.ts         # Shared RSS/Atom parser (browser + Node.js)
│   ├── rss-parser.ts          # RSS fetching (browser wrapper)
│   ├── item-id.ts             # ID generation
│   ├── log-file.ts            # Log management
│   ├── log-cache.ts           # localStorage cache eviction
│   └── url.ts                # URL utilities
├── stubs/                # Vite build stubs for PGlite (fs, path, browser-external)
├── scripts/              # Node.js scripts
│   └── fetch-feeds.ts        # GitHub Action feed fetcher
├── workers/              # Web Workers
│   ├── fetch.worker.ts       # GitHub log file fetcher
│   └── mark-all-read.worker.ts # Batch mark-as-read
└── App.tsx               # Main application
```

## 🔧 Commands

```bash
# Development
npm run dev

# Production Build
npm run build

# Preview Production
npm run preview

# Type Check
npm run build  # includes TypeScript check

# Test
npm run test

# Deploy to GitHub Pages (uses current repo from package.json)
npm run deploy

# Deploy with custom repo and/or subfolder
npm run deploy:custom -- -r owner/repo
npm run deploy:custom -- -s subfolder
npm run deploy:custom -- -r owner/repo -s subfolder

# Run feed fetcher locally (requires env vars)
GH_TOKEN=ghp_xxx TARGET_OWNER=you TARGET_REPO=rss-data TARGET_BRANCH=rss-reader-data npm run fetch-feeds
```

## 🚀 Deploy to GitHub Pages

### Quick Deploy

Deploy the app to GitHub Pages using the `gh-pages` package:

```bash
npm run deploy
```

This deploys to the current repository's GitHub Pages (detected from `package.json` repository field).

### Deploy to Custom Repository

```bash
# Deploy to a different repository
npm run deploy:custom -- -r owner/repo-name

# Deploy to a subfolder (e.g., yoursite.com/repo-name/myapp)
npm run deploy:custom -- -r owner/repo-name -s myapp

# Deploy to subfolder only (uses current repo)
npm run deploy:custom -- -s myapp
```

### How It Works

1. The `deploy.mjs` script sets the `VITE_BASE` environment variable to the subfolder path
2. Vite builds with the correct base path for routing
3. `gh-pages` publishes the `dist/` folder to the `gh-pages` branch
4. GitHub Pages serves the app at `https://<owner>.github.io/<repo>/`

### Notes

- The app uses client-side routing - the `public/_redirects` file ensures proper handling
- For subfolder deployment, all assets load from the subfolder path
- Token and config are stored in localStorage, so they persist after redeployment

## 🔒 Security Considerations

### ⚠️ Important Warnings

1. **No `.env` Files**: All configuration is done via the runtime Config Page and stored in localStorage.

2. **GitHub Token Storage**: Tokens are stored in browser localStorage.
   - For public repos, no token is needed for reading.
   - For write operations, tokens are visible in the client bundle.
   - Use least-privilege tokens with only the necessary repo scope.

3. **Public Repositories**: All data in public repos is visible to everyone.
   - Don't include personal information in feeds.
   - Consider this a public reading log.

4. **Write Capability Gating**: The app checks token write access after setup.
   - Manual commit button only shown when write is confirmed.
   - Auto-commit disabled when write capability is invalid.
   - Config page shows write capability status and errors.

5. **Rate Limits**:
   - Unauthenticated: 60 requests/hour
   - Authenticated: 5000 requests/hour
   - App uses native fetch (slower but more reliable)

6. **CORS Proxies**: When using proxy-fallback or proxy-only mode:
   - Public proxies have varying reliability and privacy policies.
   - Config page allows disabling third-party proxies.
   - Users can add custom proxy templates.

## 🐛 Troubleshooting

### "Config file not found"
- Ensure `rss-config.json` exists in your GitHub repo
- Check GitHub config in Config page (owner, repo, branch)
- Verify repo is public (or token is valid)
- Wait 30 seconds (GitHub cache)
- Re-run write capability check from Config page

### "Failed to fetch RSS feeds"
- Some feeds block CORS - check CORS policy setting
- Check feed URLs are valid
- Try "proxy-only" mode for problematic feeds
- Check browser console for specific errors
- Adjust timeout in Config page if feeds are slow

### "CORS errors"
Normal when using direct-only mode. The app supports:
1. **Direct fetch** (if CORS enabled)
2. **Proxy Fallback** (default): corsproxy.io → allorigins.win
3. **Proxy Only**: Always use configured proxies

### "Cannot write to GitHub"
- Check write capability status in Config page
- Verify token has `repo` scope
- Ensure token isn't expired
- Check branch exists and token can push to it
- Try re-saving config to re-check capability

### "Write capability check failed"
- Token may be invalid or expired
- Token may not have `repo` scope
- Repository or branch may not exist
- Check browser console for detailed error

### Items not marking as read
- Check browser console for errors
- Verify localStorage is enabled
- Try manual commit to test GitHub connection
- Check local cache settings (Config page)

### LocalStorage growing too large
- Reduce "files per site" in Config page (Local Cache section)
- Set to 0 to disable log-file caching
- Cache is automatically evicted based on your retention setting

## 📊 Performance

- **Initial Load**: ~1-2 seconds
- **Feed Fetching**: Parallel requests, ~500ms per feed
- **Bundle Size**: ~300KB gzipped
- **Memory**: <50MB for typical usage
- **LocalStorage**: Bounded by `filesPerSite` setting (default ~5MB per site)

## ⏰ Automated Feed Fetching (GitHub Action)

A scheduled GitHub Action can periodically fetch all RSS feeds and commit unread logs without any human involvement.

### How It Works

The workflow at `.github/workflows/fetch-feeds.yml` runs every 8 hours and on demand via `workflow_dispatch`. It checks out your data branch, reads `rss-config.json`, fetches every feed using the configured CORS proxy policy, and commits `logs/{siteId}/YYYY-MM-DD.json` back to the data branch.

### Enabling

1. Create a data branch (default: `rss-reader-data`) in your repository
2. Add your `rss-config.json` to that branch
3. The workflow runs automatically on schedule — no further config needed

All parameters are overridable from the Actions tab via **Run workflow**:
- **code_branch**: Code branch with package.json and scripts (default: `main`)
- **data_branch**: Data branch with `rss-config.json` (default: `rss-reader-data`)
- **proxy_mode**: `direct-only`, `proxy-fallback`, or `proxy-only`
- **proxy_templates**: Ordered proxy list with `{url}` placeholder
- **timeout_ms**: Per-feed timeout in milliseconds
- **pool_size**: Concurrent fetch limit (default: 5)
- **target_token/owner/repo**: Target a different repository

### Using in Another Repository

Fork this repo and copy `.github/workflows/fetch-feeds.yml` into your fork. The workflow runs in the same repo that contains the code, reading `rss-config.json` from a data branch and committing logs back to it.

### Local Testing

```bash
# Set required env vars and run the fetch script directly
GH_TOKEN=ghp_xxx TARGET_OWNER=you TARGET_REPO=rss-data TARGET_BRANCH=rss-reader-data npm run fetch-feeds
```

## 🎯 Roadmap

### MVP Features ✅
- [x] Runtime Config UI (no `.env` files)
- [x] GitHub API integration (read/write)
- [x] RSS feed fetching and parsing
- [x] Read status tracking
- [x] Site-based log files with chunking
- [x] Subscription management UI
- [x] Sidebar layout implementation
- [x] CORS policy control (direct/proxy modes)
- [x] Write capability check with UI gating
- [x] Local cache with per-site retention
- [x] Auto-commit functionality (disabled by default)
- [x] Clean UI with MUI
- [x] GitHub Action scheduled feed fetching
- [x] GitHub Pages static site deploy
- [x] Vim-style j/k keyboard navigation
- [x] Search/filter with PGlite full-text search
- [x] PGlite PostgreSQL WASM storage provider

### Future Enhancements
- [ ] Feed categories/tags
- [ ] Export data (CSV/JSON)
- [ ] Dark mode theme
- [ ] PWA offline support
- [ ] Feed discovery
- [ ] Multi-user support (with auth)

## 🤝 Contributing

This is a learning project. Feel free to:
- Open issues for bugs
- Suggest features
- Submit PRs for improvements

## 🙏 Credits

Built with:
- [React](https://react.dev/)
- [MUI v7](https://mui.com/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- Native DOMParser for RSS parsing
- Native GitHub REST API v3

---

**Status**: MVP Ready 🚀

**Last Updated**: 2026-05-04

**Next Steps**:
1. Read some articles - Click on items or press `j`/`k` to navigate and mark as read
2. Change settings - Toggle "Show Read Items"
3. Manage subscriptions - Add/edit/delete RSS feeds via UI
4. Check write capability - Save token in Config page to enable commit features
5. Manual commit - Click the save icon to commit to GitHub (when write is confirmed)
6. Check GitHub - After commit, look for `logs/{siteId}/YYYY-MM-DD.json`
7. Enable cron fetching - Push `.github/workflows/fetch-feeds.yml` to `main` and create `rss-reader-data` branch

**Need Help?**
1. Check browser console (F12)
2. Review this README troubleshooting section
3. Use the Config page to verify settings and re-check write capability
4. Check GitHub REST API docs: https://docs.github.com/en/rest

## 📄 License

```
Copyright 2026 wangmuy

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```