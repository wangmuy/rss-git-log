# Standards (Advisory)

## Style

- 2-space indentation, single quotes
- Semicolons required
- Line length: PREFER under 100 characters
- Trailing commas in multiline objects/arrays

## Naming

| Artifact | Convention | Example |
|----------|-----------|---------|
| Components | PascalCase file + function | `FeedList.tsx` → `function FeedList()` |
| Hooks | camelCase, `use` prefix | `useCommit.ts` |
| Utilities | camelCase file + function | `feed-parser.ts` → `parseXMLFeed()` |
| Types/Interfaces | PascalCase, no `I` prefix | `RSSFeed`, `GitFileChange` |
| Tests | Co-located with source, `.test` suffix | `url.test.ts`, `FeedListPane.test.tsx` |
| Git commits | Short imperative subject lines | "Add sidebar layout" |

## Testing

- Unit tests SHOULD cover all pure utility functions
- Component tests SHOULD cover rendering and user interactions
- Integration tests SHOULD cover cross-cutting behavior (store + component interaction)
- Use `describe`/`it` blocks for test organization
- Mock external APIs (GitHub, fetch) in unit tests

## Best Practices

- PREFER pure functions in `utils/` — no side effects, no module state
- SHOULD use `GitProvider` interface instead of `GitHubProvider` directly
- SHOULD use `GitHubConfig` parameter injection (optional param) over `getStoredConfig()` calls in shared modules consumed by Node.js
- PREFER `unknown` over `any` — narrow with type guards
- SHOULD group imports: React → third-party → local modules (blank-line separated)
- PREFER function declarations over arrow functions for component definitions

## Project Idioms

- Config is always versioned (`AppConfig` has `v1` field for future migration)
- Barrel exports: `src/types/index.ts` re-exports all type modules
- Path alias `@/` maps to `src/` — use for all imports within `src/`
- Worker files live in `src/workers/` and use `Comlink`-style messaging
- Store implementations implement the `ItemStore` interface from `src/stores/item-store.ts`