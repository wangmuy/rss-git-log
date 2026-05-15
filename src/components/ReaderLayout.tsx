import React, { useState } from 'react';
import { Container, Box, Alert, Snackbar } from '@mui/material';
import { Header } from './Header';
import { SubscriptionManager } from './SubscriptionManager';
import { SidebarFeedLayout } from './SidebarFeedLayout';
import { useConfig } from '../hooks/useConfig';
import { useRSSFeeds } from '../hooks/useRSSFeeds';
import { useCommit } from '../hooks/useCommit';
import { useReaderStore } from '../store/readerStore';
import { saveRSSConfig } from '../utils/github-api';
import { RSSConfig } from '@/types/config';
import { loadAppConfig } from '@/utils/app-config';

interface ReaderLayoutProps {
  onOpenConfig: () => void;
}

export const ReaderLayout: React.FC<ReaderLayoutProps> = ({ onOpenConfig }) => {
  const { config, loading: configLoading, error: configError, reload: reloadConfig } = useConfig();
  const { sites, loading: feedsLoading, error: feedsError, refresh, markAsRead, fetchSiteFeed } = useRSSFeeds(config);
  const loadingSites = useReaderStore(state => state.loadingSites);
  const { commit, committing, lastCommit, error: commitError, clearError } = useCommit();
  const [localConfig, setLocalConfig] = useState<RSSConfig | null>(config);
  const [appConfig, setAppConfig] = useState(() => loadAppConfig());
  const [showReadItems, setShowReadItems] = useState(false);

  // Update local config when config changes
  React.useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  React.useEffect(() => {
    setAppConfig(loadAppConfig());
  }, []);

  const loading = configLoading || feedsLoading;
  const error = configError || feedsError || commitError;

  const handleRefresh = async () => {
    clearError();
    await refresh();
  };

  const handleManualCommit = async () => {
    const success = await commit();
    if (success) {
      // Show success feedback via console for now
      console.log('Committed successfully at', new Date().toLocaleTimeString());
    }
  };

  const handleSitesChange = (newSites: any[]) => {
    if (localConfig) {
      setLocalConfig({
        ...localConfig,
        sites: newSites
      });
    }
  };

  const handleSaveConfig = async () => {
    if (!localConfig) throw new Error('No configuration to save');
    
    await saveRSSConfig(localConfig);
    await reloadConfig(); // Reload to refresh feeds
    await refresh(); // Refresh feeds with new config
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <Header
        onRefresh={handleRefresh}
        onManualCommit={handleManualCommit}
        onOpenConfig={onOpenConfig}
        isCommitting={committing}
        isLoading={loading}
        canWrite={appConfig.githubWriteCapability.canWrite}
        lastCommit={lastCommit}
        showReadItems={showReadItems}
        onShowReadItemsChange={setShowReadItems}
      />

      <Container maxWidth={false} sx={{ py: 3, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {/* Subscription Manager */}
        {localConfig && (
          <SubscriptionManager
            sites={localConfig.sites}
            onSitesChange={handleSitesChange}
            onSave={handleSaveConfig}
          />
        )}

        {/* Feed List */}
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {config && sites.length > 0 && (
            <SidebarFeedLayout
              sites={sites}
              onMarkAsRead={markAsRead}
              onSiteSelect={fetchSiteFeed}
              loadingSites={loadingSites}
              showReadItems={showReadItems}
              onShowReadItemsChange={setShowReadItems}
            />
          )}
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
          {!loading && !error && (!config || config.sites.length === 0) && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No RSS sites configured. Please create an rss-config.json file in your GitHub repository.
            </Alert>
          )}
        </Box>
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
