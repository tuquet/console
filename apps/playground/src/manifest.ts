import type { RouteRecordRaw } from 'vue-router';

/**
 * Manifest definitions for @operon/playground
 */
export const playgroundManifest = {
  id: 'playground',
  name: 'Playground',
  defaultPath: 'overview',
  routes(t: (key: string) => string): RouteRecordRaw[] {
    return [
      {
        name: 'PlaygroundOverview',
        path: 'overview',
        component: () => import('./views/index.vue'),
        meta: {
          authority: ['superadmin', 'local_operator'],
          icon: 'lucide:layers',
          plugin: 'operon',
          title: t('page.playground.overview'),
        },
      },
    ];
  },
};
