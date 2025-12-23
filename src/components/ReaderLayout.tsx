import React from 'react';
import { Container, Box, Typography, Alert, Snackbar } from '@mui/material';
import { Header } from './Header';
import { SettingsPanel } from './SettingsPanel';
import { FeedList } from './FeedList';
import { useConfig } from '../hooks/useConfig';
import { useRSSFeeds } from '../hooks/useRSSFeeds';
import { useCommit } from '../hooks/useCommit';
import { useReaderStore } from '../store/readerStore';

export const ReaderLayout: React.FC = () => {
  const { config, loading: configLoading, error: configError, reload: reloadConfig } = useConfig();
  const { sites, loading: feedsLoading, error: feedsError, refresh, markAsRead, markSiteAsRead, markAllAsRead } = useRSSFeeds(config);
  const { commit, committing, lastCommit, error: commitError } = useCommit();
  const { settings, setSettings } = useReaderStore();

  const loading = configLoading || feedsLoading;
  const error = configError || feedsError || commitError;

  const handleMarkAllRead = async () => {
    markAllAsRead();
    if (settings.autoCommit) {
      await commit();
    }
  };

  const handleRefresh = async () => {
    await refresh();
  };

  const handleManualCommit = async () => {
    const success = await commit();
    if (success) {
      // Show success feedback via console for now
      console.log('Committed successfully at', new Date().toLocaleTimeString());
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header
        onRefresh={handleRefresh}
        onMarkAllRead={handleMarkAllRead}
        onManualCommit={handleManualCommit}
        isCommitting={committing}
        lastCommit={lastCommit}
      />

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Settings Panel */}
        {config && (
          <SettingsPanel
            settings={settings}
            onSettingsChange={setSettings}
          />
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ width: '100%', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Loading feeds...
            </Typography>
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert
            severity="error"
            sx={{ mt: 2 }}
            action={
              <button onClick={reloadConfig} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}>
                Retry
              </button>
            }
          >
            {error}
          </Alert>
        )}

        {/* Empty State */}
        {!loading && !error && (!config || config.sites.length === 0) && (
          <Alert severity="info" sx={{ mt: 2 }}>
            No RSS sites configured. Please create an rss-config.json file in your GitHub repository.
          </Alert>
        )}

        {/* Feed List */}
        {!loading && !error && config && sites.length > 0 && (
          <FeedList
            sites={sites}
            onMarkAsRead={markAsRead}
            onMarkSiteAsRead={markSiteAsRead}
            showReadItems={settings.showReadItems}
          />
        )}
      </Container>

      {/* Commit Snackbar */}
      <Snackbar
        open={!!commitError}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" sx={{ width: '100%' }}>
          {commitError}
        </Alert>
      </Snackbar>
    </Box>
  );
};