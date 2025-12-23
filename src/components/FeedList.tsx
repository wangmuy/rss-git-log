import React from 'react';
import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Chip,
  Stack
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { SiteWithStatus } from '@/types/rss';
import { FeedItem } from './FeedItem';
import { generateItemIdFromItem } from '@/utils/item-id';
import { useReaderStore } from '../store/readerStore';

interface FeedListProps {
  sites: SiteWithStatus[];
  onMarkAsRead: (siteId: string, itemId: string) => void;
  onMarkSiteAsRead: (siteId: string) => void;
  showReadItems: boolean;
}

export const FeedList: React.FC<FeedListProps> = ({
  sites,
  onMarkAsRead,
  onMarkSiteAsRead,
  showReadItems
}) => {
  const isRead = useReaderStore(state => state.isRead);
  const getUnreadCount = useReaderStore(state => state.getUnreadCount);

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
    <Box>
      {sites.map((site) => {
        const unreadCount = getUnreadCount(site.siteId);

        // Filter items based on showReadItems setting
        const visibleItems = site.items.filter(item => {
          const itemId = generateItemIdFromItem(item);
          const isItemRead = isRead(site.siteId, itemId);
          return showReadItems || !isItemRead;
        });

        if (visibleItems.length === 0 && !showReadItems) {
          return null; // Don't show site if all items are read and showReadItems is false
        }

        return (
          <Accordion
            key={site.siteId}
            defaultExpanded={unreadCount > 0}
            sx={{ mb: 1 }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, flexGrow: 1 }}>
                  {site.name}
                </Typography>
                <Chip
                  label={unreadCount}
                  size="small"
                  color={unreadCount > 0 ? 'primary' : 'default'}
                  variant={unreadCount > 0 ? 'filled' : 'outlined'}
                />
              </Box>
            </AccordionSummary>

            <AccordionDetails sx={{ p: 0, bgcolor: 'background.default' }}>
              <Stack spacing={1} sx={{ p: 1 }}>
                {visibleItems.map((item) => {
                  const itemId = generateItemIdFromItem(item);
                  const isItemRead = isRead(site.siteId, itemId);

                  return (
                    <FeedItem
                      key={itemId}
                      item={item}
                      isRead={isItemRead}
                      siteColor={site.color}
                      onMarkAsRead={() => onMarkAsRead(site.siteId, itemId)}
                    />
                  );
                })}

                {visibleItems.length === 0 && showReadItems && (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                    All items read
                  </Typography>
                )}

                {unreadCount > 0 && (
                  <Box sx={{ p: 1, pt: 0 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => onMarkSiteAsRead(site.siteId)}
                    >
                      Mark all as read
                    </Typography>
                  </Box>
                )}
              </Stack>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};