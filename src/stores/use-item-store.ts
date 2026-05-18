import { ItemStore } from './item-store';
import { loadAppConfig } from '@/utils/app-config';

let instance: ItemStore | null = null;

export async function getItemStore(): Promise<ItemStore> {
  if (instance) return instance;

  const config = loadAppConfig();
  const provider = config.itemStore?.provider || 'localstorage';

  if (provider === 'pglite') {
    const { PGliteStore } = await import('./pglite-store');
    instance = new PGliteStore();
  } else {
    const { LocalStorageStore } = await import('./localstorage-store');
    instance = new LocalStorageStore();
  }

  await instance.init();
  return instance;
}

export function resetItemStore(): void {
  instance = null;
}
