## ADDED Requirements

### Requirement: Worker fetches and processes log files off the main thread

The system SHALL provide a Web Worker (`fetch-worker.ts`) that fetches log files from a git provider, parses them, and sends processed results back to the main thread.

#### Scenario: Worker receives config and siteId
- **WHEN** the main thread creates the worker and posts `{ config: GitProviderConfig, siteId: string }`
- **THEN** the worker SHALL create a `GitProvider` instance using the factory
- **THEN** the worker SHALL list the site's log directory via `provider.listDirectory()`

#### Scenario: Worker sends batch progress
- **WHEN** the worker finishes reading a batch of log files
- **THEN** it SHALL post `{ type: 'batch', items: LogItem[], historicalItems: Array<{itemId, title, pubDate}> }` to the main thread
- **THEN** the main thread SHALL call `addHistoricalItems` and `mergeGitHubReadStatus` for the batch
- **THEN** the main thread SHALL update the unread count to show progress

#### Scenario: Worker sends completion
- **WHEN** the worker finishes processing all log files
- **THEN** it SHALL post `{ type: 'done', githubItems: Map<string, LogItem> }` to the main thread
- **THEN** the main thread SHALL finalize the unread count

#### Scenario: Worker handles errors
- **WHEN** a log file read fails in the worker
- **THEN** the worker SHALL skip the file and continue with the remaining files
- **THEN** the worker SHALL NOT post an error message for individual file failures

### Requirement: Refresh uses worker instead of direct call

The system SHALL replace the direct `getLogItemsForSite` call in the refresh function with worker-based fetching.

#### Scenario: Refresh creates and terminates worker
- **WHEN** `refresh()` starts processing a site
- **THEN** it SHALL create a new Worker instance for that site
- **WHEN** the worker sends `done`
- **THEN** the main thread SHALL terminate the worker
- **THEN** it SHALL calculate the final unread count and update the site

#### Scenario: Page is still responsive during refresh
- **WHEN** the worker is processing log files
- **THEN** the main thread SHALL remain free to handle UI events and re-renders
- **THEN** the user SHALL be able to scroll, click, and interact with the page