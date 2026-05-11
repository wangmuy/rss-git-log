import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  CircularProgress
} from '@mui/material';
import { SiteWithStatus } from '@/types/rss';
import { FeedItem } from './FeedItem';
import { generateItemIdFromItem } from '@/utils/item-id';
import { useReaderStore } from '../store/readerStore';

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
  const isRead = useReaderStore(state => state.isRead);
  const markSiteAsRead = useReaderStore(state => state.markSiteAsRead);

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

  return (
    <Box sx={{ display: 'flex', flex: 1, gap: 2, minHeight: 0 }}>
      <Paper sx={{ width: { xs: 240, sm: 280, md: 320 }, overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            RSS Feeds ({sites.length})
          </Typography>
        </Box>
        <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
          {sites.map((site) => {
            const unreadCount = site.unreadCount;
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
                onClick={() => markSiteAsRead?.(selectedSite.siteId)}
                sx={{ cursor: 'pointer', textDecoration: 'underline', color: 'primary.main' }}
              >
                Mark all as read
              </Typography>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', p: 1, scrollPaddingTop: 72 }} key={selectedSite.siteId}>
              <FeedListPane
                site={selectedSite}
                onMarkAsRead={onMarkAsRead}
                isRead={isRead}
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
  isRead: (siteId: string, itemId: string) => boolean;
  showReadItems: boolean;
}

export const FeedListPane: React.FC<FeedListPaneProps> = ({ site, onMarkAsRead, isRead, showReadItems }) => {
  const [kbdItemId, setKbdItemId] = useState<string | null>(null);
  const kbdItemIdRef = useRef<string | null>(null);
  kbdItemIdRef.current = kbdItemId;
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    setKbdItemId(null);
  }, [showReadItems]);

  // Memoise the sorted + mapped full item list — only recalculated when site or items change
  const allItems = useMemo(
    () =>
      [...site.items]
        .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
        .map((item, idx) => ({
          itemId: generateItemIdFromItem(item),
          item,
          idx,
        })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [site.siteId, site.items],
  );

  // Build a Set of read-item ids from the store once — used by filtering and the keyboard handler
  const readItemIdSet = useMemo(() => {
    const set = new Set<string>();
    for (const data of allItems) {
      const read = isRead(site.siteId, data.itemId);
      if (read) set.add(data.itemId);
    }
    return set;
  }, [allItems, site.siteId, isRead]);

  // Filtered items — visible list (all or unread only)
  const items = useMemo(
    () =>
      allItems.filter(data => {
        if (showReadItems) return true;
        return !readItemIdSet.has(data.itemId);
      }),
    [allItems, showReadItems, readItemIdSet],
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key !== 'j' && key !== 'k') return;

      e.preventDefault();

      const currentId = kbdItemIdRef.current;
      const currentIdx = currentId ? itemIndexMap.get(currentId) ?? -1 : -1;

      if (key === 'j') {
        const nextIdx = currentIdx >= 0 ? Math.min(currentIdx + 1, items.length - 1) : 0;
        const nextItem = items[nextIdx];

        if (nextItem) {
          setKbdItemId(nextItem.itemId);
          if (unreadItemIdSet.has(nextItem.itemId)) {
            onMarkAsRead(site.siteId, nextItem.itemId);
          }
          const el = itemRefs.current.get(nextItem.itemId);
          try {
            el?.scrollIntoView({ block: 'start', behavior: 'smooth' });
          } catch {}
        }
      }

      if (key === 'k') {
        const prevIdx = Math.max(currentIdx - 1, 0);
        const prevItem = items[prevIdx];
        if (prevItem) {
          setKbdItemId(prevItem.itemId);
          const el = itemRefs.current.get(prevItem.itemId);
          try {
            el?.scrollIntoView({ block: 'start', behavior: 'smooth' });
          } catch {}
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site.siteId, itemIndexMap, unreadItemIdSet, onMarkAsRead, items]);

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