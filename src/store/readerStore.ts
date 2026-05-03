import { create } from 'zustand';
import { RSSFeed, SiteWithStatus } from '@/types/rss';
import { ReaderSettings } from '@/types/config';
import { ReadStatus } from '@/types/log';
import { generateItemIdFromItem } from '@/utils/item-id';

interface ReaderState {
  feeds: RSSFeed[];
  sites: SiteWithStatus[];
  readStatus: ReadStatus;
  settings: ReaderSettings;
  isLoading: boolean;
  isCommitting: boolean;
  error: string | null;

  setFeeds: (feeds: RSSFeed[]) => void;
  setSites: (sites: SiteWithStatus[]) => void;
  setSettings: (settings: Partial<ReaderSettings>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  markAsRead: (siteId: string, itemId: string) => void;
  markSiteAsRead: (siteId: string) => void;
  markAllAsRead: () => void;
  isRead: (siteId: string, itemId: string) => boolean;
  getUnreadCount: (siteId: string) => number;
  getUnreadItems: (siteId: string) => Array<{ itemId: string; title: string; pubDate: string; siteName: string }>;
  getAllUnreadItems: () => Record<string, Array<{ itemId: string; title: string; pubDate: string; siteName: string }>>;
  getAllItems: (siteId: string) => Array<{ itemId: string; title: string; pubDate: string; siteName: string }>;
  getReadItems: (siteId: string) => Array<{ itemId: string; title: string; pubDate: string; readAt?: string }>;
  mergeGitHubReadStatus: (siteId: string, githubItems: Map<string, { readAt?: string }>) => void;
  addHistoricalItems: (siteId: string, items: Array<{ itemId: string; title: string; pubDate: string }>) => void;

  clearSession: () => void;
  loadFromLocalStorage: () => void;
  saveToLocalStorage: () => void;

  setCommitting: (committing: boolean) => void;
}

const DEFAULT_SETTINGS: ReaderSettings = {
  showReadItems: false,
  autoCommit: false,
  commitInterval: 300
};

export const useReaderStore = create<ReaderState>((set, get) => ({
  feeds: [],
  sites: [],
  readStatus: {},
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  isCommitting: false,
  error: null,

  setFeeds: (feeds) => set({ feeds }),
  setSites: (sites) => set({ sites }),
  setSettings: (partialSettings) => {
    const newSettings = { ...get().settings, ...partialSettings };
    set({ settings: newSettings });
    get().saveToLocalStorage();
  },
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  markAsRead: (siteId, itemId) => {
    set(state => {
      const newReadStatus = { ...state.readStatus };
      if (!newReadStatus[siteId]) {
        newReadStatus[siteId] = new Set();
      }
      newReadStatus[siteId].add(itemId);

      localStorage.setItem('rss-reader-session', JSON.stringify({
        readStatus: Object.fromEntries(
          Object.entries(newReadStatus).map(([k, v]) => [k, Array.from(v)])
        ),
        settings: state.settings
      }));

      return { readStatus: newReadStatus };
    });
  },

  markSiteAsRead: (siteId) => {
    set(state => {
      const site = state.sites.find(s => s.siteId === siteId);
      if (!site) return state;

      const newReadStatus = { ...state.readStatus };
      if (!newReadStatus[siteId]) {
        newReadStatus[siteId] = new Set();
      }

      site.items.forEach(item => {
        const itemId = generateItemIdFromItem(item);
        newReadStatus[siteId].add(itemId);
      });

      localStorage.setItem('rss-reader-session', JSON.stringify({
        readStatus: Object.fromEntries(
          Object.entries(newReadStatus).map(([k, v]) => [k, Array.from(v)])
        ),
        settings: state.settings
      }));

      return { readStatus: newReadStatus };
    });
  },

  markAllAsRead: () => {
    set(state => {
      const newReadStatus: ReadStatus = {};

      state.sites.forEach(site => {
        const siteId = site.siteId;
        newReadStatus[siteId] = new Set();

        site.items.forEach(item => {
          const itemId = generateItemIdFromItem(item);
          newReadStatus[siteId].add(itemId);
        });
      });

      localStorage.setItem('rss-reader-session', JSON.stringify({
        readStatus: Object.fromEntries(
          Object.entries(newReadStatus).map(([k, v]) => [k, Array.from(v)])
        ),
        settings: state.settings
      }));

      return { readStatus: newReadStatus };
    });
  },

  isRead: (siteId, itemId) => {
    const state = get();
    return state.readStatus[siteId]?.has(itemId) || false;
  },

  getUnreadCount: (siteId) => {
    const state = get();
    const site = state.sites.find(s => s.siteId === siteId);
    if (!site) return 0;

    const readItems = state.readStatus[siteId] || new Set();
    return site.items.filter(item => {
      const itemId = generateItemIdFromItem(item);
      return !readItems.has(itemId);
    }).length;
  },

  getUnreadItems: (siteId) => {
    const state = get();
    const site = state.sites.find(s => s.siteId === siteId);
    if (!site) return [];

    const readItems = state.readStatus[siteId] || new Set();
    return site.items
      .filter(item => {
        const itemId = generateItemIdFromItem(item);
        return !readItems.has(itemId);
      })
      .map(item => ({
        itemId: generateItemIdFromItem(item),
        title: item.title,
        pubDate: item.pubDate,
        siteName: site.name
      }));
  },

  getAllUnreadItems: () => {
    const state = get();
    const result: Record<string, Array<{ itemId: string; title: string; pubDate: string; siteName: string }>> = {};

    state.sites.forEach(site => {
      const siteId = site.siteId;
      const unread = state.getUnreadItems(siteId);
      if (unread.length > 0) {
        result[siteId] = unread;
      }
    });

    return result;
  },

  getAllItems: (siteId) => {
    const state = get();
    const site = state.sites.find(s => s.siteId === siteId);
    if (!site) return [];

    return site.items.map(item => ({
      itemId: generateItemIdFromItem(item),
      title: item.title,
      pubDate: item.pubDate,
      siteName: site.name
    }));
  },

  getReadItems: (siteId) => {
    const state = get();
    const site = state.sites.find(s => s.siteId === siteId);
    if (!site) return [];

    const readItems = state.readStatus[siteId] || new Set();
    const readItemsList: Array<{ itemId: string; title: string; pubDate: string; readAt?: string }> = [];

    site.items.forEach(item => {
      const itemId = generateItemIdFromItem(item);
      if (readItems.has(itemId)) {
        readItemsList.push({
          itemId,
          title: item.title,
          pubDate: item.pubDate
        });
      }
    });

    return readItemsList;
  },

  mergeGitHubReadStatus: (siteId, githubItems) => {
    set(state => {
      const newReadStatus = { ...state.readStatus };
      if (!newReadStatus[siteId]) {
        newReadStatus[siteId] = new Set();
      }

      githubItems.forEach((githubItem, itemId) => {
        if (githubItem.readAt) {
          newReadStatus[siteId].add(itemId);
        }
      });

      localStorage.setItem('rss-reader-session', JSON.stringify({
        readStatus: Object.fromEntries(
          Object.entries(newReadStatus).map(([k, v]) => [k, Array.from(v)])
        ),
        settings: state.settings
      }));

      return { readStatus: newReadStatus };
    });
  },

  addHistoricalItems: (siteId, historicalItems) => {
    if (historicalItems.length === 0) return;

    set(state => {
      const siteIndex = state.sites.findIndex(s => s.siteId === siteId);
      if (siteIndex === -1) return state;

      const site = state.sites[siteIndex];
      const existingItemIds = new Set(site.items.map(item => generateItemIdFromItem(item)));

      const newItems = historicalItems
        .filter(item => !existingItemIds.has(item.itemId))
        .map(item => ({
          guid: item.itemId,
          title: item.title,
          pubDate: item.pubDate,
          link: '',
          description: ''
        }));

      if (newItems.length === 0) return state;

      const updatedSites = [...state.sites];
      updatedSites[siteIndex] = {
        ...site,
        items: [...site.items, ...newItems]
      };

      return { sites: updatedSites };
    });
  },

  clearSession: () => {
    set({
      readStatus: {},
      feeds: [],
      sites: [],
      error: null,
      isLoading: false,
      isCommitting: false
    });
    localStorage.removeItem('rss-reader-session');
  },

  loadFromLocalStorage: () => {
    try {
      const stored = localStorage.getItem('rss-reader-session');
      if (stored) {
        const parsed = JSON.parse(stored);

        const readStatus: ReadStatus = {};
        if (parsed.readStatus) {
          Object.entries(parsed.readStatus).forEach(([siteId, itemIds]) => {
            readStatus[siteId] = new Set(itemIds as string[]);
          });
        }

        set({
          readStatus,
          settings: parsed.settings || DEFAULT_SETTINGS
        });
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  },

  saveToLocalStorage: () => {
    try {
      const state = get();
      const data = {
        readStatus: Object.fromEntries(
          Object.entries(state.readStatus).map(([k, v]) => [k, Array.from(v)])
        ),
        settings: state.settings
      };
      localStorage.setItem('rss-reader-session', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },

  setCommitting: (committing) => set({ isCommitting: committing })
}));