import { useState, useEffect, useCallback } from 'react';
import { fetchMultipleRSS } from '@/utils/rss-parser';
import { RSSFeed, SiteWithStatus } from '@/types/rss';
import { useReaderStore } from '../store/readerStore';
import { getSiteId } from '@/utils/url';
import { loadAppConfig } from '@/utils/app-config';
import { getLogItemsForSite } from '@/utils/log-file';
import { generateItemIdFromItem } from '@/utils/item-id';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    sites,
    setSites,
    setFeeds,
    setLoading: setStoreLoading,
    setError: setStoreError,
    markAsRead,
    markSiteAsRead,
    markAllAsRead,
    mergeGitHubReadStatus,
    addHistoricalItems
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

      // Sync with GitHub logs after feed fetch
      const appConfig = loadAppConfig();
      if (appConfig.githubWriteCapability.canWrite) {
        for (const site of sitesWithStatus) {
          if (site.items && site.items.length > 0) {
            try {
              const githubItems = await getLogItemsForSite(site.siteId);
              if (githubItems.size > 0) {
                const rssItemIds = new Set(site.items.map(i => generateItemIdFromItem(i)));

                const historicalItems: Array<{ itemId: string; title: string; pubDate: string }> = [];
                githubItems.forEach((logItem, itemId) => {
                  if (!rssItemIds.has(itemId)) {
                    historicalItems.push({
                      itemId,
                      title: logItem.title,
                      pubDate: logItem.pubDate
                    });
                  }
                });

                if (historicalItems.length > 0) {
                  addHistoricalItems(site.siteId, historicalItems);
                }

                mergeGitHubReadStatus(site.siteId, githubItems);
              }
            } catch (error) {
              console.error('Failed to sync GitHub read status for', site.siteId, error);
            }
          }
        }
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch RSS feeds';
      setError(errorMsg);
      setStoreError(errorMsg);
      console.error('RSS fetch error:', err);
    } finally {
      setLoading(false);
      setStoreLoading(false);
    }
  }, [config, setSites, setFeeds, setStoreLoading, setStoreError, mergeGitHubReadStatus, addHistoricalItems]);

  // Auto-fetch when config becomes available and no sites exist in store
  useEffect(() => {
    if (config?.sites && config.sites.length > 0 && sites.length === 0) {
      doFetch();
    }
  }, [config, sites.length, doFetch]);

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
