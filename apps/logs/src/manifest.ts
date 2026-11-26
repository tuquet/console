import type { RouteRecordRaw } from 'vue-router';

import { setupAppLocales } from './locales';

/**
 * Manifest definitions for @operon/logs
 */
export const logsManifest = {
  id: 'logs',
  name: 'Logs',
  defaultPath: 'overview',
  setupLocales: setupAppLocales,
  routes(t: (key: string) => string): RouteRecordRaw[] {
    return [
      {
        name: 'LogsOverview',
        path: 'overview',
        component: () => import('./views/index.vue'),
        meta: {
          authority: ['superadmin', 'local_operator'],
          icon: 'lucide:scroll-text',
          plugin: 'operon',
          title: t('page.logs.overview'),
        },
      },
    ];
  },
};
