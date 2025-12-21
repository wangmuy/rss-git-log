/**
 * Remove tracking parameters from URL
 *
 * @param url - URL to clean
 * @returns URL without tracking parameters
 *
 * @example
 * cleanUrl('https://example.com/article?utm_source=newsletter&utm_campaign=test')
 * // Returns: 'https://example.com/article'
 */
export function removeTrackingParams(url: string): string {
  try {
    const urlObj = new URL(url);

    // Common tracking parameters to remove
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'fbclid',
      'gclid',
      'msclkid',
      'ref',
      'referer',
      'source'
    ];

    trackingParams.forEach(param => {
      urlObj.searchParams.delete(param);
    });

    return urlObj.toString();
  } catch {
    // If URL parsing fails, return original
    return url;
  }
}

/**
 * Get site identifier from URL (normalized)
 *
 * @param url - RSS feed URL
 * @returns Site ID (normalized URL without tracking params)
 *
 * @example
 * getSiteId('https://example.com/rss?utm_source=test')
 * // Returns: 'https://example.com/rss'
 */
export function getSiteId(url: string): string {
  return removeTrackingParams(url);
}

/**
 * Normalize a URL for comparison
 *
 * @param url - URL to normalize
 * @returns Normalized URL
 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Sort search params for consistent comparison
    const params = Array.from(urlObj.searchParams.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');

    urlObj.search = params;
    return urlObj.toString();
  } catch {
    return url;
  }
}