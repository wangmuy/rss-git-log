/**
 * RSS Reader Configuration
 */
export interface RSSConfig {
  sites: RSSSite[];
  settings: ReaderSettings;
}

/**
 * Reader Settings - user preferences
 */
export interface ReaderSettings {
  showReadItems: boolean;
  autoCommit: boolean;
  commitInterval: number; // in seconds
}

/**
 * GitRows Configuration
 */
export interface GitRowsConfig {
  owner: string;
  repo: string;
  branch?: string;
  token?: string;
}

/**
 * Environment Variables
 */
export interface EnvConfig {
  VITE_GITHUB_OWNER: string;
  VITE_GITHUB_REPO: string;
  VITE_GITHUB_BRANCH?: string;
  VITE_GITHUB_TOKEN?: string;
}