import type { RouteRecordRaw } from 'vue-router';

import TenantDetailView from './views/detail.vue';
import TenantsView from './views/index.vue';

export { TenantsView as StarterView, TenantDetailView, TenantsView };

/**
 * Sub-routes declared by the Tenants Micro-App.
 */
export const tenantsRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'TenantsStarter',
    component: TenantsView,
    meta: {
      title: 'Workspaces',
    },
  },
  {
    path: ':id',
    name: 'TenantDetailStarter',
    component: TenantDetailView,
    meta: {
      title: 'Workspace Detail',
    },
  },
];
