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

  const fetchFeeds = useCallback(async () => {
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

      // Fetch all feeds in parallel
      const feeds: RSSFeed[] = await fetchMultipleRSS(urls, loadAppConfig().corsPolicy);

      // Transform feeds into sites with status
      const sitesWithStatus: SiteWithStatus[] = config.sites.map((site: any, index: number) => {
        const feed = feeds[index];
        const siteId = getSiteId(site.url);

        return {
          ...site,
          siteId,
          unreadCount: feed?.items.length || 0,
          items: feed?.items || []
        };
      });

      setSites(sitesWithStatus);
      setFeeds(feeds);
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

  useEffect(() => {
    if (config) {
      fetchFeeds();
    }
  }, [config, fetchFeeds]);

  return {
    sites,
    loading,
    error,
    refresh: fetchFeeds,
    markAsRead,
    markSiteAsRead,
    markAllAsRead
  };
}
