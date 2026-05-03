import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Link,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CircleIcon from '@mui/icons-material/Circle';
import { RSSItem } from '@/types/rss';

interface FeedItemProps {
  item: RSSItem;
  isRead: boolean;
  siteColor?: string;
  isKeyboardSelected?: boolean;
  onMarkAsRead: () => void;
}

export const FeedItem: React.FC<FeedItemProps> = ({
  item,
  isRead,
  siteColor = '#1976d2',
  isKeyboardSelected = false,
  onMarkAsRead
}) => {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown date';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const handleItemClick = (e: React.MouseEvent) => {
    // Don't mark as read if clicking on the link
    if ((e.target as HTMLElement).tagName === 'A') {
      return;
    }
    onMarkAsRead();
  };

  const title = item.title || 'Untitled';
  const description = item.description || '';
  const link = item.link;

  return (
    <Paper
      elevation={isRead ? 0 : 1}
      sx={{
        p: 2,
        cursor: 'pointer',
        transition: 'all 0.2s',
        borderLeft: `4px solid ${isKeyboardSelected ? '#ff9800' : siteColor}`,
        opacity: isRead ? 0.6 : 1,
        bgcolor: isKeyboardSelected ? 'action.selected' : 'background.paper',
        outline: isKeyboardSelected ? `2px solid #ff9800` : 'none',
        outlineOffset: '-2px',
        '&:hover': {
          elevation: 3,
          transform: 'translateX(2px)'
        }
      }}
      onClick={handleItemClick}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        {/* Read Status Icon */}
        <Box sx={{ mt: 0.5 }}>
          {isRead ? (
            <CheckCircleIcon color="success" fontSize="small" />
          ) : (
            <CircleIcon sx={{ color: siteColor }} fontSize="small" />
          )}
        </Box>

        {/* Content */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: isRead ? 400 : 600,
                textDecoration: isRead ? 'line-through' : 'none',
                color: isRead ? 'text.secondary' : 'text.primary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}
>
                {title}
              </Typography>
            </Box>

            {description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}
              >
                {description.replace(/<[^>]*>/g, '')}
              </Typography>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={formatDate(item.pubDate)}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />

              {link && (
                <Link
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  sx={{ fontSize: '0.75rem' }}
                >
                  Open Link
                </Link>
              )}

            {!isRead && (
              <Tooltip title="Mark as read">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead();
                  }}
                  sx={{ ml: 'auto' }}
                >
                  <CheckCircleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};