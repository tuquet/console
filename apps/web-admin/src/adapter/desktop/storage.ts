import { isTauriEnvironment } from './index';

let storeInstance: any = null;

async function getDesktopStore() {
  if (!storeInstance && isTauriEnvironment()) {
    try {
      const { Store } = await import('@tauri-apps/plugin-store');
      storeInstance = await Store.load('tuquet-desktop-storage.json');
    } catch (error) {
      console.warn('[Desktop Storage] Store load failed:', error);
    }
  }
  return storeInstance;
}

/**
 * Stores a value in secure desktop store (or localStorage on web).
 */
export async function setSecureItem<T>(key: string, value: T): Promise<void> {
  if (isTauriEnvironment()) {
    try {
      const store = await getDesktopStore();
      if (store) {
        await store.set(key, value);
        await store.save();
        return;
      }
    } catch (error) {
      console.warn('[Desktop Storage] set error:', error);
    }
  }

  // Web Browser fallback
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignored
    }
  }
}

/**
 * Retrieves a value from secure desktop store (or localStorage on web).
 */
export async function getSecureItem<T>(
  key: string,
  defaultValue: null | T = null,
): Promise<null | T> {
  if (isTauriEnvironment()) {
    try {
      const store = await getDesktopStore();
      if (store) {
        const val = await store.get(key);
        if (val !== undefined && val !== null) {
          return val as T;
        }
        return defaultValue;
      }
    } catch (error) {
      console.warn('[Desktop Storage] get error:', error);
    }
  }

  // Web Browser fallback
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        return JSON.parse(raw) as T;
      }
    } catch {
      // Return default
    }
  }

  return defaultValue;
}
