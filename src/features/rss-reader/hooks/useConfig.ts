import { useState, useEffect } from 'react';
import { createGitHubClient, readFromGitHub, getEnvConfig } from '@/utils/github-api';
import { RSSConfig } from '@/types/config';

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
      const envConfig = getEnvConfig();
      const client = createGitHubClient(envConfig);

      const data = await readFromGitHub<RSSConfig>(client, 'rss-config.json');

      if (!data) {
        // Config file doesn't exist - this is expected for new setups
        // Don't show error, just return empty config
        setConfig(null);
        setLoading(false);
        return;
      }

      // Validate config
      if (!validateConfig(data)) {
        throw new Error('Invalid config format. Check required fields.');
      }

      setConfig(data);
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

/**
 * Validate RSS configuration structure
 *
 * @param config - Configuration to validate
 * @returns True if valid
 */
function validateConfig(config: any): config is RSSConfig {
  if (!config || typeof config !== 'object') return false;
  if (!Array.isArray(config.sites)) return false;
  if (!config.settings || typeof config.settings !== 'object') return false;

  // Validate sites
  for (const site of config.sites) {
    if (!site.name || !site.url) return false;
  }

  // Validate settings
  const { settings } = config;
  if (typeof settings.showReadItems !== 'boolean') return false;
  if (typeof settings.autoCommit !== 'boolean') return false;
  if (typeof settings.commitInterval !== 'number') return false;

  return true;
}