import React, { useEffect, useState } from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { ReaderLayout } from './components/ReaderLayout';
import { ConfigPage } from './components/ConfigPage';
import { useReaderStore } from './store/readerStore';
import { hasGitHubConfig, getStoredConfig, createGitHubClient, readFromGitHub } from './utils/github-api';

// MUI Theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1976d2',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

const App: React.FC = () => {
  const [view, setView] = useState<'loading' | 'config' | 'reader'>('loading');
  const loadFromLocalStorage = useReaderStore(state => state.loadFromLocalStorage);

  const checkConfig = async () => {
    try {
      // First check if runtime GitHub configuration is saved
      if (!hasGitHubConfig()) {
        setView('config');
        return;
      }

      // Then check if the config file actually exists
      try {
        const storedConfig = getStoredConfig();
        const client = createGitHubClient(storedConfig);
        await readFromGitHub(client, 'rss-config.json');
        setView('reader');
      } catch (error) {
        setView('config');
      }
    } catch (error) {
      setView('config');
    }
  };

  useEffect(() => {
    // Load session data from localStorage on mount
    loadFromLocalStorage();

    // Check if configuration exists
    checkConfig();
  }, [loadFromLocalStorage]);

  const handleConfigured = () => {
    // Re-check configuration after user saves settings
    checkConfig();
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {view === 'loading' && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#f5f5f5'
        }}>
          <div>Loading...</div>
        </div>
      )}
      {view === 'config' && <ConfigPage onConfigured={handleConfigured} onCancel={() => setView('reader')} />}
      {view === 'reader' && <ReaderLayout onOpenConfig={() => setView('config')} />}
    </ThemeProvider>
  );
};

export default App;
