import { describe, expect, it, beforeEach } from 'vitest';
import { compressedGetItem, compressedSetItem } from './compressed-storage';

const TEST_KEY = 'test-compressed-key';

beforeEach(() => {
  localStorage.clear();
});

describe('compressed-storage', () => {
  it('writes and reads compressed value', () => {
    compressedSetItem(TEST_KEY, 'hello world');
    const stored = localStorage.getItem(TEST_KEY);
    expect(stored).toMatch(/^::lz::/);
    expect(compressedGetItem(TEST_KEY)).toBe('hello world');
  });

  it('reads uncompressed legacy value', () => {
    localStorage.setItem(TEST_KEY, 'plain json');
    expect(compressedGetItem(TEST_KEY)).toBe('plain json');
  });

  it('returns null for missing key', () => {
    expect(compressedGetItem('nonexistent')).toBeNull();
  });

  it('handles large JSON roundtrip', () => {
    const large = JSON.stringify({ items: Array(1000).fill({ id: 'x'.repeat(80), val: 'test' }) });
    compressedSetItem(TEST_KEY, large);
    expect(compressedGetItem(TEST_KEY)).toBe(large);
  });
});
