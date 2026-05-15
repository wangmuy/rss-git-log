## Context

`github-api.ts` exports standalone functions (`createGitHubClient`, `readFromGitHub`, `writeToGitHub`, `listDirectory`, `getGitHubFileSha`) that are imported directly by multiple modules. Adding a second provider means every import site and every function signature needs to change. A clean interface + factory pattern keeps the API surface stable regardless of provider.

## Goals / Non-Goals

**Goals:**
- Define a minimal `GitProvider` interface covering all current git repo operations
- Refactor `github-api.ts` into a `GitHubProvider` class
- Add provider factory and selection config
- Update all consumers to use the interface
- 100% backward compatibility with existing GitHub configs

**Non-Goals:**
- Implementing a GitLab or other provider (future work)
- Changing the data format or commit strategy
- Changing the CORS/feed fetching layer

## Decisions

### 1. Interface shape: class-based with simple methods
```
interface GitFileChange {
  path: string;
  content: string;
  sha: string | null; // null for new files
}

interface GitProvider {
  readFile(path: string): Promise<GitFile | null>;
  writeFile(path: string, content: string, message: string): Promise<boolean>;
  listDirectory(path: string): Promise<GitTreeItem[]>;
  getFileSha(path: string): Promise<string | null>;
  createCommit(message: string, changes: GitFileChange[]): Promise<boolean>;
}
```

`createCommit` bundles multiple file changes into a single commit — the key optimization for the commit flow where N date buckets currently produce N separate PUT requests. Providers implement this via their batch API:
- **GitHub**: Git Data API (create blobs → create tree → create commit → update branch ref)
- **GitLab**: Commits API (`POST /projects/{id}/repository/commits` with `actions` array)

`writeFile` is kept as a convenience for single-file writes (e.g., config saves). The commit flow will use `createCommit` to batch all changed files into one API call.

**Alternatives considered:**
- Functional approach (pass client to each function) — harder to swap providers at runtime
- Batch only (no `writeFile`) — breaks single-file write use cases like config saves
- Plugin-based — over-engineered for 2 providers

### 2. Config: add `provider` field to `GitHubConfig`
```
interface GitProviderConfig {
  provider: 'github';
  owner: string;
  repo: string;
  branch: string;
  token?: string;
}
```
This keeps the config structure mostly unchanged. When GitLab is added, a new `GitLabConfig` with `provider: 'gitlab'` will be created.

### 3. Factory: `createGitProvider(config)`
Single entry point that returns the correct provider implementation based on `config.provider`. Future providers just add a new case.

### 4. Backward compatibility
Existing `GitHubConfig` without a `provider` field defaults to `'github'`. All provider methods have the same signatures as the current standalone functions.

## Risks / Trade-offs

- **[Refactoring scope]** All imports of `github-api.ts` functions need updating. Mitigated by grep listing all import sites and changing them systematically.
- **[Scripts]** `scripts/fetch-feeds.ts` imports directly from `github-api.ts`. Needs the same treatment.
- **[Testing]** Existing tests that mock `github-api.ts` functions need updating to mock the provider interface instead.