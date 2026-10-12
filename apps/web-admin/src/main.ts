import { initPreferences } from '@vben/preferences';
import { unmountGlobalLoading } from '@vben/utils';

import { overridesPreferences, preferencesExtension } from './preferences';

/**
 * Mount and render pages after application initialization finishes
 */
async function initApplication() {
  // Unique namespace identifier for app preferences, storage key prefix, and isolated data
  const env = import.meta.env.PROD ? 'prod' : 'dev';
  const appVersion = import.meta.env.VITE_APP_VERSION;
  const namespace = `${import.meta.env.VITE_APP_NAMESPACE}-${appVersion}-${env}`;

  // Initialize app preferences
  await initPreferences({
    extension: preferencesExtension,
    namespace,
    overrides: overridesPreferences,
  });

  // Bootstrap and mount Vue application logic and views
  const { bootstrap } = await import('./bootstrap');
  await bootstrap(namespace);

  // Remove and unmount global loading indicator
  unmountGlobalLoading();
}

initApplication();
