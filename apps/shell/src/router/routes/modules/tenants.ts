import type { RouteRecordRaw } from 'vue-router';

import { tenantsManifest } from '@operon/tenants';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: ['superadmin', 'tenants:read'],
      hideChildrenInMenu: true,
      icon: 'lucide:building-2',
      order: 10,
      platform: 'web',
      plugin: 'identity',
      title: $t('page.tenants.title'),
    },
    name: 'TenantsRoot',
    path: '/tenants',
    children: tenantsManifest.routes($t),
  },
];

export default routes;
