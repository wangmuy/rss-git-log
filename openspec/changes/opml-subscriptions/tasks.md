## 1. OPML Utility Module

- [x] 1.1 Create `src/utils/opml.ts` with `parseOPML()` function that extracts sites from an OPML XML string, flattening nested outlines with folder-prefixed names, reading `app:color` and deduplicating by URL
- [x] 1.2 Implement `serializeOPML()` function that generates OPML 2.0 XML from an `RSSSite[]` array, including `app:color` attribute
- [x] 1.3 Create `src/utils/opml.test.ts` with tests for parsing (flat, nested, no-xmlUrl, color attribute, malformed XML), serialization (basic, empty, with colors), and round-trip consistency
- [x] 1.4 Ensure `parseOPML` and `serializeOPML` are pure functions (accept/return strings) — add linkedom DOMParser import guard for Node.js compatibility

## 2. Update Types

- [x] 2.1 Remove `settings` field from `RSSConfig` interface in `src/types/config.ts`
- [x] 2.2 Update `useConfig()` in `src/hooks/useConfig.ts` to read `subscriptions.opml` and call `parseOPML()` instead of reading `rss-config.json` and JSON-parsing

## 3. Update GitHub API Layer

- [x] 3.1 Replace `saveRSSConfig()` in `src/utils/github-api.ts` with `saveSubscriptionsOPML()` that serializes sites to OPML and writes to `subscriptions.opml`, handling both create (file doesn't exist yet) and update (file exists) via the existing `writeToGitHub` sha-less logic
- [x] 3.2 Update `readFromGitHub` calls that reference `rss-config.json` to reference `subscriptions.opml`

## 4. Update ConfigPage Validation

- [x] 4.1 Change validation check in `src/components/ConfigPage.tsx` from `readFromGitHub(client, 'rss-config.json')` to `readFromGitHub(client, 'subscriptions.opml')`

## 5. Update SubscriptionManager UI

- [x] 5.1 Add "Import OPML" button with `<input type="file" accept=".opml,.xml">` that reads the file, calls `parseOPML()`, adds sites to the list, and shows a warning for skipped duplicates
- [x] 5.2 Add "Export OPML" button that calls `serializeOPML()` on current sites and triggers a browser download via Blob + URL.createObjectURL
- [x] 5.3 Wire the "Save to GitHub" button to call `saveSubscriptionsOPML()` instead of `saveRSSConfig()`

## 6. Update ReaderLayout

- [x] 6.1 Update `src/components/ReaderLayout.tsx` to pass sites from OPML config (already in `RSSSite[]` format) and ensure `showReadItems` reads from localStorage `AppConfig`

## 7. Update fetch-feeds.ts

- [x] 7.1 Change `scripts/fetch-feeds.ts` to read `subscriptions.opml` from disk, parse with `parseOPML()` (via linkedom DOMParser), and use the extracted sites list

## 8. Update README

- [x] 8.1 Replace all references to `rss-config.json` with `subscriptions.opml` in README.md, including setup steps, config file section, and GitHub Action docs
- [x] 8.2 Remove `public/rss-config.example.json`
- [x] 8.3 Create `public/subscriptions.example.opml` with a sample subscription list (3-4 sites with colors, matching the current example data)

## 9. Cleanup

- [x] 9.1 Remove `saveRSSConfig()` function from `src/utils/github-api.ts` if no longer used elsewhere