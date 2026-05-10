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
- [x] 4.2 Add workflow_dispatch inputs: code_branch, data_branch, proxy_mode, proxy_templates, timeout_ms, pool_size, target_token, target_owner, target_repo
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
- [x] 6.6 Verify manual workflow_dispatch run succeeds in GitHub Actions
- [ ] 6.7 Verify scheduled run triggers and completes

## 7. Fix Log File Date Grouping

### 7.1 Grouping Utility
- [x] 7.1 Create `groupByPubDate(itemList): Map<YYYY-MM-DD, LogItem[]>` utility in `log-file.ts`

### 7.2 commitAllFeedItems — per-bucket merge
- [x] 7.2 Group items by pubDate using `groupByPubDate()`, iterate buckets by date descending
- [x] 7.3 For each bucket, attempt `locateLogFileByDate(siteId, date, cfg)` — lists directory, finds a < 200 items file matching this date
- [x] 7.4 If found: read existing file → `Set<existingItemIds>` → filter new items via dedup (only current bucket's items, not cross-bucket dedup) → append → write back
- [x] 7.5 If not found: create new bucket file with this date as filename → build metadata → write
- [x] 7.6 If bucket file exists but >= 200 items: create overflow bucket with `-1` suffix (then `-2`, etc.) → new items into overflow file
- [x] 7.7 Update bucket metadata: `oldestItemDate` / `newestItemDate` reflect only that file's items, `itemCount` = current total

### 7.3 commitReadStatus — same per-date bucket logic
- [x] 7.8 Apply per-date bucket grouping + read-merge-dedup-append-write pattern to `commitReadStatus()`, including overflow bucket suffix logic

### 7.4 Supporting functions
- [x] 7.9 Implement `locateLogFileByDate(siteId, date, cfg): string | null` — lists directory, returns file path matching this date with < 200 items
- [x] 7.10 Implement `findOverflowBucket(siteId, date, cfg, baseCount): string` — returns `date-{N}.json` where N starts from existing overflow count
- [x] 7.11 Update `getLatestLogFile()`: return the file with the highest date that has < 200 items (most recent date bucket with space), falling back to overflow if date bucket is full

### 7.5 Cleanup & Tests
- [x] 7.12 Update metadata: `oldestItemDate` / `newestItemDate` in file metadata reflect the bucket's actual date range
- [x] 7.13 Remove or repurpose `findOldestItemDate()` (no longer used as filename basis)
- [x] 7.14 Write unit tests: verify items from 3 dates land in 3 separate files, verify overflow creates `-1` suffix, verify dedup only within target bucket, verify same-item-id already in different bucket still gets written to current bucket
- [x] 7.15 Verify existing SPA read flow (`getLogItemsForSite`, `getReadItemsForSite`, `getAllReadItems`) still works with the new file naming (it discovers all `.json` in the directory, so should be no-impact)
