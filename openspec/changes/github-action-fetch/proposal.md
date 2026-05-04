## Why

The current RSS reader requires a user to keep the browser open for feeds to be fetched and logs committed. There's no automated background fetching — if the user doesn't open the app, no new feed items are captured. A scheduled GitHub Action solves this by periodically fetching all feeds and committing unread logs without any human involvement.

This also requires extracting the RSS parsing logic from browser-only code into shared utilities that both the browser SPA and a Node.js script can use.

## What Changes

- **New**: `src/utils/feed-parser.ts` — shared RSS/Atom XML parsing functions that operate on DOM-compatible Document/Element objects (no platform dependencies)
- **Modify**: `src/utils/rss-parser.ts` — thin browser wrapper that creates native DOMParser, delegates to feed-parser; network functions unchanged
- **Modify**: `src/utils/log-file.ts` — add optional `GitHubConfig` parameter to `commitAllFeedItems()` and `commitReadStatus()`, falling back to `getStoredConfig()` when not provided
- **Modify**: `src/utils/github-api.ts` — expose config-passing path so Node.js callers can bypass localStorage
- **New**: `scripts/fetch-feeds.ts` — Node.js script: reads `rss-config.json` from filesystem, fetches all feeds using configurable CORS proxy policy (direct-only, proxy-fallback, proxy-only), commits unread logs back via GitHub API
- **New**: `.github/workflows/fetch-feeds.yml` — scheduled workflow + manual dispatch with configurable inputs
- **New**: `.github/actions/fetch-feeds/action.yml` — composite action metadata for reuse by other repos

## Capabilities

### New Capabilities

- `feed-parser`: Shared RSS/Atom XML parsing functions usable by both browser (native DOMParser) and Node.js (linkedom)
- `github-action`: Scheduled GitHub Action that fetches all feeds and commits unread logs to the data branch, with workflow_dispatch overrides for branch, proxy mode (direct-only / proxy-fallback / proxy-only), proxy templates, timeout, pool size, and target repo

### Modified Capabilities

- `rss-fetching`: Parser extraction — parseXMLDocument/parseRSSFeed/parseAtomFeed move to shared feed-parser module
- `github-sync`: log-file and github-api functions accept optional config parameter for non-browser callers

## Impact

- **Code**: New shared parser module, new Node.js script, new workflow files; minor refactor of existing modules
- **Dependencies**: `linkedom` (Node-compatible DOMParser), `tsx` (TypeScript execute for the action script)
- **APIs**: GitHub REST API v3 (same as existing), CORS proxies (same as existing)
- **Runtime**: Node.js 18+ in GitHub Actions runner (fetch, AbortController, btoa all built-in)
- **Browser SPA**: Backward compatible — all existing behavior unchanged
