import { useState, useCallback, useEffect } from 'react';
import { commitAllFeedItems } from '@/utils/log-file';
import { useReaderStore } from '../store/readerStore';
import { loadAppConfig } from '@/utils/app-config';

interface UseCommitReturn {
  commit: () => Promise<boolean>;
  committing: boolean;
  lastCommit: Date | null;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook to commit read status to GitHub
 *
 * @returns Commit function, committing state, last commit time, and error
 *
 * @example
 * const { commit, committing } = useCommit();
 */
export function useCommit(): UseCommitReturn {
  const [committing, setCommitting] = useState(false);
  const [lastCommit, setLastCommit] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { getAllItems, sites, isRead, setCommitting: setStoreCommitting } = useReaderStore();

  const commit = useCallback(async (): Promise<boolean> => {
    if (committing) return false;

    setCommitting(true);
    setStoreCommitting(true);
    setError(null);

    try {
      const appConfig = loadAppConfig();
      if (!appConfig.githubWriteCapability.canWrite) {
        throw new Error(appConfig.githubWriteCapability.reason || 'GitHub write access is not enabled');
      }

      const results: Record<string, boolean> = {};

      for (const site of sites) {
        const allItems = getAllItems(site.siteId);
        if (allItems.length > 0) {
          const itemsWithReadStatus = allItems.map(item => ({
            itemId: item.itemId,
            title: item.title,
            pubDate: item.pubDate,
            readAt: isRead(site.siteId, item.itemId) ? new Date().toISOString() : undefined
          }));
          results[site.siteId] = await commitAllFeedItems(site.siteId, site.name, itemsWithReadStatus);
        }
      }

      const allSuccess = Object.values(results).every(success => success);

      if (allSuccess) {
        setLastCommit(new Date());
        return true;
      } else {
        throw new Error('Some commits failed');
      }
    } catch (err: any) {
      setError(err.message || 'Commit failed');
      console.error('Commit error:', err);
      return false;
    } finally {
      setCommitting(false);
      setStoreCommitting(false);
    }
  }, [committing, getAllItems, sites, isRead, setStoreCommitting]);

  // Auto-commit timer
  useEffect(() => {
    const appConfig = loadAppConfig();
    if (!appConfig.autoCommit.enabled || !appConfig.githubWriteCapability.canWrite) return;

    const interval = setInterval(() => {
      commit();
    }, appConfig.autoCommit.intervalSeconds * 1000);

    return () => clearInterval(interval);
  }, [commit]);

  // Commit on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const appConfig = loadAppConfig();
      if (appConfig.autoCommit.enabled && appConfig.githubWriteCapability.canWrite) {
        // Fire and forget - we can't wait for async in beforeunload
        commit();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [commit]);

  return {
    commit,
    committing,
    lastCommit,
    error,
    clearError: () => setError(null)
  };
}
