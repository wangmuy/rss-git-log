import Parser from 'rss-parser';
import { RSSFeed, RSSItem } from '@/types/rss';

// Type definitions for rss-parser
interface CustomItem {
  guid?: string;
  pubDate?: string;
  description?: string;
  'content:encoded'?: string;
  content?: string;
  title?: string;
  link?: string;
}

interface CustomFeed {
  title?: string;
  link?: string;
  items: CustomItem[];
}

/**
 * Custom parser instance with extended fields
 */
const parser = new Parser<CustomFeed, CustomItem>({
  customFields: {
    item: [
      'guid',
      'pubDate',
      'description',
      'content:encoded',
      'content'
    ]
  }
});

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
  try {
    // Try direct fetch first
    const feed = await parser.parseURL(url);

    return {
      title: feed.title || '',
      link: feed.link || '',
      items: (feed.items || []).map(item => ({
        guid: item.guid || '',
        title: item.title || '',
        link: item.link || '',
        pubDate: item.pubDate || '',
        description: item.description || item['content:encoded'] || item.content || ''
      }))
    };
  } catch (error: any) {
    // If CORS error, try with proxy
    if (error.message?.includes('CORS') || error.message?.includes('Failed to fetch')) {
      return await fetchRSSWithProxy(url);
    }
    throw error;
  }
}

/**
 * Fetch RSS feed using CORS proxy
 *
 * @param url - RSS feed URL
 * @returns Parsed RSS feed
 */
async function fetchRSSWithProxy(url: string): Promise<RSSFeed> {
  const encodedUrl = encodeURIComponent(url);

  // Try multiple proxy services
  const proxies = [
    `https://corsproxy.io/?${encodedUrl}`,
    `https://api.allorigins.win/raw?url=${encodedUrl}`
  ];

  for (const proxyUrl of proxies) {
    try {
      const response = await fetch(proxyUrl);
      if (!response.ok) continue;

      const xml = await response.text();
      const feed = await parser.parseString(xml);

      return {
        title: feed.title || '',
        link: feed.link || '',
        items: (feed.items || []).map(item => ({
          guid: item.guid || '',
          title: item.title || '',
          link: item.link || '',
          pubDate: item.pubDate || '',
          description: item.description || item['content:encoded'] || item.content || ''
        }))
      };
    } catch (error) {
      // Try next proxy
      continue;
    }
  }

  throw new Error(`Failed to fetch RSS feed from ${url} using all proxy services`);
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
export async function fetchMultipleRSS(urls: string[]): Promise<RSSFeed[]> {
  const promises = urls.map(url => fetchRSS(url).catch(error => {
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