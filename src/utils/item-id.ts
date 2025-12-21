import { removeTrackingParams } from './url';

/**
 * Generate a unique identifier for an RSS item
 *
 * Uses a composite hash of multiple fields to ensure uniqueness:
 * - guid (if available)
 * - normalized link (without tracking params)
 * - title + description + pubDate (combined)
 *
 * @param guid - RSS item GUID
 * @param link - Item link URL
 * @param title - Item title
 * @param description - Item description
 * @param pubDate - Publication date
 * @returns Unique item ID (32 character base64 string)
 *
 * @example
 * generateItemId(
 *   'item-123',
 *   'https://example.com/article?utm_source=test',
 *   'My Article',
 *   'Article description',
 *   '2025-12-21T10:00:00Z'
 * )
 * // Returns: 'aBcDeFgHiJkLmNoPqRsTuVwXyZ012345'
 */
export function generateItemId(
  guid: string,
  link: string,
  title: string,
  description: string,
  pubDate: string
): string {
  // Normalize link (remove tracking params)
  const normalizedLink = link ? removeTrackingParams(link) : '';

  // Create composite string
  const composite = `${guid}|${normalizedLink}|${title}|${description}|${pubDate}`;

  // Create hash (simple base64 encoding for now)
  // In production, consider using crypto.subtle.digest for better hashing
  const hash = btoa(composite).replace(/=/g, '').substring(0, 32);

  return hash;
}

/**
 * Generate item ID from RSS item object
 *
 * @param item - RSS item
 * @returns Unique item ID
 */
export function generateItemIdFromItem(item: {
  guid?: string;
  link?: string;
  title?: string;
  description?: string;
  pubDate?: string;
}): string {
  return generateItemId(
    item.guid || '',
    item.link || '',
    item.title || '',
    item.description || '',
    item.pubDate || ''
  );
}

/**
 * Batch generate item IDs for multiple items
 *
 * @param items - Array of RSS items
 * @returns Map of item IDs to items
 */
export function generateItemIdsMap<T extends { guid?: string; link?: string; title?: string; description?: string; pubDate?: string; }>(
  items: T[]
): Map<string, T> {
  const map = new Map<string, T>();

  items.forEach(item => {
    const id = generateItemIdFromItem(item);
    map.set(id, item);
  });

  return map;
}