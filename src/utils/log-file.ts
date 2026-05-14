import { createGitHubClient, readFromGitHub, writeToGitHub, getStoredConfig, listDirectory } from './github-api';
import { LogItem, SiteLogData } from '@/types/log';
import { GitHubConfig } from '@/types/config';
import { cacheLogFile, getCachedLogFile, pruneCachedLogFilesForSite } from './log-cache';
import { yieldToMain } from './yield';

const MAX_LOG_ITEMS_PER_FILE = 200;
const FILENAME_DATE_REGEX = /^(\d{4}-\d{2}-\d{2})(-\d+)?\.json$/;

// ── Helpers ────────────────────────────────────────────────────────

/**
 * Generate site log directory path
 */
export function getSiteLogDir(siteId: string): string {
  return `logs/${encodeURIComponent(siteId)}`;
}

/**
 * Create site log filename from a date string with overflow suffix
 */
function createOverflowFilename(siteId: string, dateStr: string, suffix: number): string {
  return `${getSiteLogDir(siteId)}/${dateStr}-${suffix}.json`;
}

/**
 * Group items by their pubDate into YYYY-MM-DD buckets.
 * Items are sorted by pubDate descending before grouping.
 *
 * @param items - Array of log items (not mutated; caller should sort first if needed)
 * @returns Map of dateStr -> items for that date, ordered by date descending
 */
export function groupByPubDate(items: LogItem[]): Map<string, LogItem[]> {
  const dateSet = new Set<string>();
  
  for (const item of items) {
    const dateStr = new Date(item.pubDate).toISOString().split('T')[0];
    dateSet.add(dateStr);
  }
  
  // Sort dates descending so iteration goes newest first
  const sortedDates = Array.from(dateSet).sort().reverse();
  
  const buckets = new Map<string, LogItem[]>();
  for (const dateStr of sortedDates) {
    buckets.set(dateStr, items.filter(item => 
      new Date(item.pubDate).toISOString().split('T')[0] === dateStr
    ));
  }
  
  return buckets;
}

/**
 * Parse a date string from a log filename.
 * Returns the date part and optional overflow suffix, or null if not a log file.
 */
export function parseLogFilename(name: string): { dateStr: string; overflow: number | null; filePath: string } | null {
  const match = name.match(FILENAME_DATE_REGEX);
  if (!match) return null;
  return {
    dateStr: match[1],
    overflow: match[2] ? parseInt(match[2].substring(1), 10) : null,
    filePath: `logs` // placeholder, caller constructs full path via listDirectory
  };
}

// ── Bucket Location ────────────────────────────────────────────────

/**
 * List all directory files for a site and cache their data.
 * Returns an array of { filePath, data } for all non-allread .json files.
 */
async function listSiteFiles(
  client: ReturnType<typeof createGitHubClient>,
  siteId: string,
  cfg: GitHubConfig
): Promise<Array<{ filePath: string; data: SiteLogData | null; fileDate: string | null; overflow: number | null }>> {
  const siteDir = getSiteLogDir(siteId);
  const files = await listDirectory(client, siteDir);
  
  const results: Array<{ filePath: string; data: SiteLogData | null; fileDate: string | null; overflow: number | null }> = [];
  
  for (const file of files) {
    if (file.type !== 'file') continue;
    if (!file.name.endsWith('.json')) continue;
    if (file.name.includes('-allread')) continue;
    
    const parsed = parseLogFilename(file.name);
    if (!parsed) continue;
    
    const filePath = file.path;
    let data: SiteLogData | null = null;
    try {
      data = getCachedLogFile(cfg, siteId, filePath) ?? await readFromGitHub<SiteLogData>(client, filePath);
      if (data) cacheLogFile(cfg, siteId, filePath, data);
    } catch {
      // File doesn't exist or read error
    }
    
    results.push({
      filePath,
      data,
      fileDate: parsed.dateStr,
      overflow: parsed.overflow
    });
  }
  
  return results;
}

/**
 * Locate an existing log file for the given date with < 200 items.
 * Returns file path or null if no suitable bucket exists.
 */
