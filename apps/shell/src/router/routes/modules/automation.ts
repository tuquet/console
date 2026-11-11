import type { RouteRecordRaw } from 'vue-router';

import { automationManifest } from '@operon/automation';
import { createRemoteRoute } from '@operon/kernel';

import { $t } from '#/locales';
import { APP_REGISTRY } from '#/registry/apps';

const appMeta = APP_REGISTRY.automation;

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: appMeta?.icon || 'lucide:workflow',
      order: appMeta?.order || 20,
      platform: 'all',
      plugin: 'operon',
      title: $t(appMeta?.titleKey || 'page.automation.title'),
    },
    name: 'Automation',
    path: '/automation',
    redirect: `/automation/${automationManifest.defaultPath}`,
    children: createRemoteRoute({
      appId: 'automation',
      devPort: appMeta?.devPort || 5321,
      manifest: automationManifest,
      t: $t,
    }),
  },
];

export default routes;
