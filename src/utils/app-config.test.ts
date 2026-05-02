import { afterEach, describe, expect, it } from 'vitest';
import {
  createDefaultAppConfig,
  loadAppConfig,
  saveAppConfig,
  validateAppConfig
} from './app-config';

afterEach(() => {
  localStorage.clear();
});

describe('app config storage', () => {
  it('defaults auto-commit off and local cache to one file per site', () => {
    const config = createDefaultAppConfig();

    expect(config.autoCommit.enabled).toBe(false);
    expect(config.autoCommit.intervalSeconds).toBe(300);
    expect(config.localCache.filesPerSite).toBe(1);
  });

  it('saves and loads config from localStorage', () => {
    const config = createDefaultAppConfig({
      github: { owner: 'me', repo: 'rss', branch: 'main' }
    });

    saveAppConfig(config);

    expect(loadAppConfig().github.owner).toBe('me');
  });

  it('validates required GitHub fields and numeric bounds', () => {
    const config = createDefaultAppConfig({
      github: { owner: '', repo: '', branch: '' },
      localCache: { filesPerSite: -1 }
    });

    expect(validateAppConfig(config).length).toBeGreaterThan(0);
  });
});
