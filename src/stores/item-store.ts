export interface ItemRecord {
  itemId: string;
  siteId: string;
  guid: string;
  title: string;
  link: string;
  description: string;
  pubDate: string;
  isRead: boolean;
  readAt?: string;
}

export interface SearchResult {
  itemId: string;
  siteId: string;
  title: string;
  snippet: string;
  pubDate: string;
  rank: number;
}

export interface ItemStore {
  init(): Promise<void>;
  clear(): Promise<void>;

  upsertItems(siteId: string, items: Array<{
    itemId: string; title: string; link?: string; description?: string;
    pubDate: string; readAt?: string;
  }>): Promise<void>;

  markAsRead(siteId: string, itemId: string): Promise<void>;
  markSiteAsRead(siteId: string): Promise<void>;
  markAllAsRead(): Promise<void>;
  isRead(siteId: string, itemId: string): Promise<boolean>;
  getUnreadCount(siteId: string): Promise<number>;
  getAllUnreadCounts(): Promise<Record<string, number>>;

  search(query: string, siteId?: string): Promise<SearchResult[]>;

  getItemsForCommit(siteId: string): Promise<Array<{
    itemId: string; title: string; pubDate: string; readAt?: string;
  }>>;
}
