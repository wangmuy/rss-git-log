import React, { useEffect, useState } from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { ReaderLayout } from './components/ReaderLayout';
import { SetupPage } from './components/SetupPage';
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
  const [view, setView] = useState<'loading' | 'setup' | 'reader'>('loading');
  const loadFromLocalStorage = useReaderStore(state => state.loadFromLocalStorage);

  const checkConfig = async () => {
    try {
      // First check if env vars are set
      if (!hasGitHubConfig()) {
        setView('setup');
        return;
      }

      // Then check if the config file actually exists
      try {
        const storedConfig = getStoredConfig();
        const client = createGitHubClient(storedConfig);
        const configExists = await readFromGitHub(client, 'rss-config.json');

        if (configExists) {
          setView('reader');
        } else {
          // Config file doesn't exist yet
          setView('setup');
        }
      } catch (error) {
        // Error checking for config file (e.g., network error, auth error)
        // Still show setup page with instructions
        setView('setup');
      }
    } catch (error) {
      setView('setup');
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
      {view === 'setup' && <SetupPage onConfigured={handleConfigured} />}
      {view === 'reader' && <ReaderLayout />}
    </ThemeProvider>
  );
};

export default App;