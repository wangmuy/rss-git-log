import { describe, it, expect } from 'vitest';
import {
  groupByPubDate,
  getSiteLogDir,
  parseLogFilename,
} from './log-file';
import type { LogItem } from '@/types/log';

describe('groupByPubDate', () => {
  it('groups items by their pubDate', () => {
    const items: LogItem[] = [
      { itemId: '1', title: 'A', pubDate: '2025-05-09T10:00:00Z' },
      { itemId: '2', title: 'B', pubDate: '2025-05-09T08:00:00Z' },
      { itemId: '3', title: 'C', pubDate: '2025-05-08T14:00:00Z' },
      { itemId: '4', title: 'D', pubDate: '2025-05-07T22:00:00Z' },
    ];

    const buckets = groupByPubDate(items);

    expect(buckets.size).toBe(3);
    expect(buckets.get('2025-05-09')!.length).toBe(2);
    expect(buckets.get('2025-05-08')!.length).toBe(1);
    expect(buckets.get('2025-05-07')!.length).toBe(1);
  });

  it('groups single items into single bucket', () => {
    const items: LogItem[] = [
      { itemId: '1', title: 'A', pubDate: '2025-05-09T10:00:00Z' },
    ];
    const buckets = groupByPubDate(items);

    expect(buckets.size).toBe(1);
    expect(buckets.get('2025-05-09')!.length).toBe(1);
  });

  it('groups items with same date together', () => {
    const items: LogItem[] = [
      { itemId: '1', title: 'A', pubDate: '2025-05-09T01:00:00Z' },
      { itemId: '2', title: 'B', pubDate: '2025-05-09T12:00:00Z' },
      { itemId: '3', title: 'C', pubDate: '2025-05-09T23:59:00Z' },
    ];
    const buckets = groupByPubDate(items);

    expect(buckets.size).toBe(1);
    expect(buckets.get('2025-05-09')!.length).toBe(3);
  });

  it('returns buckets ordered by date descending', () => {
    const items: LogItem[] = [
      { itemId: '1', title: 'A', pubDate: '2025-05-07T10:00:00Z' },
      { itemId: '2', title: 'B', pubDate: '2025-05-09T10:00:00Z' },
      { itemId: '3', title: 'C', pubDate: '2025-05-08T10:00:00Z' },
    ];
    const buckets = groupByPubDate(items);

    const dates = Array.from(buckets.keys());
    expect(dates).toEqual(['2025-05-09', '2025-05-08', '2025-05-07']);
  });

  it('handles empty items', () => {
    const buckets = groupByPubDate([]);
    expect(buckets.size).toBe(0);
  });
});

describe('getSiteLogDir', () => {
  it('returns encoded path', () => {
    expect(getSiteLogDir('https://example.com/rss')).toBe('logs/https%3A%2F%2Fexample.com%2Frss');
  });

  it('handles simple siteId', () => {
    const dir = getSiteLogDir('techcrunch');
    expect(dir).toBe('logs/techcrunch');
  });
});

describe('parseLogFilename', () => {
  it('parses a standard date filename', () => {
    const result = parseLogFilename('2025-05-09.json');
    expect(result).toEqual({ dateStr: '2025-05-09', overflow: null, filePath: 'logs' });
  });

  it('parses an overflow filename', () => {
    const result = parseLogFilename('2025-05-09-1.json');
    expect(result).toEqual({ dateStr: '2025-05-09', overflow: 1, filePath: 'logs' });
  });

  it('parses a deeper overflow filename', () => {
    const result = parseLogFilename('2025-05-09-3.json');
    expect(result).toEqual({ dateStr: '2025-05-09', overflow: 3, filePath: 'logs' });
  });

  it('returns null for non-log filenames', () => {
    expect(parseLogFilename('allread.json')).toBeNull();
    expect(parseLogFilename('2025-05-09-allread.json')).toBeNull();
    expect(parseLogFilename('readme.md')).toBeNull();
    expect(parseLogFilename('unknown-format.yaml')).toBeNull();
  });
});
