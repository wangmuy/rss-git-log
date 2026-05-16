import { generateItemId } from '../utils/item-id';
import LZString from 'lz-string';

interface MarkAllReadInput {
  siteId: string;
  items: Array<{ guid?: string; link?: string; title?: string; description?: string; pubDate?: string }>;
  existingReadStatus: Record<string, string[]>;
  settings: any;
}

interface MarkAllReadResult {
  siteId: string;
  compressed: string;
  itemIds: string[];
}

self.onmessage = (e: MessageEvent<MarkAllReadInput>) => {
  const { siteId, items, existingReadStatus, settings } = e.data;

  const newReadStatus: Record<string, string[]> = { ...existingReadStatus };
  const itemIds: string[] = [];

  for (const item of items) {
    const id = generateItemId(
      item.guid || '',
      item.link || '',
      item.title || '',
      item.description || '',
      item.pubDate || ''
    );
    itemIds.push(id);
  }

  newReadStatus[siteId] = (newReadStatus[siteId] || []).concat(itemIds);
  newReadStatus[siteId] = [...new Set(newReadStatus[siteId])];

  const json = JSON.stringify({
    readStatus: newReadStatus,
    settings
  });

  const compressed = LZString.compress(json) || '';

  const result: MarkAllReadResult = { siteId, compressed, itemIds };
  self.postMessage(result);
};
