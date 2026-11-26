import type { RouteRecordRaw } from 'vue-router';

import { setupAppLocales } from './locales';

/**
 * Manifest definitions for @operon/logs
 */
export const logsManifest = {
  id: 'logs',
  name: 'Logs',
  defaultPath: 'local-ci',
  setupLocales: setupAppLocales,
  routes(t: (key: string) => string): RouteRecordRaw[] {
    return [
      {
        name: 'LogsLocalCi',
        path: 'local-ci',
        component: () => import('./views/local-ci.vue'),
        meta: {
          authority: ['superadmin', 'local_operator'],
          icon: 'lucide:scroll-text',
          plugin: 'operon',
          title: t('page.logs.local_ci'),
        },
      },
    ];
  },
};
