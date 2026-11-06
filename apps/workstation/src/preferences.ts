import { defineOverridesPreferences } from '@operon/preferences';

import { isDesktop } from '#/utils/platform';

/**
 * @description Project preferences configuration
 * Only override necessary configurations; omitted options will automatically fallback to default values.
 * Note: Clear localStorage / cache if configuration changes do not take effect immediately.
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    defaultHomePath: isDesktop()
      ? '/automation/overview'
      : '/dashboard/analytics',
    enablePreferences: true,
    enableRefreshToken: true,
    locale: 'en-US',
    loginExpiredMode: isDesktop() ? 'modal' : 'page',
    name: 'Operon',
    authPageLayout: 'panel-right',
    layout: 'header-sidebar-nav',
    preferencesButtonPosition: 'user-dropdown',
  },
  logo: {
    enable: true,
    showText: false,
    fit: 'contain',
    source: '/logo.svg',
    sourceDark: '/logo.svg',
  },
  breadcrumb: {
    enable: true,
    showIcon: false,
  },
  copyright: {
    companyName: 'operon',
    companySiteLink: 'https://operon.com',
    date: '2026',
    enable: true,
    icp: '',
    icpLink: '',
    settingShow: true,
  },
  footer: {
    enable: false,
    fixed: true,
  },
  sidebar: {
    collapsed: false,
    width: 210,
  },
  tabbar: {
    enable: false,
  },
  theme: {
    builtinType: 'neutral',
    colorPrimary: 'hsl(0 0% 98%)',
    mode: 'dark',
    radius: '0.5',
  },
  widget: {
    fullscreenButtonPosition: 'none',
    globalSearchButtonPosition: 'header',
    languageToggleButtonPosition: 'header',
    lockScreenButtonPosition: 'none',
    notificationButtonPosition: 'header',
    refreshButtonPosition: 'none',
    themeToggleButtonPosition: 'header',
    timezoneButtonPosition: 'none',
    logoutButtonPosition: 'none',
  },
});

export interface AdminCustomPreferences {
  fontFamily: 'inter' | 'roboto' | 'system-ui';
}

export const typographyPreferencesExtension = {
  fields: [
    {
      component: 'select' as const,
      defaultValue: 'inter',
      key: 'fontFamily',
      label: 'preferences.typography.fontFamily',
      options: [
        {
          label: 'preferences.typography.inter',
          value: 'inter',
        },
        {
          label: 'preferences.typography.roboto',
          value: 'roboto',
        },
        {
          label: 'preferences.typography.systemUi',
          value: 'system-ui',
        },
      ],
      tip: 'preferences.typography.fontFamilyTip',
    },
  ],
  tabLabel: 'preferences.typography.title',
  title: 'preferences.typography.title',
};
