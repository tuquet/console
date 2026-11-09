import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:workflow',
      order: 20,
      platform: 'all',
      plugin: 'operon',
      title: $t('page.automation.title'),
    },
    name: 'Automation',
    path: '/automation',
    redirect: '/automation/overview',
    children: [
      {
        name: 'AutomationOverview',
        path: 'overview',
        component: () =>
          import('@operon/automation').then((m) => m.AutomationView),
        meta: {
          authority: ['superadmin', 'local_operator'],
          icon: 'lucide:activity',
          plugin: 'operon',
          title: $t('page.automation.overview'),
        },
      },
      {
        name: 'AutomationBrowsers',
        path: 'browsers',
        component: () =>
          import('@operon/automation').then((m) => m.BrowsersView),
        meta: {
          authority: ['superadmin', 'local_operator'],
          icon: 'lucide:globe',
          plugin: 'operon',
          title: $t('page.automation.browsers'),
        },
      },
    ],
  },
];

export default routes;
