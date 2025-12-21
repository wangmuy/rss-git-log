import * as gitrows from 'gitrows';
import { GitRowsConfig } from '@/types/config';

/**
 * Creates a GitRows client instance
 *
 * @param config - GitRows configuration
 * @returns GitRows client
 *
 * @example
 * const client = createGitRowsClient({
 *   owner: 'username',
 *   repo: 'rss-data',
 *   branch: 'main'
 * });
 */
export function createGitRowsClient(config: GitRowsConfig) {
  const path = `@github/${config.owner}/${config.repo}:${config.branch || 'main'}`;

  return gitrows({
    path,
    token: config.token,
    mode: 'fetch' // Use fetch mode for client-side reliability
  });
}

/**
 * Read data from GitRows
 *
 * @param client - GitRows client
 * @param path - File path relative to repo root
 * @returns Parsed data or null if not found
 *
 * @example
 * const config = await readFromGitRows(client, 'rss-config.json');
 */
export async function readFromGitRows<T>(client: any, path: string): Promise<T | null> {
  try {
    return await client.get(path);
  } catch (error: any) {
    // 404 means file doesn't exist (or is private without access)
    if (error.message?.includes('404') || error.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Write data to GitRows
 *
 * @param client - GitRows client
 * @param path - File path relative to repo root
 * @param data - Data to write
 * @returns True if successful
 *
 * @example
 * const success = await writeToGitRows(client, 'logs/2025-12-21.json', logData);
 */
export async function writeToGitRows<T>(client: any, path: string, data: T): Promise<boolean> {
  try {
    await client.put(path, data);
    return true;
  } catch (error: any) {
    console.error(`GitRows write failed for ${path}:`, error);
    return false;
  }
}

/**
 * Get environment configuration
 *
 * @returns GitRows config from environment variables
 */
export function getEnvConfig(): GitRowsConfig {
  const owner = import.meta.env.VITE_GITHUB_OWNER;
  const repo = import.meta.env.VITE_GITHUB_REPO;
  const branch = import.meta.env.VITE_GITHUB_BRANCH;
  const token = import.meta.env.VITE_GITHUB_TOKEN;

  if (!owner || !repo) {
    throw new Error('Missing required environment variables: VITE_GITHUB_OWNER, VITE_GITHUB_REPO');
  }

  return { owner, repo, branch, token };
}

/**
 * Check if GitRows configuration is available
 *
 * @returns True if config is available
 */
export function hasGitRowsConfig(): boolean {
  const owner = import.meta.env.VITE_GITHUB_OWNER;
  const repo = import.meta.env.VITE_GITHUB_REPO;
  return !!(owner && repo);
}