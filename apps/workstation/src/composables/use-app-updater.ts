import { ref } from 'vue';

import { isDesktop } from '#/utils/platform';

export interface UpdateInfo {
  body?: string;
  date?: string;
  version: string;
}

export function useAppUpdater() {
  const isChecking = ref(false);
  const isUpdating = ref(false);
  const updateAvailable = ref<null | UpdateInfo>(null);
  const updateError = ref<null | string>(null);

  async function checkForUpdates(silent = true) {
    if (!isDesktop()) {
      return null;
    }
    isChecking.value = true;
    updateError.value = null;

    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();
      if (update) {
        updateAvailable.value = {
          body: update.body ?? undefined,
          date: update.date ?? undefined,
          version: update.version,
        };
        return update;
      }
      updateAvailable.value = null;
      return null;
    } catch (error: any) {
      if (!silent) {
        console.warn('[Updater] Failed to check for updates:', error);
      }
      updateError.value = error?.message || String(error);
      return null;
    } finally {
      isChecking.value = false;
    }
  }

  async function installUpdate() {
    if (!isDesktop() || !updateAvailable.value) {
      return;
    }
    isUpdating.value = true;
    updateError.value = null;

    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();
      if (update) {
        await update.downloadAndInstall();
        const { relaunch } = await import('@tauri-apps/plugin-process');
        await relaunch();
      }
    } catch (error: any) {
      updateError.value = error?.message || String(error);
      console.error('[Updater] Failed to download and install update:', error);
    } finally {
      isUpdating.value = false;
    }
  }

  return {
    checkForUpdates,
    installUpdate,
    isChecking,
    isUpdating,
    updateAvailable,
    updateError,
  };
}
