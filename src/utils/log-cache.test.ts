import { afterEach, describe, expect, it } from 'vitest';
import { createDefaultAppConfig, saveAppConfig } from './app-config';
import { cacheLogFile, getCachedLogFile, pruneCachedLogFilesForSite } from './log-cache';
import { GitHubConfig } from '@/types/config';
import { SiteLogData } from '@/types/log';

const github: GitHubConfig = {
  owner: 'me',
  repo: 'rss',
  branch: 'main'
};

function log(pathDate: string): SiteLogData {
  return {
    metadata: {
      siteId: 'site',
      siteName: 'Site',
      oldestItemDate: pathDate,
      newestItemDate: pathDate,
      itemCount: 1,
      generatedAt: '2026-01-01T00:00:00.000Z'
    },
    items: [{ itemId: pathDate, title: pathDate, pubDate: pathDate, readAt: '2026-01-01T00:00:00.000Z' }]
  };
}

afterEach(() => {
  localStorage.clear();
});

describe('log cache', () => {
  it('caches log files by repo branch site and path', () => {
    saveAppConfig(createDefaultAppConfig({ github, localCache: { filesPerSite: 1 } }));

    cacheLogFile(github, 'site', 'logs/site/2026-01-01.json', log('2026-01-01'));

    expect(getCachedLogFile(github, 'site', 'logs/site/2026-01-01.json')?.items[0].itemId).toBe('2026-01-01');
    expect(getCachedLogFile({ ...github, branch: 'dev' }, 'site', 'logs/site/2026-01-01.json')).toBeNull();
  });

  it('evicts older files per site using configured retention', () => {
    saveAppConfig(createDefaultAppConfig({ github, localCache: { filesPerSite: 1 } }));

    cacheLogFile(github, 'site', 'logs/site/2026-01-01.json', log('2026-01-01'));
    cacheLogFile(github, 'site', 'logs/site/2026-01-02.json', log('2026-01-02'));

    expect(getCachedLogFile(github, 'site', 'logs/site/2026-01-01.json')).toBeNull();
    expect(getCachedLogFile(github, 'site', 'logs/site/2026-01-02.json')).toBeTruthy();
  });

  it('prunes existing cache when retention is lowered', () => {
    saveAppConfig(createDefaultAppConfig({ github, localCache: { filesPerSite: 2 } }));
    cacheLogFile(github, 'site', 'logs/site/2026-01-01.json', log('2026-01-01'));
    cacheLogFile(github, 'site', 'logs/site/2026-01-02.json', log('2026-01-02'));

    pruneCachedLogFilesForSite(github, 'site', 0);

    expect(getCachedLogFile(github, 'site', 'logs/site/2026-01-01.json')).toBeNull();
    expect(getCachedLogFile(github, 'site', 'logs/site/2026-01-02.json')).toBeNull();
  });
});
