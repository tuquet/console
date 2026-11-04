/**
 * Admin Desktop Native Adapter
 * Safe abstractions over Tauri v2 APIs with zero-crash web browser fallbacks.
 */

import { isTauriEnvironment } from '#/utils/platform';

export { isTauriEnvironment };

/**
 * Minimizes the native window.
 */
export async function minimizeWindow(): Promise<void> {
  if (!isTauriEnvironment()) return;
  try {
    const { getCurrentWebviewWindow } =
      await import('@tauri-apps/api/webviewWindow');
    await getCurrentWebviewWindow().minimize();
  } catch (error) {
    console.error('[Desktop] Failed to minimize window:', error);
  }
}

/**
 * Toggles maximize / restore on the native window.
 */
export async function toggleMaximizeWindow(): Promise<boolean> {
  if (!isTauriEnvironment()) return false;
  try {
    const { getCurrentWebviewWindow } =
      await import('@tauri-apps/api/webviewWindow');
    const win = getCurrentWebviewWindow();
    await win.toggleMaximize();
    return await win.isMaximized();
  } catch (error) {
    console.error('[Desktop] Failed to toggle maximize window:', error);
    return false;
  }
}

/**
 * Closes the native window (or exits the application).
 */
export async function closeWindow(): Promise<void> {
  if (!isTauriEnvironment()) return;
  try {
    const { getCurrentWebviewWindow } =
      await import('@tauri-apps/api/webviewWindow');
    await getCurrentWebviewWindow().close();
  } catch (error) {
    console.error('[Desktop] Failed to close window:', error);
  }
}

/**
 * Checks if the native window is currently maximized.
 */
export async function isWindowMaximized(): Promise<boolean> {
  if (!isTauriEnvironment()) return false;
  try {
    const { getCurrentWebviewWindow } =
      await import('@tauri-apps/api/webviewWindow');
    return await getCurrentWebviewWindow().isMaximized();
  } catch {
    return false;
  }
}

/**
 * Reveals the native window smoothly once the frontend DOM has initialized.
 */
export async function revealWindow(): Promise<void> {
  if (!isTauriEnvironment()) return;
  try {
    const { getCurrentWebviewWindow } =
      await import('@tauri-apps/api/webviewWindow');
    const win = getCurrentWebviewWindow();
    await win.show();
    await win.setFocus();
  } catch (error) {
    console.warn('[Desktop] revealWindow fallback:', error);
  }
}

/**
 * Starts window dragging on mousedown in Tauri environment.
 */
export async function startDragging(): Promise<void> {
  if (!isTauriEnvironment()) return;
  try {
    const { getCurrentWebviewWindow } =
      await import('@tauri-apps/api/webviewWindow');
    await getCurrentWebviewWindow().startDragging();
  } catch (error) {
    console.error('[Desktop] Failed to start window dragging:', error);
  }
}

/**
 * Toggles developer tools window.
 */
export async function toggleDevtools(): Promise<boolean> {
  if (!isTauriEnvironment()) return false;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<boolean>('toggle_devtools');
  } catch (error) {
    console.error('[Desktop] Failed to toggle DevTools:', error);
    return false;
  }
}

/**
 * Opens developer tools window.
 */
export async function openDevtools(): Promise<void> {
  if (!isTauriEnvironment()) return;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('open_devtools');
  } catch (error) {
    console.error('[Desktop] Failed to open DevTools:', error);
  }
}

/**
 * Returns the canonical workstation log path on the host.
 */
export async function getLogPath(): Promise<string> {
  if (!isTauriEnvironment()) return '';
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<string>('get_log_path');
  } catch (error) {
    console.error('[Desktop] Failed to get log path:', error);
    return '';
  }
}

/**
 * Appends a log line to the persistent workstation log file (~/.operon/logs/workstation.log).
 */
export async function appendDesktopLog(
  level: 'debug' | 'error' | 'info' | 'warn',
  message: string,
): Promise<void> {
  if (!isTauriEnvironment()) return;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('append_log', { level, message });
  } catch {
    // Fail-safe silently if IPC is unavailable
  }
}

/**
 * Initializes desktop keyboard shortcuts (F12, Ctrl+Shift+I) and intercepts
 * uncaught frontend errors to persist them into workstation.log.
 */
export function initDesktopLoggingAndShortcuts(): void {
  if (!isTauriEnvironment() || typeof window === 'undefined') return;

  // 1. Keyboard shortcuts for DevTools (F12 and Ctrl+Shift+I)
  window.addEventListener('keydown', (event) => {
    if (
      event.key === 'F12' ||
      (event.ctrlKey &&
        event.shiftKey &&
        (event.key === 'I' || event.key === 'i'))
    ) {
      event.preventDefault();
      toggleDevtools().catch(console.error);
    }
  });

  // 2. Forward uncaught errors to persistent file log
  window.addEventListener('error', (event) => {
    const errorMsg =
      event.error?.stack ||
      event.error?.message ||
      event.message ||
      'Unknown window error';
    appendDesktopLog('error', `[Frontend] Uncaught error: ${errorMsg}`);
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason =
      event.reason?.stack || event.reason?.message || String(event.reason);
    appendDesktopLog('error', `[Frontend] Unhandled rejection: ${reason}`);
  });

  // 3. Intercept console.error to also append to workstation.log
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    originalConsoleError.apply(console, args);
    try {
      const msg = args
        .map((arg) =>
          typeof arg === 'object'
            ? arg?.stack || JSON.stringify(arg)
            : String(arg),
        )
        .join(' ');
      appendDesktopLog('error', `[Frontend] ${msg}`);
    } catch {
      // Fail-safe
    }
  };

  // 4. Log initial frontend readiness
  appendDesktopLog(
    'info',
    '[Frontend] Webview runtime initialized with DevTools listener active',
  );
}

export * from './deep-link';
