import { describe, expect, it } from 'vitest';
import { normalizeUrl, removeTrackingParams } from './url';

describe('removeTrackingParams', () => {
  it('removes UTM parameters', () => {
    expect(removeTrackingParams('https://example.com/a?utm_source=x&utm_medium=y&id=1')).toBe('https://example.com/a?id=1');
  });

  it('removes social and ref tracking parameters', () => {
    expect(removeTrackingParams('https://example.com/a?fbclid=x&gclid=y&ref=z&id=1')).toBe('https://example.com/a?id=1');
  });

  it('returns invalid URLs unchanged', () => {
    expect(removeTrackingParams('not a url')).toBe('not a url');
  });
});

describe('normalizeUrl', () => {
  it('sorts query parameters for stable comparison', () => {
    expect(normalizeUrl('https://example.com/a?b=2&a=1')).toBe('https://example.com/a?a=1&b=2');
  });
});
