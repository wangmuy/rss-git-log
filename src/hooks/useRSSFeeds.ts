import { useState, useEffect, useCallback } from 'react';
import { fetchMultipleRSS } from '@/utils/rss-parser';
import { RSSFeed, SiteWithStatus } from '@/types/rss';
import { useReaderStore } from '../store/readerStore';
import { getSiteId } from '@/utils/url';
import { loadAppConfig } from '@/utils/app-config';

interface UseRSSFeedsReturn {
  sites: SiteWithStatus[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markAsRead: (siteId: string, itemId: string) => void;
  markSiteAsRead: (siteId: string) => void;
  markAllAsRead: () => void;
}

/**
 * Hook to fetch and manage RSS feeds
 *
 * @param config - RSS configuration
 * @returns Feeds, loading state, error, and actions
 *
 * @example
 * const { sites, loading, error, refresh } = useRSSFeeds(config);
 */
export function useRSSFeeds(config: any): UseRSSFeedsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    sites,
    setSites,
    setFeeds,
    setLoading: setStoreLoading,
    setError: setStoreError,
    markAsRead,
    markSiteAsRead,
    markAllAsRead
  } = useReaderStore();

  const doFetch = useCallback(async () => {
    if (!config?.sites || config.sites.length === 0) {
      setError('No sites configured');
      return;
    }

    setLoading(true);
    setStoreLoading(true);
    setError(null);
    setStoreError(null);

    try {
      // Extract URLs from config
      const urls = config.sites.map((site: any) => site.url);

      // Fetch all feeds in parallel (returns null for failed feeds)
      const feeds: Array<RSSFeed | null> = await fetchMultipleRSS(urls, loadAppConfig().corsPolicy);

      // Track failed feeds for error reporting
      const failedSites: string[] = [];
      const successfulFeeds: RSSFeed[] = [];

      // Transform feeds into sites with status
      const sitesWithStatus: SiteWithStatus[] = config.sites.map((site: any, index: number) => {
        const feed = feeds[index];
        const siteId = getSiteId(site.url);

        if (!feed) {
          failedSites.push(site.name || site.url);
          return {
            ...site,
            siteId,
            unreadCount: 0,
            items: [],
            error: 'Failed to load feed'
          };
        }

        successfulFeeds.push(feed);
        return {
          ...site,
          siteId,
          unreadCount: feed.items.length || 0,
          items: feed.items || []
        };
      });

      // Set error message if some feeds failed
      if (failedSites.length > 0 && failedSites.length < config.sites.length) {
        setError(`Some feeds failed to load: ${failedSites.join(', ')}`);
      } else if (failedSites.length === config.sites.length) {
        setError(`All feeds failed to load. Check CORS policy in Config page.`);
      }

      setSites(sitesWithStatus);
      setFeeds(successfulFeeds);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch RSS feeds';
      setError(errorMsg);
      setStoreError(errorMsg);
      console.error('RSS fetch error:', err);
    } finally {
      setLoading(false);
      setStoreLoading(false);
    }
  }, [config, setSites, setFeeds, setStoreLoading, setStoreError]);

  // Only auto-fetch on initial mount when no sites exist in store
  useEffect(() => {
    if (config && sites.length === 0) {
      doFetch();
    }
  }, []);

  return {
    sites,
    loading,
    error,
    refresh: doFetch,
    markAsRead,
    markSiteAsRead,
    markAllAsRead
  };
}
