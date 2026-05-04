import React, { useState, useEffect, useRef } from 'react';
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
import { SiteWithStatus, RSSItem } from '@/types/rss';
import { FeedItem } from './FeedItem';
import { generateItemIdFromItem } from '@/utils/item-id';
import { useReaderStore } from '../store/readerStore';

interface SidebarFeedLayoutProps {
  sites: SiteWithStatus[];
  onMarkAsRead: (siteId: string, itemId: string) => void;
  onSiteSelect: (siteId: string) => void;
  loadingSites: Record<string, boolean>;
}

export const SidebarFeedLayout: React.FC<SidebarFeedLayoutProps> = ({
  sites,
  onMarkAsRead,
  onSiteSelect,
  loadingSites
}) => {
  const [selectedSiteId, setSelectedSiteId] = useState<string>(sites[0]?.siteId || '');
  const getUnreadCount = useReaderStore(state => state.getUnreadCount);

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
      </Paper>

      <Paper sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {selectedSite && selectedSite.items.length > 0 && (
          <>
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {selectedSite.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedSite.items.length} items
                </Typography>
              </Box>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', p: 1, scrollPaddingTop: 72 }} key={selectedSite.siteId}>
              <FeedListPane
                site={selectedSite}
                onMarkAsRead={onMarkAsRead}
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

interface FeedItemData {
  itemId: string;
  item: RSSItem;
  idx: number;
}

const FeedListPane: React.FC<{
  site: SiteWithStatus;
  onMarkAsRead: (siteId: string, itemId: string) => void;
}> = ({ site, onMarkAsRead }) => {
  const [kbdIndex, setKbdIndex] = useState(-1);
  const kbdIndexRef = useRef(-1);
  kbdIndexRef.current = kbdIndex;
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isRead = useReaderStore(state => state.isRead);

  const items: FeedItemData[] = [...site.items]
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .map((item, idx) => ({
      itemId: generateItemIdFromItem(item),
      item,
      idx
    }));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key !== 'j' && key !== 'k') return;

      e.preventDefault();

      if (key === 'j') {
        const currentKbd = kbdIndexRef.current;
        const newIdx = currentKbd >= 0 ? currentKbd + 1 : 0;
        const nextIdx = Math.min(newIdx, items.length - 1);
        setKbdIndex(nextIdx);

        const current = items[nextIdx];
        if (current) {
          const read = isRead(site.siteId, current.itemId);
          if (!read) {
            onMarkAsRead(site.siteId, current.itemId);
          }
        }
        itemRefs.current[nextIdx]?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }

      if (key === 'k') {
        const currentKbd = kbdIndexRef.current;
        const prevIdx = Math.max(currentKbd - 1, 0);
        setKbdIndex(prevIdx);
        itemRefs.current[prevIdx]?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [site.siteId, isRead, onMarkAsRead, items]);

  return (
    <Stack spacing={1}>
      {items.map((data, idx) => (
        <div key={`${site.siteId}-${data.itemId}-${idx}`} ref={el => { itemRefs.current[idx] = el; }} style={{ scrollMarginTop: 72 }}>
          <FeedItem
            item={data.item}
            isRead={isRead(site.siteId, data.itemId)}
            siteColor={site.color}
            isKeyboardSelected={kbdIndex === idx}
            onMarkAsRead={() => onMarkAsRead(site.siteId, data.itemId)}
          />
        </div>
      ))}
    </Stack>
  );
};