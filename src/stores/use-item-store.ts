import { ItemStore } from './item-store';
import { loadAppConfig, saveAppConfig, createDefaultAppConfig } from '@/utils/app-config';

let instance: ItemStore | null = null;

export async function getItemStore(): Promise<ItemStore> {
  if (instance) return instance;

  const config = loadAppConfig();
  const provider = config.itemStore?.provider || 'localstorage';

  if (provider === 'pglite') {
    try {
      const { PGliteStore } = await import('./pglite-store');
      const pgStore = new PGliteStore();
      await pgStore.init();
      instance = pgStore;
      return instance;
    } catch (e) {
      console.warn('PGlite initialization failed, falling back to localStorage:', e);
      // Reset config so we don't retry PGlite on every page load
      saveAppConfig(createDefaultAppConfig({ ...config, itemStore: { provider: 'localstorage' } }));
    }
  }

  const { LocalStorageStore } = await import('./localstorage-store');
  instance = new LocalStorageStore();
  await instance.init();
  return instance;
}

export function resetItemStore(): void {
  instance = null;
}
