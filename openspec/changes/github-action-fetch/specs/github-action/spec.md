## ADDED Requirements

### Requirement: Scheduled feed fetching via GitHub Action
The system SHALL provide a GitHub Actions workflow that periodically fetches all configured RSS feeds and commits unread items as log files.

#### Scenario: Scheduled run triggers on cron
- **WHEN** the cron schedule fires (default: every 2 hours)
- **THEN** the action checks out the configured data branch from the target repo, reads `rss-config.json`, fetches all feeds, and commits new log files

#### Scenario: Manual run via workflow_dispatch
- **WHEN** a user triggers the workflow manually from the Actions tab
- **THEN** the action runs with the user-provided inputs (or defaults) and commits log files

### Requirement: Configurable action inputs
The workflow_dispatch SHALL accept inputs that override all runtime parameters.

#### Scenario: Override target branch
- **WHEN** user provides `branch: 'my-data-branch'` via workflow_dispatch
- **THEN** the action checks out and writes to `my-data-branch` instead of the default

#### Scenario: Override proxy mode
- **WHEN** user provides `proxy_mode: 'proxy-only'` via workflow_dispatch
- **THEN** the action skips direct fetch and uses only the configured proxy templates

#### Scenario: Override proxy templates
- **WHEN** user provides custom `proxy_templates` via workflow_dispatch
- **THEN** the action uses those proxies in the specified order instead of defaults

#### Scenario: Override timeout and pool size
- **WHEN** user provides `timeout_ms: 20000` and `pool_size: 8`
- **THEN** the action applies 20s per-feed timeout and fetches up to 8 feeds concurrently

#### Scenario: Target a different repository
- **WHEN** user provides `target_token`, `target_owner`, and `target_repo` via workflow_dispatch
- **THEN** the action reads config from and writes logs to the specified remote repository

### Requirement: Composite action for reusability
The system SHALL provide a composite action definition so other repositories can reference this action directly.

#### Scenario: External repo references the action
- **WHEN** another repo's workflow uses `owner/rss-git-log/.github/actions/fetch-feeds@main`
- **THEN** the action runs in that repo's context, fetching and committing logs

### Requirement: Node.js fetch script
The action SHALL use a standalone Node.js TypeScript script that does not depend on the browser SPA build.

#### Scenario: Script reads config from filesystem
- **WHEN** the script runs in the GitHub Actions runner
- **THEN** it reads `rss-config.json` directly from the checked-out working directory (no GitHub API call needed for config)

#### Scenario: Script commits logs via GitHub API
- **WHEN** feeds are fetched and parsed successfully
- **THEN** the script writes `logs/{siteId}/YYYY-MM-DD.json` files via GitHub REST API PUT, merging with existing files that have space (<200 items)

#### Scenario: One feed failure does not block others
- **WHEN** one feed URL fails (network error, timeout, bad XML)
- **THEN** the script logs the error and continues with remaining feeds

### Requirement: Config functions accept optional GitHubConfig
Functions in `log-file.ts` that internally read config from localStorage SHALL accept an optional `GitHubConfig` parameter for non-browser callers.

#### Scenario: Browser caller omits config
- **WHEN** browser code calls `commitAllFeedItems(siteId, name, items)` without a config
- **THEN** the function falls back to `getStoredConfig()` (localStorage) — backward compatible

#### Scenario: Node.js caller provides config
- **WHEN** the Node.js script calls `commitAllFeedItems(siteId, name, items, config)` with an explicit config
- **THEN** the function uses the provided config directly, bypassing localStorage
