## ADDED Requirements

### Requirement: Add new RSS feed subscription
The system SHALL provide UI for adding new RSS feed subscriptions with name, URL, and optional color.

#### Scenario: Successful subscription add
- **WHEN** user enters valid feed URL and name, then submits
- **THEN** new subscription is added to config and saved to GitHub

#### Scenario: Validate feed URL
- **WHEN** user enters invalid URL format
- **THEN** system shows validation error message

#### Scenario: Cancel add operation
- **WHEN** user opens add form and then cancels
- **THEN** form closes without saving

### Requirement: Edit existing RSS feed subscription
The system SHALL provide UI for editing existing subscription name, URL, or color.

#### Scenario: Successful subscription edit
- **WHEN** user modifies subscription fields and saves
- **THEN** subscription is updated in config and saved to GitHub

#### Scenario: Edit with invalid URL
- **WHEN** user enters invalid URL during edit
- **THEN** system shows validation error and doesn't save

### Requirement: Delete RSS feed subscription
The system SHALL provide UI for deleting subscriptions with confirmation.

#### Scenario: Confirm deletion
- **WHEN** user deletes subscription and confirms
- **THEN** subscription is removed from config and saved to GitHub

#### Scenario: Cancel deletion
- **WHEN** user deletes subscription but cancels confirmation
- **THEN** subscription remains in config unchanged

### Requirement: Save subscription changes to GitHub
The system SHALL sync subscription changes back to GitHub rss-config.json file.

#### Scenario: Auto-save on change
- **WHEN** subscription is added, edited, or deleted
- **THEN** updated config is committed to GitHub via API

#### Scenario: Handle save failure
- **WHEN** GitHub API write fails
- **THEN** system shows error message and keeps local changes

### Requirement: Refresh feeds after config change
The system SHALL automatically refresh feed data after subscription changes.

#### Scenario: Reload feeds after add
- **WHEN** new subscription is added and saved
- **THEN** feeds are reloaded and new feed appears in sidebar

#### Scenario: Reload feeds after edit
- **WHEN** subscription is edited and saved
- **THEN** feeds are reloaded with updated information
