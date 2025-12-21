import { useState, useEffect } from 'react';
import { createGitRowsClient, readFromGitRows, getEnvConfig } from '@/utils/gitrows';
import { RSSConfig } from '@/types/config';

interface UseConfigReturn {
  config: RSSConfig | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Hook to load RSS configuration from GitRows
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
      const client = createGitRowsClient(envConfig);

      const data = await readFromGitRows<RSSConfig>(client, 'rss-config.json');

      if (!data) {
        throw new Error(
          'Config file not found. Please create rss-config.json in your GitHub repo.\n\n' +
          'Example structure:\n' +
          JSON.stringify({
            sites: [
              { name: 'Tech News', url: 'https://example.com/rss', color: '#2196F3' }
            ],
            settings: {
              showReadItems: false,
              autoCommit: true,
              commitInterval: 300
            }
          }, null, 2)
        );
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