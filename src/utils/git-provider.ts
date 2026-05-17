import { GitFile, GitTreeItem, GitFileChange, GitProviderConfig } from '@/types/git';
import { utf8ToBase64, base64ToUtf8 } from './base64';
import { getFetchSignal } from './abort';

export interface GitProvider {
  readFile(path: string): Promise<GitFile | null>;
  writeFile(path: string, content: string, message: string): Promise<boolean>;
  deleteFile(path: string, message: string): Promise<boolean>;
  listDirectory(path: string): Promise<GitTreeItem[]>;
  getFileSha(path: string): Promise<string | null>;
  createCommit(message: string, changes: GitFileChange[]): Promise<boolean>;
}

export class GitHubProvider implements GitProvider {
  private config: GitProviderConfig;
  private baseUrl: string;

  constructor(config: GitProviderConfig) {
    this.config = config;
    this.baseUrl = `https://api.github.com/repos/${config.owner}/${config.repo}`;
  }

  private branch(): string {
    return this.config.branch?.trim() || 'main';
  }

  private headers(): HeadersInit {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };
    if (this.config.token) {
      headers['Authorization'] = `token ${this.config.token}`;
    }
    return headers;
  }

  private async fetchWithSignal(url: string, options?: RequestInit): Promise<Response> {
    const signal = getFetchSignal();
    return fetch(url, { ...options, signal });
  }

  async readFile(path: string): Promise<GitFile | null> {
    const url = `${this.baseUrl}/contents/${encodeURIComponent(path)}?ref=${this.branch()}`;
    const response = await this.fetchWithSignal(url, { headers: this.headers() });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    const data = await response.json();
    return { content: base64ToUtf8(data.content), sha: data.sha };
  }

  async writeFile(path: string, content: string, message: string): Promise<boolean> {
    if (!this.config.token) throw new Error('GitHub token is required for write operations');

    for (let attempt = 0; attempt < 2; attempt++) {
      const sha = await this.getFileSha(path);
      const body = JSON.stringify({
        message,
        content: utf8ToBase64(content),
        branch: this.branch(),
        ...(sha ? { sha } : {})
      });
      const response = await this.fetchWithSignal(`${this.baseUrl}/contents/${encodeURIComponent(path)}`, {
        method: 'PUT', headers: this.headers(), body
      });
      if (response.ok) return true;
      if (response.status !== 409) return false;
      // 409 Conflict — stale SHA, retry with fresh SHA
    }
    return false;
  }

  async deleteFile(path: string, message: string): Promise<boolean> {
    if (!this.config.token) throw new Error('GitHub token is required for write operations');
    try {
      const sha = await this.getFileSha(path);
      if (!sha) return true;
      const body = JSON.stringify({ message, sha, branch: this.branch() });
      const response = await this.fetchWithSignal(`${this.baseUrl}/contents/${encodeURIComponent(path)}`, {
        method: 'DELETE', headers: this.headers(), body
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async listDirectory(path: string): Promise<GitTreeItem[]> {
    const url = `${this.baseUrl}/contents/${encodeURIComponent(path)}?ref=${this.branch()}`;
    const response = await this.fetchWithSignal(url, { headers: this.headers() });
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    const data = await response.json();
    return Array.isArray(data) ? data.map((item: any) => ({
      name: item.name, path: item.path, type: item.type as 'file' | 'dir'
    })) : [];
  }

  async getFileSha(path: string): Promise<string | null> {
    const url = `${this.baseUrl}/contents/${encodeURIComponent(path)}?ref=${this.branch()}`;
    const response = await this.fetchWithSignal(url, { headers: this.headers() });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    const data = await response.json();
    return data.sha || null;
  }

  async createCommit(message: string, changes: GitFileChange[]): Promise<boolean> {
    if (!this.config.token) throw new Error('GitHub token is required for write operations');
    try {
      const headers = this.headers();

      // 1. Create blobs for each file
      const blobResponses = await Promise.all(
        changes.map(change =>
          fetch(`${this.baseUrl}/git/blobs`, {
            method: 'POST', headers,
            body: JSON.stringify({ content: utf8ToBase64(change.content), encoding: 'base64' })
          }).then(r => r.json())
        )
      );
      if (blobResponses.some((r: any) => !r.sha)) return false;

      // 2. Get current head commit tree SHA
      const refUrl = `${this.baseUrl}/git/refs/heads/${this.branch()}`;
      const refResp = await this.fetchWithSignal(refUrl, { headers });
      if (!refResp.ok) return false;
      const refData = await refResp.json();
      const currentTreeSha = refData.object.sha;

      // 3. Get the current tree
      const treeResp = await this.fetchWithSignal(`${this.baseUrl}/git/trees/${currentTreeSha}`, { headers });
      if (!treeResp.ok) return false;
      const currentTree = await treeResp.json();

      // 4. Create new tree with updated files
      const treeItems = [
        ...currentTree.tree.filter((item: any) => !changes.some(c => c.path === item.path)),
        ...changes.map((change, i) => ({
          path: change.path,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: blobResponses[i].sha
        }))
      ];

      const newTreeResp = await this.fetchWithSignal(`${this.baseUrl}/git/trees`, {
        method: 'POST', headers,
        body: JSON.stringify({ base_tree: currentTreeSha, tree: treeItems })
      });
      if (!newTreeResp.ok) return false;
      const newTree = await newTreeResp.json();

      // 5. Create commit
      const commitResp = await this.fetchWithSignal(`${this.baseUrl}/git/commits`, {
        method: 'POST', headers,
        body: JSON.stringify({
          message,
          tree: newTree.sha,
          parents: [refData.object.sha]
        })
      });
      if (!commitResp.ok) return false;
      const newCommit = await commitResp.json();

      // 6. Update branch ref
      const updateResp = await this.fetchWithSignal(refUrl, {
        method: 'PATCH', headers,
        body: JSON.stringify({ sha: newCommit.sha, force: false })
      });
      return updateResp.ok;
    } catch (error) {
      console.error('Failed to create commit:', error);
      return false;
    }
  }
}

export function createGitProvider(config: GitProviderConfig): GitProvider {
  const provider = config.provider || 'github';
  if (provider === 'github') {
    return new GitHubProvider(config);
  }
  throw new Error(`Unknown git provider: ${provider}`);
}
