import type { RouteRecordRaw } from 'vue-router';

import StarterView from './views/index.vue';

export {
  StarterView as AutomationView,
  StarterView as BrowsersView,
  StarterView,
};

/**
 * Sub-routes declared by the Automation Micro-App.
 */
export const automationRoutes: RouteRecordRaw[] = [
  {
    path: 'starter',
    name: 'AutomationStarter',
    component: StarterView,
    meta: {
      title: 'Automation Starter',
    },
  },
];
