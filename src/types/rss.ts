/**
 * RSS Feed Item - represents a single article/entry from an RSS feed
 */
export interface RSSItem {
  guid: string;
  title: string;
  link: string;
  pubDate: string;
  description: string;
  /**
   * Pre-computed item ID. Set when the item originates from GitHub log files
   * (via addHistoricalItems) so the original ID is preserved instead of
   * regenerated from incomplete fields (link/description are empty for
   * historical items). When absent, generateItemIdFromItem is used.
   */
  itemId?: string;
}

/**
 * RSS Feed - represents a complete feed with multiple items
 */
export interface RSSFeed {
  title: string;
  link: string;
  items: RSSItem[];
}

/**
 * RSS Site Configuration
 */
export interface RSSSite {
  name: string;
  url: string;
  color?: string;
}

/**
 * Site with read status
 */
export interface SiteWithStatus extends RSSSite {
  siteId: string;
  unreadCount: number;
  items: RSSItem[];
  error?: string;
}