import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      hideChildrenInMenu: true,
      icon: 'lucide:layout-dashboard',
      order: -1,
      plugin: 'core-iam',
      title: $t('page.dashboard.title'),
    },
    name: 'Dashboard',
    path: '/dashboard',
    redirect: '/dashboard/analytics',
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
      // Backwards-compatible aliases (hidden in menu)
      {
        name: 'WorkspaceRedirect',
        path: 'workspace',
        redirect: '/tenants',
        meta: {
          hideInMenu: true,
          title: '',
        },
      },
      {
        name: 'WorkspaceDetailRedirect',
        path: 'workspace/:id',
        redirect: (to) => `/tenants/${to.params.id}`,
        meta: {
          hideInMenu: true,
          title: '',
        },
      },
      {
        name: 'FleetRedirect',
        path: 'fleet',
        redirect: '/automation/devices',
        meta: {
          hideInMenu: true,
          title: '',
        },
      },
    ],
  },
];

export default routes;
