## 1. Core Interface & GitHubProvider

- [x] 1.1 Define `GitProvider` interface in `src/utils/git-provider.ts` with `readFile`, `writeFile`, `listDirectory`, `getFileSha`, `createCommit`
- [x] 1.2 Define file/directory/change result types (`GitFile`, `GitTreeItem`, `GitFileChange`) in `src/types/git.ts`
- [x] 1.3 Create `GitHubProvider` class implementing `GitProvider` — move single-file ops from `github-api.ts`
- [x] 1.4 Implement `GitHubProvider.createCommit` using Git Data API (blobs → tree → commit → ref)
- [x] 1.5 Add `provider` field to config types in `src/types/config.ts` with default `'github'`
- [x] 1.6 Add `createGitProvider(config)` factory function
- [x] 1.7 Keep backward-compatible wrappers for incremental migration

## 2. Update Consumers

- [x] 2.1 Update `src/utils/log-file.ts` to use `GitProvider` via factory — use `createCommit` for batch writes
- [x] 2.2 Update `src/hooks/useConfig.ts` to use `GitProvider` via factory
- [x] 2.3 Update `scripts/fetch-feeds.ts` to use `GitProvider` via factory
- [x] 2.4 Update `src/utils/github-api.test.ts` to test via provider interface

## 3. Cleanup

- [x] 3.1 Remove `github-api.ts` standalone functions fully replaced by `GitHubProvider`
- [x] 3.2 Verify all imports point to `git-provider.ts` instead of `github-api.ts`
- [x] 3.3 Full build & test pass