import { GitHubConfig } from '@/types/config';
import { createDefaultAppConfig, loadAppConfig, saveAppConfig } from './app-config';
import { utf8ToBase64, base64ToUtf8 } from './base64';
import { serializeOPML } from './opml';
import { RSSSite } from '@/types/rss';

/**
 * GitHub API client for browser-compatible GitHub operations
 * Uses GitHub REST API v3 for reading and writing files
 */
export interface GitHubClient {
  config: GitHubConfig;
  baseUrl: string;
}

export interface GitHubWriteCapability {
  canWrite: boolean;
  checkedAt?: string;
  reason?: string;
}

/**
 * Creates a GitHub API client
 *
 * @param config - GitHub configuration (owner, repo, branch, token)
 * @returns GitHub client object
 *
 * @example
 * const client = createGitHubClient({
 *   owner: 'username',
 *   repo: 'rss-data',
 *   branch: 'main',
 *   token: 'ghp_xxx'
 * });
 */
export function createGitHubClient(config: GitHubConfig): GitHubClient {
  return {
    config,
    baseUrl: `https://api.github.com/repos/${config.owner}/${config.repo}`
  };
}

/**
 * Build headers for GitHub API requests
 */
function buildHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  return headers;
}

function getGitHubBranch(config: GitHubConfig): string {
  return config.branch?.trim() || 'main';
}

function getGitHubConfigKey(config: GitHubConfig): string {
  return `${config.owner}/${config.repo}#${getGitHubBranch(config)}`;
}

/**
 * Read file from GitHub repository
 *
 * @param client - GitHub client
 * @param path - File path relative to repo root
 * @returns Parsed data or null if not found
 *
 * @example
 * const config = await readFromGitHub(client, 'subscriptions.opml');
 */
