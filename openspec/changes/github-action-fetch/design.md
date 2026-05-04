## Context

The RSS reader SPA is entirely browser-based. The GitHub Action needs to run the same fetch-parse-commit pipeline in Node.js. The core challenge is that RSS parsing uses `DOMParser` which is browser-only.

## Goals / Non-Goals

- **Goal**: Single shared parser module that both browser and Node.js import
- **Goal**: Zero breaking changes to the browser SPA
- **Goal**: Reusable composite action that other repos can reference
- **Goal**: All runtime parameters overridable via workflow_dispatch
- **Non-Goal**: Replacing or modifying the SPA build/deploy process
- **Non-Goal**: Supporting Node.js versions older than 18

## Architecture

### Parser Layer Split

```
                   ┌──────────────────────────────┐
                   │  src/utils/feed-parser.ts     │  ← SHARED (no platform deps)
                   │                               │
                   │  parseXMLDocument(doc)         │
                   │    → detects RSS vs Atom       │
                   │    → calls parseRSS/parseAtom  │
                   │                               │
                   │  parseRSSFeed(doc, channel)    │
                   │  parseAtomFeed(doc, feed)      │
                   │                               │
                   │  Uses only:                    │
                   │    querySelector()             │
                   │    querySelectorAll()          │
                   │    textContent                 │
                   │    getAttribute()              │
                   └──────────┬───────────────────┘
                              │ imports
              ┌───────────────┼───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│ src/utils/rss-parser.ts  │     │ scripts/fetch-feeds.ts  │
│ (BROWSER)                │     │ (NODE.JS)               │
│                          │     │                         │
│ parseXMLFeed(xml):       │     │ parseXMLFeedNode(xml):  │
│   new DOMParser()        │     │   new DOMParser(xmldom) │
│   → parseXMLDocument()   │     │   → parseXMLDocument()  │
│                          │     │                         │
│ fetchWithTimeout()       │     │ fetchWithTimeout()      │
│ fetchRSSWithProxy()      │     │ fetchRSSWithProxy()     │
│ fetchRSSWithPolicy()     │     │ fetchRSSWithPolicy()    │
│ fetchMultipleRSS()       │     │                         │
└─────────────────────────┘     └─────────────────────────┘
```

### Config Plumbing (localStorage bypass)

Functions that currently call `getStoredConfig()` → `loadAppConfig()` → `localStorage` gain an optional `config` parameter:

```ts
// log-file.ts — before
export async function commitAllFeedItems(siteId, siteName, items) {
  const config = getStoredConfig();  // localStorage
  // ...
}

// log-file.ts — after
export async function commitAllFeedItems(siteId, siteName, items, config?: GitHubConfig) {
  const cfg = config ?? getStoredConfig();  // localStorage fallback for browser
  // ...
}
```

Same pattern for `commitReadStatus()` in log-file.ts. The `github-api.ts` functions already accept a `GitHubClient` — callers just construct it directly instead of via `getStoredConfig()`.

### Action Script Flow

The workflow (below) checks out the target repo+branch before running the script. The script itself sees `rss-config.json` on disk.

```
scripts/fetch-feeds.ts
│
├─ 1. Read env vars (GH_TOKEN, TARGET_OWNER, TARGET_REPO, TARGET_BRANCH, ...)
├─ 2. Build GitHubConfig from env vars (no localStorage)
├─ 3. Read rss-config.json from working directory (checked out by workflow from target repo/branch)
├─ 4. Build CORSPolicy from inputs (or defaults)
├─ 5. For each site, in pool of POOL_SIZE, per the configured proxy_mode:
│     ├─ direct-only:    fetch URL directly, fail on error
│     ├─ proxy-fallback: try direct first, fall through proxies on CORS/network failure
│     ├─ proxy-only:     skip direct, iterate proxies sequentially
│     └─ Parse XML via parseXMLFeedNode() → RSSFeed
├─ 6. For each site, build LogItems (all unread, sorted by pubDate desc)
├─ 7. Call commitAllFeedItems(siteId, siteName, items, config)
│     └─ Merges with existing log file if <200 items, otherwise creates new
└─ 8. Output summary
```

### Workflow Structure

```yaml
# .github/workflows/fetch-feeds.yml
name: Fetch RSS Feeds

on:
  schedule:
    - cron: '23 */8 * * *'          # every 8 hours (00:23, 08:23, 16:23), off the :00 spike
  workflow_dispatch:
    inputs:
      branch              # default: 'rss-reader-data'
      proxy_mode          # default: 'proxy-fallback' (direct-only | proxy-fallback | proxy-only)
      proxy_templates     # default: corsproxy.io + allorigins.win
      timeout_ms          # default: '10000'
      pool_size            # default: '5'
      target_token        # default: '' (falls back to GITHUB_TOKEN)
      target_owner        # default: current repo owner
      target_repo         # default: current repo name

jobs:
  fetch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          repository: ${{ inputs.target_owner }}/${{ inputs.target_repo }}
          ref: ${{ inputs.branch }}
          token: ${{ inputs.target_token || secrets.GITHUB_TOKEN }}
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npx tsx scripts/fetch-feeds.ts
        env:
          GH_TOKEN: ${{ inputs.target_token || secrets.GITHUB_TOKEN }}
          TARGET_OWNER: ${{ inputs.target_owner || github.repository_owner }}
          TARGET_REPO: ${{ inputs.target_repo || github.event.repository.name }}
          TARGET_BRANCH: ${{ inputs.branch }}
          PROXY_MODE: ${{ inputs.proxy_mode }}
          PROXY_TEMPLATES: ${{ inputs.proxy_templates }}
          TIMEOUT_MS: ${{ inputs.timeout_ms }}
          POOL_SIZE: ${{ inputs.pool_size }}
```

### Composite Action (for reuse by other repos)

The workflow above is self-contained — it runs in this repo with inline steps (checkout, setup-node, npm ci, tsx). The composite action below is a thin wrapper that other repos can reference directly. It contains only the `npx tsx` invocation; callers must handle checkout and Node.js setup themselves. This split exists because composite actions cannot use other actions (like `actions/checkout`) in their steps.

```yaml
# .github/actions/fetch-feeds/action.yml
name: 'Fetch RSS Feeds'
description: 'Fetch RSS feeds and commit unread logs to GitHub'
inputs:
  branch:
    description: 'Data branch'
    default: 'rss-reader-data'
  # ... same inputs as workflow_dispatch
runs:
  using: 'composite'
  steps:
    - run: npx tsx ${{ github.action_path }}/scripts/fetch-feeds.ts
      shell: bash
      env: ...
```

### Dependencies

- `linkedom` — provides `DOMParser` with the same API surface the existing parser code expects (`querySelector`, `textContent`, `getAttribute`)
- `tsx` — runs TypeScript directly in Node.js without a build step

## Risks / Tradeoffs

- **linkedom maintenance**: Not the most actively maintained library, but the API surface we need (DOMParser, querySelector) is stable and small. Alternative: `linkedom` (more active but heavier).
- **Script checkout cost**: The action checks out the data repo branch. For repos with large histories this could be slow. Mitigation: shallow clone (`fetch-depth: 1`).
- **Feed fetch failures**: Some feeds will fail. The script logs and continues — one bad feed doesn't block others. Same behavior as the browser app.
