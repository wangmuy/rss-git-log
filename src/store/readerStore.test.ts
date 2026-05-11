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

    it('unreadCount decreases by exactly 1 per markAsRead call for unique items', () => {
      const items: RSSItem[] = [
        createMockItem(1),
        createMockItem(2),
        createMockItem(3)
      ];

      const itemId1 = generateItemIdFromItem(items[0]);
      const itemId2 = generateItemIdFromItem(items[1]);
      const itemId3 = generateItemIdFromItem(items[2]);

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

      // Mark item 1 as read
      store.markAsRead('site-1', itemId1);
      let site = useReaderStore.getState().sites.find(s => s.siteId === 'site-1');
      expect(site?.unreadCount).toBe(2);

      // Navigate back by pressing 'k' (simulating user going back)
      // The item 1 was already marked as read, so pressing j again to go to item 1
      // and pressing j again to go back should not change count

      // Press 'j' to mark item 2 as read
      store.markAsRead('site-1', itemId2);
      site = useReaderStore.getState().sites.find(s => s.siteId === 'site-1');
      expect(site?.unreadCount).toBe(1);

      // Press 'k' to navigate back to item 1 (already read)
      // Then press 'j' again to go to item 2 (already read)
      // Both are already read, so count should not change
      store.markAsRead('site-1', itemId1); // mark already-read item 1 again
      site = useReaderStore.getState().sites.find(s => s.siteId === 'site-1');
      expect(site?.unreadCount).toBe(1); // still 1

      store.markAsRead('site-1', itemId2); // mark already-read item 2 again
      site = useReaderStore.getState().sites.find(s => s.siteId === 'site-1');
      expect(site?.unreadCount).toBe(1); // still 1, not 0

      // Only marking a truly unread item should change the count
      store.markAsRead('site-1', itemId3); // mark unread item 3
      site = useReaderStore.getState().sites.find(s => s.siteId === 'site-1');
      expect(site?.unreadCount).toBe(0);
    });

    it('marking same item multiple times does not decrease count repeatedly', () => {
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
          unreadCount: 2,
          error: undefined
        }],
        readStatus: {
          'site-1': new Set()
        }
      });

      const store = useReaderStore.getState();

      // Mark item 1 as read
      store.markAsRead('site-1', itemId1);
      let site = useReaderStore.getState().sites.find(s => s.siteId === 'site-1');
      expect(site?.unreadCount).toBe(1);

      // Mark item 1 as read again (simulates pressing 'j' going back to same item then forward)
      store.markAsRead('site-1', itemId1);
      site = useReaderStore.getState().sites.find(s => s.siteId === 'site-1');
      expect(site?.unreadCount).toBe(1); // should not change

      // Mark item 1 as read one more time
      store.markAsRead('site-1', itemId1);
      site = useReaderStore.getState().sites.find(s => s.siteId === 'site-1');
      expect(site?.unreadCount).toBe(1); // should still not change
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

    it('does not change readStatus if site is not found', () => {
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
      store.markSiteAsRead('nonexistent-site');

      const updatedSite = useReaderStore.getState().sites.find(s => s.siteId === 'site-1');
      expect(updatedSite?.unreadCount).toBe(1); // should not change
    });
  });

  describe('markAllAsRead updates readStatus', () => {
    it('marks all items across all sites as read', () => {
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
      store.markAllAsRead();

      expect(useReaderStore.getState().readStatus['site-1'].size).toBe(2);
      expect(useReaderStore.getState().readStatus['site-2'].size).toBe(2);
    });
  });
});