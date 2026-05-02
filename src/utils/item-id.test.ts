import { describe, expect, it } from 'vitest';
import { generateItemId } from './item-id';

describe('generateItemId', () => {
  it('returns a stable 32-character id for the same item', () => {
    const first = generateItemId('guid-1', 'https://example.com/a', 'Title', 'Body', '2026-01-01');
    const second = generateItemId('guid-1', 'https://example.com/a', 'Title', 'Body', '2026-01-01');

    expect(first).toBe(second);
    expect(first).toHaveLength(32);
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
