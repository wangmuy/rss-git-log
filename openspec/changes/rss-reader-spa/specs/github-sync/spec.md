## ADDED Requirements

### Requirement: Read file from GitHub repository
The system SHALL read files from GitHub repo using REST API v3 with native fetch, handling base64 decoding.

#### Scenario: Read existing config file
- **WHEN** system requests rss-config.json from GitHub repo
- **THEN** system returns parsed JSON content or null if file doesn't exist (404)

#### Scenario: Read with authentication
- **WHEN** GitHub token is provided in config
- **THEN** system includes Authorization header in request

#### Scenario: Handle 404 gracefully
- **WHEN** requested file does not exist in repo
- **THEN** system returns null without throwing error

### Requirement: Write file to GitHub repository
The system SHALL write/update files to GitHub repo using REST API v3 PUT endpoint with base64 encoding.

#### Scenario: Create new file
- **WHEN** file doesn't exist and system writes content
- **THEN** file is created at specified path in repo with commit message

#### Scenario: Update existing file
- **WHEN** file exists and system writes updated content
- **THEN** file is updated using SHA from previous read, with new commit message

#### Scenario: Base64 encoding
- **WHEN** system writes JSON data to GitHub
- **THEN** content is base64-encoded before sending to API

### Requirement: Create GitHub API client with native fetch
The system SHALL use native browser fetch API (no external HTTP libraries) for all GitHub API interactions.

#### Scenario: Build client from config
- **WHEN** system provides owner, repo, branch, and optional token
- **THEN** system creates client object with correct base URL

#### Scenario: Handle API errors
- **WHEN** GitHub API returns error (401, 403, 429, 500)
- **THEN** system returns appropriate error message to user

### Requirement: Store GitHub config in localStorage
The system SHALL store GitHub repository configuration (owner, repo, branch, token) in browser LocalStorage instead of .env files.

#### Scenario: Save config from UI
- **WHEN** user enters GitHub config in SetupPage
- **THEN** config is saved to LocalStorage and used for subsequent API calls

#### Scenario: Load config on startup
- **WHEN** application initializes
- **THEN** GitHub config is loaded from LocalStorage if available
