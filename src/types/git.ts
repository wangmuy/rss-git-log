export interface GitFile {
  content: string;
  sha: string;
}

export interface GitTreeItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
}

export interface GitFileChange {
  path: string;
  content: string;
  sha: string | null;
}

export interface GitProviderConfig {
  provider?: string;
  owner: string;
  repo: string;
  branch: string;
  token?: string;
}
