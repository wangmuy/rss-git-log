# RSS Reader - GitHub Powered

A lean React Single Page Application (SPA) for reading RSS feeds with automatic read status tracking and daily log persistence via GitHub API.

## ✨ Features

- **Zero Backend**: Pure client-side React application
- **GitHub API Integration**: Config and logs stored in GitHub repositories
- **Read Tracking**: Automatic tracking of read items per session
- **Daily Logs**: Automatic commit to `logs/YYYY-MM-DD.json`
- **Clean UI**: Minimal, focused reading experience
- **Configurable**: User settings for display and auto-commit
- **MUI v7**: Modern Material Design components

## 🚀 Quick Start

### Prerequisites

1. **Node.js 18+** and **npm** installed
2. **GitHub account** with a public repository

### Setup

#### 1. Install Dependencies

```bash
npm install
```

#### 2. Configure Environment

Copy `.env.example` to `.env` and update with your GitHub details:

```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_GITHUB_OWNER=your-username
VITE_GITHUB_REPO=rss-reader-data
VITE_GITHUB_BRANCH=main
# VITE_GITHUB_TOKEN=ghp_xxxxxxxx  # Only needed for private repos or write operations
```

#### 3. Set Up GitHub Repository

1. Create a **public** GitHub repository (e.g., `rss-reader-data`)
2. Upload the config file:
   ```bash
   # Copy the example config
   cp public/rss-config.example.json rss-config.json

   # Edit with your RSS feeds
   nano rss-config.json

   # Upload to GitHub
   git add rss-config.json
   git commit -m "Add RSS config"
   git push
   ```

#### 4. Run Development Server

```bash
npm run dev
```

Visit: `http://localhost:3000`

## 📋 Configuration

### RSS Config File (`rss-config.json`)

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

### Settings Explained

- **showReadItems**: Display already-read items (default: false)
- **autoCommit**: Automatically commit to GitHub (default: true)
- **commitInterval**: Seconds between auto-commits (default: 300 = 5 minutes)

## 🏗️ Architecture

### Data Flow

```
Browser → Load Config (GitHub API) → Fetch RSS Feeds → Display UI
                                      ↓
                              User Reads Items → Track in Session
                                      ↓
                              Auto/Manual Commit → GitHub API (logs/YYYY-MM-DD.json)
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

## 📁 Project Structure

```
src/
├── features/
│   └── rss-reader/
│       ├── components/     # UI Components
│       ├── hooks/          # Custom hooks
│       ├── store/          # Zustand state
│       └── types/          # TypeScript types
├── utils/                  # Utility functions
│   ├── github-api.ts       # GitHub API integration
│   ├── rss-parser.ts       # RSS parsing
│   ├── item-id.ts          # ID generation
│   ├── url.ts              # URL utilities
│   └── log-file.ts         # Log management
├── types/                  # Global types
└── App.tsx                 # Main app
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
   - Use public repos for read-only access
   - For write operations, consider:
     - Serverless function (Cloudflare Workers, Vercel Functions)
     - GitHub OAuth app with user authentication

2. **Public Repositories**
   - All data in public repos is visible to everyone
   - Don't include personal information in feeds
   - Consider this a public reading log

3. **Rate Limits**
   - Unauthenticated: 60 requests/hour
   - Authenticated: 5000 requests/hour
   - App uses `fetch` mode (slower but more reliable)

## 🐛 Troubleshooting

### "Config file not found"
- Ensure `rss-config.json` exists in your GitHub repo
- Check environment variables are correct
- Verify repo is public (or token is valid)

### "Failed to fetch RSS feeds"
- Some feeds block CORS - app uses proxy fallback
- Check feed URLs are valid
- Try refreshing after a few seconds

### "404 errors from GitHub API"
- This can mean:
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
- [x] GitHub API integration
- [x] RSS feed fetching
- [x] Read status tracking
- [x] Daily log files
- [x] Configurable settings
- [x] Clean UI with MUI

### Future Enhancements
- [ ] Search/filter feeds
- [ ] Categories/tags
- [ ] Export data (CSV/JSON)
- [ ] Keyboard shortcuts
- [ ] PWA offline support
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

**Last Updated**: 2025-12-21