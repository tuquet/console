import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:workflow',
      order: 20,
      platform: 'all',
      plugin: 'operon',
      title: $t('page.automation.title'),
    },
    name: 'Automation',
    path: '/automation',
    redirect: '/automation/overview',
    children: [
      {
        name: 'AutomationOverview',
        path: 'overview',
        component: () => import('#/views/automation/overview/index.vue'),
        meta: {
          authority: [
            'superadmin',
            'local_operator',
            'operon:workflows:read',
            'operon:jobs:read',
            'operon:devices:read',
            'operon:browser_profiles:read',
            'operon:proxies:read',
          ],
          icon: 'lucide:activity',
          plugin: 'operon',
          title: $t('page.automation.overview'),
        },
      },
      {
        name: 'AutomationBrowsers',
        path: 'browsers',
        component: () => import('#/views/automation/browsers/index.vue'),
        meta: {
          authority: [
            'superadmin',
            'local_operator',
            'operon:browser_profiles:read',
          ],
          icon: 'lucide:globe',
          plugin: 'operon',
          title: $t('page.automation.browsers'),
        },
      },
      // },
      // {
      //   name: 'AutomationWorkflows',
      //   path: 'workflows',
      //   component: () => import('#/views/automation/workflows/index.vue'),
      //   meta: {
      //     authority: ['superadmin', 'local_operator', 'operon:workflows:read'],
      //     icon: 'lucide:git-branch',
      //     plugin: 'operon',
      //     title: $t('page.automation.workflows'),
      //   },
      // },
      // {
      //   name: 'AutomationJobs',
      //   path: 'jobs',
      //   component: () => import('#/views/automation/jobs/index.vue'),
      //   meta: {
      //     authority: ['superadmin', 'local_operator', 'operon:jobs:read'],
      //     icon: 'lucide:play-circle',
      //     plugin: 'operon',
      //     title: $t('page.automation.jobs'),
      //   },
      // },
      // {
      //   name: 'AutomationDevices',
      //   path: 'devices',
      //   component: () => import('#/views/automation/devices/index.vue'),
      //   meta: {
      //     authority: ['superadmin', 'local_operator', 'operon:devices:read'],
      //     icon: 'lucide:laptop',
      //     plugin: 'operon',
      //     title: $t('page.automation.devices'),
      //   },
      // },
      // {
      //   name: 'AutomationProxies',
      //   path: 'proxies',
      //   component: () => import('#/views/automation/proxies/index.vue'),
      //   meta: {
      //     authority: ['superadmin', 'local_operator', 'operon:proxies:read'],
      //     icon: 'lucide:network',
      //     plugin: 'operon',
      //     title: $t('page.automation.proxies'),
      //   },
      // },
      // {
      //   name: 'AutomationJobDetail',
      //   path: 'jobs/:id',
      //   component: () => import('#/views/automation/jobs/detail.vue'),
      //   meta: {
      //     authority: ['superadmin', 'local_operator', 'operon:jobs:read'],
      //     hideInMenu: true,
      //     icon: 'lucide:file-text',
      //     plugin: 'operon',
      //     title: $t('page.automation.jobDetail'),
      //   },
      // },
    ],
  },
];

export default routes;
