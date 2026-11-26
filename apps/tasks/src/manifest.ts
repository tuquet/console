import type { RouteRecordRaw } from 'vue-router';

import { setupAppLocales } from './locales';

/**
 * Manifest definitions for @operon/tasks
 */
export const tasksManifest = {
  id: 'tasks',
  name: 'Tasks',
  defaultPath: 'overview',
  setupLocales: setupAppLocales,
  routes(t: (key: string) => string): RouteRecordRaw[] {
    return [
      {
        name: 'TasksOverview',
        path: 'overview',
        component: () => import('./views/overview.vue'),
        meta: {
          authority: ['superadmin', 'local_operator'],
          icon: 'lucide:layers',
          plugin: 'operon',
          title: t('page.tasks.overview'),
        },
      },
      {
        name: 'TasksTasks',
        path: 'tasks',
        component: () => import('./views/index.vue'),
        meta: {
          authority: ['superadmin', 'local_operator'],
          icon: 'lucide:list-todo',
          plugin: 'operon',
          title: t('page.tasks.tasks'),
        },
      },
    ];
  },
};
