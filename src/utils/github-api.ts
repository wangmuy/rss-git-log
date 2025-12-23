import { GitHubConfig } from '@/types/config';

/**
 * GitHub API client for browser-compatible GitHub operations
 * Uses GitHub REST API v3 for reading and writing files
 */
export interface GitHubClient {
  config: GitHubConfig;
  baseUrl: string;
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

/**
 * Read file from GitHub repository
 *
 * @param client - GitHub client
 * @param path - File path relative to repo root
 * @returns Parsed data or null if not found
 *
 * @example
 * const config = await readFromGitHub(client, 'rss-config.json');
 */
export async function readFromGitHub<T>(client: GitHubClient, path: string): Promise<T | null> {
  try {
    const url = `${client.baseUrl}/contents/${encodeURIComponent(path)}?ref=${client.config.branch || 'main'}`;

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
    const content = atob(data.content);

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
export async function writeToGitHub<T>(client: GitHubClient, path: string, data: T): Promise<boolean> {
  try {
    if (!client.config.token) {
      throw new Error('GitHub token is required for write operations');
    }

    // First, get the current file to get its SHA (required for updates)
    let sha: string | undefined;
    try {
      const getResponse = await fetch(
        `${client.baseUrl}/contents/${encodeURIComponent(path)}?ref=${client.config.branch || 'main'}`,
        { headers: buildHeaders(client.config.token) }
      );

      if (getResponse.ok) {
        const currentData = await getResponse.json();
        sha = currentData.sha;
      }
    } catch (e) {
      // File doesn't exist yet, that's fine
    }

    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

    const response = await fetch(`${client.baseUrl}/contents/${encodeURIComponent(path)}`, {
      method: 'PUT',
      headers: buildHeaders(client.config.token),
      body: JSON.stringify({
        message: `Update ${path} via RSS Reader`,
        content: btoa(content),
        branch: client.config.branch || 'main',
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
  const stored = localStorage.getItem('github-config');
  if (!stored) {
    throw new Error('No GitHub configuration found in storage');
  }

  const config = JSON.parse(stored) as GitHubConfig;
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
  localStorage.setItem('github-config', JSON.stringify(config));
}

/**
 * Save RSS configuration to GitHub
 *
 * @param config - RSS configuration to save
 * @returns True if successful
 */
export async function saveRSSConfig(config: any): Promise<boolean> {
  try {
    const storedConfig = getStoredConfig();
    const client = createGitHubClient(storedConfig);
    return await writeToGitHub(client, 'rss-config.json', config);
  } catch (error) {
    console.error('Failed to save RSS config:', error);
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
