import { useState, useEffect, useCallback } from 'react';
import { fetchRSSWithPolicy } from '@/utils/rss-parser';
import { SiteWithStatus } from '@/types/rss';
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
  fetchSiteFeed: (siteId: string) => Promise<void>;
}

export function useRSSFeeds(config: any): UseRSSFeedsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    sites,
    setSites,
    setLoading: setStoreLoading,
    setError: setStoreError,
    markAsRead,
    markSiteAsRead,
    markAllAsRead,
    mergeGitHubReadStatus,
    addHistoricalItems,
    setSiteLoading,
    updateSite
  } = useReaderStore();

  const initializeSites = useCallback(() => {
    if (!config?.sites || config.sites.length === 0) {
      return;
    }

    const initialSites: SiteWithStatus[] = config.sites.map((site: any) => {
      const siteId = getSiteId(site.url);
      return {
        ...site,
        siteId,
        unreadCount: 0,
        items: [],
        error: undefined
      };
    });

    setSites(initialSites);
  }, [config, setSites]);

  useEffect(() => {
    if (config?.sites && config.sites.length > 0 && sites.length === 0) {
      initializeSites();
    }
  }, [config, sites.length, initializeSites]);

  const fetchSiteFeed = useCallback(async (siteId: string) => {
    const site = sites.find(s => s.siteId === siteId);
    if (!site || site.items.length > 0) return;

    setSiteLoading(siteId, true);
    setStoreLoading(true);

    try {
      const feed = await fetchRSSWithPolicy(site.url, loadAppConfig().corsPolicy);
      const items = feed?.items || [];
      const unreadCount = items.length;

      updateSite(siteId, items, unreadCount);

      const appConfig = loadAppConfig();
      if (appConfig.githubWriteCapability.canWrite) {
        try {
          const githubItems = await getLogItemsForSite(siteId);
          if (githubItems.size > 0) {
            const rssItemIds = new Set(items.map(i => generateItemIdFromItem(i)));

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
              addHistoricalItems(siteId, historicalItems);
            }

            mergeGitHubReadStatus(siteId, githubItems);
          }
        } catch (error) {
          console.error('Failed to sync GitHub read status for', siteId, error);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch feed for', siteId, err);
      const siteIndex = sites.findIndex(s => s.siteId === siteId);
      if (siteIndex !== -1) {
        const updatedSites = [...sites];
        updatedSites[siteIndex] = { ...sites[siteIndex], error: 'Failed to load feed' };
        setSites(updatedSites);
      }
    } finally {
      setSiteLoading(siteId, false);
      setStoreLoading(false);
    }
  }, [sites, setSiteLoading, setStoreLoading, updateSite, setSites, mergeGitHubReadStatus, addHistoricalItems]);

  const refresh = useCallback(async () => {
    if (!config?.sites || config.sites.length === 0) {
      setError('No sites configured');
      return;
    }

    setLoading(true);
    setStoreLoading(true);
    setError(null);
    setStoreError(null);

    try {
      for (const site of config.sites) {
        const siteId = getSiteId(site.url);
        await fetchSiteFeed(siteId);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch RSS feeds';
      setError(errorMsg);
      setStoreError(errorMsg);
    } finally {
      setLoading(false);
      setStoreLoading(false);
    }
  }, [config, fetchSiteFeed, setStoreLoading, setStoreError]);

  return {
    sites,
    loading,
    error,
    refresh,
    markAsRead,
    markSiteAsRead,
    markAllAsRead,
    fetchSiteFeed
  };
}