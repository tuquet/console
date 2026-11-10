import type { RouteRecordRaw } from 'vue-router';

import { automationManifest } from '@operon/automation';

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
    redirect: `/automation/${automationManifest.defaultPath}`,
    children: automationManifest.routes($t),
  },
];

export default routes;
