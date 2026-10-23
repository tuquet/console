import { isTauriEnvironment } from './index';

export interface NotificationOptions {
  body?: string;
  title: string;
}

/**
 * Sends a native OS notification on desktop, with browser fallback.
 */
export async function sendDesktopNotification(
  options: NotificationOptions,
): Promise<boolean> {
  const { body, title } = options;

  if (isTauriEnvironment()) {
    try {
      const { isPermissionGranted, requestPermission, sendNotification } =
        await import('@tauri-apps/plugin-notification');

      let granted = await isPermissionGranted();
      if (!granted) {
        const permission = await requestPermission();
        granted = permission === 'granted';
      }

      if (granted) {
        sendNotification({ body, title });
        return true;
      }
    } catch {
      // Ignored when native notification fails
    }
  }

  // Web Browser fallback
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (Notification.permission === 'granted') {
        const _n = new Notification(title, { body });
        void _n;
        return true;
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const _n = new Notification(title, { body });
          void _n;
          return true;
        }
      }
    } catch {
      // Ignored in non-secure or restricted contexts
    }
  }

  return false;
}
