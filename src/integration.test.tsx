import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { useReaderStore } from './store/readerStore';
import { generateItemIdFromItem } from './utils/item-id';
import { RSSItem } from './types/rss';

describe('reader flow', () => {
  beforeEach(() => {
    useReaderStore.setState({
      sites: [{
        siteId: 'site-1',
        name: 'Test Site',
        url: 'https://example.com/rss',
        color: '#1976d2',
        items: [],
        unreadCount: 0,
        error: undefined
      }],
      readStatus: { 'site-1': new Set() }
    });
  });

  afterEach(() => {
    useReaderStore.getState().clearSession();
  });

  it('marks item as read and updates unreadCount', () => {
    const items: RSSItem[] = [
      { guid: '1', title: 'One', link: 'https://example.com/1', pubDate: '2026-01-01', description: 'First' },
      { guid: '2', title: 'Two', link: 'https://example.com/2', pubDate: '2026-01-02', description: 'Second' }
    ];

    useReaderStore.setState(state => ({
      sites: state.sites.map(s => s.siteId === 'site-1' ? { ...s, items, unreadCount: 2 } : s)
    }));

    const store = useReaderStore.getState();
    const itemId1 = generateItemIdFromItem(items[0]);

    store.markAsRead('site-1', itemId1);

    const updatedSite = useReaderStore.getState().sites.find(s => s.siteId === 'site-1');
    expect(updatedSite?.unreadCount).toBe(1);
  });
});
