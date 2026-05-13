import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchRSSWithPolicy } from '@/utils/rss-parser';
import { SiteWithStatus } from '@/types/rss';
import { useReaderStore } from '../store/readerStore';
import { getSiteId } from '@/utils/url';
import { loadAppConfig } from '@/utils/app-config';
import { getLogItemsForSite } from '@/utils/log-file';
import { clearCachedLogFilesForSite } from '@/utils/log-cache';
import { generateItemIdFromItem } from '@/utils/item-id';

const getStoreState = () => useReaderStore.getState();

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
          const feed = await fetchRSSWithPolicy(site!.url, loadAppConfig().corsPolicy);
          const items = feed?.items || [];
          updateSite(nextSiteId, items, 0);

          const appConfig = loadAppConfig();
          if (appConfig.githubWriteCapability.canWrite) {
            try {
              clearCachedLogFilesForSite(appConfig.github, nextSiteId);
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

          const currentStoreState = getStoreState();
          const currentSite = currentStoreState.sites.find(s => s.siteId === nextSiteId);
          const allItems = currentSite?.items || items;
          const unreadCount = currentStoreState.getUnreadCount(nextSiteId);
          updateSite(nextSiteId, allItems, unreadCount);
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

    try {
      for (const configSite of config.sites) {
        const nextSiteId = getSiteId(configSite.url);
        const site = sites.find(s => s.siteId === nextSiteId);
        if (!site) continue;

        setSiteLoading(nextSiteId, true);
        updateSite(nextSiteId, [], 0);

        try {
          const feed = await fetchRSSWithPolicy(configSite.url, loadAppConfig().corsPolicy);
          const items = feed?.items || [];

          const appConfig = loadAppConfig();
          if (appConfig.githubWriteCapability.canWrite) {
            try {
              clearCachedLogFilesForSite(appConfig.github, nextSiteId);
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

          const currentStoreState = getStoreState();
          const currentSite = currentStoreState.sites.find(s => s.siteId === nextSiteId);
          const allItems = currentSite?.items || items;
          const unreadCount = currentStoreState.getUnreadCount(nextSiteId);
          updateSite(nextSiteId, allItems, unreadCount);
        } catch (err: any) {
          console.error('Failed to fetch feed for', nextSiteId, err);
        } finally {
          setSiteLoading(nextSiteId, false);
        }
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to refresh feeds';
      setError(errorMsg);
      setStoreError(errorMsg);
    } finally {
      setLoading(false);
      setStoreLoading(false);
    }
  }, [config, setStoreLoading, setStoreError, setSiteLoading, updateSite, addHistoricalItems, mergeGitHubReadStatus]);

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