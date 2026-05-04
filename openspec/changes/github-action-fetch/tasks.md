## 1. Shared Feed Parser

- [x] 1.1 Create `src/utils/feed-parser.ts` with `parseXMLDocument(doc: Document): RSSFeed`
- [x] 1.2 Move `parseRSSFeed()` from rss-parser.ts to feed-parser.ts (pure DOM logic)
- [x] 1.3 Move `parseAtomFeed()` from rss-parser.ts to feed-parser.ts (pure DOM logic)
- [x] 1.4 Move parserror detection into feed-parser.ts
- [x] 1.5 Refactor `parseXMLFeed()` in rss-parser.ts to thin wrapper: create native DOMParser, call `parseXMLDocument()`
- [x] 1.6 Verify existing rss-parser tests still pass after extraction

## 2. Config Plumbing (localStorage Bypass)

- [x] 2.1 Add optional `config?: GitHubConfig` parameter to `commitAllFeedItems()` in log-file.ts
- [x] 2.2 Add optional `config?: GitHubConfig` parameter to `commitReadStatus()` in log-file.ts
- [x] 2.3 Add optional `config?: GitHubConfig` parameter to `getLatestLogFile()` in log-file.ts
- [x] 2.4 Verify browser callers still work without passing config (backward compat)

## 3. Node.js Fetch Script

- [x] 3.1 Install `@xmldom/xmldom` and `tsx` as devDependencies
- [x] 3.2 Create `scripts/fetch-feeds.ts` with `parseXMLFeedNode(xml)` using xmldom DOMParser
- [x] 3.3 Implement `fetchWithTimeout()` using Node 18+ `fetch` + `AbortController` + `setTimeout`
- [x] 3.4 Implement `fetchRSSWithProxy()` — same sequential proxy loop, Node 18+ fetch
- [x] 3.5 Implement `fetchRSSWithPolicy()` — dispatcher that routes to direct fetch, proxy-fallback, or proxy-only based on configured `proxy_mode` input
- [x] 3.6 Implement main(): read env vars → build GitHubConfig → read rss-config.json from working directory (checked out by workflow from target repo/branch)
- [x] 3.7 Implement main(): fetch all feeds with configurable pool concurrency
- [x] 3.8 Implement main(): build LogItems (all unread, pubDate desc, item IDs via shared item-id.ts)
- [x] 3.9 Implement main(): call `commitAllFeedItems()` with explicit config for each site
- [x] 3.10 Add console output: site name, items fetched, commit result, errors
- [x] 3.11 Add `"fetch-feeds": "tsx scripts/fetch-feeds.ts"` to package.json scripts

## 4. GitHub Workflow

- [x] 4.1 Create `.github/workflows/fetch-feeds.yml` with `on.schedule` (every 8 hours) and `on.workflow_dispatch`
- [x] 4.2 Add workflow_dispatch inputs: branch, proxy_mode, proxy_templates, timeout_ms, pool_size, target_token, target_owner, target_repo
- [x] 4.3 Configure checkout step with repository/ref/token from inputs, shallow clone (`fetch-depth: 1`)
- [x] 4.4 Configure Node.js setup step (node 18)
- [x] 4.5 Configure npm ci + tsx run steps
- [x] 4.6 Pass all inputs as env vars to the script

## 5. Composite Action (Reusability)

Separate from the self-contained workflow. Composite actions cannot use other actions (like `actions/checkout`), so this is a thin wrapper around the `npx tsx` invocation only. External repos handle checkout + Node setup themselves.

- [x] 5.1 Create `.github/actions/fetch-feeds/action.yml` with composite type, `npx tsx` invocation only
- [x] 5.2 Define all inputs with defaults matching workflow_dispatch
- [x] 5.3 Reference script path via `${{ github.action_path }}/../../scripts/fetch-feeds.ts`
- [x] 5.4 Document usage in README: fork repo and copy workflow for external use

## 6. Testing & Verification

- [x] 6.1 Write unit tests for `parseXMLDocument()` with RSS 2.0 XML string + linkedom DOMParser
- [x] 6.2 Write unit tests for `parseXMLDocument()` with Atom XML string + linkedom DOMParser
- [x] 6.3 Write unit tests for `parseXMLDocument()` with malformed XML
- [x] 6.4 Test `fetch-feeds.ts` locally — script loads and runs (exits cleanly awaiting valid env vars)
- [x] 6.5 Verify browser SPA builds and all existing tests pass
- [ ] 6.6 Verify manual workflow_dispatch run succeeds in GitHub Actions
- [ ] 6.7 Verify scheduled run triggers and completes
