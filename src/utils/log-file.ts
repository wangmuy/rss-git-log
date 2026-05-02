import { createGitHubClient, readFromGitHub, writeToGitHub, getStoredConfig } from './github-api';
import { LogItem, SiteLogData } from '@/types/log';
import { cacheLogFile, getCachedLogFile, pruneCachedLogFilesForSite } from './log-cache';

const MAX_LOG_ITEMS_PER_FILE = 200;

/**
 * Generate site log file path for a specific date
 *
 * @param siteId - Site identifier
 * @param date - Date object (defaults to today)
 * @returns Log file path: logs/{siteId}/YYYY-MM-DD.json
 *
 * @example
 * getLogFilePath('https://example.com/rss') // 'logs/https%3A%2F%2Fexample.com%2Frss/2025-12-21.json'
 */
export function getLogFilePath(siteId: string, date: Date = new Date()): string {
  const dateStr = date.toISOString().split('T')[0];
  return createSiteLogFilename(siteId, dateStr);
}

/**
 * Generate site log directory path
 *
 * @param siteId - Site identifier
 * @returns Site log directory path
 */
export function getSiteLogDir(siteId: string): string {
  return `logs/${encodeURIComponent(siteId)}`;
}

/**
 * Find oldest item date from array of items
 *
 * @param items - Array of log items
 * @returns Oldest publication date as YYYY-MM-DD
 */
export function findOldestItemDate(items: LogItem[]): string {
  if (items.length === 0) return new Date().toISOString().split('T')[0];
  
  const oldestDate = items.reduce((oldest, item) => {
    const itemDate = new Date(item.pubDate);
    return itemDate < oldest ? itemDate : oldest;
  }, new Date(items[0].pubDate));
  
  return oldestDate.toISOString().split('T')[0];
}

/**
 * Create site log filename based on oldest item date
 *
 * @param siteId - Site identifier
 * @param oldestDate - Oldest item date (YYYY-MM-DD)
 * @returns Full file path
 */
export function createSiteLogFilename(siteId: string, oldestDate: string): string {
  return `${getSiteLogDir(siteId)}/${oldestDate}.json`;
}

/**
 * Get latest log file for a site
 *
 * @param siteId - Site identifier
 * @returns Latest file path or null if none exists
 */
export async function getLatestLogFile(siteId: string): Promise<string | null> {
  // For now, we'll implement a simple approach
  // In a full implementation, we'd list directory contents via GitHub API
  // For this MVP, we'll try common recent dates
  const config = getStoredConfig();
  const client = createGitHubClient(config);
  
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const filePath = createSiteLogFilename(siteId, dateStr);
    
    try {
      const data = getCachedLogFile(config, siteId, filePath) ??
        await readFromGitHub<SiteLogData>(client, filePath);
      if (data && data.items.length < 200) {
        cacheLogFile(config, siteId, filePath, data);
        return filePath;
      }
    } catch {
      // File doesn't exist, continue
    }
  }
  
  return null;
}

/**
 * Read existing site log file from GitHub
 *
 * @param siteId - Site identifier
 * @param date - Date of log file (defaults to today)
 * @returns Log data or null if file doesn't exist
 *
 * @example
 * const log = await readLog('https://example.com/rss');
 */
export async function readLog(siteId: string, date: Date = new Date()): Promise<SiteLogData | null> {
  const config = getStoredConfig();
  const client = createGitHubClient(config);
  const path = getLogFilePath(siteId, date);

  const cached = getCachedLogFile(config, siteId, path);
  if (cached) return cached;

  const data = await readFromGitHub<SiteLogData>(client, path);
  if (data) {
    cacheLogFile(config, siteId, path, data);
  }

  return data;
}

/**
 * Commit read status to site-based log files
 *
 * @param siteId - Site identifier (normalized URL)
 * @param siteName - Site display name
 * @param items - Array of items to log
 * @returns True if commit successful
 */
