import { getStoredConfig, readFromGitHubWithProvider, writeToGitHubWithProvider, listDirectoryWithProvider, deleteFileWithProvider, createCommitWithProvider } from './github-api';
import { LogItem, SiteLogData } from '@/types/log';
import { GitHubConfig } from '@/types/config';
import { cacheLogFile, getCachedLogFile, pruneCachedLogFilesForSite } from './log-cache';
import { asyncPool } from './async-pool';
import { yieldToMain } from './yield';

const MAX_LOG_ITEMS_PER_FILE = 200;
const FILENAME_DATE_REGEX = /^(\d{4}-\d{2}-\d{2})(-\d+)?\.json$/;

export function isFileFromEarlierDate(filePath: string): boolean {
  const basename = filePath.split('/').pop() || '';
  const match = basename.match(FILENAME_DATE_REGEX);
  if (!match) return false;
  const today = new Date().toISOString().split('T')[0];
  return match[1] < today;
}

export function isFullyRead(data: SiteLogData): boolean {
  return data.items.length > 0 && data.items.every(i => i.readAt);
}

function filterOutAllreadDuplicates(files: Array<{ name: string; path: string; type: string }>): { keep: Array<{ name: string; path: string; type: string }>; toDelete: string[] } {
  const allreadBases = new Set<string>();
  for (const f of files) {
    if (f.name.includes('-allread')) {
      const base = f.name.replace('-allread.json', '.json');
      allreadBases.add(base);
    }
  }
  const toDelete: string[] = [];
  const keep = files.filter(f => {
    if (f.name.endsWith('.json') && !f.name.includes('-allread') && allreadBases.has(f.name)) {
      toDelete.push(f.path);
      return false;
    }
    return true;
  });
  return { keep, toDelete };
}

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

// ── In-memory site file cache (avoids redundant reads within a commit session) ──
const siteFileCache = new Map<string, Array<{ filePath: string; data: SiteLogData | null; fileDate: string | null; overflow: number | null }>>();

// ── Bucket Location ────────────────────────────────────────────────

/**
 * List all directory files for a site and cache their data.
 * Returns an array of { filePath, data } for all non-allread .json files.
 * Results are cached in-memory for the current session; call clearSiteFileCache to invalidate.
 */
