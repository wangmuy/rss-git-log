import LZString from 'lz-string';

const COMPRESSION_PREFIX = '::lz::';

export function compressedSetItem(key: string, value: string): void {
  try {
    const compressed = LZString.compress(value);
    if (compressed === null) throw new Error('lz-string compress returned null');
    localStorage.setItem(key, COMPRESSION_PREFIX + compressed);
  } catch {
    try {
      localStorage.setItem(key, value);
    } catch {
      console.warn('localStorage quota exceeded for', key);
    }
  }
}

export function compressedGetItem(key: string): string | null {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return null;
    if (stored.startsWith(COMPRESSION_PREFIX)) {
      return LZString.decompress(stored.slice(COMPRESSION_PREFIX.length));
    }
    return stored;
  } catch {
    return localStorage.getItem(key);
  }
}
