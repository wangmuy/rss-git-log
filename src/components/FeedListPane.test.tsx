import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { FeedListPane } from './SidebarFeedLayout';
import { SiteWithStatus, RSSItem } from '@/types/rss';
import { generateItemIdFromItem } from '@/utils/item-id';
import { useReaderStore } from '@/store/readerStore';

const createMockSite = (feedItems: RSSItem[]): SiteWithStatus => ({
  siteId: 'test-site',
  name: 'Test Site',
  url: 'https://example.com/feed.xml',
  color: '#1976d2',
  items: feedItems,
  unreadCount: feedItems.length,
  error: undefined,
});

const createMockItem = (id: number): RSSItem => ({
  guid: `guid-${id}`,
  title: `Title ${id}`,
  link: `https://example.com/${id}`,
  description: `Desc ${id}`,
  pubDate: `2026-01-0${id}T12:00:00Z`,
});

function setReadItemIds(readItemIds: Set<string>): void {
  useReaderStore.setState({ readStatus: { 'test-site': readItemIds } });
}

/** Return FeedItem Paper containers rendered inside this test's render container. */
function getFeedItems(container: HTMLElement): Element[] {
  return [...container.querySelectorAll('[id="FeedItem-root"]')];
}

afterEach(() => {
  cleanup();
  useReaderStore.getState().clearSession();
});

function setSessionReadItemIds(readItemIds: Set<string>): void {
  useReaderStore.setState({ sessionReadItemIdSet: { 'test-site': readItemIds } });
}

