import { create } from 'zustand';
import { RSSFeed, SiteWithStatus } from '@/types/rss';
import { ReaderSettings } from '@/types/config';
import { ReadStatus } from '@/types/log';
import { generateItemIdFromItem } from '@/utils/item-id';

interface ReaderState {
  // Data
  feeds: RSSFeed[];
  sites: SiteWithStatus[];
  readStatus: ReadStatus;
  settings: ReaderSettings;

  // Loading states
  isLoading: boolean;
  isCommitting: boolean;
  error: string | null;

  // Actions
  setFeeds: (feeds: RSSFeed[]) => void;
  setSites: (sites: SiteWithStatus[]) => void;
  setSettings: (settings: Partial<ReaderSettings>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Read tracking
  markAsRead: (siteId: string, itemId: string) => void;
  markSiteAsRead: (siteId: string) => void;
  markAllAsRead: () => void;
  isRead: (siteId: string, itemId: string) => boolean;
  getUnreadCount: (siteId: string) => number;
  getUnreadItems: (siteId: string) => Array<{ itemId: string; title: string; pubDate: string; siteName: string }>;
  getAllUnreadItems: () => Record<string, Array<{ itemId: string; title: string; pubDate: string; siteName: string }>>;

  // Session management
  clearSession: () => void;
  loadFromLocalStorage: () => void;
  saveToLocalStorage: () => void;

  // Commit state
  setCommitting: (committing: boolean) => void;
}

const DEFAULT_SETTINGS: ReaderSettings = {
  showReadItems: false,
  autoCommit: false,
  commitInterval: 300 // 5 minutes
};

export const useReaderStore = create<ReaderState>((set, get) => ({
  // Initial state
  feeds: [],
  sites: [],
  readStatus: {},
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  isCommitting: false,
  error: null,

  // Data setters
  setFeeds: (feeds) => set({ feeds }),
  setSites: (sites) => set({ sites }),
  setSettings: (partialSettings) => {
    const newSettings = { ...get().settings, ...partialSettings };
    set({ settings: newSettings });
    // Auto-save to localStorage
    get().saveToLocalStorage();
  },
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // Read tracking
  markAsRead: (siteId, itemId) => {
    set(state => {
      const newReadStatus = { ...state.readStatus };
      if (!newReadStatus[siteId]) {
        newReadStatus[siteId] = new Set();
      }
      newReadStatus[siteId].add(itemId);

      // Auto-save
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

      // Add all items from this site
      site.items.forEach(item => {
        const itemId = generateItemIdFromItem(item);
        newReadStatus[siteId].add(itemId);
      });

      // Auto-save
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

      // Auto-save
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

  // Session management
  clearSession: () => {
    set({
      readStatus: {},
      feeds: [],
      sites: [],
      error: null
    });
    localStorage.removeItem('rss-reader-session');
  },

  loadFromLocalStorage: () => {
    try {
      const stored = localStorage.getItem('rss-reader-session');
      if (stored) {
        const parsed = JSON.parse(stored);

        // Convert arrays back to Sets
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

  // Commit state
  setCommitting: (committing) => set({ isCommitting: committing })
}));
