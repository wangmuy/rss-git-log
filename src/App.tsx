import React, { useEffect, useState } from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { ReaderLayout } from './features/rss-reader/components/ReaderLayout';
import { SetupPage } from './features/rss-reader/components/SetupPage';
import { useReaderStore } from './features/rss-reader/store/readerStore';
import { hasGitRowsConfig } from './utils/gitrows';

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

  const checkConfig = () => {
    try {
      const hasConfig = hasGitRowsConfig();
      setView(hasConfig ? 'reader' : 'setup');
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
    // Note: This will only work if .env file already existed or user refreshes page
    // After creating .env file, user needs to restart dev server
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