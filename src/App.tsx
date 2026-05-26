import React, { useEffect, useState, Component, ErrorInfo, ReactNode } from 'react';
import { CssBaseline, ThemeProvider, createTheme, Alert } from '@mui/material';
import { ReaderLayout } from './components/ReaderLayout';
import { ConfigPage } from './components/ConfigPage';
import { useReaderStore } from './store/readerStore';
import { hasGitHubConfig, getStoredConfig, createGitHubClient, readFromGitHub } from './utils/github-api';

// Error Boundary to catch unhandled errors
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('React Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, textAlign: 'center' }}>
          <Alert severity="error">
            Something went wrong: {this.state.error?.message}
            <button
              onClick={() => window.location.reload()}
              style={{ marginLeft: 10, padding: '5px 10px', cursor: 'pointer' }}
            >
              Reload Page
            </button>
          </Alert>
        </div>
      );
    }
    return this.props.children;
  }
}

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
        await readFromGitHub(client, 'subscriptions.opml');
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
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
};

export default App;
