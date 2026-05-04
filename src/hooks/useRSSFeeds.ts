import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchRSSWithPolicy } from '@/utils/rss-parser';
import { SiteWithStatus } from '@/types/rss';
import { useReaderStore } from '../store/readerStore';
import { getSiteId } from '@/utils/url';
import { loadAppConfig } from '@/utils/app-config';
import { getLogItemsForSite } from '@/utils/log-file';
import { generateItemIdFromItem } from '@/utils/item-id';

const POOL_SIZE = 3;

interface UseRSSFeedsReturn {
  sites: SiteWithStatus[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markAsRead: (siteId: string, itemId: string) => void;
  markSiteAsRead: (siteId: string) => void;
  markAllAsRead: () => void;
  fetchSiteFeed: (siteId: string) => void;
}

export function useRSSFeeds(config: any): UseRSSFeedsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const poolRef = useRef<Set<string>>(new Set());
  const queueRef = useRef<string[]>([]);

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

    const siteIds = initialSites.map(s => s.siteId);
    queueRef.current = siteIds;
  }, [config, setSites]);

  const processQueue = useCallback(async () => {
    while (poolRef.current.size < POOL_SIZE && queueRef.current.length > 0) {
      const nextSiteId = queueRef.current.shift()!;
      const site = sites.find(s => s.siteId === nextSiteId);
      if (!site || site.items.length > 0 || poolRef.current.has(nextSiteId)) {
        continue;
      }

      poolRef.current.add(nextSiteId);
      setSiteLoading(nextSiteId, true);
      setStoreLoading(true);

      (async () => {
        try {
          const feed = await fetchRSSWithPolicy(site.url, loadAppConfig().corsPolicy);
          const items = feed?.items || [];
          const unreadCount = items.length;
          updateSite(nextSiteId, items, unreadCount);

          const appConfig = loadAppConfig();
          if (appConfig.githubWriteCapability.canWrite) {
            try {
              const githubItems = await getLogItemsForSite(nextSiteId);
              if (githubItems.size > 0) {
                const rssItemIds = new Set(items.map(i => generateItemIdFromItem(i)));
                const historicalItems: Array<{ itemId: string; title: string; pubDate: string }> = [];
                githubItems.forEach((logItem, itemId) => {
                  if (!rssItemIds.has(itemId)) {
                    historicalItems.push({ itemId, title: logItem.title, pubDate: logItem.pubDate });
                  }
                });
                if (historicalItems.length > 0) {
                  addHistoricalItems(nextSiteId, historicalItems);
                }
                mergeGitHubReadStatus(nextSiteId, githubItems);
              }
            } catch (e) {
              console.error('Failed to sync GitHub read status for', nextSiteId, e);
            }
          }
        } catch (err: any) {
          console.error('Failed to fetch feed for', nextSiteId, err);
        } finally {
          poolRef.current.delete(nextSiteId);
          setSiteLoading(nextSiteId, false);
          setStoreLoading(false);
          processQueue();
        }
      })();
    }
  }, [sites, setSiteLoading, setStoreLoading, updateSite, addHistoricalItems, mergeGitHubReadStatus]);

  useEffect(() => {
    if (config?.sites && config.sites.length > 0 && sites.length === 0) {
      initializeSites();
      setTimeout(() => processQueue(), 0);
    }
  }, [config, sites.length, initializeSites, processQueue]);

  const fetchSiteFeed = useCallback((siteId: string) => {
    const site = sites.find(s => s.siteId === siteId);
    if (!site) return;

    if (site.items.length > 0) return;
    if (poolRef.current.has(siteId)) return;

    queueRef.current = queueRef.current.filter(id => id !== siteId);
    queueRef.current.unshift(siteId);

    processQueue();
  }, [sites, processQueue]);

  const refresh = useCallback(async () => {
    if (!config?.sites || config.sites.length === 0) {
      setError('No sites configured');
      return;
    }

    setLoading(true);
    setStoreLoading(true);
    setError(null);
    setStoreError(null);

    poolRef.current.clear();
    queueRef.current.length = 0;

    try {
      for (const configSite of config.sites) {
        const siteId = getSiteId(configSite.url);
        const existingSite = sites.find(s => s.siteId === siteId);
        if (existingSite) {
          poolRef.current.add(siteId);
          setSiteLoading(siteId, true);

          try {
            const feed = await fetchRSSWithPolicy(configSite.url, loadAppConfig().corsPolicy);
            const items = feed?.items || [];
            const unreadCount = items.length;
            updateSite(siteId, items, unreadCount);
          } catch (err) {
            console.error('Failed to fetch feed for', siteId, err);
          } finally {
            poolRef.current.delete(siteId);
            setSiteLoading(siteId, false);
          }
        }
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch RSS feeds';
      setError(errorMsg);
      setStoreError(errorMsg);
    } finally {
      setLoading(false);
      setStoreLoading(false);
    }
  }, [config, sites, setStoreLoading, setStoreError, setSiteLoading, updateSite]);

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