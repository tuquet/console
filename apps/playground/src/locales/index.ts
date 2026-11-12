import type { App } from 'vue';

import type { SupportedLanguagesType } from '@operon/locales';

import {
  $t,
  setupI18n as coreSetup,
  loadLocalesMapFromDir,
  registerLocaleMessages,
} from '@operon/locales';
import { preferences } from '@operon/preferences';

const APP_LOCALE_ID = 'playground';

const modules = import.meta.glob('./langs/**/*.json');

const localesMap = loadLocalesMapFromDir(
  /\.\/langs\/([^/]+)\/(.*)\.json$/,
  modules,
);

async function loadMessages(lang: SupportedLanguagesType) {
  const appLocaleMessages = await localesMap[lang]?.();
  return appLocaleMessages?.default;
}

export async function setupAppLocales() {
  await registerLocaleMessages(APP_LOCALE_ID, loadMessages);
}

export async function setupStandaloneI18n(app: App) {
  await coreSetup(app, {
    defaultLocale: preferences.app.locale,
    loadMessages,
    missingWarn: !import.meta.env.PROD,
  });
}

export { $t };
