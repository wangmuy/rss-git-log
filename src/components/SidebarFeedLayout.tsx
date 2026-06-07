import React, { useState, useEffect, useRef, useMemo, useLayoutEffect, useCallback } from 'react';
import { useReaderStore } from '../store/readerStore';
import { generateItemIdFromItem } from '@/utils/item-id';
import { getItemStore } from '@/stores/use-item-store';
import { SearchResult } from '@/stores/item-store';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Chip,
  Stack,
  Paper,
  CircularProgress,
  TextField,
  InputAdornment,
  Tooltip,
  LinearProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { SiteWithStatus } from '@/types/rss';
import { FeedItem } from './FeedItem';

interface SidebarFeedLayoutProps {
  sites: SiteWithStatus[];
  onMarkAsRead: (siteId: string, itemId: string) => void;
  onSiteSelect: (siteId: string) => void;
  loadingSites: Record<string, boolean>;
  showReadItems: boolean;
  onShowReadItemsChange?: (show: boolean) => void;
}

export const SidebarFeedLayout: React.FC<SidebarFeedLayoutProps> = ({
  sites,
  onMarkAsRead,
  onSiteSelect,
  loadingSites,
  showReadItems
}) => {
  const [selectedSiteId, setSelectedSiteId] = useState<string>(sites[0]?.siteId || '');
  const getUnreadCount = useReaderStore(state => state.getUnreadCount);
  const setSiteLoading = useReaderStore(state => state.setSiteLoading);

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchTier, setSearchTier] = useState<'vector' | 'text' | 'regex' | 'loading' | null>(null);
  const [modelProgress, setModelProgress] = useState(0);
  const searchInFlightRef = useRef(false);

  // Wire PGliteStore model lifecycle callbacks (no-op for localStorage provider)
  React.useEffect(() => {
    getItemStore().then(store => {
      if ('onProgress' in store && 'onModelReady' in store) {
        const pgStore = store as any;
        pgStore.onProgress = (pct: number) => {
          setModelProgress(pct);
          setSearchTier('loading');
        };
        pgStore.onModelReady = () => {
          setSearchTier('vector');
          setModelProgress(0);
        };
        // Detect current tier on mount
        if (pgStore._modelReady) {
          setSearchTier('vector');
        } else {
          setSearchTier('text');
        }
      }
    });
  }, []);

  const doSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    if (searchInFlightRef.current) return;
    searchInFlightRef.current = true;
    try {
      const store = await getItemStore();
      if (!searchInFlightRef.current) return;
      const results = await store.search(query);
      if (!searchInFlightRef.current) return;
      setSearchResults(results);
      setSearching(false);
    } catch (e) {
      console.error('[Search] error:', e);
      setSearchResults([]);
      setSearching(false);
    } finally {
      searchInFlightRef.current = false;
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setSearching(false);
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    const site = sites.find(s => s.siteId === selectedSiteId);
    if (!site || site.items.length === 0) return;

    setSiteLoading(selectedSiteId, true);
    try {
      const state = useReaderStore.getState();
      const result: any = await new Promise((resolve, reject) => {
        const worker = new Worker(new URL('../workers/mark-all-read.worker.ts', import.meta.url), { type: 'module' });
        worker.onmessage = (e: MessageEvent) => { worker.terminate(); resolve(e.data); };
        worker.onerror = (e: ErrorEvent) => { worker.terminate(); reject(e); };
        worker.postMessage({
          siteId: selectedSiteId,
          items: site.items,
          existingReadStatus: Object.fromEntries(
            Object.entries(state.readStatus).map(([k, v]) => [k, Array.from(v)])
          ),
          settings: state.settings
        });
      });

      try {
        localStorage.setItem('rss-reader-session', '::lz::' + result.compressed);
      } catch {}

      const existing = useReaderStore.getState().readStatus[selectedSiteId] || new Set();
      const existingSession = useReaderStore.getState().sessionReadItemIdSet[selectedSiteId] || new Set();
      for (const id of result.itemIds) {
        existing.add(id);
        existingSession.add(id);
      }
      useReaderStore.setState({
        readStatus: { ...useReaderStore.getState().readStatus, [selectedSiteId]: existing },
        sessionReadItemIdSet: { ...useReaderStore.getState().sessionReadItemIdSet, [selectedSiteId]: existingSession },
        sites: useReaderStore.getState().sites.map(s =>
          s.siteId === selectedSiteId ? { ...s, unreadCount: 0 } : s
        )
      });
    } catch (e) {
      console.error('Failed to mark all as read:', e);
    } finally {
      setSiteLoading(selectedSiteId, false);
    }
  }, [selectedSiteId, sites, setSiteLoading]);

  useEffect(() => {
    if (sites.length > 0) {
      const selectedExists = sites.some(site => site.siteId === selectedSiteId);
      if (!selectedExists) {
        setSelectedSiteId(sites[0].siteId);
      }
    }
  }, [sites, selectedSiteId]);

  useEffect(() => {
    if (selectedSiteId && sites.length > 0) {
      const site = sites.find(s => s.siteId === selectedSiteId);
      if (site && site.items.length === 0 && !loadingSites[selectedSiteId]) {
        onSiteSelect(selectedSiteId);
      }
    }
  }, [selectedSiteId, sites, loadingSites, onSiteSelect]);

  const selectedSite = sites.find(site => site.siteId === selectedSiteId);

  if (sites.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No feeds available
        </Typography>
      </Box>
    );
  }

  const feedList = useMemo(() => (
        <List sx={{ flex: '1 1 auto', overflow: 'auto', p: 0 }}>
          {sites.map((site) => {
            const unreadCount = getUnreadCount(site.siteId);
            const isSelected = site.siteId === selectedSiteId;
            const isLoading = loadingSites[site.siteId];
            const hasItems = site.items.length > 0;
            const hasError = site.error;

            return (
              <ListItem key={site.siteId} disablePadding>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => setSelectedSiteId(site.siteId)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    borderLeft: isSelected ? `4px solid ${site.color || '#1976d2'}` : '4px solid transparent',
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ fontWeight: isSelected ? 600 : 400 }}>
                          {site.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {isLoading && (
                            <CircularProgress size={16} color="primary" />
                          )}
                          {hasError && (
                            <Chip label="!" size="small" color="error" sx={{ minWidth: 20, height: 20 }} />
                          )}
                          {unreadCount > 0 && !isLoading && (
                            <Chip
                              label={unreadCount}
                              size="small"
                              color="primary"
                              sx={{ minWidth: 24, height: 20 }}
                            />
                          )}
                          {unreadCount === 0 && !isLoading && hasItems && (
                            <Chip
                              label="✓"
                              size="small"
                              sx={{ minWidth: 20, height: 20, bgcolor: 'success.light', color: 'success.contrastText' }}
                            />
                          )}
                        </Box>
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      ), [sites, selectedSiteId, loadingSites, getUnreadCount]);

      return (
        <Box sx={{ display: 'flex', flex: 1, gap: 2, minHeight: 0 }}>
          <Paper sx={{ width: { xs: 240, sm: 280, md: 320 }, overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                RSS Feeds ({sites.length})
              </Typography>
            </Box>
            <Box sx={{ px: 1, pt: 1 }}>
              <SearchBox onSearch={doSearch} searching={searching} searchTier={searchTier} modelProgress={modelProgress} />
            </Box>
            {searchResults.length > 0 ? (
              <Box sx={{ flex: 1, overflow: 'auto', borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="caption" sx={{ px: 2, pt: 1, display: 'block', color: 'text.secondary' }}>
                  Search results ({searchResults.length})
                </Typography>
                {searchResults.map((result) => (
                  <ListItem key={result.itemId} disablePadding sx={{ pl: 2 }}>
                    <ListItemButton
                      onClick={() => {
                        setSelectedSiteId(result.siteId);
                        clearSearch();
                      }}
                    >
                      <ListItemText
                        primary={result.title}
                        secondary={`${new Date(result.pubDate).toLocaleDateString()} · ${result.snippet.slice(0, 80)}...`}
                        primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </Box>
            ) : null}
            {feedList}
      </Paper>

      <Paper sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {selectedSite && selectedSite.items.length > 0 && (
          <>
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {selectedSite.name}
              </Typography>
              <Typography
                variant="body2"
                onClick={handleMarkAllAsRead}
                sx={{ cursor: 'pointer', textDecoration: 'underline', color: 'primary.main' }}
              >
                Mark all as read
              </Typography>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', p: 1, scrollPaddingTop: 72, position: 'relative' }} key={selectedSite.siteId}>
              {loadingSites[selectedSite.siteId] && (
                <Box sx={{
                  position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, borderRadius: 1
                }}>
                  <CircularProgress size={32} />
                </Box>
              )}
              <FeedListPane
                key={selectedSite.siteId}
                site={selectedSite}
                onMarkAsRead={onMarkAsRead}
                showReadItems={showReadItems}
              />
            </Box>
          </>
        )}

        {selectedSite && selectedSite.items.length === 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            {loadingSites[selectedSite.siteId] ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={24} />
                <Typography variant="body1" color="text.secondary">
                  Loading feed...
                </Typography>
              </Box>
            ) : selectedSite.error ? (
              <Typography variant="body1" color="error">
                Failed to load feed
              </Typography>
            ) : (
              <Typography variant="body1" color="text.secondary">
                Select a feed to view items
              </Typography>
            )}
          </Box>
        )}

        {!selectedSite && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <Typography variant="body1" color="text.secondary">
              Select a feed to view items
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

interface FeedListPaneProps {
  site: SiteWithStatus;
  onMarkAsRead: (siteId: string, itemId: string) => void;
  showReadItems: boolean;
}

export const FeedListPane: React.FC<FeedListPaneProps> = ({ site, onMarkAsRead, showReadItems }) => {
  const readStatus = useReaderStore(state => state.readStatus);
  const isReadInSession = useReaderStore(state => state.isReadInSession);
  const [kbdItemId, setKbdItemId] = useState<string | null>(null);
  const kbdItemIdRef = useRef<string | null>(null);
  kbdItemIdRef.current = kbdItemId;
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    setKbdItemId(null);
  }, [showReadItems]);

  // Memoise the sorted + mapped full item list — deduplicated by itemId
  const allItems = useMemo(
    () => {
      const seen = new Set<string>();
      return [...site.items]
        .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
        .filter(item => {
          const id = generateItemIdFromItem(item);
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        })
        .map((item, idx) => ({
          itemId: generateItemIdFromItem(item),
          item,
          idx,
        }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [site.siteId, site.items],
  );

  // Build a Set of read-item ids from the store once — used by filtering and the keyboard handler
  const readItemIdSet = useMemo(() => {
    const siteReadStatus = readStatus[site.siteId];
    const set = new Set<string>();
    for (const data of allItems) {
      if (siteReadStatus?.has(data.itemId)) set.add(data.itemId);
    }
    return set;
  }, [allItems, site.siteId, readStatus]);

  // Filtered items — visible list (all or unread only, with session-read items staying visible)
  const items = useMemo(
    () =>
      allItems.filter(data => {
        if (showReadItems) return true;
        return !readItemIdSet.has(data.itemId) || isReadInSession(site.siteId, data.itemId);
      }),
    [allItems, showReadItems, readItemIdSet, isReadInSession, site.siteId],
  );

  // Build a Set of *unread* itemId values for O(1) mark-as-read checks and filtering
  const unreadItemIdSet = useMemo(() => {
    const set = new Set<string>();
    for (const data of allItems) {
      if (!readItemIdSet.has(data.itemId)) set.add(data.itemId);
    }
    return set;
  }, [allItems, readItemIdSet]);

  // Memoise the item-id → index map so key-down handler does O(1) lookup
  const itemIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < items.length; i++) {
      map.set(items[i].itemId, i);
    }
    return map;
  }, [items]);

  // Refs for values needed by the stable keyboard event listener
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const unreadItemIdSetRef = useRef(unreadItemIdSet);
  unreadItemIdSetRef.current = unreadItemIdSet;
  const itemIndexMapRef = useRef(itemIndexMap);
  itemIndexMapRef.current = itemIndexMap;
  const onMarkAsReadRef = useRef(onMarkAsRead);
  onMarkAsReadRef.current = onMarkAsRead;
  const siteIdRef = useRef(site.siteId);
  siteIdRef.current = site.siteId;

  // Stable — attaches once, reads latest values from refs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key !== 'j' && key !== 'k') return;

      e.preventDefault();

      const currentId = kbdItemIdRef.current;
      const idxMap = itemIndexMapRef.current;
      const currentIdx = currentId ? idxMap.get(currentId) ?? -1 : -1;

      if (key === 'j') {
        const nextIdx = currentIdx >= 0 ? Math.min(currentIdx + 1, itemsRef.current.length - 1) : 0;
        const nextItem = itemsRef.current[nextIdx];

        if (nextItem) {
          setKbdItemId(nextItem.itemId);
          if (unreadItemIdSetRef.current.has(nextItem.itemId)) {
            onMarkAsReadRef.current(siteIdRef.current, nextItem.itemId);
          }
        }
      }

      if (key === 'k') {
        const prevIdx = Math.max(currentIdx - 1, 0);
        const prevItem = itemsRef.current[prevIdx];
        if (prevItem) {
          setKbdItemId(prevItem.itemId);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Scroll focused item into view after DOM commits (ensures correct position after list mutations)
  useLayoutEffect(() => {
    if (kbdItemId) {
      const el = itemRefs.current.get(kbdItemId);
      if (el) {
        try {
          el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } catch {}
      }
    }
  }, [kbdItemId]);

  return (
    <Stack spacing={1}>
      {items.map((data) => (
        <div
          key={data.itemId}
          ref={el => { if (el) itemRefs.current.set(data.itemId, el); }}
          style={{ scrollMarginTop: 72 }}
        >
          <FeedItem
            item={data.item}
            isRead={!unreadItemIdSet.has(data.itemId)}
            siteColor={site.color}
            isKeyboardSelected={kbdItemId === data.itemId}
            onMarkAsRead={() => onMarkAsRead(site.siteId, data.itemId)}
          />
        </div>
      ))}
    </Stack>
  );
};

const SearchBox = React.memo(function SearchBox({
  onSearch, searching, searchTier, modelProgress
}: {
  onSearch: (q: string) => void;
  searching: boolean;
  searchTier: 'vector' | 'text' | 'regex' | 'loading' | null;
  modelProgress: number;
}) {
  const [value, setValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => onSearch(value), 500);
    return () => clearTimeout(timer);
  }, [value, onSearch]);

  const tierIcon = () => {
    if (searching) return <CircularProgress size={16} />;
    if (searchTier === 'loading') return <CircularProgress size={16} />;
    if (searchTier === 'vector') return <span style={{ fontSize: 16, lineHeight: 1 }}>✦</span>;
    if (searchTier === 'text') return <span style={{ fontSize: 13, fontWeight: 600 }}>Aa</span>;
    if (searchTier === 'regex') return <span style={{ fontSize: 14, fontFamily: 'monospace' }}>.*</span>;
    return <SearchIcon fontSize="small" />;
  };

  const tierLabel = () => {
    if (searchTier === 'loading') return `AI search loading (${modelProgress}%)`;
    if (searchTier === 'vector') return 'Semantic search';
    if (searchTier === 'text') return 'Full-text search';
    if (searchTier === 'regex') return 'Regex search';
    return '';
  };

  return (
    <Box>
      <TextField
        size="small"
        placeholder="Search feeds..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                {tierLabel() ? (
                  <Tooltip title={tierLabel()} arrow>
                    {tierIcon()}
                  </Tooltip>
                ) : tierIcon()}
              </InputAdornment>
            )
          }
        }}
        sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 1, '& .MuiInputBase-input': { color: 'inherit' }, '& .MuiInputAdornment-root': { color: 'inherit' } }}
      />
      {searchTier === 'loading' && (
        <LinearProgress
          variant="determinate"
          value={modelProgress}
          sx={{ mt: 0.5, borderRadius: 1, height: 3 }}
        />
      )}
    </Box>
  );
});