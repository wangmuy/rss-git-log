/**
 * Site-based log file structure - single site per file.
 */
export interface SiteLogData {
  metadata: SiteLogMetadata;
  items: LogItem[];
}

/**
 * Site-specific log metadata
 */
export interface SiteLogMetadata {
  siteId: string;
  siteName: string;
  oldestItemDate: string; // YYYY-MM-DD (filename basis)
  newestItemDate: string; // YYYY-MM-DD
  itemCount: number; // Current count (max 200)
  generatedAt: string; // ISO timestamp
}

/**
 * Logged item with read timestamp
 * source is transient — set in-memory after a successful commit, never persisted to JSON.
 * - Absent for newly fetched items from RSS feeds (set before write, never serialized)
 * - Set to the target file path (e.g. "logs/.../2026-05-10.json") after write completes (in-memory only)
 */
export interface LogItem {
  itemId: string;
  title: string;
  pubDate: string;
  readAt?: string; // ISO timestamp - present if read, omitted if unread
  source?: string; // GitHub file path where this item is stored
}

/**
 * Read status tracking (session)
 */
export interface ReadStatus {
  [siteId: string]: Set<string>; // Set of item IDs
}
