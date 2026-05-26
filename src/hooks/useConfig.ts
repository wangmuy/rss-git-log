import { useState, useEffect } from 'react';
import { createGitHubClient, readFromGitHub, getStoredConfig } from '@/utils/github-api';
import { RSSConfig } from '@/types/config';
import { parseOPML } from '@/utils/opml';

interface UseConfigReturn {
  config: RSSConfig | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Hook to load RSS configuration from GitHub
 *
 * @returns Configuration, loading state, error, and reload function
 *
 * @example
 * const { config, loading, error } = useConfig();
 */
export function useConfig(): UseConfigReturn {
  const [config, setConfig] = useState<RSSConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = async () => {
    setLoading(true);
    setError(null);

    try {
      const storedConfig = getStoredConfig();
      const client = createGitHubClient(storedConfig);

      const data = await readFromGitHub<string>(client, 'subscriptions.opml');

      if (!data) {
        setConfig({ sites: [] });
        setLoading(false);
        return;
      }

      const { sites } = parseOPML(data);
      setConfig({ sites });
    } catch (err: any) {
      setError(err.message || 'Failed to load configuration');
      console.error('Config loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  return {
    config,
    loading,
    error,
    reload: loadConfig
  };
}