describe('FeedListPane show/hide logic', () => {
  it('shows all items when showReadItems is false and none are read', () => {
    const feedItems: RSSItem[] = [createMockItem(1), createMockItem(2), createMockItem(3)];
    const site = createMockSite(feedItems);
    setReadItemIds(new Set<string>());

    const container = render(
      <FeedListPane
        site={site}
        onMarkAsRead={() => {}}
        showReadItems={false}
      />
    ).container;

    const rendered = getFeedItems(container);
    expect(rendered.length).toBe(3);
  });

  it('shows all items including read ones when showReadItems is true', () => {
    const feedItems: RSSItem[] = [createMockItem(1), createMockItem(2)];
    const site = createMockSite(feedItems);
    const itemId1 = generateItemIdFromItem(feedItems[0]);
    setReadItemIds(new Set([itemId1]));

    const container = render(
      <FeedListPane
        site={site}
        onMarkAsRead={() => {}}
        showReadItems={true}
      />
    ).container;

    const rendered = getFeedItems(container);
    expect(rendered.length).toBe(2);
  });

  it('hides read items when showReadItems is false', () => {
    const feedItems: RSSItem[] = [createMockItem(1), createMockItem(2), createMockItem(3)];
    const site = createMockSite(feedItems);
    const itemId1 = generateItemIdFromItem(feedItems[0]);
    const itemId3 = generateItemIdFromItem(feedItems[2]);
    setReadItemIds(new Set([itemId1, itemId3]));

    const container = render(
      <FeedListPane
        site={site}
        onMarkAsRead={() => {}}
        showReadItems={false}
      />
    ).container;

    const rendered = getFeedItems(container);
    expect(rendered.length).toBe(1);
    expect(rendered[0].querySelector('p')?.textContent).toBe('Desc 2');
  });

  it('right pane item count matches unread count when showReadItems is false', () => {
    const feedItems: RSSItem[] = [createMockItem(1), createMockItem(2), createMockItem(3)];
    const site = createMockSite(feedItems);
    const itemId1 = generateItemIdFromItem(feedItems[0]);
    setReadItemIds(new Set([itemId1]));

    const container = render(
      <FeedListPane
        site={site}
        onMarkAsRead={() => {}}
        showReadItems={false}
      />
    ).container;

    const rendered = getFeedItems(container);
    expect(rendered.length).toBe(2);
  });

  it('toggling showReadItems from false to true reveals previously hidden read items', async () => {
    const feedItems: RSSItem[] = [createMockItem(1), createMockItem(2)];
    const site = createMockSite(feedItems);
    const itemId1 = generateItemIdFromItem(feedItems[0]);
    setReadItemIds(new Set([itemId1]));

    const { rerender, container } = render(
      <FeedListPane
        site={site}
        onMarkAsRead={() => {}}
        showReadItems={false}
      />
    );

    await waitFor(() => {
      const rendered = getFeedItems(container);
      expect(rendered.length).toBe(1);
    });

    rerender(
      <FeedListPane
        site={site}
        onMarkAsRead={() => {}}
        showReadItems={true}
      />
    );

    await waitFor(() => {
      const rendered = getFeedItems(container);
      expect(rendered.length).toBe(2);
    });
  });

  it('session-read items stay visible when showReadItems is false', () => {
    const feedItems: RSSItem[] = [createMockItem(1), createMockItem(2)];
    const site = createMockSite(feedItems);
    const itemId1 = generateItemIdFromItem(feedItems[0]);
    // item1 is in readStatus (pre-read) AND session set (user-read this session)
    setReadItemIds(new Set([itemId1]));
    setSessionReadItemIds(new Set([itemId1]));

    const container = render(
      <FeedListPane
        site={site}
        onMarkAsRead={() => {}}
        showReadItems={false}
      />
    ).container;

    const rendered = getFeedItems(container);
    expect(rendered.length).toBe(2);
  });

  it('markAsRead adds to sessionReadItemIdSet so item stays visible', async () => {
    const feedItems: RSSItem[] = [createMockItem(1), createMockItem(2)];
    const site = createMockSite(feedItems);
    const itemId1 = generateItemIdFromItem(feedItems[0]);
    setReadItemIds(new Set<string>());

    const container = render(
      <FeedListPane
        site={site}
        onMarkAsRead={(_, itemId) => useReaderStore.getState().markAsRead('test-site', itemId)}
        showReadItems={false}
      />
    ).container;

    await waitFor(() => {
      const rendered = getFeedItems(container);
      expect(rendered.length).toBe(2);
    });

    useReaderStore.getState().markAsRead('test-site', itemId1);

    await waitFor(() => {
      const rendered = getFeedItems(container);
      expect(rendered.length).toBe(2);
    });
  });

  it('mergeGitHubReadStatus adds to readStatus but NOT sessionReadItemIdSet so item becomes hidden', async () => {
    const feedItems: RSSItem[] = [createMockItem(1)];
    const site = createMockSite(feedItems);
    const itemId1 = generateItemIdFromItem(feedItems[0]);
    setReadItemIds(new Set<string>());

    const container = render(
      <FeedListPane
        site={site}
        onMarkAsRead={() => {}}
        showReadItems={false}
      />
    ).container;

    await waitFor(() => {
      const rendered = getFeedItems(container);
      expect(rendered.length).toBe(1);
    });

    const githubItems = new Map<string, { readAt?: string }>();
    githubItems.set(itemId1, { readAt: new Date().toISOString() });
    useReaderStore.getState().mergeGitHubReadStatus('test-site', githubItems);

    await waitFor(() => {
      const rendered = getFeedItems(container);
      expect(rendered.length).toBe(0);
    });
  });

  it('markSiteAsRead keeps all items visible (adds to sessionReadItemIdSet)', async () => {
    const feedItems: RSSItem[] = [createMockItem(1), createMockItem(2), createMockItem(3)];
    const site = createMockSite(feedItems);
    setReadItemIds(new Set<string>());

    const container = render(
      <FeedListPane
        site={site}
        onMarkAsRead={() => {}}
        showReadItems={false}
      />
    ).container;

    await waitFor(() => {
      const rendered = getFeedItems(container);
      expect(rendered.length).toBe(3);
    });

    useReaderStore.getState().markSiteAsRead('test-site');

    await waitFor(() => {
      const rendered = getFeedItems(container);
      expect(rendered.length).toBe(3);
    });
  });

  it('batch merge: pre-read items from feed fetch are hidden, GitHub-read items are hidden, GitHub-unread items are visible', async () => {
    const feedItems: RSSItem[] = [createMockItem(1), createMockItem(2), createMockItem(3)];
    const site = createMockSite(feedItems);
    const itemId1 = generateItemIdFromItem(feedItems[0]);
    const itemId2 = generateItemIdFromItem(feedItems[1]);

    // Simulate page load: item1 was read in previous session
    setReadItemIds(new Set([itemId1]));

    const container = render(
      <FeedListPane
        site={site}
        onMarkAsRead={() => {}}
        showReadItems={false}
      />
    ).container;

    // After feed fetch: item1 hidden (pre-read), item2+3 visible
    await waitFor(() => {
      const rendered = getFeedItems(container);
      expect(rendered.length).toBe(2);
    });

    // Simulate GitHub merge: item2 was read elsewhere, item3 is new/unread
    const githubItems = new Map<string, { readAt?: string }>();
    githubItems.set(itemId2, { readAt: new Date().toISOString() });
    useReaderStore.getState().mergeGitHubReadStatus('test-site', githubItems);

    // GitHub merge adds item2 to readStatus (not session set) → hidden
    // item3 still unread → visible
    // item1 still in readStatus → hidden
    await waitFor(() => {
      const rendered = getFeedItems(container);
      expect(rendered.length).toBe(1);
    });
  });
});

