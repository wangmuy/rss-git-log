import { describe, expect, it } from 'vitest';
import { DOMParser } from 'linkedom';
import { parseOPMLDocument, serializeOPML } from './opml';

function parse(xml: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  return parseOPMLDocument(doc as any);
}

describe('parseOPMLDocument', () => {
  it('parses flat OPML with multiple sites', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head><title>Subs</title></head>
  <body>
    <outline type="rss" text="HN" title="HN" xmlUrl="https://news.ycombinator.com/rss" app:color="#ff6600"/>
    <outline type="rss" text="TechCrunch" title="TechCrunch" xmlUrl="https://techcrunch.com/feed/"/>
  </body>
</opml>`;
    const { sites } = parse(xml);
    expect(sites).toHaveLength(2);
    expect(sites[0]).toEqual({ name: 'HN', url: 'https://news.ycombinator.com/rss', color: '#ff6600' });
    expect(sites[1]).toEqual({ name: 'TechCrunch', url: 'https://techcrunch.com/feed/', color: undefined });
  });

  it('flattens nested outlines with folder prefix', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <body>
    <outline text="Tech">
      <outline type="rss" xmlUrl="https://tc.com/feed" title="TechCrunch"/>
      <outline text="Mobile">
        <outline type="rss" xmlUrl="https://9to5mac.com/feed" title="9to5Mac"/>
      </outline>
    </outline>
  </body>
</opml>`;
    const { sites } = parse(xml);
    expect(sites).toHaveLength(2);
    expect(sites[0].name).toBe('Tech / TechCrunch');
    expect(sites[1].name).toBe('Tech / Mobile / 9to5Mac');
  });

  it('returns empty array for body with no outline xmlUrl', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <body>
    <outline text="Empty folder"/>
  </body>
</opml>`;
    const { sites } = parse(xml);
    expect(sites).toHaveLength(0);
  });

  it('uses xmlUrl as name when title and text are missing', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <body>
    <outline type="rss" xmlUrl="https://example.com/feed"/>
  </body>
</opml>`;
    const { sites } = parse(xml);
    expect(sites).toHaveLength(1);
    expect(sites[0].name).toBe('https://example.com/feed');
  });

  it('reads app:color attribute', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <body>
    <outline type="rss" xmlUrl="https://example.com/feed" title="Example" app:color="#ff6600"/>
  </body>
</opml>`;
    const { sites } = parse(xml);
    expect(sites[0].color).toBe('#ff6600');
  });
});

describe('serializeOPML', () => {
  it('generates valid OPML with sites', () => {
    const sites = [
      { name: 'HN', url: 'https://news.ycombinator.com/rss', color: '#ff6600' },
      { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' }
    ];
    const xml = serializeOPML(sites);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<opml version="2.0');
    expect(xml).toContain('xmlUrl="https://news.ycombinator.com/rss"');
    expect(xml).toContain('app:color="#ff6600"');
    expect(xml).not.toContain('app:color=""');
  });

  it('generates OPML with empty body for empty sites', () => {
    const xml = serializeOPML([]);
    expect(xml).toContain('<body>');
    expect(xml).toContain('</body>');
  });

  it('escapes XML special characters in names and URLs', () => {
    const sites = [
      { name: 'AT&T', url: 'https://example.com/?a=1&b=2' }
    ];
    const xml = serializeOPML(sites);
    expect(xml).toContain('AT&amp;T');
    expect(xml).toContain('a=1&amp;b=2');
  });
});

describe('round-trip', () => {
  it('preserves site data through parse then serialize', () => {
    const sites = [
      { name: 'HN', url: 'https://news.ycombinator.com/rss', color: '#ff6600' },
      { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' }
    ];
    const xml = serializeOPML(sites);
    const { sites: parsed } = parse(xml);
    expect(parsed).toEqual(sites);
  });
});