import { useEffect, useRef, useCallback } from 'react';

interface UseKeyboardNavigationArgs {
  totalItems: number;
  selectedIndex: number;
  isReadList: boolean[];
  onSelect: (index: number) => void;
  siteId?: string;
}

export function useKeyboardNavigation({
  totalItems,
  selectedIndex,
  isReadList,
  onSelect,
  siteId,
}: UseKeyboardNavigationArgs) {
  const argsRef = useRef({ totalItems, selectedIndex, isReadList, onSelect });
  argsRef.current = { totalItems, selectedIndex, isReadList, onSelect };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) {
      return;
    }

    const key = e.key.toLowerCase();
    if (key !== 'j' && key !== 'k') return;

    const { totalItems, selectedIndex, isReadList, onSelect } = argsRef.current;
    if (totalItems === 0) return;

    e.preventDefault();

    if (key === 'j') {
      let next = selectedIndex >= 0 ? selectedIndex + 1 : -1;
      if (next >= totalItems) next = totalItems - 1;
      if (selectedIndex < 0) {
        const firstUnread = isReadList.findIndex((r) => !r);
        next = firstUnread >= 0 ? firstUnread : 0;
      }
      onSelect(next);
    }

    if (key === 'k') {
      const prev = selectedIndex <= 0 ? 0 : selectedIndex - 1;
      onSelect(prev);
    }
  }, []);

  // Re-register listener when site changes
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, siteId]);
}