export async function readFromGitHub<T>(client: GitHubClient, path: string): Promise<T | null> {
  try {
    const url = `${client.baseUrl}/contents/${encodeURIComponent(path)}?ref=${getGitHubBranch(client.config)}`;

    const response = await fetch(url, {
      headers: buildHeaders(client.config.token)
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // GitHub returns base64 encoded content
    const content = base64ToUtf8(data.content);

    // Try to parse as JSON, fallback to raw text
    try {
      return JSON.parse(content) as T;
    } catch {
      return content as unknown as T;
    }
  } catch (error) {
    console.error(`Failed to read ${path} from GitHub:`, error);
    throw error;
  }
}

/**
 * List contents of a directory in the GitHub repository
 *
 * @param client - GitHub client
 * @param path - Directory path relative to repo root
 * @returns Array of file info objects (name, path, type)
 */
export async function listDirectory(client: GitHubClient, path: string): Promise<Array<{ name: string; path: string; type: string }>> {
  try {
    const url = `${client.baseUrl}/contents/${encodeURIComponent(path)}?ref=${getGitHubBranch(client.config)}`;
    const response = await fetch(url, {
      headers: buildHeaders(client.config.token)
    });

    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Failed to list ${path} from GitHub:`, error);
    return [];
  }
}

/**
 * Get the current SHA for a GitHub repository file.
 *
 * GitHub requires this SHA when updating an existing file.
 *
 * @param client - GitHub client
 * @param path - File path relative to repo root
 * @returns File SHA or undefined when the file does not exist
 */
export async function getGitHubFileSha(client: GitHubClient, path: string): Promise<string | undefined> {
  const response = await fetch(
    `${client.baseUrl}/contents/${encodeURIComponent(path)}?ref=${getGitHubBranch(client.config)}`,
    { headers: buildHeaders(client.config.token) }
  );

  if (response.status === 404) {
    return undefined;
  }

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const currentData = await response.json();
  return currentData.sha;
}

/**
 * Check whether the configured token appears able to write to the repo branch.
 *
 * This avoids creating test commits. GitHub exposes repository permissions for
 * authenticated requests, and branch lookup verifies the target branch exists.
 */
export async function checkGitHubWriteCapability(client: GitHubClient): Promise<GitHubWriteCapability> {
  const checkedAt = new Date().toISOString();

  if (!client.config.token) {
    return {
      canWrite: false,
      checkedAt,
      reason: 'GitHub token is required for write operations'
    };
  }

  try {
    const repoResponse = await fetch(client.baseUrl, {
      headers: buildHeaders(client.config.token)
    });

    if (!repoResponse.ok) {
      return {
        canWrite: false,
        checkedAt,
        reason: `GitHub repo check failed: ${repoResponse.status} ${repoResponse.statusText}`
      };
    }

    const repoData = await repoResponse.json();
    const permissions = repoData.permissions as
      | { admin?: boolean; maintain?: boolean; push?: boolean }
      | undefined;
    const canPush = !!(permissions?.admin || permissions?.maintain || permissions?.push);

    if (!canPush) {
      return {
        canWrite: false,
        checkedAt,
        reason: 'GitHub token cannot write to this repository'
      };
    }

    const branchResponse = await fetch(
      `${client.baseUrl}/branches/${encodeURIComponent(getGitHubBranch(client.config))}`,
      { headers: buildHeaders(client.config.token) }
    );

    if (!branchResponse.ok) {
      return {
        canWrite: false,
        checkedAt,
        reason: `GitHub branch check failed: ${branchResponse.status} ${branchResponse.statusText}`
      };
    }

    return {
      canWrite: true,
      checkedAt
    };
  } catch (error: any) {
    return {
      canWrite: false,
      checkedAt,
      reason: error.message || 'GitHub write capability check failed'
    };
  }
}

export function saveGitHubWriteCapability(
  config: GitHubConfig,
  capability: GitHubWriteCapability
): void {
  const appConfig = loadAppConfig();
  if (getGitHubConfigKey(appConfig.github) !== getGitHubConfigKey(config)) {
    return;
  }

  saveAppConfig(createDefaultAppConfig({
    ...appConfig,
    githubWriteCapability: capability
  }));
}

export function getStoredGitHubWriteCapability(config: GitHubConfig): GitHubWriteCapability | null {
  const appConfig = loadAppConfig();
  if (getGitHubConfigKey(appConfig.github) !== getGitHubConfigKey(config)) {
    return null;
  }

  return appConfig.githubWriteCapability;
}

export function clearGitHubWriteCapability(): void {
  const appConfig = loadAppConfig();
  saveAppConfig(createDefaultAppConfig({
    ...appConfig,
    githubWriteCapability: {
      canWrite: false,
      reason: 'GitHub write capability has not been checked'
    }
  }));
}


/**
 * Write file to GitHub repository
 *
 * @param client - GitHub client
 * @param path - File path relative to repo root
 * @param data - Data to write (will be JSON stringified)
 * @returns True if successful
 *
 * @example
 * const success = await writeToGitHub(client, 'logs/2025-12-21.json', logData);
 */

/**
 * Encode a string to base64 safely, handling Unicode characters
 */
export async function writeToGitHub<T>(client: GitHubClient, path: string, data: T): Promise<boolean> {
  try {
    if (!client.config.token) {
      throw new Error('GitHub token is required for write operations');
    }

    const sha = await getGitHubFileSha(client, path);

    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

    const response = await fetch(`${client.baseUrl}/contents/${encodeURIComponent(path)}`, {
      method: 'PUT',
      headers: buildHeaders(client.config.token),
      body: JSON.stringify({
        message: `Update ${path} via RSS Reader`,
        content: utf8ToBase64(content),
        branch: getGitHubBranch(client.config),
        sha: sha
      })
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error(`Failed to write ${path} to GitHub:`, error);
    return false;
  }
}

/**
 * Get configuration from localStorage
 *
 * @returns GitHub config from localStorage
 */
export function getStoredConfig(): GitHubConfig {
  const config = loadAppConfig().github;
  if (!config.owner || !config.repo) {
    throw new Error('Invalid GitHub configuration: missing owner or repo');
  }

  return config;
}

/**
 * Save configuration to localStorage
 *
 * @param config - GitHub configuration to save
 */
export function saveConfig(config: GitHubConfig): void {
  saveAppConfig(createDefaultAppConfig({
    ...loadAppConfig(),
    github: {
      ...config,
      branch: config.branch?.trim() || 'main'
    },
    githubWriteCapability: {
      canWrite: false,
      reason: 'GitHub write capability has not been checked'
    }
  }));
}

/**
 * Save subscription list as OPML to GitHub
 *
 * @param sites - Subscription sites to save
 * @returns True if successful
 */
export async function saveSubscriptionsOPML(sites: RSSSite[]): Promise<boolean> {
  try {
    const storedConfig = getStoredConfig();
    const client = createGitHubClient(storedConfig);
    const opml = serializeOPML(sites);
    return await writeToGitHub(client, 'subscriptions.opml', opml);
  } catch (error) {
    console.error('Failed to save subscriptions.opml:', error);
    throw error;
  }
}

/**
 * Check if GitHub configuration is available
 *
 * @returns True if config is available
 */
export function hasGitHubConfig(): boolean {
  try {
    const config = getStoredConfig();
    return !!(config.owner && config.repo);
  } catch {
    return false;
  }
}

// ── Backward-compatible wrappers (delegate to GitProvider) ──────────

import { createGitProvider } from './git-provider';
import { GitFileChange } from '@/types/git';

export async function readFromGitHubWithProvider(config: GitHubConfig, path: string): Promise<any> {
  const provider = createGitProvider(config);
  const file = await provider.readFile(path);
  if (!file) return null;
  try { return JSON.parse(file.content); } catch { return file.content; }
}

export async function writeToGitHubWithProvider(config: GitHubConfig, path: string, data: any, message?: string): Promise<boolean> {
  const provider = createGitProvider(config);
  const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  return provider.writeFile(path, content, message || `Update ${path} via RSS Reader`);
}

export async function listDirectoryWithProvider(config: GitHubConfig, path: string): Promise<Array<{ name: string; path: string; type: string }>> {
  const provider = createGitProvider(config);
  return provider.listDirectory(path);
}

export async function createCommitWithProvider(
  config: GitHubConfig,
  message: string,
  changes: Array<{ path: string; content: string; sha: string | null }>
): Promise<boolean> {
  const provider = createGitProvider(config);
  return provider.createCommit(message, changes as GitFileChange[]);
}

export async function deleteFileWithProvider(config: GitHubConfig, path: string, message: string): Promise<boolean> {
  const provider = createGitProvider(config);
  return provider.deleteFile(path, message);
}
