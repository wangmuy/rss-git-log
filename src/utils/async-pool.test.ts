import { describe, expect, it } from 'vitest';
import { asyncPool } from './async-pool';

describe('asyncPool', () => {
  it('processes all items with concurrency limit', async () => {
    const items = [1, 2, 3, 4, 5];
    let maxConcurrent = 0;
    let current = 0;

    const results = await asyncPool(items, 2, async (item) => {
      current++;
      maxConcurrent = Math.max(maxConcurrent, current);
      await new Promise(r => setTimeout(r, 10));
      current--;
      return item * 2;
    });

    expect(results).toEqual([2, 4, 6, 8, 10]);
    expect(maxConcurrent).toBe(2);
  });

  it('handles empty array', async () => {
    const results = await asyncPool([], 3, async (x: number) => x);
    expect(results).toEqual([]);
  });

  it('handles single item', async () => {
    const results = await asyncPool([42], 5, async (x: number) => x * 2);
    expect(results).toEqual([84]);
  });
});
