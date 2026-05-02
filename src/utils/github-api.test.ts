import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkGitHubWriteCapability, createGitHubClient } from './github-api';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('checkGitHubWriteCapability', () => {
  it('rejects missing tokens without network calls', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    const result = await checkGitHubWriteCapability(createGitHubClient({
      owner: 'me',
      repo: 'rss',
      branch: 'main'
    }));

    expect(result.canWrite).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('accepts tokens with push permission and an existing branch', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ permissions: { push: true } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ name: 'main' })));

    const result = await checkGitHubWriteCapability(createGitHubClient({
      owner: 'me',
      repo: 'rss',
      branch: 'main',
      token: 'token'
    }));

    expect(result.canWrite).toBe(true);
  });
});
