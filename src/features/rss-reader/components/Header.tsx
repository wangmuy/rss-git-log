import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Tooltip,
  Badge,
  Chip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  DoneAll as DoneAllIcon,
  Save as SaveIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

interface HeaderProps {
  onRefresh: () => void;
  onMarkAllRead: () => void;
  onManualCommit: () => void;
  isCommitting: boolean;
  lastCommit: Date | null;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  onMarkAllRead,
  onManualCommit,
  isCommitting,
  lastCommit
}) => {
  const formatLastCommit = () => {
    if (!lastCommit) return 'Never committed';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastCommit.getTime()) / 1000);

    if (diff < 60) return 'Committed just now';
    if (diff < 3600) return `Committed ${Math.floor(diff / 60)}m ago`;
    return `Committed ${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <AppBar position="sticky" elevation={1}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          RSS Reader
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
          {lastCommit && (
            <Tooltip title={formatLastCommit()}>
              <Chip
                icon={<ScheduleIcon sx={{ fontSize: 16 }} />}
                label={formatLastCommit()}
                size="small"
                variant="outlined"
                sx={{
                  color: 'inherit',
                  borderColor: 'rgba(255,255,255,0.3)',
                  display: { xs: 'none', sm: 'inline-flex' }
                }}
              />
            </Tooltip>
          )}
        </Box>

        <Tooltip title="Mark All as Read">
          <span>
            <IconButton
              color="inherit"
              onClick={onMarkAllRead}
              size="large"
            >
              <DoneAllIcon />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title={isCommitting ? 'Committing...' : 'Manual Commit'}>
          <span>
            <IconButton
              color="inherit"
              onClick={onManualCommit}
              disabled={isCommitting}
              size="large"
            >
              <Badge color="secondary" variant="dot" invisible={!isCommitting}>
                <SaveIcon />
              </Badge>
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Refresh Feeds">
          <IconButton
            color="inherit"
            onClick={onRefresh}
            size="large"
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};