import { AppConfig, AutoCommitConfig, CORSPolicy, GitHubConfig, LocalCacheConfig } from '@/types/config';
import { DEFAULT_CORS_POLICY } from './rss-parser';

const APP_CONFIG_STORAGE_KEY = 'rss-reader-app-config';
const DEFAULT_GITHUB_CONFIG: GitHubConfig = {
  owner: '',
  repo: '',
  branch: 'rss-reader-data',
  token: undefined
};

const DEFAULT_AUTO_COMMIT: AutoCommitConfig = {
  enabled: false,
  intervalSeconds: 300
};

const DEFAULT_LOCAL_CACHE: LocalCacheConfig = {
  filesPerSite: 30
};

export const DEFAULT_APP_CONFIG: AppConfig = {
  version: 1,
  github: DEFAULT_GITHUB_CONFIG,
  githubWriteCapability: {
    canWrite: false,
    reason: 'GitHub write capability has not been checked'
  },
  corsPolicy: DEFAULT_CORS_POLICY,
  autoCommit: DEFAULT_AUTO_COMMIT,
  localCache: DEFAULT_LOCAL_CACHE
};

export function createDefaultAppConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    ...DEFAULT_APP_CONFIG,
    ...overrides,
    github: {
      ...DEFAULT_APP_CONFIG.github,
      ...overrides.github
    },
    githubWriteCapability: {
      ...DEFAULT_APP_CONFIG.githubWriteCapability,
      ...overrides.githubWriteCapability
    },
    corsPolicy: {
      ...DEFAULT_APP_CONFIG.corsPolicy,
      ...overrides.corsPolicy,
      proxies: overrides.corsPolicy?.proxies ?? DEFAULT_APP_CONFIG.corsPolicy.proxies
    },
    autoCommit: {
      ...DEFAULT_APP_CONFIG.autoCommit,
      ...overrides.autoCommit
    },
    localCache: {
      ...DEFAULT_APP_CONFIG.localCache,
      ...overrides.localCache
    }
  };
}

export function validateGitHubConfig(config: GitHubConfig): string[] {
  const errors: string[] = [];

  if (!config.owner.trim()) errors.push('GitHub owner is required');
  if (!config.repo.trim()) errors.push('GitHub repository is required');
  if (!config.branch.trim()) errors.push('GitHub branch is required');

  return errors;
}

export function validateCORSPolicy(policy: CORSPolicy): string[] {
  const errors: string[] = [];

  if (!['direct-only', 'proxy-fallback', 'proxy-only'].includes(policy.mode)) {
    errors.push('CORS mode is invalid');
  }

  if (!Number.isFinite(policy.timeoutMs) || policy.timeoutMs < 1000) {
    errors.push('CORS timeout must be at least 1000ms');
  }

  if (policy.mode !== 'direct-only' && policy.proxies.length === 0) {
    errors.push('At least one CORS proxy is required for proxy modes');
  }

  for (const proxy of policy.proxies) {
    if (!proxy.name.trim()) errors.push('CORS proxy name is required');
    if (!proxy.urlTemplate.includes('{url}')) {
      errors.push(`${proxy.name || 'CORS proxy'} URL template must include {url}`);
    }
  }

  return errors;
}

export function validateAutoCommit(config: AutoCommitConfig): string[] {
  const errors: string[] = [];

  if (!Number.isFinite(config.intervalSeconds) || config.intervalSeconds < 30) {
    errors.push('Auto-commit interval must be at least 30 seconds');
  }

  return errors;
}

export function validateLocalCache(config: LocalCacheConfig): string[] {
  const errors: string[] = [];

  if (!Number.isInteger(config.filesPerSite) || config.filesPerSite < 0 || config.filesPerSite > 30) {
    errors.push('Local cache files per site must be between 0 and 30');
  }

  return errors;
}

export function validateAppConfig(config: AppConfig): string[] {
  return [
    ...validateGitHubConfig(config.github),
    ...validateCORSPolicy(config.corsPolicy),
    ...validateAutoCommit(config.autoCommit),
    ...validateLocalCache(config.localCache)
  ];
}

export function loadAppConfig(): AppConfig {
  const stored = localStorage.getItem(APP_CONFIG_STORAGE_KEY);
  if (!stored) {
    return createDefaultAppConfig();
  }

  try {
    const parsed = JSON.parse(stored) as Partial<AppConfig>;
    return createDefaultAppConfig(parsed);
  } catch {
    return createDefaultAppConfig();
  }
}

export function saveAppConfig(config: AppConfig): void {
  localStorage.setItem(APP_CONFIG_STORAGE_KEY, JSON.stringify(config));
}

export function resetAppConfig(): AppConfig {
  const config = createDefaultAppConfig();
  saveAppConfig(config);
  return config;
}

export function hasValidRequiredGitHubConfig(config: AppConfig = loadAppConfig()): boolean {
  return validateGitHubConfig(config.github).length === 0;
}

const ALL_STORAGE_KEYS = [
  'rss-reader-app-config',
  'rss-reader-session',
  'rss-reader-log-cache'
];

export function clearAllLocalStorage(): void {
  ALL_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
}
