/**
 * Log File Structure - daily read history
 */
export interface LogData {
  metadata: LogMetadata;
  sites: Record<string, LogSite>;
}

/**
 * Log metadata
 */
export interface LogMetadata {
  date: string; // YYYY-MM-DD
  generatedAt: string; // ISO timestamp
}

/**
 * Site-specific log data
 */
export interface LogSite {
  name: string;
  readItems: LogItem[];
}

/**
 * Logged item with read timestamp
 */
export interface LogItem {
  itemId: string;
  title: string;
  pubDate: string;
  readAt: string; // ISO timestamp
}

/**
 * Read status tracking (session)
 */
export interface ReadStatus {
  [siteId: string]: Set<string>; // Set of item IDs
}