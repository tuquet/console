import type { RouteRecordRaw } from 'vue-router';

import { createRemoteRoute } from '@operon/kernel';
import { systemManifest } from '@operon/system';

import { $t } from '#/locales';
import { APP_REGISTRY } from '#/registry/apps';

const appMeta = APP_REGISTRY.system;

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: appMeta?.icon || 'lucide:shield-check',
      order: appMeta?.order || 30,
      plugin: 'identity',
      requiresCloud: true,
      title: $t(appMeta?.titleKey || 'page.system.title'),
    },
    name: 'System',
    path: '/system',
    redirect: `/system/${systemManifest.defaultPath}`,
    children: createRemoteRoute({
      appId: 'system',
      devPort: appMeta?.devPort || 5322,
      manifest: systemManifest,
      t: $t,
    }),
  },
];

export default routes;
