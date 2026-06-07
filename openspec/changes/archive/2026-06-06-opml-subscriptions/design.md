## Context

Currently the SPA stores its subscription list in `rss-config.json` on a GitHub data branch, a JSON file bundling both the site list and reader settings. The GitHub Action (`fetch-feeds.ts`) also reads this file from disk. We are replacing the subscription portion with OPML, a standard XML format for RSS subscription lists, and moving settings entirely to localStorage.

## Goals / Non-Goals

**Goals:**
- Store subscriptions in `subscriptions.opml` on the GitHub data branch
- Parse OPML in the browser (DOMParser) and in Node.js (linkedom) using the same abstraction pattern as `feed-parser.ts`
- Serialize the subscription list to OPML when saving to GitHub
- Provide "Import OPML" via file upload with flattening + dedup
- Provide "Export OPML" via browser download
- Remove reader settings from the GitHub file (localStorage only)

**Non-Goals:**
- No backward compatibility with `rss-config.json`
- No support for nested OPML folder hierarchy in the UI (flattened on import)
- No migration utility

## Decisions

### 1. OPML parsing — pair of utility functions in `src/utils/`
Decision: Create `src/utils/opml.ts` with `parseOPML(xml: string): RSSSite[]` and `serializeOPML(sites: RSSSite[]): string`.

Rationale:
- Follows the existing pattern in `feed-parser.ts` which abstracts DOMParser vs linkedom
- `parseOPML` extracts `<outline>` elements with `xmlUrl`, reads `title`/`text` attributes, reads `app:color`, and flattens nested `<outline>` groups by prefixing `title` with the folder path (e.g., "Tech / TechCrunch")
- `serializeOPML` builds the XML document structure with the OPML 2.0 header and `app:color` on each `<outline>`
- Both functions are pure — no DOM/environment dependency inside them; the caller passes a parsed Document

### 2. How `app:color` is represented in XML
Decision: Use a literal attribute `app:color` on `<outline>`. No XML namespace declaration needed — OPML allows arbitrary attributes.

```xml
<outline type="rss" xmlUrl="https://news.ycombinator.com/rss"
         text="Hacker News" title="Hacker News" app:color="#ff6600"/>
```

Rationale: Simple, no namespace machinery, visually clear. This is a common pattern in OPML extensions (e.g., feed readers often add custom attributes like `newsgator:markRead`).

### 3. OPML flattening strategy
Decision: When an `<outline>` element without `xmlUrl` is encountered, treat it as a folder. Its child `<outline>` elements with `xmlUrl` get their `title` prefixed with `folderName + " / "`. Recursively (folders within folders produce "A / B / C").

```xml
<outline text="Tech">
  <outline type="rss" xmlUrl="https://tc.com/feed" title="TechCrunch"/>
  <outline text="Mobile">
    <outline type="rss" xmlUrl="https://9to5mac.com/feed" title="9to5Mac"/>
  </outline>
</outline>
```
→ `"Tech / TechCrunch"`, `"Tech / Mobile / 9to5Mac"`

Rationale: Preserves grouping information without requiring a folder concept in the flat UI. Easy to reverse if folder support is added later.

### 4. Duplicate detection
Decision: During import, skip any `<outline>` whose `xmlUrl` matches an existing site's `url` (case-insensitive comparison). Collect skipped URLs and show a single warning message after import completes listing what was skipped.

### 5. File upload for import
Decision: Use `<input type="file" accept=".opml,.xml">`. Read the file as text, pass to `parseOPML`. No server upload, no CORS issues.

### 6. Export as browser download
Decision: Create a Blob from the serialized OPML, use `URL.createObjectURL` + `<a download>`. No server round-trip.

### 7. The `RSSConfig` type and `useConfig`
Decision: Remove the `settings` field from the `RSSConfig` interface. The `useConfig` hook now calls `readFromGitHub(client, 'subscriptions.opml')`, parses the OPML text, and returns `{ sites: RSSSite[] }`. Reader settings (`showReadItems`, `autoCommit`, `commitInterval`) are read from `AppConfig` in localStorage instead.

### 8. `fetch-feeds.ts` reads OPML
Decision: The script reads `subscriptions.opml` from disk (same directory as before), parses it with the Node.js path (linkedom DOMParser), and extracts sites. The CORS policy and other config continue coming from environment variables.

### 9. ConfigPage validation
Decision: After GitHub credentials are saved, the page verifies `subscriptions.opml` is readable via `readFromGitHub(client, 'subscriptions.opml')` instead of `rss-config.json`.

## Risks / Trade-offs

- **[Breaking change]** Existing users with `rss-config.json` will see "No RSS sites configured" until they manually create `subscriptions.opml`. Mitigation: The README will be updated to document the new format. Since the user base is self-hosted, this is acceptable.
- **[No settings sync]** Reader settings like `showReadItems` and `autoCommit` are now device-local. Users who switch devices lose these preferences. Mitigation: Acceptable — these are UI preferences, not data. The subscription list (the critical data) remains synced.
- **[OPML with colors not standard]** Other RSS readers importing the exported OPML will see the `app:color` attribute but ignore it (unknown attributes are silently dropped in XML). The color data is preserved for round-trips within this app.