export async function locateLogFileByDate(siteId: string, dateStr: string, config?: GitHubConfig): Promise<string | null> {
  const cfg = config ?? getStoredConfig();
  const client = createGitHubClient(cfg);
  
  const siteFiles = await listSiteFiles(client, siteId, cfg);
  
  for (const sf of siteFiles) {
    if (sf.fileDate === dateStr && sf.data && sf.data.items.length < MAX_LOG_ITEMS_PER_FILE) {
      return sf.filePath;
    }
  }
  
  return null;
}

/**
 * Find the overflow count for a given date bucket.
 * Returns the next suffix number to use (0 if no overflow files exist).
 */
async function findOverflowCount(siteId: string, dateStr: string, config?: GitHubConfig): Promise<number> {
  const cfg = config ?? getStoredConfig();
  const client = createGitHubClient(cfg);
  
  const siteFiles = await listSiteFiles(client, siteId, cfg);
  
  let maxOverflow = -1;
  for (const sf of siteFiles) {
    if (sf.fileDate === dateStr && sf.overflow !== null) {
      if (sf.overflow > maxOverflow) {
        maxOverflow = sf.overflow;
      }
    }
  }
  
  return maxOverflow + 1;
}

/**
 * Find an overflow bucket file path for items that don't fit in the main date bucket.
 * Returns the file path for writing overflow items (may not exist yet).
 * If the main bucket exists with space, returns that instead.
 */
export async function findOverflowBucket(siteId: string, dateStr: string, config?: GitHubConfig): Promise<string | null> {
  const cfg = config ?? getStoredConfig();
  const client = createGitHubClient(cfg);
  
  const siteFiles = await listSiteFiles(client, siteId, cfg);
  
  // First check if any existing file for this date has space
  for (const sf of siteFiles) {
    if (sf.fileDate === dateStr && sf.data && sf.data.items.length < MAX_LOG_ITEMS_PER_FILE) {
      return sf.filePath;
    }
  }
  
  // Need to create a new overflow file
  const nextSuffix = await findOverflowCount(siteId, dateStr, cfg);
  return createOverflowFilename(siteId, dateStr, nextSuffix);
}

/**
 * Get all unique dates that have log files for a site.
 * Returns dates sorted descending (newest first).
 */
async function getSiteFileDates(siteId: string, config?: GitHubConfig): Promise<string[]> {
  const cfg = config ?? getStoredConfig();
  const client = createGitHubClient(cfg);
  
  const siteFiles = await listSiteFiles(client, siteId, cfg);
  const dates = new Set<string>();
  
  for (const sf of siteFiles) {
    if (sf.fileDate) {
      dates.add(sf.fileDate);
    }
  }
  
  return Array.from(dates).sort().reverse();
}

// ── Bucket Merge ───────────────────────────────────────────────────

/**
 * Merge new items into a bucket file: read existing → dedup → append → write.
 * Returns true if write succeeded (or no new items).
 */
