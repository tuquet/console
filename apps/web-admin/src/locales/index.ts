import type { App } from 'vue';

import type { LocaleSetupOptions, SupportedLanguagesType } from '@tuquet/locales';

import {
  $t,
  setupI18n as coreSetup,
  loadLocalesMapFromDir,
} from '@tuquet/locales';
import { preferences } from '@tuquet/preferences';

import dayjs from 'dayjs';

const modules = import.meta.glob('./langs/**/*.json');

const localesMap = loadLocalesMapFromDir(
  /\.\/langs\/([^/]+)\/(.*)\.json$/,
  modules,
);

/**
 * Load application-specific locale messages
 * Can also be adapted to fetch translation data from backend
 * @param lang
 */
async function loadMessages(lang: SupportedLanguagesType) {
  const [appLocaleMessages] = await Promise.all([
    localesMap[lang]?.(),
    loadThirdPartyMessage(lang),
  ]);
  return appLocaleMessages?.default;
}

/**
 * Load third-party component library locale messages
 * @param lang
 */
async function loadThirdPartyMessage(lang: SupportedLanguagesType) {
  await loadDayjsLocale(lang);
}

/**
 * Load Day.js locale
 * @param lang
 */
async function loadDayjsLocale(lang: SupportedLanguagesType) {
  const locale =
    lang === 'vi-VN'
      ? await import('dayjs/locale/vi')
      : await import('dayjs/locale/en');
  if (locale) {
    dayjs.locale(locale);
  }
}

async function setupI18n(app: App, options: LocaleSetupOptions = {}) {
  await coreSetup(app, {
    defaultLocale: preferences.app.locale,
    loadMessages,
    missingWarn: !import.meta.env.PROD,
    ...options,
  });
}

export { $t, setupI18n };
