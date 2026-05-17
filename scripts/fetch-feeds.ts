import { DOMParser } from 'linkedom';
import { parseXMLDocument } from '../src/utils/feed-parser';
import { generateItemIdFromItem } from '../src/utils/item-id';
import { getSiteId } from '../src/utils/url';
import { commitAllFeedItems } from '../src/utils/log-file';
import type { GitHubConfig, CORSPolicy, CORSPolicyMode } from '../src/types/config';
import type { RSSFeed, RSSItem, RSSConfig } from '../src/types/rss';
import type { LogItem } from '../src/types/log';
import * as fs from 'fs';
import * as path from 'path';

// Re-export for composite action env passthrough
(globalThis as any).DOMParser = DOMParser;

// ── Parse (Node.js) ──────────────────────────────────────────────

function parseXMLFeedNode(xml: string): RSSFeed {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  return parseXMLDocument(doc);
}

// ── Network ──────────────────────────────────────────────────────

function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

function buildProxyUrl(template: string, url: string): string {
  return template.replace('{url}', encodeURIComponent(url));
}

async function fetchRSSWithProxy(url: string, policy: CORSPolicy): Promise<RSSFeed> {
  for (const proxy of policy.proxies) {
    try {
      const response = await fetchWithTimeout(buildProxyUrl(proxy.urlTemplate, url), policy.timeoutMs);
      if (!response.ok) continue;
      const xml = await response.text();
      if (xml.trim().toLowerCase().startsWith('<!doctype') || xml.trim().toLowerCase().startsWith('<html')) {
        console.warn(`  Proxy ${proxy.name} returned HTML, skipping`);
        continue;
      }
      return parseXMLFeedNode(xml);
    } catch {
      continue;
    }
  }
  throw new Error(`All proxies failed for ${url}`);
}

async function fetchRSSWithPolicy(url: string, policy: CORSPolicy): Promise<RSSFeed> {
  if (policy.mode === 'proxy-only') {
    return fetchRSSWithProxy(url, policy);
  }

  try {
    const response = await fetchWithTimeout(url, policy.timeoutMs);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const xml = await response.text();
    return parseXMLFeedNode(xml);
  } catch (error: any) {
    if (policy.mode === 'direct-only') throw error;
    if (
      error.name === 'AbortError' ||
      error.message?.includes('CORS') ||
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('NetworkError') ||
      error.message?.includes('fetch failed')
    ) {
      return fetchRSSWithProxy(url, policy);
    }
    throw error;
  }
}

// ── Config Parsing ───────────────────────────────────────────────

function parseProxyTemplates(text: string): Array<{ name: string; urlTemplate: string }> {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      const separatorIndex = line.indexOf('|');
      if (separatorIndex === -1) {
        return { name: line, urlTemplate: line };
      }
      return {
        name: line.slice(0, separatorIndex).trim(),
        urlTemplate: line.slice(separatorIndex + 1).trim()
      };
    });
}

function getEnv(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

// ── Main ─────────────────────────────────────────────────────────

async function main() {
  console.log('RSS Feed Fetcher — starting');

  // 1. Read env vars
  const targetOwner = getEnv('TARGET_OWNER', '');
  const targetRepo = getEnv('TARGET_REPO', '');
  const targetBranch = getEnv('TARGET_BRANCH', 'rss-reader-data');
  const ghToken = process.env['GH_TOKEN'] || '';

  if (!targetOwner || !targetRepo) {
    console.error('TARGET_OWNER and TARGET_REPO must be set (or run in a GitHub repo context)');
    process.exit(1);
  }

  // 2. Build GitHubConfig
  const githubConfig: GitHubConfig = {
    owner: targetOwner,
    repo: targetRepo,
    branch: targetBranch,
    token: ghToken || undefined
  };

  const proxyMode = getEnv('PROXY_MODE', 'proxy-fallback') as CORSPolicyMode;
  const proxyTemplatesText = getEnv(
    'PROXY_TEMPLATES',
    'corsproxy.io|https://corsproxy.io/?{url}\nallorigins.win|https://api.allorigins.win/raw?url={url}'
  );
  const timeoutMs = parseInt(getEnv('TIMEOUT_MS', '10000'), 10);
  const poolSize = parseInt(getEnv('POOL_SIZE', '5'), 10);

  // 3. Build CORSPolicy
  const corsPolicy: CORSPolicy = {
    mode: proxyMode,
    proxies: parseProxyTemplates(proxyTemplatesText),
    timeoutMs
  };

  console.log(`Target: ${targetOwner}/${targetRepo}#${targetBranch}`);
  console.log(`Proxy mode: ${proxyMode}, timeout: ${timeoutMs}ms, pool: ${poolSize}`);

  // 4. Read rss-config.json
  const configPath = path.join(process.cwd(), 'rss-config.json');
  if (!fs.existsSync(configPath)) {
    console.error(`rss-config.json not found at ${configPath}`);
    process.exit(1);
  }

  const config: RSSConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  console.log(`Sites to fetch: ${config.sites.length}`);

  // 5. Fetch all feeds with concurrency pool
  const results: Array<{ site: RSSConfig['sites'][0]; feed: RSSFeed | null; error?: string }> = [];
  const queue = [...config.sites];

  async function worker() {
    while (queue.length > 0) {
      const site = queue.shift()!;
      console.log(`Fetching: ${site.name} (${site.url})`);
      try {
        const feed = await fetchRSSWithPolicy(site.url, corsPolicy);
        console.log(`  ✓ ${feed.items.length} items`);
        results.push({ site, feed });
      } catch (err: any) {
        console.error(`  ✗ ${err.message || err}`);
        results.push({ site, feed: null, error: err.message || String(err) });
      }
    }
  }

  const workers = Array.from({ length: Math.min(poolSize, queue.length) }, () => worker());
  await Promise.all(workers);

  // 6. Build LogItems and commit
  let totalCommitted = 0;
  let commitErrors = 0;

  for (const { site, feed } of results) {
    if (!feed || feed.items.length === 0) continue;

    const siteId = getSiteId(site.url);
    const logItems: Array<{ itemId: string; title: string; pubDate: string }> = feed.items
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .map(item => ({
        itemId: generateItemIdFromItem(item),
        title: item.title,
        pubDate: item.pubDate
      }));

    try {
      const success = await commitAllFeedItems(siteId, site.name, logItems, githubConfig);
      if (success) {
        console.log(`Committed: ${site.name} — ${logItems.length} items`);
        totalCommitted += logItems.length;
      } else {
        console.error(`Commit failed: ${site.name}`);
        commitErrors++;
      }
    } catch (err: any) {
      console.error(`Commit error: ${site.name} — ${err.message || err}`);
      commitErrors++;
    }
  }

  // 7. Output summary
  const succeeded = results.filter(r => r.feed !== null).length;
  const failed = results.filter(r => r.feed === null).length;
  console.log(`\nSummary: ${succeeded} succeeded, ${failed} failed, ${totalCommitted} items committed, ${commitErrors} commit errors`);

  if (commitErrors > 0 || failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
