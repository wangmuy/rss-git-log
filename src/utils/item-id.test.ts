import { describe, expect, it } from 'vitest';
import { generateItemId, getItemId, generateItemIdFromItem } from './item-id';

describe('generateItemId', () => {
  it('returns a stable id for the same item', () => {
    const first = generateItemId('guid-1', 'https://example.com/a', 'Title', 'Body', '2026-01-01');
    const second = generateItemId('guid-1', 'https://example.com/a', 'Title', 'Body', '2026-01-01');

    expect(first).toBe(second);
    expect(first.length).toBeGreaterThan(10);
  });

  it('normalizes tracking parameters before generating ids', () => {
    const clean = generateItemId('guid-1', 'https://example.com/a', 'Title', 'Body', '2026-01-01');
    const tracked = generateItemId('guid-1', 'https://example.com/a?utm_source=x&fbclid=y', 'Title', 'Body', '2026-01-01');

    expect(tracked).toBe(clean);
  });

  it('changes when meaningful fields change', () => {
    const first = generateItemId('guid-1', 'https://example.com/a', 'Title', 'Body', '2026-01-01');
    const second = generateItemId('guid-2', 'https://example.com/a', 'Title', 'Body', '2026-01-01');

    expect(second).not.toBe(first);
  });
});

describe('getItemId', () => {
  it('returns pre-computed itemId when present', () => {
    const originalId = generateItemIdFromItem({
      guid: 'guid-1', link: 'https://example.com/a',
      title: 'Title', description: 'Body', pubDate: '2026-01-01'
    });
    const item = {
      itemId: originalId,
      guid: originalId,
      link: '',
      description: '',
      title: 'Title',
      pubDate: '2026-01-01'
    };
    expect(getItemId(item)).toBe(originalId);
  });

  it('falls back to generateItemIdFromItem when itemId is absent', () => {
    const item = {
      guid: 'guid-1',
      link: 'https://example.com/a',
      title: 'Title',
      description: 'Body',
      pubDate: '2026-01-01'
    };
    const expected = generateItemIdFromItem(item);
    expect(getItemId(item)).toBe(expected);
  });

  it('returns different id than generateItemIdFromItem for historical items with empty link/description', () => {
    const originalId = generateItemIdFromItem({
      guid: 'guid-1', link: 'https://example.com/a',
      title: 'Title', description: 'Body', pubDate: '2026-01-01'
    });
    const historicalItem = {
      itemId: originalId,
      guid: originalId,
      link: '',
      description: '',
      title: 'Title',
      pubDate: '2026-01-01'
    };
    const regenerated = generateItemIdFromItem(historicalItem);
    expect(getItemId(historicalItem)).toBe(originalId);
    expect(getItemId(historicalItem)).not.toBe(regenerated);
  });
});
