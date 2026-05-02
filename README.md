# RSS Reader - GitHub Powered

A lean React Single Page Application (SPA) for reading RSS feeds with automatic read status tracking and daily log persistence via GitHub API.

## ✨ Features

- **Zero Backend**: Pure client-side React application
- **GitHub API Integration**: Config and logs stored in GitHub repositories
- **Read Tracking**: Automatic tracking of read items per session
- **Site-Based Logs**: Organized logs by site with 200-item chunking (`logs/{siteId}/YYYY-MM-DD.json`)
- **Clean UI**: Minimal, focused reading experience with sidebar layout
- **Subscription Management**: Add, edit, delete RSS feeds via UI
- **Configurable**: User settings for display and auto-commit
- **MUI v7**: Modern Material Design components
- **Browser Native**: No Node.js dependencies, uses native fetch/DOMParser

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

1. Go to github.com and create a **new public repository**
   - Name: `rss-reader-data` (or any name)
   - Visibility: **Public** (important!)
   - Initialize with README: No

2. Note your repository details:
   - Owner: `your-username`
   - Repo: `rss-reader-data`

#### Step 3: Configure via UI (No .env Files!)

> **Note**: This app uses browser localStorage instead of .env files. Configuration is done through the app's Setup page.

The app will prompt you to enter your GitHub details on first use:
- **Owner**: your GitHub username
- **Repo**: the repository name you created
- **Branch**: `main` (default)
- **Token**: Only needed for private repos or write operations

> **Security**: For public repos, no token is needed for reading. If using a token, be aware it's visible in the client bundle.

#### Step 4: Create Config File

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
    "autoCommit": true,
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

#### Step 5: Start Development Server

```bash
npm run dev
```

Open your browser to: `http://localhost:3000`

#### Step 6: Verify Setup

You should see:
1. ✅ Header with app title
2. ✅ Setup page (first time) or Settings panel
3. ✅ Your RSS feeds loaded in sidebar
4. ✅ Articles displayed in content area

If you see errors:
- Check browser console (F12)
- Verify config file is in GitHub repo
- Check repo is public
- Ensure GitHub config is entered correctly in Setup page

## 📋 Configuration

### RSS Config File (`rss-config.json`)

Stored in your GitHub repository root. See `public/rss-config.example.json` for the full schema.

### Settings Explained

- **showReadItems**: Display already-read items (default: false)
- **autoCommit**: Automatically commit to GitHub (default: true)
- **commitInterval**: Seconds between auto-commits (default: 300 = 5 minutes)

## 🏗️ Architecture

### Data Flow

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
Display UI (Sidebar Layout)
    ↓
LocalStorage (session)
    ↓
Commit to logs/{siteId}/YYYY-MM-DD.json
```

### Storage Layers

1. **Session State**: Browser localStorage (immediate, fast)
2. **Persistent Logs**: GitHub API (permanent, shareable)

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

## 📁 Project Structure

```
src/
├── components/           # All UI components
│   ├── SetupPage.tsx           # GitHub repo configuration
│   ├── SidebarFeedLayout.tsx   # Main two-panel layout
│   ├── SubscriptionManager.tsx # RSS feed CRUD
│   ├── FeedItem.tsx           # Individual RSS item
│   ├── Header.tsx             # App header
│   └── SettingsPanel.tsx      # User settings
├── hooks/              # Custom React hooks
│   ├── useConfig.ts           # Config loading/management
│   ├── useRSSFeeds.ts         # RSS feed fetching
│   └── useCommit.ts           # GitHub commit logic
├── store/              # Zustand state management
│   └── readerStore.ts         # Read status, feeds, settings
├── types/              # TypeScript definitions
│   ├── config.ts              # RSSConfig, GitHubConfig
│   ├── rss.ts                 # RSSItem, RSSFeed
│   └── log.ts                 # Site log interfaces
├── utils/              # Utility functions
│   ├── github-api.ts          # GitHub API (native fetch)
│   ├── rss-parser.ts          # RSS parsing (DOMParser)
│   ├── item-id.ts             # ID generation
│   ├── log-file.ts            # Log management
│   └── url.ts                # URL utilities
└── App.tsx             # Main application
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
```

## 🔒 Security Considerations

### ⚠️ Important Warnings

1. **Never commit tokens to client-side code**
   - Use public repos for read-only access (no token needed)
   - For write operations, tokens are stored in localStorage
   - Be aware tokens in client bundle are visible

2. **Public Repositories**
   - All data in public repos is visible to everyone
   - Don't include personal information in feeds
   - Consider this a public reading log

3. **Rate Limits**
   - Unauthenticated: 60 requests/hour
   - Authenticated: 5000 requests/hour
   - App uses native fetch (slower but more reliable)

## 🐛 Troubleshooting

### "Config file not found"
- Ensure `rss-config.json` exists in your GitHub repo
- Check GitHub config in Setup page (owner, repo, branch)
- Verify repo is public (or token is valid)
- Wait 30 seconds (GitHub cache)

### "Failed to fetch RSS feeds"
- Some feeds block CORS - app auto-uses proxy fallback
- Check feed URLs are valid
- Try refreshing after a few seconds
- Check browser console for specific errors

### "CORS errors"
This is normal! The app automatically uses CORS proxies as fallback:
1. Direct fetch (if CORS enabled)
2. Fallback 1: `https://corsproxy.io/?{encoded_url}`
3. Fallback 2: `https://api.allorigins.win/raw?url={encoded_url}`

### "404 errors from GitHub API"
This can mean:
- File doesn't exist yet (normal for first commit)
- Private repo without access
- Wrong repo/branch configuration

### Items not marking as read
- Check browser console for errors
- Verify localStorage is enabled
- Try manual commit to test GitHub connection

## 📊 Performance

- **Initial Load**: ~1-2 seconds
- **Feed Fetching**: Parallel requests, ~500ms per feed
- **Bundle Size**: ~300KB gzipped
- **Memory**: <50MB for typical usage

## 🎯 Roadmap

### MVP Features ✅
- [x] GitHub API integration (read/write)
- [x] RSS feed fetching and parsing
- [x] Read status tracking
- [x] Site-based log files with chunking
- [x] Subscription management UI
- [x] Sidebar layout implementation
- [x] Auto-commit functionality
- [x] Browser-only storage (localStorage)
- [x] Configurable settings
- [x] Clean UI with MUI

### Future Enhancements
- [ ] Search/filter functionality
- [ ] Feed categories/tags
- [ ] Export data (CSV/JSON)
- [ ] Keyboard shortcuts
- [ ] PWA offline support
- [ ] Dark mode theme
- [ ] Feed discovery
- [ ] Multi-user support (with auth)

## 🤝 Contributing

This is a learning project. Feel free to:
- Open issues for bugs
- Suggest features
- Submit PRs for improvements

## 📄 License

MIT License - feel free to use and modify.

## 🙏 Credits

Built with:
- [React](https://react.dev/)
- [MUI v7](https://mui.com/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- Native DOMParser for RSS parsing
- Native GitHub REST API v3

---

**Status**: MVP Ready 🚀

**Last Updated**: 2025-12-24

**Next Steps**:
1. Read some articles - Click on items to mark as read
2. Change settings - Toggle "Show Read Items"
3. Manage subscriptions - Add/edit/delete RSS feeds via UI
4. Manual commit - Click the save icon to commit to GitHub
5. Check GitHub - After commit, look for `logs/{siteId}/YYYY-MM-DD.json`

**Need Help?**
1. Check browser console (F12)
2. Review this README troubleshooting section
3. Check GitHub REST API docs: https://docs.github.com/en/rest
