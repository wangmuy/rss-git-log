import { createGitProvider } from '../utils/git-provider';
import { GitProviderConfig } from '@/types/git';
import { SiteLogData } from '@/types/log';

interface FetchInput {
  config: GitProviderConfig;
  siteId: string;
}

const FILE_READ_CONCURRENCY = 6;

self.onmessage = async (e: MessageEvent<FetchInput>) => {
  const { config, siteId } = e.data;
  const provider = createGitProvider(config);

  try {
    const siteDir = `logs/${encodeURIComponent(siteId)}`;
    const files = await provider.listDirectory(siteDir);

    const logFiles = files.filter(
      f => f.type === 'file' && f.name.endsWith('.json') && !f.name.includes('-allread')
    );

    const allItems: Array<{ itemId: string; title: string; pubDate: string; readAt?: string }> = [];

    for (let i = 0; i < logFiles.length; i += FILE_READ_CONCURRENCY) {
      const batch = logFiles.slice(i, i + FILE_READ_CONCURRENCY);

      const batchData = await Promise.allSettled(
        batch.map(async (file) => {
          const fileData = await provider.readFile(file.path);
          if (!fileData) return null;
          return JSON.parse(fileData.content) as SiteLogData;
        })
      );

      const batchItems: Array<{ itemId: string; title: string; pubDate: string; readAt?: string }> = [];
      for (const result of batchData) {
        if (result.status === 'fulfilled' && result.value) {
          for (const item of result.value.items) {
            allItems.push(item);
            batchItems.push(item);
          }
        }
      }

      if (batchItems.length > 0) {
        self.postMessage({ type: 'batch', items: batchItems });
      }
    }

    self.postMessage({ type: 'done', items: allItems });
  } catch (error) {
    self.postMessage({ type: 'error', error: String(error) });
  }
};
