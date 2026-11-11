import type { RouteRecordRaw } from 'vue-router';

import { createRemoteRoute } from '@operon/kernel';
import { tenantsManifest } from '@operon/tenants';

import { $t } from '#/locales';
import { APP_REGISTRY } from '#/registry/apps';

const appMeta = APP_REGISTRY.tenants;

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: ['superadmin', 'tenants:read'],
      hideChildrenInMenu: true,
      icon: appMeta?.icon || 'lucide:building-2',
      order: appMeta?.order || 10,
      platform: 'web',
      plugin: 'identity',
      title: $t(appMeta?.titleKey || 'page.tenants.title'),
    },
    name: 'TenantsRoot',
    path: '/tenants',
    children: createRemoteRoute({
      appId: 'tenants',
      devPort: appMeta?.devPort || 5323,
      manifest: tenantsManifest,
      t: $t,
    }),
  },
];

export default routes;
