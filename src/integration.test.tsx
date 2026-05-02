import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRSSFeeds } from './hooks/useRSSFeeds';
import { useReaderStore } from './store/readerStore';
import { generateItemIdFromItem } from './utils/item-id';

const RSS_XML = `<?xml version="1.0"?>
<rss><channel><title>RSS Feed</title><link>https://example.com</link>
<item><guid>1</guid><title>One</title><link>https://example.com/1</link><pubDate>2026-01-01</pubDate><description>First</description></item>
</channel></rss>`;

const config = {
  sites: [{ name: 'Example', url: 'https://example.com/rss', color: '#1976d2' }],
  settings: { showReadItems: false, autoCommit: false, commitInterval: 300 }
};

function TestReaderFlow() {
  const { sites, markAsRead } = useRSSFeeds(config);
  const isRead = useReaderStore(state => state.isRead);
  const item = sites[0]?.items[0];

  if (!item) return <div>Loading</div>;

  const itemId = generateItemIdFromItem(item);
  return (
    <button onClick={() => markAsRead(sites[0].siteId, itemId)}>
      {isRead(sites[0].siteId, itemId) ? 'read' : item.title}
    </button>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  useReaderStore.getState().clearSession();
});

describe('reader flow', () => {
  it('fetches, displays, and tracks a read item', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(RSS_XML));

    render(<TestReaderFlow />);

    const item = await screen.findByText('One');
    fireEvent.click(item);

    await waitFor(() => expect(screen.getByText('read')).toBeTruthy());
  });
});