describe('Keyboard navigation j/k behavior', () => {

  it('pressing j marks only ONE item as read, not multiple', async () => {
    const feedItems: RSSItem[] = [
      createMockItem(1),
      createMockItem(2),
      createMockItem(3),
      createMockItem(4),
      createMockItem(5),
    ];
    const site = createMockSite(feedItems);
    setReadItemIds(new Set<string>());

    const onMarkAsRead = vi.fn();
    const container = render(
      <FeedListPane
        site={site}
        onMarkAsRead={onMarkAsRead}
        showReadItems={false}
      />
    ).container;

    await waitFor(() => {
      const rendered = getFeedItems(container);
      expect(rendered.length).toBe(5);
    });

    fireEvent.keyDown(document, { key: 'j' });

    await waitFor(() => {
      expect(onMarkAsRead).toHaveBeenCalledTimes(1);
    });

    expect(onMarkAsRead).toHaveBeenCalledWith('test-site', expect.any(String));
  });

  it('pressing j multiple times marks items sequentially', async () => {
    const feedItems: RSSItem[] = [createMockItem(1), createMockItem(2), createMockItem(3)];
    const site = createMockSite(feedItems);
    setReadItemIds(new Set<string>());

    const onMarkAsRead = vi.fn();
    render(
      <FeedListPane
        site={site}
        onMarkAsRead={onMarkAsRead}
        showReadItems={false}
      />
    );

    fireEvent.keyDown(document, { key: 'j' });
    await waitFor(() => expect(onMarkAsRead).toHaveBeenCalledTimes(1));

    fireEvent.keyDown(document, { key: 'j' });
    await waitFor(() => expect(onMarkAsRead).toHaveBeenCalledTimes(2));

    fireEvent.keyDown(document, { key: 'j' });
    await waitFor(() => expect(onMarkAsRead).toHaveBeenCalledTimes(3));
  });

  it('unread count should decrease by exactly 1 per j keypress', async () => {
    const feedItems: RSSItem[] = [createMockItem(1), createMockItem(2), createMockItem(3)];
    const site = createMockSite(feedItems);
    setReadItemIds(new Set<string>());

    const onMarkAsRead = vi.fn();
    render(
      <FeedListPane
        site={site}
        onMarkAsRead={onMarkAsRead}
        showReadItems={false}
      />
    );

    fireEvent.keyDown(document, { key: 'j' });
    await waitFor(() => expect(onMarkAsRead).toHaveBeenCalledTimes(1));

    fireEvent.keyDown(document, { key: 'j' });
    await waitFor(() => expect(onMarkAsRead).toHaveBeenCalledTimes(2));

    expect(onMarkAsRead).toHaveBeenCalledTimes(2);
  });

  it('k key does not mark items as read', async () => {
    const feedItems: RSSItem[] = [createMockItem(1), createMockItem(2)];
    const site = createMockSite(feedItems);
    setReadItemIds(new Set<string>());

    const onMarkAsRead = vi.fn();
    render(
      <FeedListPane
        site={site}
        onMarkAsRead={onMarkAsRead}
        showReadItems={false}
      />
    );

    fireEvent.keyDown(document, { key: 'k' });
    await waitFor(() => {});

    expect(onMarkAsRead).not.toHaveBeenCalled();
  });

  it('reading status from store readStatus affects which items get marked', async () => {
    const feedItems: RSSItem[] = [createMockItem(1), createMockItem(2), createMockItem(3)];
    const site = createMockSite(feedItems);
    const itemId1 = generateItemIdFromItem(feedItems[0]);
    const itemId2 = generateItemIdFromItem(feedItems[1]);
    setReadItemIds(new Set([itemId1, itemId2]));

    const onMarkAsRead = vi.fn();
    const container = render(
      <FeedListPane
        site={site}
        onMarkAsRead={onMarkAsRead}
        showReadItems={false}
      />
    ).container;

    await waitFor(() => {
      const rendered = getFeedItems(container);
      expect(rendered.length).toBe(1);
    });

    fireEvent.keyDown(document, { key: 'j' });
    await waitFor(() => {
      expect(onMarkAsRead).toHaveBeenCalledTimes(1);
    });
  });

  it('simulates post-refresh: readStatus has many items, j only marks first visible unread', async () => {
    const feedItems: RSSItem[] = [
      createMockItem(1),
      createMockItem(2),
      createMockItem(3),
      createMockItem(4),
      createMockItem(5),
    ];
    const site = createMockSite(feedItems);
    const itemIds = feedItems.map(i => generateItemIdFromItem(i));
    setReadItemIds(new Set([itemIds[0], itemIds[1], itemIds[2], itemIds[3]]));

    const onMarkAsRead = vi.fn();
    const container = render(
      <FeedListPane
        site={site}
        onMarkAsRead={onMarkAsRead}
        showReadItems={false}
      />
    ).container;

    await waitFor(() => {
      const rendered = getFeedItems(container);
      expect(rendered.length).toBe(1);
    });

    fireEvent.keyDown(document, { key: 'j' });
    await waitFor(() => {
      expect(onMarkAsRead).toHaveBeenCalledTimes(1);
    });
  });

  it('rapid j presses should each mark exactly one item', async () => {
    const feedItems: RSSItem[] = [createMockItem(1), createMockItem(2), createMockItem(3), createMockItem(4)];
    const site = createMockSite(feedItems);
    setReadItemIds(new Set<string>());

    const onMarkAsRead = vi.fn();
    render(
      <FeedListPane
        site={site}
        onMarkAsRead={onMarkAsRead}
        showReadItems={false}
      />
    );

    fireEvent.keyDown(document, { key: 'j' });
    fireEvent.keyDown(document, { key: 'j' });
    fireEvent.keyDown(document, { key: 'j' });

    await waitFor(() => {
      expect(onMarkAsRead).toHaveBeenCalledTimes(3);
    });

    const calls = onMarkAsRead.mock.calls;
    const uniqueItemIds = new Set(calls.map(c => c[1]));
    expect(uniqueItemIds.size).toBe(3);
  });
});
