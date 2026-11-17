import { DEFAULT_HOME_PATH } from '@operon/constants';
import { defineOverridesPreferences } from '@operon/preferences';

/**
 * @description Project preferences configuration
 * Only override necessary configurations; omitted options will automatically fallback to default values.
 * Note: Clear localStorage / cache if configuration changes do not take effect immediately.
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    defaultHomePath: DEFAULT_HOME_PATH,
    enablePreferences: true,
    enableRefreshToken: true,
    locale: 'en-US',
    loginExpiredMode: 'modal',
    name: 'Operon',
    authPageLayout: 'panel-right',
    layout: 'header-sidebar-nav',
    preferencesButtonPosition: 'none',
  },
  logo: {
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
    width: 230,
  },
  tabbar: {
    enable: true,
  },
  theme: {
    builtinType: 'neutral',
    colorPrimary: 'hsl(0 0% 98%)',
    mode: 'dark',
    radius: '0.5',
  },
  widget: {
    breadcrumbButtonPosition: 'header-left',
    fullscreenButtonPosition: 'none',
    globalSearchButtonPosition: 'header-left',
    lockScreenButtonPosition: 'none',
    logoButtonPosition: 'header-left',
    logoutButtonPosition: 'none',
    refreshButtonPosition: 'none',
    sidebarToggleButtonPosition: 'header-left',
    timezoneButtonPosition: 'none',
    userDropdownButtonPosition: 'none',
    workspaceSelectorButtonPosition: 'sidebar-header',
    languageToggleButtonPosition: 'header-right',
    notificationButtonPosition: 'header-right',
    themeToggleButtonPosition: 'header-right',
    order: [
      'logo',
      'workspaceSelector',
      'sidebarToggle',
      'globalSearch',
      'breadcrumb',
      'notification',
      'themeToggle',
      'languageToggle',
      'logoutBtn',
      'lockScreenBtn',
      'fullscreen',
      'preferences',
      'refresh',
      'timezone',
      'userDropdown',
    ],
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