export async function commitReadStatus(
  siteId: string,
  siteName: string,
  items: Array<{ itemId: string; title: string; pubDate: string }>
): Promise<boolean> {
  if (items.length === 0) return true;

  const config = getStoredConfig();
  const client = createGitHubClient(config);

  // Convert to LogItems with readAt timestamp
  const logItems: LogItem[] = items.map(item => ({
    ...item,
    readAt: new Date().toISOString()
  }));

  try {
    // Try to find existing file with space
    let targetFile = await getLatestLogFile(siteId);
    let existingData: SiteLogData | null = null;

    if (targetFile) {
      existingData = await readFromGitHub<SiteLogData>(client, targetFile);
    }

    // If no existing file or file is full, create new one
    if (!existingData || existingData.items.length >= MAX_LOG_ITEMS_PER_FILE) {
      const oldestDate = findOldestItemDate(logItems);
      targetFile = createSiteLogFilename(siteId, oldestDate);
      existingData = null;
    }

    // Create or update log data
    const siteLogData: SiteLogData = existingData || {
      metadata: {
        siteId,
        siteName,
        oldestItemDate: findOldestItemDate(logItems),
        newestItemDate: findOldestItemDate(logItems),
        itemCount: 0,
        generatedAt: new Date().toISOString()
      },
      items: []
    };

    // Filter out already logged items
    const existingItemIds = new Set(siteLogData.items.map(i => i.itemId));
    const newItems = logItems.filter(item => !existingItemIds.has(item.itemId));

    if (newItems.length === 0) return true;

    // Add new items
    siteLogData.items.push(...newItems);
    
    // Update metadata
    const allDates = siteLogData.items.map(item => new Date(item.pubDate));
    siteLogData.metadata.oldestItemDate = new Date(Math.min(...allDates.map(d => d.getTime()))).toISOString().split('T')[0];
    siteLogData.metadata.newestItemDate = new Date(Math.max(...allDates.map(d => d.getTime()))).toISOString().split('T')[0];
    siteLogData.metadata.itemCount = siteLogData.items.length;
    siteLogData.metadata.generatedAt = new Date().toISOString();

    const success = await writeToGitHub(client, targetFile!, siteLogData);
    if (success) {
      cacheLogFile(config, siteId, targetFile!, siteLogData);
      pruneCachedLogFilesForSite(config, siteId);
    }

    return success;
  } catch (error) {
    console.error('Failed to commit read status:', error);
    return false;
  }
}

/**
 * Commit all read items from multiple sites
 *
 * @param allReadItems - Record of siteId -> items
 * @returns Record of siteId -> success status
 *
 * @example
 * await commitAllReadItems({
 *   'https://site1.com/rss': [{ itemId: '123', title: '...', pubDate: '...' }],
 *   'https://site2.com/rss': [{ itemId: '456', title: '...', pubDate: '...' }]
 * });
 */
export async function commitAllReadItems(
  allReadItems: Record<string, Array<{ itemId: string; title: string; pubDate: string; siteName: string }>>
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};

  for (const [siteId, items] of Object.entries(allReadItems)) {
    if (items.length > 0) {
      const siteName = items[0].siteName;
      const itemData = items.map(({ itemId, title, pubDate }) => ({ itemId, title, pubDate }));
      results[siteId] = await commitReadStatus(siteId, siteName, itemData);
    }
  }

  return results;
}

/**
 * Get read items for a specific site from site-based logs
 *
 * @param siteId - Site identifier
 * @returns Set of item IDs that have been read
 */
export async function getReadItemsForSite(siteId: string): Promise<Set<string>> {
  const config = getStoredConfig();
  const client = createGitHubClient(config);
  const readItems = new Set<string>();

  // Try to find recent log files for this site
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const filePath = createSiteLogFilename(siteId, dateStr);

    try {
      const data = getCachedLogFile(config, siteId, filePath) ??
        await readFromGitHub<SiteLogData>(client, filePath);
      if (data) {
        cacheLogFile(config, siteId, filePath, data);
        data.items.forEach(item => readItems.add(item.itemId));
      }
    } catch {
      // File doesn't exist, continue
    }
  }

  return readItems;
}

/**
 * Get all read items from site-based logs
 *
 * @returns Record of siteId -> Set of item IDs
 */
export async function getAllReadItems(): Promise<Record<string, Set<string>>> {
  // This is a simplified implementation
  // In a full implementation, we'd need to discover all sites and their files
  // For now, return empty - the app will populate as sites are accessed
  return {};
}
