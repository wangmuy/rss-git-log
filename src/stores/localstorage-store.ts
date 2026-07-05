import { ItemStore, SearchResult } from './item-store';
import { useReaderStore } from '../store/readerStore';
import { getItemId } from '@/utils/item-id';
import MiniSearch from 'minisearch';

export class LocalStorageStore implements ItemStore {
  private miniSearch: MiniSearch | null = null;

  async init(): Promise<void> {
    const store = useReaderStore.getState();
    store.loadFromLocalStorage();
    await this.rebuildSearchIndex();
  }

  async clear(): Promise<void> {
    const store = useReaderStore.getState();
    store.clearSession();
    this.miniSearch = null;
  }

  private async rebuildSearchIndex(): Promise<void> {
    const ms = new MiniSearch({
      fields: ['title', 'description'],
      storeFields: ['itemId', 'siteId', 'title', 'pubDate'],
      searchOptions: { fuzzy: 0.2, prefix: true }
    });
    const store = useReaderStore.getState();
    const docs: any[] = [];
    for (const site of store.sites) {
      for (const item of site.items) {
        const itemId = getItemId(item);
        docs.push({
          id: itemId,
          itemId,
          siteId: site.siteId,
          title: item.title || '',
          description: item.description || '',
          pubDate: item.pubDate || ''
        });
      }
    }
    if (docs.length > 0) ms.addAll(docs);
    this.miniSearch = ms;
  }

  async upsertItems(siteId: string, items: Array<{
    itemId: string; title: string; link?: string; description?: string;
    pubDate: string; readAt?: string;
  }>): Promise<void> {
    const store = useReaderStore.getState();
    const githubItems = new Map(items.map(i => [i.itemId, i]));
    store.mergeGitHubReadStatus(siteId, githubItems);

    const historicalItems = items.map(i => ({
      itemId: i.itemId, title: i.title, pubDate: i.pubDate
    }));
    store.addHistoricalItems(siteId, historicalItems);
  }

  async markAsRead(siteId: string, itemId: string): Promise<void> {
    useReaderStore.getState().markAsRead(siteId, itemId);
  }

  async markSiteAsRead(siteId: string): Promise<void> {
    useReaderStore.getState().markSiteAsRead(siteId);
  }

  async markAllAsRead(): Promise<void> {
    useReaderStore.getState().markAllAsRead();
  }

  async isRead(siteId: string, itemId: string): Promise<boolean> {
    return useReaderStore.getState().isRead(siteId, itemId);
  }

  async getUnreadCount(siteId: string): Promise<number> {
    return useReaderStore.getState().getUnreadCount(siteId);
  }

  async getAllUnreadCounts(): Promise<Record<string, number>> {
    const store = useReaderStore.getState();
    const counts: Record<string, number> = {};
    for (const site of store.sites) {
      counts[site.siteId] = store.getUnreadCount(site.siteId);
    }
    return counts;
  }

  async search(query: string, siteId?: string): Promise<SearchResult[]> {
    if (!this.miniSearch) return [];
    const results = this.miniSearch.search(query);
    return results
      .filter(r => !siteId || r.siteId === siteId)
      .slice(0, 20)
      .map((r, i) => ({
        itemId: r.itemId as string,
        siteId: r.siteId as string,
        title: r.title as string,
        snippet: (r.description as string || '').slice(0, 200),
        pubDate: r.pubDate as string,
        rank: i + 1
      }));
  }

  async getItemsForCommit(siteId: string): Promise<Array<{
    itemId: string; title: string; pubDate: string; readAt?: string;
  }>> {
    const store = useReaderStore.getState();
    return store.getAllItems(siteId).map(item => ({
      itemId: item.itemId,
      title: item.title,
      pubDate: item.pubDate,
      readAt: store.isRead(siteId, item.itemId) ? new Date().toISOString() : undefined
    }));
  }
}