async function listSiteFiles(
  siteId: string,
  cfg: GitHubConfig
): Promise<Array<{ filePath: string; data: SiteLogData | null; fileDate: string | null; overflow: number | null }>> {
  const cached = siteFileCache.get(siteId);
  if (cached) {
    console.log(`[commit-cache] listSiteFiles HIT for ${siteId} (${cached.length} files)`);
    return cached;
  }
  console.log(`[commit-cache] listSiteFiles MISS for ${siteId}`);
  
  const siteDir = getSiteLogDir(siteId);
  const files = await listDirectoryWithProvider(cfg, siteDir);
  const { keep: filtered, toDelete } = filterOutAllreadDuplicates(files);
  // Delete orphaned regular files whose -allread counterpart exists
  for (const path of toDelete) {
    deleteFileWithProvider(cfg, path, 'Remove orphaned log file (allread exists)').catch(() => {});
  }
  
  const results: Array<{ filePath: string; data: SiteLogData | null; fileDate: string | null; overflow: number | null }> = [];
  
  for (const file of filtered) {
    if (file.type !== 'file') continue;
    if (!file.name.endsWith('.json')) continue;
    if (file.name.includes('-allread')) continue;
    
    const parsed = parseLogFilename(file.name);
    if (!parsed) continue;
    
    const filePath = file.path;
    let data: SiteLogData | null = null;
    try {
      data = getCachedLogFile(cfg, siteId, filePath) ?? await readFromGitHubWithProvider(cfg, filePath) as SiteLogData;
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
  
  console.log(`[commit-cache] listSiteFiles CACHE ${siteId} (${results.length} files)`);
  siteFileCache.set(siteId, results);
  return results;
}

/**
 * Locate an existing log file for the given date with < 200 items.
 * Returns file path or null if no suitable bucket exists.
 */
export async function locateLogFileByDate(siteId: string, dateStr: string, config?: GitHubConfig, siteFiles?: Array<{ filePath: string; data: SiteLogData | null; fileDate: string | null; overflow: number | null }>): Promise<string | null> {
  const cfg = config ?? getStoredConfig();
  
  const files = siteFiles ?? await listSiteFiles(siteId, cfg);
  
  for (const sf of files) {
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
async function findOverflowCount(siteId: string, dateStr: string, config?: GitHubConfig, siteFiles?: Array<{ filePath: string; data: SiteLogData | null; fileDate: string | null; overflow: number | null }>): Promise<number> {
  const cfg = config ?? getStoredConfig();
  
  const files = siteFiles ?? await listSiteFiles(siteId, cfg);
  
  let maxOverflow = -1;
  for (const sf of files) {
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
export async function findOverflowBucket(siteId: string, dateStr: string, config?: GitHubConfig, siteFiles?: Array<{ filePath: string; data: SiteLogData | null; fileDate: string | null; overflow: number | null }>): Promise<string | null> {
  const cfg = config ?? getStoredConfig();
  
  const files = siteFiles ?? await listSiteFiles(siteId, cfg);
  
  // First check if any existing file for this date has space
  for (const sf of files) {
    if (sf.fileDate === dateStr && sf.data && sf.data.items.length < MAX_LOG_ITEMS_PER_FILE) {
      return sf.filePath;
    }
  }
  
  // Need to create a new overflow file
  const nextSuffix = await findOverflowCount(siteId, dateStr, cfg, files);
  return createOverflowFilename(siteId, dateStr, nextSuffix);
}

/**
 * Get all unique dates that have log files for a site.
 * Returns dates sorted descending (newest first).
 */
async function getSiteFileDates(siteId: string, config?: GitHubConfig): Promise<string[]> {
  const cfg = config ?? getStoredConfig();
  
  const siteFiles = await listSiteFiles(siteId, cfg);
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
/**
 * Prepare a bucket write: read existing → dedup → append → return file content.
 * Does NOT write to GitHub — the caller batches writes via createCommitWithProvider.
 * Returns null if nothing to write.
 */
interface BucketWrite {
  path: string;
  content: string;
  siteLogData: SiteLogData;
}

async function mergeItemsIntoBucket(
  siteId: string,
  siteName: string,
  dateStr: string,
  newItems: LogItem[],
  config: GitHubConfig,
  siteFiles?: Array<{ filePath: string; data: SiteLogData | null; fileDate: string | null; overflow: number | null }>
): Promise<BucketWrite | null> {
  if (newItems.length === 0) return null;
  
  // Try to locate existing file with space
  let targetFile = await locateLogFileByDate(siteId, dateStr, config, siteFiles);
  let existingData: SiteLogData | null = null;
  
  if (targetFile) {
    existingData = await readFromGitHubWithProvider(config, targetFile) as SiteLogData;
  }
  
  // If no suitable file found, try overflow
  if (!existingData) {
    const overflowFile = await findOverflowBucket(siteId, dateStr, config, siteFiles);
    if (overflowFile) {
      // Check if it's an existing file
      const files = siteFiles ?? await listSiteFiles(siteId, config);
      const match = files.find(sf => sf.filePath === overflowFile);
      if (match && match.data) {
        existingData = match.data;
        targetFile = match.filePath;
      } else {
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
  
  if (toAdd.length === 0) return null;
  
  // Add new items
  siteLogData.items.push(...toAdd);
  
  // Update metadata for this bucket only
  const allDates = siteLogData.items.map(item => new Date(item.pubDate));
  siteLogData.metadata.oldestItemDate = new Date(Math.min(...allDates.map(d => d.getTime()))).toISOString().split('T')[0];
  siteLogData.metadata.newestItemDate = new Date(Math.max(...allDates.map(d => d.getTime()))).toISOString().split('T')[0];
  siteLogData.metadata.itemCount = siteLogData.items.length;
  siteLogData.metadata.generatedAt = new Date().toISOString();
  
  // Mark newly added items with their source file path
  for (const item of toAdd) {
    item.source = targetFile!;
  }
  
  const content = JSON.stringify(siteLogData, null, 2);
  
  return { path: targetFile!, content, siteLogData };
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

  const logItems: LogItem[] = items
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .map(item => ({
      itemId: item.itemId,
      title: item.title,
      pubDate: item.pubDate,
      ...(item.readAt ? { readAt: item.readAt } : {})
    }));

  try {
    const buckets = groupByPubDate(logItems);
    console.log(`[commit] ${siteId}: ${logItems.length} items, ${buckets.size} buckets`);
    const siteFiles = await listSiteFiles(siteId, cfg);
    
    const writes: Array<{ path: string; content: string }> = [];
    const postCommitTasks: Array<() => Promise<void>> = [];
    
    for (const [dateStr, bucketItems] of buckets) {
      const result = await mergeItemsIntoBucket(siteId, siteName, dateStr, bucketItems, cfg, siteFiles);
      if (result) {
        writes.push({ path: result.path, content: result.content });
        postCommitTasks.push(async () => {
          cacheLogFile(cfg, siteId, result.path, result.siteLogData);
          pruneCachedLogFilesForSite(cfg, siteId);
          if (isFullyRead(result.siteLogData) && isFileFromEarlierDate(result.path)) {
            try {
              await renameToAllread(result.path, cfg);
            } catch (e) {
              console.error('Failed to rename to allread:', e);
            }
          }
        });
      }
    }
    
if (writes.length === 0) {
      console.log(`[commit] ${siteId}: nothing to write, skipping`);
      return true;
    }
    
    const changes = writes.map(w => ({ path: w.path, content: w.content, sha: null }));
    console.log(`[commit] ${siteName}: ${writes.length} files to write via batch commit`);
    const success = await createCommitWithProvider(cfg, `Update feed data for ${siteName}`, changes);
    
    if (success) {
      for (const task of postCommitTasks) {
        await task();
      }
    }
    
    return success;
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
    const siteFiles = await listSiteFiles(siteId, cfg);
    
    const writes: Array<{ path: string; content: string }> = [];
    const postCommitTasks: Array<() => Promise<void>> = [];
    
    for (const [dateStr, bucketItems] of buckets) {
      const result = await mergeItemsIntoBucket(siteId, siteName, dateStr, bucketItems, cfg, siteFiles);
      if (result) {
        writes.push({ path: result.path, content: result.content });
        postCommitTasks.push(async () => {
          cacheLogFile(cfg, siteId, result.path, result.siteLogData);
          pruneCachedLogFilesForSite(cfg, siteId);
          if (isFullyRead(result.siteLogData) && isFileFromEarlierDate(result.path)) {
            try {
              await renameToAllread(result.path, cfg);
            } catch (e) {
              console.error('Failed to rename to allread:', e);
            }
          }
        });
      }
    }
    
if (writes.length === 0) return true;

    const changes = writes.map(w => ({ path: w.path, content: w.content, sha: null }));
    const success = await createCommitWithProvider(cfg, `Update read status for ${siteName}`, changes);

    if (success) {
      for (const task of postCommitTasks) {
        await task();
      }
    }

    return success;
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
    const siteFiles = await listSiteFiles(siteId, cfg);
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
  const path = getLogFilePath(siteId, date);

  const cached = getCachedLogFile(config, siteId, path);
  if (cached) return cached;

  const data = await readFromGitHubWithProvider(config, path) as SiteLogData | null;
  if (data) {
    cacheLogFile(config, siteId, path, data);
  }

  return data;
}

/**
 * Rename log file to add -allread suffix
 */
export async function renameToAllread(filePath: string, config?: GitHubConfig): Promise<boolean> {
  const cfg = config ?? getStoredConfig();

  const allreadPath = filePath.replace('.json', '-allread.json');

  try {
    const content = await readFromGitHubWithProvider(cfg, filePath) as SiteLogData;
    if (!content) return false;

    const success = await writeToGitHubWithProvider(cfg, allreadPath, JSON.stringify(content, null, 2), undefined);
    if (success) {
      await deleteFileWithProvider(cfg, filePath, 'Mark as allread - removing active log');
    }
    return success;
  } catch (error) {
    console.error('Failed to rename to allread:', error);
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
  const itemsMap = new Map<string, LogItem>();

  const siteDir = getSiteLogDir(siteId);
  const files = await listDirectoryWithProvider(config, siteDir);
  const { keep: filtered, toDelete } = filterOutAllreadDuplicates(files);
  for (const path of toDelete) {
    deleteFileWithProvider(config, path, 'Remove orphaned log file (allread exists)').catch(() => {});
  }

  const logFiles = filtered.filter(f => f.type === 'file' && f.name.endsWith('.json') && !f.name.includes('-allread'));

  // Read log files in batches to avoid overwhelming browser connection limits
  const FILE_READ_CONCURRENCY = 6;
  const allItemsArrays = await asyncPool(logFiles, FILE_READ_CONCURRENCY, async (file) => {
    const filePath = file.path;
    const data = getCachedLogFile(config, siteId, filePath) ??
      await readFromGitHubWithProvider(config, filePath) as SiteLogData;
    if (data) {
      cacheLogFile(config, siteId, filePath, data);
      // If fully read and not today's file, rename to -allread so it's skipped next time
      if (isFullyRead(data) && isFileFromEarlierDate(filePath)) {
        renameToAllread(filePath, config).catch(e => console.error('Failed to rename to allread during fetch:', e));
      }
      return data.items;
    }
    return [];
  }, yieldToMain);

  for (const items of allItemsArrays) {
    for (const item of items) {
      itemsMap.set(item.itemId, item);
    }
  }

  return itemsMap;
}

/**
 * Get read items for a specific site from site-based logs
 */
export async function getReadItemsForSite(siteId: string): Promise<Set<string>> {
  const config = getStoredConfig();
  const readItems = new Set<string>();

  const siteDir = getSiteLogDir(siteId);
  const files = await listDirectoryWithProvider(config, siteDir);

  for (const file of files) {
    if (file.type !== 'file') continue;
    if (!file.name.endsWith('.json')) continue;
    if (file.name.includes('-allread')) continue;

    const filePath = file.path;
    try {
      const data = getCachedLogFile(config, siteId, filePath) ??
        await readFromGitHubWithProvider(config, filePath) as SiteLogData;
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
