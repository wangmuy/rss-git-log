import { describe, expect, it } from 'vitest';
import { DOMParser } from 'linkedom';
import { parseXMLDocument } from './feed-parser';

const RSS_XML = `<?xml version="1.0"?>
<rss><channel><title>RSS Feed</title><link>https://example.com</link>
<item><guid>1</guid><title>One</title><link>https://example.com/1</link><pubDate>2026-01-01</pubDate><description>First</description></item>
</channel></rss>`;

const ATOM_XML = `<?xml version="1.0"?>
<feed><title>Atom Feed</title><link href="https://example.com"/>
<entry><id>1</id><title>One</title><link href="https://example.com/1"/><updated>2026-01-01</updated><summary>First</summary></entry>
</feed>`;

function parse(xml: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  return parseXMLDocument(doc);
}

describe('parseXMLDocument', () => {
  it('parses RSS 2.0 feeds', () => {
    const feed = parse(RSS_XML);

    expect(feed.title).toBe('RSS Feed');
    expect(feed.link).toBe('https://example.com');
    expect(feed.items).toHaveLength(1);
    expect(feed.items[0].guid).toBe('1');
    expect(feed.items[0].title).toBe('One');
    expect(feed.items[0].link).toBe('https://example.com/1');
    expect(feed.items[0].pubDate).toBe('2026-01-01');
    expect(feed.items[0].description).toBe('First');
  });

  it('parses Atom feeds', () => {
    const feed = parse(ATOM_XML);

    expect(feed.title).toBe('Atom Feed');
    expect(feed.link).toBe('https://example.com');
    expect(feed.items).toHaveLength(1);
    expect(feed.items[0].guid).toBe('1');
    expect(feed.items[0].title).toBe('One');
    expect(feed.items[0].link).toBe('https://example.com/1');
    expect(feed.items[0].pubDate).toBe('2026-01-01');
    expect(feed.items[0].description).toBe('First');
  });

  it('returns empty items for incomplete but parseable XML', () => {
    // xmldom parses incomplete tags without throwing — it builds what it can
    const parser = new DOMParser();
    const doc = parser.parseFromString('<rss><channel></channel></rss>', 'text/xml');

    const feed = parseXMLDocument(doc);
    expect(feed.title).toBe('');
    expect(feed.items).toHaveLength(0);
  });

  it('throws on unknown feed format', () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString('<html><body>Not a feed</body></html>', 'text/xml');

    expect(() => parseXMLDocument(doc)).toThrow('Unknown feed format');
  });
});
