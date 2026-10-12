import {
  defineOverridesPreferences,
  definePreferencesExtension,
} from '@vben/preferences';

interface WebAdminPreferencesExtension {
  defaultTableSize: number;
  enableFormFullscreen: boolean;
  reportTitle: string;
  tenantMode: 'multi' | 'single';
}

/**
 * @description Project preferences configuration
 * Only override necessary configurations; omitted options will automatically fallback to default values.
 * Note: Clear localStorage / cache if configuration changes do not take effect immediately.
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    defaultHomePath: '/dashboard/workspace',
    enablePreferences: true,
    locale: 'en-US',
    name: 'Specter',
    preferencesButtonPosition: 'auto',
    authPageLayout: 'panel-right',
  },
  logo: {
    enable: true,
    fit: 'contain',
    source: '/logo.svg',
    sourceDark: '/logo.svg',
  },
  breadcrumb: {
    enable: true,
  },
  copyright: {
    companyName: 'tuquet',
    companySiteLink: 'https://tuquet.com',
    date: '2026',
    enable: false,
    icp: '',
    icpLink: '',
    settingShow: false,
  },
  footer: {
    enable: false,
  },
  sidebar: {
    collapsed: false,
    width: 210,
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
    fullscreen: true,
    globalSearch: true,
    languageToggle: false,
    lockScreen: true,
    logoutButtonPosition: 'user-dropdown',
    notification: true,
    refresh: true,
    sidebarToggle: true,
    themeToggle: true,
    timezone: false,
  },
});

export const preferencesExtension =
  definePreferencesExtension<WebAdminPreferencesExtension>({
    tabLabel: 'preferences.admin.tabLabel',
    title: 'preferences.admin.title',
    fields: [
      {
        component: 'switch',
        defaultValue: true,
        key: 'enableFormFullscreen',
        label: 'preferences.admin.fields.enableFormFullscreen.label',
        tip: 'preferences.admin.fields.enableFormFullscreen.tip',
      },
      {
        component: 'select',
        defaultValue: 'single',
        key: 'tenantMode',
        label: 'preferences.admin.fields.tenantMode.label',
        options: [
          {
            label: 'preferences.admin.fields.tenantMode.options.single.label',
            value: 'single',
          },
          {
            label: 'preferences.admin.fields.tenantMode.options.multi.label',
            value: 'multi',
          },
        ],
      },
      {
        component: 'number',
        componentProps: {
          max: 200,
          min: 10,
          step: 10,
        },
        defaultValue: 20,
        key: 'defaultTableSize',
        label: 'preferences.admin.fields.defaultTableSize.label',
      },
      {
        component: 'input',
        defaultValue: '',
        key: 'reportTitle',
        label: 'preferences.admin.fields.reportTitle.label',
        placeholder: 'preferences.admin.fields.reportTitle.placeholder',
      },
    ],
  });
