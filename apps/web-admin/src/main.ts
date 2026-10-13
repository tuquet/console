import { initPreferences } from '@vben/preferences';
import { unmountGlobalLoading } from '@vben/utils';

import {
  overridesPreferences,
  typographyPreferencesExtension,
} from './preferences';

// Auto-reload on stale chunk failures after new deployments
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    window.location.reload();
  });
}

/**
 * Mount and render pages after application initialization finishes
 */
async function initApplication() {
  // Unique namespace identifier for app preferences, storage key prefix, and isolated data
  const env = import.meta.env.PROD ? 'prod' : 'dev';
  const appVersion = import.meta.env.VITE_APP_VERSION;
  const namespace = `${import.meta.env.VITE_APP_NAMESPACE}-${appVersion}-${env}`;

  try {
    // Initialize app preferences with typography extension
    await initPreferences({
      extension: typographyPreferencesExtension,
      namespace,
      overrides: overridesPreferences,
    });

    // Bootstrap and mount Vue application logic and views
    const { bootstrap } = await import('./bootstrap');
    await bootstrap(namespace);
  } catch (error) {
    console.error('[Specter Admin] Failed to initialize application:', error);
    const appEl = document.querySelector('#app');
    if (appEl && !appEl.innerHTML.trim()) {
      appEl.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:24px;font-family:sans-serif;color:#333;text-align:center;">
          <h2 style="font-size:22px;margin-bottom:12px;">Không thể tải ứng dụng</h2>
          <p style="color:#666;max-width:480px;margin-bottom:20px;font-size:14px;">Trình duyệt có thể đang chứa bản lưu cũ hoặc kết nối mạng bị gián đoạn.</p>
          <button onclick="window.location.reload(true)" style="padding:10px 20px;background:#09090b;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:500;">
            Tải lại trang (Reload)
          </button>
        </div>
      `;
    }
  } finally {
    // Remove and unmount global loading indicator
    unmountGlobalLoading();
  }
}

initApplication();
