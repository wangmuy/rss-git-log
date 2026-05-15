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
  Save as SaveIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

interface HeaderProps {
  onRefresh: () => void;
  onManualCommit: () => void;
  onOpenConfig: () => void;
  isCommitting: boolean;
  isLoading: boolean;
  canWrite: boolean;
  lastCommit: Date | null;
  showReadItems: boolean;
  onShowReadItemsChange: (show: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  onManualCommit,
  onOpenConfig,
  isCommitting,
  isLoading,
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

        <FormControlLabel
          control={
            <Switch
              checked={showReadItems}
              onChange={(e) => onShowReadItemsChange(e.target.checked)}
              size="small"
              sx={{
                color: 'white',
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: 'white',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: 'white',
                },
              }}
            />
          }
          label={<Typography variant="body2" sx={{ color: 'white' }}>Show All</Typography>}
          sx={{ mr: 2 }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
          {lastCommit && (
            <Tooltip title={formatLastCommit()}>
              <Chip
                label={lastCommit ? `Commited ${lastCommit.toLocaleTimeString()}` : 'No commits'}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            </Tooltip>
          )}
          {isLoading && (
            <Chip
              label="Loading..."
              size="small"
              color="primary"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          )}

        </Box>

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
