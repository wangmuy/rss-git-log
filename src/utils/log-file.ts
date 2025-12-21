import { createGitHubClient, readFromGitHub, writeToGitHub, getEnvConfig } from './github-api';
import { LogData, LogItem } from '@/types/log';

/**
 * Generate log file path for a specific date
 *
 * @param date - Date object (defaults to today)
 * @returns Log file path: logs/YYYY-MM-DD.json
 *
 * @example
 * getLogFilePath() // 'logs/2025-12-21.json'
 * getLogFilePath(new Date('2025-12-20')) // 'logs/2025-12-20.json'
 */
export function getLogFilePath(date: Date = new Date()): string {
  const dateStr = date.toISOString().split('T')[0];
  return `logs/${dateStr}.json`;
}

/**
 * Read existing log file from GitHub
 *
 * @param date - Date of log file (defaults to today)
 * @returns Log data or null if file doesn't exist
 *
 * @example
 * const log = await readLog();
 */
export async function readLog(date: Date = new Date()): Promise<LogData | null> {
  const config = getEnvConfig();
  const client = createGitHubClient(config);
  const path = getLogFilePath(date);

  return await readFromGitHub<LogData>(client, path);
}

/**
 * Commit read status to daily log file
 *
 * @param siteId - Site identifier (normalized URL)
 * @param siteName - Site display name
 * @param items - Array of items to log
 * @returns True if commit successful
 *
 * @example
 * await commitReadStatus(
 *   'https://example.com/rss',
 *   'Tech News',
 *   [{ itemId: 'abc123', title: 'Article', pubDate: '2025-12-21T10:00:00Z' }]
 * );
 */
export async function commitReadStatus(
  siteId: string,
  siteName: string,
  items: Array<{ itemId: string; title: string; pubDate: string }>
): Promise<boolean> {
  if (items.length === 0) return true;

  const config = getEnvConfig();
  const client = createGitHubClient(config);
  const path = getLogFilePath();

  // Read existing log (handle 404 for missing files)
  let existing: LogData | null = null;
  try {
    existing = await readFromGitHub<LogData>(client, path);
  } catch (error: any) {
    if (!error.message?.includes('404')) {
      console.error('Error reading existing log:', error);
      return false;
    }
    // File doesn't exist yet - that's OK
  }

  // Create or merge log data
  const logData: LogData = existing || {
    metadata: {
      date: path.split('/')[1].replace('.json', ''),
      generatedAt: new Date().toISOString()
    },
    sites: {}
  };

  // Initialize site if needed
  if (!logData.sites[siteId]) {
    logData.sites[siteId] = { name: siteName, readItems: [] };
  }

  // Filter out already logged items
  const existingItemIds = new Set(logData.sites[siteId].readItems.map(i => i.itemId));
  const newItems: LogItem[] = items
    .filter(item => !existingItemIds.has(item.itemId))
    .map(item => ({
      ...item,
      readAt: new Date().toISOString()
    }));

  if (newItems.length === 0) {
    // Nothing new to add
    return true;
  }

  // Add new items
  logData.sites[siteId].readItems.push(...newItems);

  // Update metadata
  logData.metadata.generatedAt = new Date().toISOString();

  // Write back to GitHub
  return await writeToGitHub(client, path, logData);
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
 * Get read items for a specific site from today's log
 *
 * @param siteId - Site identifier
 * @returns Set of item IDs that have been read today
 *
 * @example
 * const readItems = await getReadItemsForSite('https://example.com/rss');
 */
export async function getReadItemsForSite(siteId: string): Promise<Set<string>> {
  const log = await readLog();
  if (!log || !log.sites[siteId]) return new Set();

  return new Set(log.sites[siteId].readItems.map(item => item.itemId));
}

/**
 * Get all read items from today's log
 *
 * @returns Record of siteId -> Set of item IDs
 *
 * @example
 * const allReadItems = await getAllReadItems();
 */
export async function getAllReadItems(): Promise<Record<string, Set<string>>> {
  const log = await readLog();
  if (!log) return {};

  const result: Record<string, Set<string>> = {};
  for (const [siteId, siteData] of Object.entries(log.sites)) {
    result[siteId] = new Set(siteData.readItems.map(item => item.itemId));
  }
  return result;
}