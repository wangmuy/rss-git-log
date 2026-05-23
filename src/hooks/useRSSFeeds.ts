import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchRSSWithPolicy } from '@/utils/rss-parser';
import { SiteWithStatus } from '@/types/rss';
import { useReaderStore } from '../store/readerStore';
import { getSiteId } from '@/utils/url';
import { loadAppConfig } from '@/utils/app-config';
import { generateItemIdFromItem } from '@/utils/item-id';
import { GitProviderConfig } from '@/types/git';
import { getItemStore } from '@/stores/use-item-store';

const getStoreState = () => useReaderStore.getState();

function fetchWithWorker(config: GitProviderConfig, siteId: string): Promise<Array<{ itemId: string; title: string; pubDate: string; readAt?: string }>> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/fetch.worker.ts', import.meta.url), { type: 'module' });
    const allItems: Array<{ itemId: string; title: string; pubDate: string; readAt?: string }> = [];
    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'batch') {
        allItems.push(...msg.items);
      } else if (msg.type === 'done') {
        worker.terminate();
        resolve(allItems);
      } else if (msg.type === 'error') {
        worker.terminate();
        reject(new Error(msg.error));
      }
    };
    worker.onerror = (e) => {
      worker.terminate();
      reject(e);
    };
    worker.postMessage({ config, siteId });
  });
}

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
          const store = await getItemStore();
          if (appConfig.githubWriteCapability.canWrite) {
            try {
              const itemsList = await fetchWithWorker(appConfig.github, nextSiteId);
              console.log(`[useRSSFeeds] GitHub returned ${itemsList.length} items for ${nextSiteId}`);
              // Merge RSS feed items + historical GitHub items so PGlite has everything
              const allStoreItems = itemsList.map((i: any) => i);
              const rssItemIds = new Set(itemsList.map((i: any) => i.itemId));
              for (const item of items) {
                const itemId = generateItemIdFromItem(item);
                if (!rssItemIds.has(itemId)) {
                  allStoreItems.push({
                    itemId, title: item.title || '', link: item.link,
                    description: item.description, pubDate: item.pubDate
                  });
                }
              }
              const newCount = allStoreItems.length - itemsList.length;
              console.log(`[useRSSFeeds] PGlite upsert: ${allStoreItems.length} total (${itemsList.length} GitHub + ${newCount} new RSS) for ${nextSiteId}`);
              await store.upsertItems(nextSiteId, allStoreItems);
            } catch (e) {
              console.error('Failed to sync GitHub read status for', nextSiteId, e);
            }
          } else {
            // Always store items in PGlite for search, even without GitHub
            const rssStoreItems = items.map(item => ({
              itemId: generateItemIdFromItem(item),
              title: item.title || '',
              link: item.link,
              description: item.description,
              pubDate: item.pubDate
            }));
            await store.upsertItems(nextSiteId, rssStoreItems);
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

    const REFRESH_CONCURRENCY = 3;

    // Process sites with limited concurrency
    for (let i = 0; i < config.sites.length; i += REFRESH_CONCURRENCY) {
      const batch = config.sites.slice(i, i + REFRESH_CONCURRENCY);

      await Promise.allSettled(
        batch.map(async (configSite: any) => {
          const nextSiteId = getSiteId(configSite.url);
          const site = sites.find(s => s.siteId === nextSiteId);
          if (!site) return;

          setSiteLoading(nextSiteId, true);

          try {
            const feed = await fetchRSSWithPolicy(configSite.url, loadAppConfig().corsPolicy);
            const items = feed?.items || [];
            // Set fresh RSS items immediately so the site is not empty while we fetch historical data
            updateSite(nextSiteId, items, 0);

            const appConfig = loadAppConfig();
            const store = await getItemStore();
            if (appConfig.githubWriteCapability.canWrite) {
              try {
                const itemsList = await fetchWithWorker(appConfig.github, nextSiteId);
                console.log(`[useRSSFeeds] refresh GitHub returned ${itemsList.length} items for ${nextSiteId}`);
                const allStoreItems = itemsList.map((i: any) => i);
                const rssItemIds = new Set(itemsList.map((i: any) => i.itemId));
                for (const item of items) {
                  const itemId = generateItemIdFromItem(item);
                  if (!rssItemIds.has(itemId)) {
                    allStoreItems.push({
                      itemId, title: item.title || '', link: item.link,
                      description: item.description, pubDate: item.pubDate
                    });
                  }
                }
                const newCount = allStoreItems.length - itemsList.length;
                console.log(`[useRSSFeeds] refresh PGlite upsert: ${allStoreItems.length} total (${itemsList.length} GitHub + ${newCount} new RSS) for ${nextSiteId}`);
                await store.upsertItems(nextSiteId, allStoreItems);
              } catch (e) {
                console.error('Failed to sync GitHub read status for', nextSiteId, e);
              }
            } else {
              // Always store items in PGlite for search, even without GitHub
              const rssStoreItems = items.map(item => ({
                itemId: generateItemIdFromItem(item),
                title: item.title || '',
                link: item.link,
                description: item.description,
                pubDate: item.pubDate
              }));
              await store.upsertItems(nextSiteId, rssStoreItems);
            }

            const currentStoreState = getStoreState();
            const currentSite = currentStoreState.sites.find((s: any) => s.siteId === nextSiteId);
            const allItems = currentSite?.items || items;
            const unreadCount = currentStoreState.getUnreadCount(nextSiteId);
            updateSite(nextSiteId, allItems, unreadCount);
          } catch (err: any) {
            console.error('Failed to fetch feed for', nextSiteId, err);
          } finally {
            setSiteLoading(nextSiteId, false);
          }
        })
      );
    }

    setLoading(false);
    setStoreLoading(false);
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