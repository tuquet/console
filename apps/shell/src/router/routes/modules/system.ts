import type { RouteRecordRaw } from 'vue-router';

import { systemManifest } from '@operon/system';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:shield-check',
      order: 30,
      plugin: 'identity',
      requiresCloud: true,
      title: $t('page.system.title'),
    },
    name: 'System',
    path: '/system',
    redirect: `/system/${systemManifest.defaultPath}`,
    children: systemManifest.routes($t),
  },
];

export default routes;
