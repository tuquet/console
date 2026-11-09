import type { RouteRecordRaw } from 'vue-router';

import StarterView from './views/index.vue';

export {
  StarterView,
  StarterView as SystemAuditLogsView,
  StarterView as SystemOverviewView,
  StarterView as SystemPluginsView,
  StarterView as SystemRolesView,
  StarterView as SystemUsersView,
  StarterView as SystemView,
};

/**
 * Sub-routes declared by the System Micro-App.
 */
export const systemRoutes: RouteRecordRaw[] = [
  {
    path: 'starter',
    name: 'SystemStarter',
    component: StarterView,
    meta: {
      title: 'System Starter',
    },
  },
];
