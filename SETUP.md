# Setup Guide - RSS Reader with GitHub API

This guide will walk you through setting up the RSS Reader from scratch.

## 📋 Prerequisites

1. **Node.js 18+** installed
   - Check: `node --version`
   - Download: https://nodejs.org/

2. **GitHub Account**
   - Sign up: https://github.com/join

3. **Git** installed (optional, for uploading config)
   - Check: `git --version`

## 🚀 Step-by-Step Setup

### Step 1: Install Dependencies

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

### Step 2: Create GitHub Repository

1. Go to github.com and create a **new public repository**
   - Name: `rss-reader-data` (or any name)
   - Visibility: **Public** (important!)
   - Initialize with README: No

2. Note your repository details:
   - Owner: `your-username`
   - Repo: `rss-reader-data`

### Step 3: Configure Environment

Create a `.env` file in the project root:

```bash
# Copy the example
cp .env.example .env
```

Edit `.env` with your details:

```env
VITE_GITHUB_OWNER=your-username
VITE_GITHUB_REPO=rss-reader-data
VITE_GITHUB_BRANCH=main
# VITE_GITHUB_TOKEN=ghp_xxxxxxxx  # Leave commented for public repos
```

**Important**: Never commit `.env` to Git!

### Step 4: Create Config File

1. Copy the example config:
   ```bash
   cp public/rss-config.example.json /tmp/rss-config.json
   ```

2. Edit with your favorite RSS feeds:
   ```json
   {
     "sites": [
       {
         "name": "Your Feed Name",
         "url": "https://example.com/rss",
         "color": "#ff6600"
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

### Step 5: Start Development Server

```bash
npm run dev
```

Open your browser to: `http://localhost:3000`

### Step 6: Verify Setup

You should see:
1. ✅ Header with app title
2. ✅ Settings panel
3. ✅ Your RSS feeds loaded
4. ✅ Articles displayed

If you see errors:
- Check browser console (F12)
- Verify `.env` variables
- Ensure config file is in GitHub repo
- Check repo is public

## 🔧 Common Issues

### Issue: "Config file not found"

**Solution**:
1. Verify config file exists in GitHub repo
2. Check `.env` variables match exactly
3. Ensure repo is public
4. Wait 30 seconds (GitHub cache)

### Issue: "Failed to fetch RSS feeds"

**Solution**:
1. Check feed URLs are valid
2. Some feeds block CORS - app will auto-use proxy
3. Try refreshing after a few seconds
4. Check browser console for specific errors

### Issue: "CORS errors"

**Solution**: This is normal! The app automatically uses CORS proxies as fallback. If you see this in console but feeds still load, it's working correctly.

## 🎯 Next Steps

### Testing the App

1. **Read some articles** - Click on items to mark as read
2. **Change settings** - Toggle "Show Read Items"
3. **Manual commit** - Click the save icon to commit to GitHub
4. **Check GitHub** - After commit, look for `logs/2025-12-21.json`

### Understanding the Data Flow

1. **Session Storage**: Read status saved to browser localStorage immediately
2. **Auto-commit**: Every 5 minutes (configurable), commits to GitHub API
3. **Manual commit**: Click save icon for immediate commit
4. **Log files**: Created daily in `logs/YYYY-MM-DD.json`

### Adding More Feeds

Edit your `rss-config.json` in GitHub and:
- Wait 5 minutes for auto-refresh
- Or click the refresh icon in the app

## 📚 Learn More

- **Full Documentation**: See `README.md`
- **Architecture**: See `dev/active/rss-reader/` planning docs
- **Troubleshooting**: See README troubleshooting section

## 🆘 Need Help?

1. Check the README.md troubleshooting section
2. Look at browser console (F12)
3. Review the planning documents in `dev/active/rss-reader/`
4. Check GitHub REST API docs: https://docs.github.com/en/rest?apiVersion=2022-11-28

---

**Status**: Ready to use! 🎉

**Next**: Start the dev server and enjoy your RSS feeds!