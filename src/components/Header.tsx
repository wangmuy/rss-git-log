import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Tooltip,
  Badge,
  Chip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  DoneAll as DoneAllIcon,
  Save as SaveIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

interface HeaderProps {
  onRefresh: () => void;
  onMarkAllRead: () => void;
  onManualCommit: () => void;
  onOpenConfig: () => void;
  isCommitting: boolean;
  canWrite: boolean;
  lastCommit: Date | null;
  showReadItems: boolean;
  onShowReadItemsChange: (checked: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  onMarkAllRead,
  onManualCommit,
  onOpenConfig,
  isCommitting,
  canWrite,
  lastCommit,
  showReadItems,
  onShowReadItemsChange
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

        <FormControlLabel
          control={
            <Switch
              checked={showReadItems}
              onChange={(e) => onShowReadItemsChange(e.target.checked)}
              size="small"
              sx={{
                color: 'inherit',
                '& .MuiSwitch-thumb': {
                  bgcolor: showReadItems ? 'white' : 'rgba(255,255,255,0.5)'
                }
              }}
            />
          }
          label={
            <Typography variant="body2" sx={{ color: 'inherit' }}>
              Show Read
            </Typography>
          }
          sx={{ mr: 1 }}
        />

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

        {canWrite && (
          <Tooltip title={isCommitting ? 'Committing...' : 'Manual Commit'}>
            <span>
              <IconButton
              color="inherit"
              onClick={onManualCommit}
              disabled={isCommitting}
              aria-label="Manual Commit"
              size="large"
            >
                <Badge color="secondary" variant="dot" invisible={!isCommitting}>
                  <SaveIcon />
                </Badge>
              </IconButton>
            </span>
          </Tooltip>
        )}

        <Tooltip title="Refresh Feeds">
          <IconButton
            color="inherit"
            onClick={onRefresh}
            size="large"
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Config">
          <IconButton
            color="inherit"
            onClick={onOpenConfig}
            aria-label="Config"
            size="large"
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};