async function mergeItemsIntoBucket(
  client: ReturnType<typeof createGitHubClient>,
  siteId: string,
  siteName: string,
  dateStr: string,
  newItems: LogItem[],
  config: GitHubConfig
): Promise<boolean> {
  if (newItems.length === 0) return true;
  
  // Try to locate existing file with space
  let targetFile = await locateLogFileByDate(siteId, dateStr, config);
  let existingData: SiteLogData | null = null;
  
  if (targetFile) {
    existingData = await readFromGitHub<SiteLogData>(client, targetFile);
  }
  
  // If no suitable file found, try overflow
  if (!existingData) {
    const overflowFile = await findOverflowBucket(siteId, dateStr, config);
    if (overflowFile) {
      // Check if it's an existing file
      const siteFiles = await listSiteFiles(client, siteId, config);
      const match = siteFiles.find(sf => sf.filePath === overflowFile);
      if (match && match.data) {
        existingData = match.data;
        targetFile = match.filePath;
      } else {
        // It's a new overflow filename — use it directly as target
        targetFile = overflowFile;
        existingData = null;
      }
    }
  }
  
  const siteLogData: SiteLogData = existingData || {
    metadata: {
      siteId,
      siteName,
      oldestItemDate: dateStr,
      newestItemDate: dateStr,
      itemCount: 0,
      generatedAt: new Date().toISOString()
    },
    items: []
  };
  
  // Dedup within target bucket only (not cross-bucket dedup)
  const existingItemIds = new Set(siteLogData.items.map(i => i.itemId));
  const toAdd = newItems.filter(item => !existingItemIds.has(item.itemId));
  
  if (toAdd.length === 0) return true;
  
  // Add new items
  siteLogData.items.push(...toAdd);
  
  // Update metadata for this bucket only
  const allDates = siteLogData.items.map(item => new Date(item.pubDate));
  siteLogData.metadata.oldestItemDate = new Date(Math.min(...allDates.map(d => d.getTime()))).toISOString().split('T')[0];
  siteLogData.metadata.newestItemDate = new Date(Math.max(...allDates.map(d => d.getTime()))).toISOString().split('T')[0];
  siteLogData.metadata.itemCount = siteLogData.items.length;
  siteLogData.metadata.generatedAt = new Date().toISOString();
  
  const success = await writeToGitHub(client, targetFile!, siteLogData);
  if (success) {
    // Mark newly added items with their source file path
    for (const item of toAdd) {
      item.source = targetFile!;
    }
    cacheLogFile(config, siteId, targetFile!, siteLogData);
    pruneCachedLogFilesForSite(config, siteId);
  }
  
  return success;
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * Commit all feed items (read + unread) to GitHub log files.
 * Items are grouped by pubDate into YYYY-MM-DD buckets.
 * For each bucket: locate existing file with space → dedup → append → write.
 * Overflow (>200 items per file) spills to date-1, date-2, etc.
 */
export async function commitAllFeedItems(
  siteId: string,
  siteName: string,
  items: Array<{ itemId: string; title: string; pubDate: string; readAt?: string }>,
  config?: GitHubConfig
): Promise<boolean> {
  if (items.length === 0) return true;

  const cfg = config ?? getStoredConfig();
  const client = createGitHubClient(cfg);

  const logItems: LogItem[] = items
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .map(item => ({
      itemId: item.itemId,
      title: item.title,
      pubDate: item.pubDate,
      ...(item.readAt ? { readAt: item.readAt } : {})
    }));

  try {
    // Group items by their pubDate
    const buckets = groupByPubDate(logItems);
    
    let allSuccess = true;
    
    // Process buckets by date descending (newest first)
    for (const [dateStr, bucketItems] of buckets) {
      const success = await mergeItemsIntoBucket(client, siteId, siteName, dateStr, bucketItems, cfg);
      if (!success) {
        console.error(`  Failed to commit ${bucketItems.length} items to ${dateStr}`);
        allSuccess = false;
      }
      await yieldToMain();
    }
    
    return allSuccess;
  } catch (error) {
    console.error('Failed to commit feed items:', error);
    return false;
  }
}

/**
 * Commit read status to site-based log files.
 * Uses the same per-date-bucket grouping as commitAllFeedItems.
 * Items with readAt are marked as read, items without readAt are unread.
 */
export async function commitReadStatus(
  siteId: string,
  siteName: string,
  items: Array<{ itemId: string; title: string; pubDate: string; readAt?: string }>,
  config?: GitHubConfig
): Promise<boolean> {
  if (items.length === 0) return true;

  const cfg = config ?? getStoredConfig();
  const client = createGitHubClient(cfg);

  // Sort and convert to LogItems
  const logItems: LogItem[] = items
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .map(item => ({
      itemId: item.itemId,
      title: item.title,
      pubDate: item.pubDate,
      ...(item.readAt ? { readAt: item.readAt } : {})
    }));

  try {
    // Group by pubDate
    const buckets = groupByPubDate(logItems);
    
    let allSuccess = true;
    
    for (const [dateStr, bucketItems] of buckets) {
      const success = await mergeItemsIntoBucket(client, siteId, siteName, dateStr, bucketItems, cfg);
      if (!success) {
        console.error(`  Failed to commit read status for ${bucketItems.length} items to ${dateStr}`);
        allSuccess = false;
      }
    }
    
    return allSuccess;
  } catch (error) {
    console.error('Failed to commit read status:', error);
    return false;
  }
}

/**
 * Get latest log file for a site.
 * Returns the file with the highest date that has < 200 items.
 * Falls back to an overflow bucket if the main date bucket is full.
 */
export async function getLatestLogFile(siteId: string, config?: GitHubConfig): Promise<string | null> {
  const cfg = config ?? getStoredConfig();
  const client = createGitHubClient(cfg);

  const dates = await getSiteFileDates(siteId, cfg);

  for (const dateStr of dates) {
    const filePath = await locateLogFileByDate(siteId, dateStr, cfg);
    if (filePath) {
      return filePath;
    }
  }
  
  // If no bucket with space found, check for overflow files
  for (const dateStr of dates) {
    const overflow = await findOverflowBucket(siteId, dateStr, cfg);
    if (overflow && !overflow.endsWith('.json')) {
      // It's a new overflow file path, not an existing one
      continue;
    }
    // For overflow files that exist and have space
    const siteFiles = await listSiteFiles(client, siteId, cfg);
    const validOverflow = siteFiles
      .filter(sf => sf.fileDate === dateStr && sf.overflow !== null && sf.data && sf.data.items.length < MAX_LOG_ITEMS_PER_FILE)
      .sort((a, b) => Number(b.overflow) - Number(a.overflow))
      .pop();
    if (validOverflow) return validOverflow.filePath;
  }

  return null;
}

/**
 * Generate site log file path for a specific date (legacy API for SPA reading)
 */
export function getLogFilePath(siteId: string, date: Date = new Date()): string {
  const dateStr = date.toISOString().split('T')[0];
  return `${getSiteLogDir(siteId)}/${dateStr}.json`;
}

/**
 * Read existing site log file from GitHub (legacy API)
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
 * Rename log file to add -allread suffix
 */
export async function renameToAllread(filePath: string): Promise<boolean> {
  const config = getStoredConfig();
  const client = createGitHubClient(config);

  const allreadPath = filePath.replace('.json', '-allread.json');

  try {
    const content = await readFromGitHub<SiteLogData>(client, filePath);
    if (!content) return false;

    const success = await writeToGitHub(client, allreadPath, content);
    if (success) {
      await deleteFileFromGitHub(client, filePath);
    }
    return success;
  } catch (error) {
    console.error('Failed to rename to allread:', error);
    return false;
  }
}

/**
 * Delete a file from GitHub
 */
async function deleteFileFromGitHub(client: any, filePath: string): Promise<boolean> {
  try {
    const config = getStoredConfig();
    const { owner, repo } = config;
    const path = filePath;

    const { data } = await client.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner,
      repo,
      path
    });

    if (Array.isArray(data) || !data.sha) {
      return false;
    }

    await client.request('DELETE /repos/{owner}/{repo}/contents/{path}', {
      owner,
      repo,
      path,
      sha: data.sha,
      message: 'Mark as allread - removing active log'
    });

    return true;
  } catch (error) {
    console.error('Failed to delete file:', error);
    return false;
  }
}

