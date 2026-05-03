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
  Paper
} from '@mui/material';
import { SiteWithStatus } from '@/types/rss';
import { FeedItem } from './FeedItem';
import { generateItemIdFromItem } from '@/utils/item-id';
import { useReaderStore } from '../store/readerStore';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';

interface SidebarFeedLayoutProps {
  sites: SiteWithStatus[];
  onMarkAsRead: (siteId: string, itemId: string) => void;
  onMarkSiteAsRead: (siteId: string) => void;
  showReadItems: boolean;
}

export const SidebarFeedLayout: React.FC<SidebarFeedLayoutProps> = ({
  sites,
  onMarkAsRead,
  onMarkSiteAsRead,
  showReadItems
}) => {
  const [selectedSiteId, setSelectedSiteId] = useState<string>(sites[0]?.siteId || '');
  const [kbdIndex, setKbdIndex] = useState(-1);
  const prevSitesRef = useRef(sites);
  const readStatus = useReaderStore(state => state.readStatus);
  const isRead = useReaderStore(state => state.isRead);
  const getUnreadCount = useReaderStore(state => state.getUnreadCount);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  if (prevSitesRef.current !== sites) {
    setKbdIndex(-1);
    prevSitesRef.current = sites;
  }

  useEffect(() => {
    if (sites.length > 0) {
      const selectedExists = sites.some(site => site.siteId === selectedSiteId);
      if (!selectedExists) {
        setSelectedSiteId(sites[0].siteId);
      }
    }
  }, [sites, selectedSiteId]);

  const selectedSite = sites.find(site => site.siteId === selectedSiteId);

  const visibleItems = useMemo(() => {
    if (!selectedSite) return [];
    return [...selectedSite.items]
      .filter(item => {
        const itemId = generateItemIdFromItem(item);
        const isItemRead = isRead(selectedSite.siteId, itemId);
        return showReadItems || !isItemRead;
      })
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  }, [selectedSite, showReadItems, readStatus, isRead]);

  const itemReadStatus = useMemo(
    () => visibleItems.map(item => isRead(selectedSite!.siteId, generateItemIdFromItem(item))),
    [visibleItems, selectedSite?.siteId, isRead]
  );

  useEffect(() => {
    if (kbdIndex >= visibleItems.length) {
      setKbdIndex(visibleItems.length > 0 ? visibleItems.length - 1 : -1);
    }
  }, [visibleItems.length, kbdIndex]);

  const handleSelect = (index: number) => {
    setKbdIndex(index);
    if (index < 0 || index >= visibleItems.length) return;
    const item = visibleItems[index];
    const itemId = generateItemIdFromItem(item);
    if (!isRead(selectedSite!.siteId, itemId)) {
      onMarkAsRead(selectedSite!.siteId, itemId);
    }
    itemRefs.current[index]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  useKeyboardNavigation({
    totalItems: visibleItems.length,
    selectedIndex: kbdIndex,
    isReadList: itemReadStatus,
    onSelect: handleSelect,
  });

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
      {/* Left Sidebar - Site List */}
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
                        {unreadCount > 0 && (
                          <Chip
                            label={unreadCount}
                            size="small"
                            color="primary"
                            sx={{ ml: 1, minWidth: 24, height: 20 }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Paper>

      {/* Right Content Area - Feed Items */}
      <Paper sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {selectedSite && (
          <>
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {selectedSite.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {visibleItems.length} items
                  </Typography>
                  {getUnreadCount(selectedSite.siteId) > 0 && (
                    <Typography
                      variant="caption"
                      color="primary"
                      sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => onMarkSiteAsRead(selectedSite.siteId)}
                    >
                      Mark all as read
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
              {visibleItems.length > 0 ? (
                <Stack spacing={1}>
              {visibleItems.map((item, idx) => {
                const itemId = generateItemIdFromItem(item);
                const isItemRead = isRead(selectedSite.siteId, itemId);

                return (
                  <div key={itemId} ref={el => { itemRefs.current[idx] = el; }}>
                    <FeedItem
                      item={item}
                      isRead={isItemRead}
                      siteColor={selectedSite.color}
                      isKeyboardSelected={kbdIndex === idx}
                      onMarkAsRead={() => onMarkAsRead(selectedSite.siteId, itemId)}
                    />
                  </div>
                );
              })}
                </Stack>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {showReadItems ? 'No items available' : 'All items read'}
                  </Typography>
                </Box>
              )}
            </Box>
          </>
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
