import { isTauriEnvironment } from './index';

export interface UpdateInfo {
  available: boolean;
  currentVersion?: string;
  notes?: string;
  version?: string;
}

/**
 * Checks for desktop updates via configured GitHub Releases endpoint.
 */
export async function checkDesktopUpdate(): Promise<UpdateInfo> {
  if (!isTauriEnvironment()) {
    return { available: false };
  }

  try {
    const { check } = await import('@tauri-apps/plugin-updater');
    const update = await check();

    if (update?.available) {
      return {
        available: true,
        currentVersion: update.currentVersion,
        notes: update.body,
        version: update.version,
      };
    }

    return {
      available: false,
      currentVersion: update?.currentVersion,
    };
  } catch (error) {
    console.warn('[Desktop Updater] Check failed:', error);
    return { available: false };
  }
}

/**
 * Checks for updates and surfaces a toast notification with the result.
 * - Update available → success toast with version
 * - Up to date       → info toast
 * - Error            → warning toast
 */
export async function checkAndNotifyUpdate(): Promise<void> {
  const { toast } = await import('@operon-core/shadcn-ui');
  try {
    const info = await checkDesktopUpdate();
    if (info.available) {
      toast.success(
        `Update v${info.version} is available! Restart the app to install.`,
        { duration: 8000 },
      );
    } else {
      toast.info(`Operon v${info.currentVersion ?? ''} is up to date.`, {
        duration: 3000,
      });
    }
  } catch {
    toast.warning('Could not check for updates. Try again later.', {
      duration: 4000,
    });
  }
}
