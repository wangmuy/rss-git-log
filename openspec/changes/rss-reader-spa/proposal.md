## Why

Build a static React SPA for reading RSS feeds with read status tracking, using GitHub as a backend replacement. This solves the problem of needing a zero-backend RSS reader that persists read state via Git commits to GitHub repos.

The app must be deployable once and configured at runtime. GitHub repository, branch, CORS behavior, auto-commit, and future settings should be managed from an in-app Config UI instead of build-time environment variables.

## What Changes

- **New**: Static React SPA with no server-side component
- **New**: RSS feed fetching and parsing using native browser DOMParser (no Node.js dependencies)
- **New**: Read status tracking with LocalStorage for session + GitHub API for persistence
- **New**: Site-based log files (JSON) committed to GitHub for read history
- **New**: Site-based log organization with 200-item chunking per file
- **New**: Subscription management UI for adding/editing/deleting RSS feeds
- **New**: Sidebar layout with left panel (site list) and right panel (content)
- **New**: GitHub API integration using native fetch (read/write config and logs)
- **New**: Config UI page for GitHub repo/branch setup, CORS policy, auto-commit settings, and future configuration sections
- **New**: CORS policy controls for direct-only, proxy-fallback, and proxy-only RSS fetching
- **New**: GitHub token write-access check after token setup
- **New**: Manual commit button in the reader when the configured token can write to the GitHub repo
- **New**: Auto-commit functionality with configurable intervals, disabled by default
- **New**: Vim-style keyboard navigation for feed items (j/k to move, auto-mark-as-read)
- **BREAKING**: Removed build-time GitHub repo setup and .env files - all app setup now lives in runtime localStorage config
- **BREAKING**: Flattened project structure from `src/features/rss-reader/*` to `src/*`

## Capabilities

### New Capabilities

- `rss-fetching`: Fetch and parse RSS/Atom feeds using native DOMParser with CORS proxy fallback
- `read-tracking`: Track read/unread status using Zustand store with LocalStorage persistence
- `github-sync`: Read/write config and log files via GitHub REST API v3 using native fetch
- `log-management`: Site-based log files with 200-item chunking
- `subscription-ui`: UI for managing RSS feed subscriptions (add/edit/delete)
- `sidebar-layout`: Two-panel layout with site list sidebar and content display
- `runtime-config`: In-app Config UI for GitHub storage, CORS policy, auto-commit, and future settings
- `commit-controls`: Token write-access check plus conditional manual/auto commit controls

### Modified Capabilities

<!-- No existing specs to modify -->

## Impact

- **Code**: New React SPA in `src/` directory with components, hooks, store, types, and utils
- **Dependencies**: React 18+, MUI v7, Zustand, Vite (build tool)
- **APIs**: GitHub REST API v3 (config and log files), CORS proxies (corsproxy.io, allorigins.win)
- **Storage**: Browser LocalStorage (session and runtime app config), GitHub repo (persistent logs)
- **Browser Requirements**: Modern browsers with fetch, DOMParser, atob/btoa support
