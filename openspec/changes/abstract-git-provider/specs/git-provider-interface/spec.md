## ADDED Requirements

### Requirement: GitProvider interface defines common git operations

The system SHALL define a `GitProvider` interface with the following methods:
- `readFile(path)`: Read a file and return its content + SHA or null
- `writeFile(path, content, message)`: Write a file with commit message, return success
- `listDirectory(path)`: List files and directories, return tree items
- `getFileSha(path)`: Get the SHA of a file, return null if not found
- `createCommit(message, changes)`: Create a commit with multiple file changes atomically, return success

#### Scenario: Interface defines readFile
- **WHEN** a provider implements `readFile`
- **THEN** it SHALL accept a file path string
- **THEN** it SHALL return `{ content: string, sha: string }` on success
- **THEN** it SHALL return `null` if the file does not exist

#### Scenario: Interface defines writeFile
- **WHEN** a provider implements `writeFile`
- **THEN** it SHALL accept a path, file content string, and commit message
- **THEN** it SHALL return `true` on success, `false` on failure

#### Scenario: Interface defines listDirectory
- **WHEN** a provider implements `listDirectory`
- **THEN** it SHALL accept a directory path
- **THEN** it SHALL return an array of `{ name: string, path: string, type: 'file' | 'dir' }` items

#### Scenario: Interface defines getFileSha
- **WHEN** a provider implements `getFileSha`
- **THEN** it SHALL return the SHA string if the file exists, `null` otherwise

#### Scenario: Interface defines createCommit
- **WHEN** a provider implements `createCommit`
- **THEN** it SHALL accept a commit message and an array of `{ path, content, sha }` changes
- **THEN** it SHALL create a single commit containing all file changes
- **THEN** it SHALL return `true` on success, `false` on failure

### Requirement: GitHubProvider implements GitProvider

The system SHALL provide a `GitHubProvider` class that implements `GitProvider` using the GitHub REST API v3, matching the current behavior of `github-api.ts`.

#### Scenario: GitHubProvider reads files
- **WHEN** `readFile` is called with an existing file path
- **THEN** it SHALL fetch from `GET /repos/{owner}/{repo}/contents/{path}`
- **THEN** it SHALL decode and return the base64 content plus SHA

#### Scenario: GitHubProvider writes files
- **WHEN** `writeFile` is called with a valid path and content
- **THEN** it SHALL PUT to `PUT /repos/{owner}/{repo}/contents/{path}`
- **THEN** it SHALL include the file SHA for updates (existing files)

#### Scenario: GitHubProvider lists directory
- **WHEN** `listDirectory` is called
- **THEN** it SHALL fetch from `GET /repos/{owner}/{repo}/contents/{path}`
- **THEN** it SHALL filter and return only files and directories

#### Scenario: GitHubProvider creates batch commits
- **WHEN** `createCommit` is called with an array of file changes
- **THEN** it SHALL create blobs for each file via `POST /repos/{owner}/{repo}/git/blobs`
- **THEN** it SHALL create a tree via `POST /repos/{owner}/{repo}/git/trees`
- **THEN** it SHALL create a commit via `POST /repos/{owner}/{repo}/git/commits`
- **THEN** it SHALL update the branch ref via `PATCH /repos/{owner}/{repo}/git/refs/heads/{branch}`
- **THEN** it SHALL return `true` if all steps succeed

### Requirement: Provider factory creates correct provider

The system SHALL provide a `createGitProvider(config)` factory that returns the correct provider based on `config.provider`. The default provider SHALL be `github` for backward compatibility.

#### Scenario: Factory creates GitHubProvider by default
- **WHEN** `createGitProvider` is called with a config without `provider` field
- **THEN** it SHALL return a `GitHubProvider` instance

#### Scenario: Factory reads provider field
- **WHEN** `createGitProvider` is called with `{ provider: 'github', ... }`
- **THEN** it SHALL return a `GitHubProvider` instance

### Requirement: All consumers use provider interface

The system SHALL update all modules that currently import from `github-api.ts` to use the `GitProvider` interface via the factory, with no change in observable behavior.

#### Scenario: log-file.ts uses provider
- **WHEN** `log-file.ts` functions are called
- **THEN** they SHALL use `createGitProvider(config)` instead of `createGitHubClient(config)`
- **THEN** the resulting file reads, writes, and directory listings SHALL behave identically to before

#### Scenario: GitHub config without provider defaults to github
- **WHEN** an existing `GitHubConfig` (no `provider` field) is loaded from localStorage
- **THEN** `createGitProvider` SHALL default to `'github'`
- **THEN** the app SHALL work exactly as before
