# Project Profile: RSS Reader

## Identity Card

| Field | Value |
|-------|-------|
| Name | RSS Reader |
| Description | Lean React SPA RSS Reader with GitHub API integration |
| Tech Stack | Vite 5 + React 18 + TypeScript 5 strict, MUI v7, Zustand, Vitest |
| Runtime | Browser (Chrome/Firefox/Safari/Edge ESR) + Node.js 18+ (GitHub Action) |
| Deployment | GitHub Pages static site |
| Package | `rss-reader` v0.0.1 (private, ESM) |
| Repository | Single repo with code branch + data branch for logs/config |
| Schema | `spec-driven-enhanced` — custom multi-scale SDD schema |
| Scale | Blueprint (established conventions, growing) |

## Implemented Capabilities

| Capability | Change | Status |
|------------|--------|--------|
| `rss-fetching` | RSS/Atom feed fetching with native DOMParser and CORS proxy fallback | done |
| `compressed-local-storage` | lz-string compressed localStorage for cache | done |
| `mark-all-as-read-worker` | Web Worker for mark-all-as-read processing | done |
| `allread-file-rotation` | Auto-rename fully-read log files to `-allread` suffix | done |
| `worker-based-fetching` | Web Worker for log file fetch, parse, cache, merge | done |
| `git-provider-interface` | Abstract `GitProvider` interface with `GitHubProvider` class | done |
| `feed-parser` | Shared RSS/Atom XML parser for browser + Node.js | done |
| `github-action` | Scheduled GitHub Action for feed fetching every 8h | done |
| `item-store-interface` | Common `ItemStore` interface for localStorage/PGlite backends | done |
| `web-worker-search` | Web Worker PGlite with vector embeddings for semantic search | done |
| `opml-storage` | OPML subscription read/write via GitHub | done |
| `session-read-visibility` | Session-scoped read visibility (greyed out, not removed) | done |

## In-Progress Changes

| Change | Domain | Status |
|--------|--------|--------|
| `combine-rename-in-batch-commit` | git/persistence — fold renames into batch commit | tasks complete (pending archive) |

## Key Domains (Bounded Contexts)

| Domain | Description | Key Files |
|--------|-------------|-----------|
| feed | RSS/Atom feed fetching, parsing, subscription management | `feed-parser.ts`, `rss-parser.ts`, `opml.ts`, `types/rss.ts` |
| persistence | GitHub API read/write, GitProvider interface, log files | `github-api.ts`, `git-provider.ts`, `log-file.ts`, `types/git.ts` |
| storage | Item store backends (localStorage, PGlite) | `stores/`, `compressed-storage.ts`, `log-cache.ts` |
| ui | React components, layout, reader experience | `components/`, `hooks/`, `App.tsx` |
| state | Zustand stores, read/unread tracking | `store/readerStore.ts`, `types/log.ts` |
| ops | GitHub Action, deploy, build tooling | `scripts/`, `.github/`, `vite.config.ts` |

## Quick Start

```bash
npm install
npm run dev      # Dev server at localhost:3000
npm run build    # Type-check + production build
npm test         # Run test suite
npm run deploy   # Deploy to GitHub Pages
```

Last auto-derived: 2026-06-07