## Why

Build a static React SPA for reading RSS feeds with read status tracking, using GitHub as a backend replacement. This solves the problem of needing a zero-backend RSS reader that persists read state via Git commits to GitHub repos.

## What Changes

- **New**: Static React SPA with no server-side component
- **New**: RSS feed fetching and parsing using native browser DOMParser (no Node.js dependencies)
- **New**: Read status tracking with LocalStorage for session + GitHub API for persistence
- **New**: Daily log files (JSON) committed to GitHub for read history
- **New**: Site-based log organization with 200-item chunking per file
- **New**: Subscription management UI for adding/editing/deleting RSS feeds
- **New**: Sidebar layout with left panel (site list) and right panel (content)
- **New**: GitHub API integration using native fetch (read/write config and logs)
- **New**: CORS proxy fallback handling for RSS feed fetching
- **New**: Auto-commit functionality with configurable intervals
- **BREAKING**: Removed .env files - all config now stored in localStorage
- **BREAKING**: Flattened project structure from `src/features/rss-reader/*` to `src/*`
- **BREAKING**: Changed log structure from `logs/YYYY-MM-DD.json` to `logs/{siteId}/YYYY-MM-DD.json`

## Capabilities

### New Capabilities

- `rss-fetching`: Fetch and parse RSS/Atom feeds using native DOMParser with CORS proxy fallback
- `read-tracking`: Track read/unread status using Zustand store with LocalStorage persistence
- `github-sync`: Read/write config and log files via GitHub REST API v3 using native fetch
- `log-management`: Site-based daily log files with 200-item chunking and automatic migration
- `subscription-ui`: UI for managing RSS feed subscriptions (add/edit/delete)
- `sidebar-layout`: Two-panel layout with site list sidebar and content display

### Modified Capabilities

<!-- No existing specs to modify -->

## Impact

- **Code**: New React SPA in `src/` directory with components, hooks, store, types, and utils
- **Dependencies**: React 18+, MUI v7, Zustand, Vite (build tool)
- **APIs**: GitHub REST API v3 (config and log files), CORS proxies (corsproxy.io, allorigins.win)
- **Storage**: Browser LocalStorage (session), GitHub repo (persistent logs)
- **Browser Requirements**: Modern browsers with fetch, DOMParser, atob/btoa support