/**
 * Get all log items for a site from GitHub (excludes allread files)
 */
export async function getLogItemsForSite(
  siteId: string
): Promise<Map<string, LogItem>> {
  const config = getStoredConfig();
  const client = createGitHubClient(config);
  const itemsMap = new Map<string, LogItem>();

  const siteDir = getSiteLogDir(siteId);
  const files = await listDirectory(client, siteDir);

  for (const file of files) {
    if (file.type !== 'file') continue;
    if (!file.name.endsWith('.json')) continue;
    if (file.name.includes('-allread')) continue;

    const filePath = file.path;
    try {
      const data = getCachedLogFile(config, siteId, filePath) ??
        await readFromGitHub<SiteLogData>(client, filePath);
      if (data) {
        cacheLogFile(config, siteId, filePath, data);
        data.items.forEach(item => {
          itemsMap.set(item.itemId, item);
        });
      }
    } catch {
      // File doesn't exist, continue
    }
  }

  return itemsMap;
}

/**
 * Get read items for a specific site from site-based logs
 */
export async function getReadItemsForSite(siteId: string): Promise<Set<string>> {
  const config = getStoredConfig();
  const client = createGitHubClient(config);
  const readItems = new Set<string>();

  const siteDir = getSiteLogDir(siteId);
  const files = await listDirectory(client, siteDir);

  for (const file of files) {
    if (file.type !== 'file') continue;
    if (!file.name.endsWith('.json')) continue;
    if (file.name.includes('-allread')) continue;

    const filePath = file.path;
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
 */
export async function getAllReadItems(): Promise<Record<string, Set<string>>> {
  return {};
}

/**
 * Commit all read items from multiple sites
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
