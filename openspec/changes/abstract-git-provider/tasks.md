## 1. Core Interface & GitHubProvider

- [ ] 1.1 Define `GitProvider` interface in `src/utils/git-provider.ts` with `readFile`, `writeFile`, `listDirectory`, `getFileSha`, `createCommit`
- [ ] 1.2 Define file/directory/change result types (`GitFile`, `GitTreeItem`, `GitFileChange`) in `src/types/git.ts`
- [ ] 1.3 Create `GitHubProvider` class implementing `GitProvider` — move single-file ops from `github-api.ts`
- [ ] 1.4 Implement `GitHubProvider.createCommit` using Git Data API (blobs → tree → commit → ref)
- [ ] 1.5 Add `provider` field to config types in `src/types/config.ts` with default `'github'`
- [ ] 1.6 Add `createGitProvider(config)` factory function
- [ ] 1.7 Keep backward-compatible wrappers for incremental migration

## 2. Update Consumers

- [ ] 2.1 Update `src/utils/log-file.ts` to use `GitProvider` via factory — use `createCommit` for batch writes
- [ ] 2.2 Update `src/hooks/useConfig.ts` to use `GitProvider` via factory
- [ ] 2.3 Update `scripts/fetch-feeds.ts` to use `GitProvider` via factory
- [ ] 2.4 Update `src/utils/github-api.test.ts` to test via provider interface

## 3. Cleanup

- [ ] 3.1 Remove `github-api.ts` standalone functions fully replaced by `GitHubProvider`
- [ ] 3.2 Verify all imports point to `git-provider.ts` instead of `github-api.ts`
- [ ] 3.3 Full build & test pass