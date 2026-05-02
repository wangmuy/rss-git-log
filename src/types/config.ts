import { RSSSite } from './rss';

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

export type CORSPolicyMode = 'direct-only' | 'proxy-fallback' | 'proxy-only';

export interface CORSProxyConfig {
  name: string;
  urlTemplate: string;
}

export interface CORSPolicy {
  mode: CORSPolicyMode;
  proxies: CORSProxyConfig[];
  timeoutMs: number;
}

/**
 * GitHub Configuration
 */
export interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
  token?: string;
}

export interface GitHubWriteCapabilityState {
  canWrite: boolean;
  checkedAt?: string;
  reason?: string;
}

export interface AutoCommitConfig {
  enabled: boolean;
  intervalSeconds: number;
}

export interface LocalCacheConfig {
  filesPerSite: number;
}

export interface AppConfig {
  version: 1;
  github: GitHubConfig;
  githubWriteCapability: GitHubWriteCapabilityState;
  corsPolicy: CORSPolicy;
  autoCommit: AutoCommitConfig;
  localCache: LocalCacheConfig;
}
