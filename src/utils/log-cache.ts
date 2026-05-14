import { GitHubConfig } from '@/types/config';
import { SiteLogData } from '@/types/log';
import { loadAppConfig } from './app-config';
import { compressedGetItem, compressedSetItem } from './compressed-storage';

const LOG_CACHE_STORAGE_KEY = 'rss-reader-log-cache';

interface CachedLogEntry {
  repoKey: string;
  siteId: string;
  path: string;
  fetchedAt: string;
  itemCount: number;
  data: SiteLogData;
}

type CachedLogEntries = Record<string, CachedLogEntry>;

function getRepoKey(config: GitHubConfig): string {
  return `${config.owner}/${config.repo}#${config.branch || 'main'}`;
}

function getCacheKey(config: GitHubConfig, siteId: string, path: string): string {
  return `${getRepoKey(config)}::${siteId}::${path}`;
}

const hasLocalStorage = typeof localStorage !== 'undefined';

function loadCache(): CachedLogEntries {
  if (!hasLocalStorage) return {};
  const stored = compressedGetItem(LOG_CACHE_STORAGE_KEY);
  if (!stored) return {};

  try {
    return JSON.parse(stored) as CachedLogEntries;
  } catch {
    return {};
  }
}

function saveCache(entries: CachedLogEntries): void {
  if (!hasLocalStorage) return;
  compressedSetItem(LOG_CACHE_STORAGE_KEY, JSON.stringify(entries));
}

export function getCachedLogFile(
  config: GitHubConfig,
  siteId: string,
  path: string
): SiteLogData | null {
  const entry = loadCache()[getCacheKey(config, siteId, path)];
  return entry?.data ?? null;
}

export function cacheLogFile(
  config: GitHubConfig,
  siteId: string,
  path: string,
  data: SiteLogData
): void {
  if (!hasLocalStorage) return;

  const appConfig = loadAppConfig();
  if (appConfig.localCache.filesPerSite === 0) return;

  const stripped: SiteLogData = {
    ...data,
    items: data.items.map(({ itemId, title, pubDate, readAt }) => ({
      itemId, title, pubDate, readAt
    }))
  };

  const entries = loadCache();
  entries[getCacheKey(config, siteId, path)] = {
    repoKey: getRepoKey(config),
    siteId,
    path,
    fetchedAt: new Date().toISOString(),
    itemCount: data.items.length,
    data: stripped
  };

  saveCache(entries);
  pruneCachedLogFilesForSite(config, siteId, appConfig.localCache.filesPerSite);
}

export function pruneCachedLogFilesForSite(
  config: GitHubConfig,
  siteId: string,
  filesPerSite?: number
): void {
  if (!hasLocalStorage) return;
  const limit = filesPerSite ?? loadAppConfig().localCache.filesPerSite;
  const entries = loadCache();
  const repoKey = getRepoKey(config);
  const matchingEntries = Object.entries(entries)
    .filter(([, entry]) => entry.repoKey === repoKey && entry.siteId === siteId && entry.path)
    .sort(([, a], [, b]) => b.path.localeCompare(a.path));

  for (const [cacheKey] of matchingEntries.slice(Math.max(limit, 0))) {
    delete entries[cacheKey];
  }

  saveCache(entries);
}

export function clearCachedLogFilesForSite(config: GitHubConfig, siteId: string): void {
  if (!hasLocalStorage) return;
  const entries = loadCache();
  const repoKey = getRepoKey(config);
  for (const [cacheKey, entry] of Object.entries(entries)) {
    if (entry.repoKey === repoKey && entry.siteId === siteId) {
      delete entries[cacheKey];
    }
  }
  saveCache(entries);
}

export function pruneCachedLogFiles(config: GitHubConfig): void {
  if (!hasLocalStorage) return;
  const entries = loadCache();
  const repoKey = getRepoKey(config);
  const siteIds = new Set(
    Object.values(entries)
      .filter(entry => entry.repoKey === repoKey)
      .map(entry => entry.siteId)
  );

  for (const siteId of siteIds) {
    pruneCachedLogFilesForSite(config, siteId);
  }
}
