## Why

All git repository operations (read/write files, list directory, get SHA) currently go through `github-api.ts` with a GitHub-specific implementation. Adding support for other providers like GitLab requires extracting a common interface and creating provider-specific implementations. This change lays the groundwork for provider interchangeability.

## What Changes

- Define a `GitProvider` interface with `readFile`, `writeFile`, `listDirectory`, `getFileSha` operations
- Refactor `github-api.ts` into a `GitHubProvider` class implementing the interface
- Create a provider factory to instantiate the correct provider from config
- Add a `provider` field to `AppConfig` to select which provider to use
- Update all consumers (`log-file.ts`, `useConfig.ts`, `scripts/fetch-feeds.ts`) to use the interface
- Keep the existing `GitHubConfig` as the default config type, make it extensible
- Backward compatible: existing configs continue to work unchanged

## Capabilities

### New Capabilities
- `git-provider-interface`: Abstract interface for git repository operations supporting interchangeable provider implementations

### Modified Capabilities
- *(none — no existing spec-level behavior changes)*

## Impact

- `src/utils/github-api.ts`: Refactored into `GitHubProvider` class
- `src/utils/git-provider.ts` (new): Interface definition and factory
- `src/utils/gitlab-provider.ts` (future): Not implemented yet, just interface
- `src/types/config.ts`: Add `provider` field to `AppConfig`, make config types provider-agnostic
- `src/utils/log-file.ts`: Use provider interface instead of direct GitHub calls
- `src/hooks/useConfig.ts`: Use provider interface
- `scripts/fetch-feeds.ts`: Use provider interface
- All imports from `github-api.ts` that use `createGitHubClient` will migrate to factory