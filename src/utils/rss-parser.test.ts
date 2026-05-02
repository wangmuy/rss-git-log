import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchRSSWithPolicy } from './rss-parser';
import { CORSPolicy } from '@/types/config';

const RSS_XML = `<?xml version="1.0"?>
<rss><channel><title>RSS Feed</title><link>https://example.com</link>
<item><guid>1</guid><title>One</title><link>https://example.com/1</link><pubDate>2026-01-01</pubDate><description>First</description></item>
</channel></rss>`;

const ATOM_XML = `<?xml version="1.0"?>
<feed><title>Atom Feed</title><link href="https://example.com"/>
<entry><id>1</id><title>One</title><link href="https://example.com/1"/><updated>2026-01-01</updated><summary>First</summary></entry>
</feed>`;

const policy: CORSPolicy = {
  mode: 'direct-only',
  proxies: [],
  timeoutMs: 1000
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fetchRSSWithPolicy', () => {
  it('parses RSS 2.0 feeds', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(RSS_XML));

    const feed = await fetchRSSWithPolicy('https://example.com/rss', policy);

    expect(feed.title).toBe('RSS Feed');
    expect(feed.items[0].guid).toBe('1');
  });

  it('parses Atom feeds', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(ATOM_XML));

    const feed = await fetchRSSWithPolicy('https://example.com/atom', policy);

    expect(feed.title).toBe('Atom Feed');
    expect(feed.items[0].link).toBe('https://example.com/1');
  });

  it('throws on malformed XML', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('<rss><channel>'));

    await expect(fetchRSSWithPolicy('https://example.com/rss', policy)).rejects.toThrow('Failed to parse XML feed');
  });

  it('uses proxy-only mode without direct fetch', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(RSS_XML));

    await fetchRSSWithPolicy('https://example.com/rss', {
      mode: 'proxy-only',
      proxies: [{ name: 'test', urlTemplate: 'https://proxy.test/?url={url}' }],
      timeoutMs: 1000
    });

    expect(fetchMock).toHaveBeenCalledWith('https://proxy.test/?url=https%3A%2F%2Fexample.com%2Frss', expect.any(Object));
  });

  it('falls back to proxies when direct fetch fails', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockResolvedValueOnce(new Response(RSS_XML));

    const feed = await fetchRSSWithPolicy('https://example.com/rss', {
      mode: 'proxy-fallback',
      proxies: [{ name: 'test', urlTemplate: 'https://proxy.test/?url={url}' }],
      timeoutMs: 1000
    });

    expect(feed.title).toBe('RSS Feed');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
