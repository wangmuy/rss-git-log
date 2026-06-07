## Why

RSS subscription lists are conventionally exchanged as OPML. Using a custom JSON format (`rss-config.json`) ties subscription data to this reader's internal schema, making it non-portable. Changing to OPML means subscriptions can be imported from and exported to any RSS reader, and the data branch becomes interoperable.

## What Changes

- **BREAKING**: `rss-config.json` is no longer read or written. Subscriptions live in `subscriptions.opml` on the GitHub data branch.
- **BREAKING**: Reader settings (`showReadItems`, `autoCommit`, `commitInterval`) move entirely to localStorage. They are no longer synced to the GitHub data branch.
- **New**: OPML parser and serializer for the subscription list
- **New**: "Import OPML" button (file upload) in the subscription manager
- **New**: "Export OPML" button (browser download) in the subscription manager
- **Modified**: "Save to GitHub" writes `subscriptions.opml` instead of `rss-config.json`
- **Modified**: Config page validation checks for `subscriptions.opml` existence
- **Modified**: `fetch-feeds.ts` reads `subscriptions.opml` instead of `rss-config.json`
- **Custom attribute**: `app:color="#ff6600"` on OPML `<outline>` elements for feed color

## Capabilities

### New Capabilities
- `opml-storage`: Reading subscriptions from and writing subscriptions to `subscriptions.opml` on the GitHub data branch
- `opml-import`: Importing an OPML file via browser file upload, flattening nested outlines with folder-prefixed names, skipping duplicate URLs with a warning
- `opml-export`: Generating an OPML XML file from the current subscription list and triggering a browser download

### Modified Capabilities
*(No existing active specs are modified. The archived `subscription-ui` and `github-sync` specs from the original SPA change are superseded by this new format.)*

## Impact

- `src/utils/github-api.ts` — `saveRSSConfig` replaced with OPML read/write functions
- `src/hooks/useConfig.ts` — reads and parses `subscriptions.opml` instead of `rss-config.json`
- `src/components/ConfigPage.tsx` — validation check changes from `rss-config.json` to `subscriptions.opml`
- `src/components/ReaderLayout.tsx` — passes OPML data instead of JSON config
- `src/components/SubscriptionManager.tsx` — adds Import/Export buttons, save writes OPML
- `scripts/fetch-feeds.ts` — reads and parses `subscriptions.opml` from disk
- `src/types/config.ts` — `RSSConfig` interface: `settings` field is removed (reader settings live in localStorage `AppConfig` only)
- No new dependencies (OPML is XML, handled by existing DOMParser/linkedom stack)
