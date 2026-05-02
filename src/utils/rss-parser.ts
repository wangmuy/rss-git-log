import { RSSFeed } from '@/types/rss';
import { CORSPolicy } from '@/types/config';

export const DEFAULT_CORS_POLICY: CORSPolicy = {
  mode: 'proxy-fallback',
  proxies: [
    {
      name: 'corsproxy.io',
      urlTemplate: 'https://corsproxy.io/?{url}'
    },
    {
      name: 'allorigins.win',
      urlTemplate: 'https://api.allorigins.win/raw?url={url}'
    }
  ],
  timeoutMs: 10000
};

/**
 * Parse RSS/Atom XML string using browser's DOMParser
 *
 * @param xml - XML string from RSS/Atom feed
 * @returns Parsed RSS feed
 */
function parseXMLFeed(xml: string): RSSFeed {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');

  // Check for parsing errors
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Failed to parse XML feed');
  }

  // Try RSS first
  const rssChannel = doc.querySelector('channel');
  if (rssChannel) {
    return parseRSSFeed(doc, rssChannel);
  }

  // Try Atom
  const atomFeed = doc.querySelector('feed');
  if (atomFeed) {
    return parseAtomFeed(doc, atomFeed);
  }

  throw new Error('Unknown feed format');
}

/**
 * Parse RSS feed format
 */
function parseRSSFeed(_doc: Document, channel: Element): RSSFeed {
  const title = channel.querySelector('title')?.textContent || '';
  const link = channel.querySelector('link')?.textContent || '';

  const items: Array<{
    guid: string;
    title: string;
    link: string;
    pubDate: string;
    description: string;
  }> = [];

  channel.querySelectorAll('item').forEach(item => {
    const guid = item.querySelector('guid')?.textContent ||
                 item.querySelector('link')?.textContent ||
                 '';
    const itemTitle = item.querySelector('title')?.textContent || '';
    const itemLink = item.querySelector('link')?.textContent || '';
    const pubDate = item.querySelector('pubDate')?.textContent ||
                    item.querySelector('dc\\:date')?.textContent ||
                    '';
    const description = item.querySelector('description')?.textContent ||
                        item.querySelector('content\\:encoded')?.textContent ||
                        item.querySelector('content')?.textContent ||
                        '';

    items.push({
      guid,
      title: itemTitle,
      link: itemLink,
      pubDate,
      description
    });
  });

  return { title, link, items };
}

/**
 * Parse Atom feed format
 */
function parseAtomFeed(_doc: Document, feed: Element): RSSFeed {
  const title = feed.querySelector('title')?.textContent || '';
  const link = feed.querySelector('link[rel="alternate"]')?.getAttribute('href') ||
               feed.querySelector('link')?.getAttribute('href') || '';

  const items: Array<{
    guid: string;
    title: string;
    link: string;
    pubDate: string;
    description: string;
  }> = [];

  feed.querySelectorAll('entry').forEach(entry => {
    const guid = entry.querySelector('id')?.textContent ||
                 entry.querySelector('link')?.getAttribute('href') ||
                 '';
    const itemTitle = entry.querySelector('title')?.textContent || '';
    const itemLink = entry.querySelector('link')?.getAttribute('href') || '';
    const pubDate = entry.querySelector('updated')?.textContent ||
                    entry.querySelector('published')?.textContent ||
                    '';
    const description = entry.querySelector('summary')?.textContent ||
                        entry.querySelector('content')?.textContent ||
                        '';

    items.push({
      guid,
      title: itemTitle,
      link: itemLink,
      pubDate,
      description
    });
  });

  return { title, link, items };
}

/**
 * Fetch with timeout.
 */
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

function buildProxyUrl(template: string, url: string): string {
  return template.replace('{url}', encodeURIComponent(url));
}

/**
 * Fetch RSS feed using configured CORS proxies.
 *
 * @param url - RSS feed URL
 * @param policy - CORS policy
 * @returns Parsed RSS feed
 */
async function fetchRSSWithProxy(url: string, policy: CORSPolicy): Promise<RSSFeed> {
  for (const proxy of policy.proxies) {
    try {
      const response = await fetchWithTimeout(buildProxyUrl(proxy.urlTemplate, url), policy.timeoutMs);
      if (!response.ok) continue;

      const xml = await response.text();
      return parseXMLFeed(xml);
    } catch (error) {
      // Try next proxy
      continue;
    }
  }

  throw new Error(`Failed to fetch RSS feed from ${url} using all proxy services`);
}

/**
 * Fetch and parse RSS feed from URL
 *
 * @param url - RSS feed URL
 * @returns Parsed RSS feed
 *
 * @example
 * const feed = await fetchRSS('https://example.com/rss');
 */
export async function fetchRSS(url: string): Promise<RSSFeed> {
  return fetchRSSWithPolicy(url, DEFAULT_CORS_POLICY);
}

/**
 * Fetch and parse RSS feed from URL using a runtime CORS policy.
 *
 * @param url - RSS feed URL
 * @param policy - Runtime CORS policy
 * @returns Parsed RSS feed
 */
export async function fetchRSSWithPolicy(url: string, policy: CORSPolicy = DEFAULT_CORS_POLICY): Promise<RSSFeed> {
  try {
    if (policy.mode === 'proxy-only') {
      return await fetchRSSWithProxy(url, policy);
    }

    const response = await fetchWithTimeout(url, policy.timeoutMs);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const xml = await response.text();
    return parseXMLFeed(xml);
  } catch (error: any) {
    if (policy.mode === 'direct-only') {
      throw error;
    }

    if (error.name === 'AbortError' ||
        error.message?.includes('CORS') ||
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('NetworkError')) {
      return await fetchRSSWithProxy(url, policy);
    }
    throw error;
  }
}

/**
 * Fetch multiple RSS feeds in parallel
 *
 * @param urls - Array of RSS feed URLs
 * @returns Array of parsed feeds
 *
 * @example
 * const feeds = await fetchMultipleRSS(['https://feed1.com', 'https://feed2.com']);
 */
export async function fetchMultipleRSS(
  urls: string[],
  policy: CORSPolicy = DEFAULT_CORS_POLICY
): Promise<RSSFeed[]> {
  const promises = urls.map(url => fetchRSSWithPolicy(url, policy).catch(error => {
    console.error(`Failed to fetch ${url}:`, error);
    return null;
  }));

  const results = await Promise.all(promises);
  return results.filter((feed): feed is RSSFeed => feed !== null);
}

/**
 * Validate RSS feed data
 *
 * @param feed - RSS feed to validate
 * @returns True if valid
 */
export function validateRSSFeed(feed: RSSFeed): boolean {
  if (!feed.title || !feed.items) return false;
  if (!Array.isArray(feed.items)) return false;
  return true;
}

/**
 * Sanitize RSS content (remove potentially harmful HTML)
 *
 * @param html - HTML content to sanitize
 * @returns Sanitized content
 */
export function sanitizeHTML(html: string): string {
  // Basic sanitization - remove script tags and event handlers
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/g, '')
    .replace(/\son\w+='[^']*'/g, '');
}
