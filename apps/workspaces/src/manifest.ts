import type { RouteRecordRaw } from 'vue-router';

import { setupAppLocales } from './locales';

/** Routes are shared by standalone development and the host shell. */
export const workspacesManifest = {
  id: 'workspaces',
  defaultPath: '',
  setupLocales: setupAppLocales,
  routes(t: (key: string) => string): RouteRecordRaw[] {
    return [
      {
        name: 'Workspaces',
        path: '',
        component: () => import('./views/index.vue'),
        meta: {
          authority: ['superadmin', 'workspaces:read'],
          icon: 'lucide:building-2',
          title: t('page.workspaces.title'),
        },
      },
      {
        name: 'WorkspaceDetail',
        path: ':id',
        component: () => import('./views/detail.vue'),
        meta: {
          authority: ['superadmin', 'workspaces:read'],
          hideInMenu: true,
          icon: 'lucide:layout-grid',
          title: t('page.workspaces.detail'),
        },
      },
    ];
  },
};
