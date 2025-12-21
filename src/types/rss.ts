/**
 * RSS Feed Item - represents a single article/entry from an RSS feed
 */
export interface RSSItem {
  guid: string;
  title: string;
  link: string;
  pubDate: string;
  description: string;
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
}