import { RSSFeed } from '@/types/rss';

// Minimal DOM interfaces so both browser (native DOMParser) and
// Node.js (linkedom) documents satisfy the structural contract.
interface ParseableElement {
  textContent: string | null;
  getAttribute(name: string): string | null;
  querySelector(selectors: string): ParseableElement | null;
  querySelectorAll(selectors: string): ParseableElement[];
}

interface ParseableDocument {
  querySelector(selectors: string): ParseableElement | null;
}

function elText(el: ParseableElement | null, selector: string): string {
  return el?.querySelector(selector)?.textContent || '';
}

function elAttr(el: ParseableElement | null, selector: string, attr: string): string {
  return el?.querySelector(selector)?.getAttribute(attr) || '';
}

/**
 * Parse an already-parsed XML Document into an RSSFeed.
 * Platform-agnostic: works with any DOM-compatible Document
 * (browser native DOMParser or Node.js linkedom).
 */
export function parseXMLDocument(doc: ParseableDocument): RSSFeed {
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Failed to parse XML feed');
  }

  const rssChannel = doc.querySelector('channel');
  if (rssChannel) {
    return parseRSSFeed(doc, rssChannel);
  }

  const atomFeed = doc.querySelector('feed');
  if (atomFeed) {
    return parseAtomFeed(doc, atomFeed);
  }

  throw new Error('Unknown feed format');
}

export function parseRSSFeed(_doc: ParseableDocument, channel: ParseableElement): RSSFeed {
  const title = elText(channel, 'title');
  const link = elText(channel, 'link');

  const itemEls = Array.from(channel.querySelectorAll('item'));
  const items: RSSFeed['items'] = itemEls.map(item => ({
    guid: elText(item, 'guid') || elText(item, 'link'),
    title: elText(item, 'title'),
    link: elText(item, 'link'),
    pubDate: elText(item, 'pubDate') || elText(item, 'dc\\:date'),
    description: elText(item, 'description') ||
                 elText(item, 'content\\:encoded') ||
                 elText(item, 'content')
  }));

  return { title, link, items };
}

export function parseAtomFeed(_doc: ParseableDocument, feed: ParseableElement): RSSFeed {
  const title = elText(feed, 'title');
  const link = elAttr(feed, 'link[rel="alternate"]', 'href') ||
               elAttr(feed, 'link', 'href');

  const entryEls = Array.from(feed.querySelectorAll('entry'));
  const items: RSSFeed['items'] = entryEls.map(entry => ({
    guid: elText(entry, 'id') || elAttr(entry, 'link', 'href'),
    title: elText(entry, 'title'),
    link: elAttr(entry, 'link', 'href'),
    pubDate: elText(entry, 'updated') || elText(entry, 'published'),
    description: elText(entry, 'summary') || elText(entry, 'content')
  }));

  return { title, link, items };
}
