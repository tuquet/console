import type { RouteRecordRaw } from 'vue-router';

import { createRemoteRoute } from '@operon/kernel';
import { playgroundManifest } from '@operon/playground';

import { $t } from '#/locales';
import { APP_REGISTRY } from '#/registry/apps';

const appMeta = APP_REGISTRY.playground;

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: appMeta?.icon || 'lucide:layers',
      order: appMeta?.order || 50,
      platform: 'all',
      plugin: 'operon',
      title: $t(appMeta?.titleKey || 'page.playground.title'),
    },
    name: 'Playground',
    path: '/playground',
    redirect: `/playground/${playgroundManifest.defaultPath}`,
    children: createRemoteRoute({
      appId: 'playground',
      devPort: appMeta?.devPort || 5324,
      manifest: playgroundManifest,
      t: $t,
    }),
  },
];

export default routes;
