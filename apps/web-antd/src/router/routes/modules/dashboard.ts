import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:layout-dashboard',
      order: -1,
      title: $t('page.dashboard.title'),
    },
    name: 'Dashboard',
    path: '/dashboard',
    redirect: '/dashboard/workspace',
    children: [
      {
        name: 'Analytics',
        path: 'analytics',
        component: () => import('#/views/dashboard/analytics/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:area-chart',
          title: $t('page.dashboard.analytics'),
        },
      },
      {
        name: 'Workspace',
        path: 'workspace',
        component: () => import('#/views/dashboard/workspace/index.vue'),
        meta: {
          icon: 'lucide:layers',
          title: $t('page.dashboard.workspace'),
        },
      },
      {
        name: 'Fleet',
        path: 'fleet',
        component: () => import('#/views/dashboard/fleet/index.vue'),
        meta: {
          icon: 'lucide:laptop',
          title: $t('page.dashboard.fleet'),
        },
      },
      {
        name: 'WorkspaceDetail',
        path: 'workspace/:id',
        component: () => import('#/views/dashboard/workspace/detail.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:layout-grid',
          title: $t('page.dashboard.workspaceDetail'),
        },
      },
    ],
  },
];

export default routes;
