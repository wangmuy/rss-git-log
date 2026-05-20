import { ItemStore, SearchResult } from './item-store';
import { PGlite } from '@electric-sql/pglite';

export class PGliteStore implements ItemStore {
  private db: PGlite | null = null;

  async init(): Promise<void> {
    this.db = new PGlite('idb://rss-reader');
    await this.db.waitReady;
    await this.migrate();
  }

  async clear(): Promise<void> {
    if (!this.db) return;
    await this.db.exec('DROP TABLE IF EXISTS items CASCADE');
    await this.db.close();
    this.db = null;
  }

  private async migrate(): Promise<void> {
    if (!this.db) return;
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        item_id TEXT NOT NULL,
        site_id TEXT NOT NULL,
        guid TEXT NOT NULL DEFAULT '',
        title TEXT NOT NULL DEFAULT '',
        link TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        pub_date TEXT NOT NULL DEFAULT '',
        is_read INTEGER NOT NULL DEFAULT 0,
        read_at TEXT,
        fetched_at TEXT NOT NULL DEFAULT (now())
      )
    `);
    await this.db.exec('CREATE INDEX IF NOT EXISTS idx_items_site ON items(site_id)');
    await this.db.exec('CREATE INDEX IF NOT EXISTS idx_items_read ON items(is_read)');
    await this.db.exec('CREATE INDEX IF NOT EXISTS idx_items_pub_date ON items(pub_date DESC)');
  }

  private async safeExec(sql: string, params?: any[]): Promise<void> {
    if (!this.db) return;
    try {
      if (params) {
        await this.db.query(sql, params);
      } else {
        await this.db.exec(sql);
      }
    } catch {
      try { await this.db.exec('ROLLBACK'); } catch {}
      throw new Error(`Query failed, connection reset needed`);
    }
  }

  async upsertItems(siteId: string, items: Array<{
    itemId: string; title: string; link?: string; description?: string;
    pubDate: string; readAt?: string;
  }>): Promise<void> {
    if (!this.db || items.length === 0) return;
    const conn = this.db;

    for (const item of items) {
      try {
        await conn.query(
          `INSERT INTO items (id, item_id, site_id, guid, title, link, description, pub_date, is_read, read_at)
           VALUES (md5($1), $1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET
             title = COALESCE(NULLIF(EXCLUDED.title, ''), items.title),
             link = COALESCE(NULLIF(EXCLUDED.link, ''), items.link),
             description = COALESCE(NULLIF(EXCLUDED.description, ''), items.description),
             pub_date = COALESCE(NULLIF(EXCLUDED.pub_date, ''), items.pub_date),
             is_read = items.is_read,
             read_at = items.read_at`,
          [
            item.itemId, siteId, item.itemId, item.title || '',
            item.link || '', item.description || '', item.pubDate || '',
            item.readAt ? 1 : 0, item.readAt || null
          ]
        );
      } catch {
        try { await conn.exec('ROLLBACK'); } catch {}
      }
    }
  }

  async markAsRead(_siteId: string, itemId: string): Promise<void> {
    await this.safeExec(
      'UPDATE items SET is_read = 1, read_at = now() WHERE id = md5($1)',
      [itemId]
    );
  }

  async markSiteAsRead(siteId: string): Promise<void> {
    await this.safeExec(
      'UPDATE items SET is_read = 1, read_at = now() WHERE site_id = $1',
      [siteId]
    );
  }

  async markAllAsRead(): Promise<void> {
    await this.safeExec('UPDATE items SET is_read = 1, read_at = now()');
  }

  async isRead(_siteId: string, itemId: string): Promise<boolean> {
    if (!this.db) return false;
    try {
      const res = await this.db.query<{ is_read: number }>(
        'SELECT is_read FROM items WHERE id = md5($1)',
        [itemId]
      );
      return res.rows?.[0]?.is_read === 1;
    } catch {
      try { await this.db.exec('ROLLBACK'); } catch {}
      return false;
    }
  }

  async getUnreadCount(siteId: string): Promise<number> {
    if (!this.db) return 0;
    try {
      const res = await this.db.query<{ cnt: number }>(
        'SELECT COUNT(*) AS cnt FROM items WHERE site_id = $1 AND is_read = 0',
        [siteId]
      );
      return res.rows?.[0]?.cnt ?? 0;
    } catch {
      try { await this.db.exec('ROLLBACK'); } catch {}
      return 0;
    }
  }

  async getAllUnreadCounts(): Promise<Record<string, number>> {
    if (!this.db) return {};
    try {
      const res = await this.db.query<{ site_id: string; cnt: number }>(
        'SELECT site_id, COUNT(*) AS cnt FROM items WHERE is_read = 0 GROUP BY site_id'
      );
      const counts: Record<string, number> = {};
      for (const row of res.rows ?? []) {
        counts[row.site_id] = row.cnt;
      }
      return counts;
    } catch {
      try { await this.db.exec('ROLLBACK'); } catch {}
      return {};
    }
  }

  async search(query: string, siteId?: string): Promise<SearchResult[]> {
    if (!this.db || !query.trim()) return [];
    const rows: Array<{ item_id: string; site_id: string; title: string; description: string; pub_date: string }> = [];

    try {
      const siteFilter = siteId ? ' AND i.site_id = $2' : '';
      const params: any[] = [query];
      if (siteId) params.push(siteId);
      const res = await this.db.query(
        `SELECT i.item_id, i.site_id, i.title, i.description, i.pub_date
         FROM items i
         WHERE to_tsvector('english', i.title || ' ' || i.description)
               @@ plainto_tsquery('english', $1)
         ${siteFilter}
         ORDER BY ts_rank(
           to_tsvector('english', i.title || ' ' || i.description),
           plainto_tsquery('english', $1)
         ) DESC
         LIMIT 20`,
        params
      );
      rows.push(...(res.rows as any[]));
    } catch {
      try {
        const siteFilter = siteId ? ' AND site_id = $2' : '';
        const params: any[] = [query];
        if (siteId) params.push(siteId);
        const res = await this.db.query(
          `SELECT item_id, site_id, title, description, pub_date
           FROM items
           WHERE title LIKE '%' || $1 || '%' OR description LIKE '%' || $1 || '%'
           ${siteFilter}
           LIMIT 20`,
          params
        );
        rows.push(...(res.rows as any[]));
      } catch {
        try { await this.db.exec('ROLLBACK'); } catch {}
      }
    }

    return rows.map((row: any, i: number) => ({
      itemId: row.item_id,
      siteId: row.site_id,
      title: row.title,
      snippet: (row.description || '').slice(0, 200),
      pubDate: row.pub_date,
      rank: i + 1
    }));
  }

  async getItemsForCommit(siteId: string): Promise<Array<{
    itemId: string; title: string; pubDate: string; readAt?: string;
  }>> {
    if (!this.db) return [];
    try {
      const res = await this.db.query<{ item_id: string; title: string; pub_date: string; read_at: string | null }>(
        'SELECT item_id, title, pub_date, read_at FROM items WHERE site_id = $1',
        [siteId]
      );
      return res.rows.map(row => ({
        itemId: row.item_id,
        title: row.title,
        pubDate: row.pub_date,
        readAt: row.read_at || undefined
      }));
    } catch {
      try { await this.db.exec('ROLLBACK'); } catch {}
      return [];
    }
  }
}