import type { RouteRecordRaw } from 'vue-router';

import { createRemoteRoute } from '@operon/kernel';
import { logsManifest } from '@operon/logs';

import { $t } from '#/locales';
import { APP_REGISTRY } from '#/registry/apps';

const appMeta = APP_REGISTRY.logs;

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: ['superadmin', 'local_operator'],
      hideChildrenInMenu: true,
      icon: appMeta?.icon || 'lucide:scroll-text',
      order: appMeta?.order || 25,
      platform: 'all',
      plugin: 'operon',
      title: $t(appMeta?.titleKey || 'page.logs.title'),
    },
    name: 'Logs',
    path: '/logs',
    redirect: `/logs/${logsManifest.defaultPath}`,
    children: createRemoteRoute({
      appId: 'logs',
      devPort: appMeta?.devPort || 5325,
      manifest: logsManifest,
      t: $t,
    }),
  },
];

export default routes;
