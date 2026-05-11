import { describe, expect, it, beforeEach } from 'vitest';
import { useReaderStore } from './readerStore';
import { RSSItem } from '@/types/rss';
import { generateItemIdFromItem } from '@/utils/item-id';

const createMockItem = (id: number): RSSItem => ({
  guid: `guid-${id}`,
  title: `Title ${id}`,
  link: `https://example.com/${id}`,
  description: `Description ${id}`,
  pubDate: `2026-01-0${id}T12:00:00Z`
});

describe('readerStore', () => {
  beforeEach(() => {
    useReaderStore.setState({
      sites: [],
      readStatus: {},
      loadingSites: {}
    });
  });

  describe('markAsRead updates unreadCount', () => {
    it('decreases unreadCount by 1 when marking an unread item as read', () => {
      const items: RSSItem[] = [
        createMockItem(1),
        createMockItem(2),
        createMockItem(3)
      ];

      useReaderStore.setState({
        sites: [{
          siteId: 'site-1',
          name: 'Test Site',
          url: 'https://example.com/feed.xml',
          color: '#1976d2',
          items,
          unreadCount: 3,
          error: undefined
        }],
        readStatus: {
          'site-1': new Set()
        }
      });

      const store = useReaderStore.getState();
      const itemId = generateItemIdFromItem(items[0]);
      store.markAsRead('site-1', itemId);

      const updatedSite = useReaderStore.getState().sites.find(s => s.siteId === 'site-1');
      expect(updatedSite?.unreadCount).toBe(2);
    });

    it('does not change unreadCount when marking an already-read item', () => {
      const items: RSSItem[] = [
        createMockItem(1),
        createMockItem(2)
      ];
      const itemId1 = generateItemIdFromItem(items[0]);

      useReaderStore.setState({
        sites: [{
          siteId: 'site-1',
          name: 'Test Site',
          url: 'https://example.com/feed.xml',
          color: '#1976d2',
          items,
          unreadCount: 1,
          error: undefined
        }],
        readStatus: {
          'site-1': new Set([itemId1])
        }
      });

      const store = useReaderStore.getState();
      store.markAsRead('site-1', itemId1);

      const updatedSite = useReaderStore.getState().sites.find(s => s.siteId === 'site-1');
      expect(updatedSite?.unreadCount).toBe(1);
    });

    it('updates unreadCount for the correct site when multiple sites exist', () => {
      const items1: RSSItem[] = [createMockItem(1), createMockItem(2)];
      const items2: RSSItem[] = [createMockItem(3), createMockItem(4)];

      useReaderStore.setState({
        sites: [
          {
            siteId: 'site-1',
            name: 'Site 1',
            url: 'https://example.com/feed1.xml',
            color: '#1976d2',
            items: items1,
            unreadCount: 2,
            error: undefined
          },
          {
            siteId: 'site-2',
            name: 'Site 2',
            url: 'https://example.com/feed2.xml',
            color: '#388e3c',
            items: items2,
            unreadCount: 2,
            error: undefined
          }
        ],
        readStatus: {
          'site-1': new Set(),
          'site-2': new Set()
        }
      });

      const store = useReaderStore.getState();
      const itemId = generateItemIdFromItem(items1[0]);
      store.markAsRead('site-1', itemId);

      const site1 = useReaderStore.getState().sites.find(s => s.siteId === 'site-1');
      const site2 = useReaderStore.getState().sites.find(s => s.siteId === 'site-2');

      expect(site1?.unreadCount).toBe(1);
      expect(site2?.unreadCount).toBe(2);
    });

    it('decrements to 0 when marking the last unread item', () => {
      const items: RSSItem[] = [createMockItem(1)];

      useReaderStore.setState({
        sites: [{
          siteId: 'site-1',
          name: 'Test Site',
          url: 'https://example.com/feed.xml',
          color: '#1976d2',
          items,
          unreadCount: 1,
          error: undefined
        }],
        readStatus: {
          'site-1': new Set()
        }
      });

      const store = useReaderStore.getState();
      const itemId = generateItemIdFromItem(items[0]);
      store.markAsRead('site-1', itemId);

      const updatedSite = useReaderStore.getState().sites.find(s => s.siteId === 'site-1');
      expect(updatedSite?.unreadCount).toBe(0);
    });
  });

  describe('markSiteAsRead updates unreadCount', () => {
    it('sets unreadCount to 0 when marking all items as read', () => {
      const items: RSSItem[] = [
        createMockItem(1),
        createMockItem(2),
        createMockItem(3)
      ];

      useReaderStore.setState({
        sites: [{
          siteId: 'site-1',
          name: 'Test Site',
          url: 'https://example.com/feed.xml',
          color: '#1976d2',
          items,
          unreadCount: 3,
          error: undefined
        }],
        readStatus: {
          'site-1': new Set()
        }
      });

      const store = useReaderStore.getState();
      store.markSiteAsRead('site-1');

      const updatedSite = useReaderStore.getState().sites.find(s => s.siteId === 'site-1');
      expect(updatedSite?.unreadCount).toBe(0);
    });
  });
});