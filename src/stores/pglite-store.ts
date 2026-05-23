import { ItemStore, SearchResult } from './item-store';

export class PGliteStore implements ItemStore {
  private dbWorker: Worker | null = null;
  private embedWorker: Worker | null = null;
  private pending = new Map<number, { resolve: (v: any) => void; reject: (e: any) => void }>();
  private seq = 0;
  private _modelReady = false;

  onProgress: ((pct: number) => void) | null = null;
  onModelReady: (() => void) | null = null;

  async init(): Promise<void> {
    console.log('[PGliteStore] init start (worker proxy)');

    this.dbWorker = new Worker(
      new URL('../workers/db.worker.ts', import.meta.url),
      { type: 'module' }
    );
    this.embedWorker = new Worker(
      new URL('../workers/embed.worker.ts', import.meta.url),
      { type: 'module' }
    );

    const handler = (e: MessageEvent) => {
      const { seq, type, error, ...data } = e.data;
      if (seq != null) {
        const p = this.pending.get(seq);
        if (!p) return;
        this.pending.delete(seq);
        if (error) p.reject(new Error(error));
        else p.resolve(data);
      } else if (type === 'STATUS') {
        if (data.status === 'MODEL_LOADING') {
          this.onProgress?.(data.progress);
        } else if (data.status === 'MODEL_READY') {
          this._modelReady = true;
          this.onModelReady?.();
          console.log('[PGliteStore] model ready, vector search enabled');
        } else if (data.status === 'MODEL_ERROR') {
          console.warn('[PGliteStore] model failed to load:', data.error);
        }
      }
    };
    this.dbWorker.onmessage = handler;
    this.embedWorker.onmessage = handler;

    // Create MessageChannel between workers
    const channel = new MessageChannel();
    this.dbWorker.postMessage({ type: 'init', embedPort: channel.port1 }, [channel.port1]);
    this.embedWorker.postMessage({ type: 'init', dbPort: channel.port2 }, [channel.port2]);

    await Promise.all([
      this.request(this.dbWorker, 'init'),
      this.request(this.embedWorker, 'init'),
    ]);

    console.log('[PGliteStore] init done (both workers ready)');
  }

  private request(worker: Worker, type: string, payload?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const seq = ++this.seq;
      this.pending.set(seq, { resolve, reject });
      worker.postMessage({ seq, type, ...payload });
    });
  }

  async clear(): Promise<void> {
    console.log('[PGliteStore] clear');
    await Promise.all([
      this.request(this.dbWorker!, 'clear'),
      this.request(this.embedWorker!, 'clear'),
    ]);
    this.dbWorker?.terminate();
    this.embedWorker?.terminate();
    this.dbWorker = null;
    this.embedWorker = null;
    this._modelReady = false;
  }

  async upsertItems(siteId: string, items: Array<{
    itemId: string; title: string; link?: string; description?: string;
    pubDate: string; readAt?: string;
  }>): Promise<void> {
    if (items.length === 0) return;
    await this.request(this.dbWorker!, 'upsert', { siteId, items });
  }

  async search(query: string, siteId?: string): Promise<SearchResult[]> {
    if (!query.trim()) return [];

    // Try vector search if model is ready
    if (this._modelReady) {
      try {
        const idsResp = await this.request(this.embedWorker!, 'vectorSearch', { text: query });
        if (idsResp.ids && idsResp.ids.length > 0) {
          const details = await this.request(this.dbWorker!, 'fetchDetails', { ids: idsResp.ids });
          return (details.items || []) as SearchResult[];
        }
      } catch (e) {
        console.log('[PGliteStore] vector search failed, falling back to text search:', e);
      }
    }

    // Text search on W1 (tsvector → ~*)
    const textResp = await this.request(this.dbWorker!, 'search', { query, siteId });
    return (textResp.items || []) as SearchResult[];
  }

  async markAsRead(_siteId: string, itemId: string): Promise<void> {
    await this.request(this.dbWorker!, 'markRead', { itemId });
  }

  async markSiteAsRead(siteId: string): Promise<void> {
    await this.request(this.dbWorker!, 'markSiteRead', { siteId });
  }

  async markAllAsRead(): Promise<void> {
    this.dbWorker!.postMessage({ type: 'markAllRead' });
  }

  async isRead(_siteId: string, itemId: string): Promise<boolean> {
    try {
      const resp = await this.request(this.dbWorker!, 'isRead', { itemId });
      return !!resp.isRead;
    } catch {
      return false;
    }
  }

  async getUnreadCount(siteId: string): Promise<number> {
    try {
      const resp = await this.request(this.dbWorker!, 'getUnreadCount', { siteId });
      return resp.count ?? 0;
    } catch {
      return 0;
    }
  }

  async getAllUnreadCounts(): Promise<Record<string, number>> {
    try {
      const resp = await this.request(this.dbWorker!, 'getAllUnreadCounts');
      return (resp.counts || {}) as Record<string, number>;
    } catch {
      return {};
    }
  }

  async getItemsForCommit(siteId: string): Promise<Array<{
    itemId: string; title: string; pubDate: string; readAt?: string;
  }>> {
    try {
      const resp = await this.request(this.dbWorker!, 'getItemsForCommit', { siteId });
      return (resp.items || []) as any[];
    } catch {
      return [];
    }
  }
}