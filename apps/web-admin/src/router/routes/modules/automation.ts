import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:workflow',
      order: 20,
      title: $t('page.automation.title'),
    },
    name: 'Automation',
    path: '/automation',
    redirect: '/automation/workflows',
    children: [
      {
        name: 'AutomationWorkflows',
        path: 'workflows',
        component: () => import('#/views/automation/workflows/index.vue'),
        meta: {
          authority: ['superadmin', 'automa:workflows:read'],
          icon: 'lucide:git-branch',
          plugin: 'automa',
          title: $t('page.automation.workflows'),
        },
      },
      {
        name: 'AutomationRuns',
        path: 'runs',
        component: () => import('#/views/automation/runs/index.vue'),
        meta: {
          authority: ['superadmin', 'automa:campaigns:read'],
          icon: 'lucide:play-circle',
          plugin: 'automa',
          title: $t('page.automation.runs'),
        },
      },
      {
        name: 'AutomationDevices',
        path: 'devices',
        component: () => import('#/views/automation/devices/index.vue'),
        meta: {
          authority: ['superadmin', 'runners:devices:read'],
          icon: 'lucide:laptop',
          plugin: 'runners',
          title: $t('page.automation.devices'),
        },
      },
      {
        name: 'AutomationBrowsers',
        path: 'browsers',
        component: () => import('#/views/automation/browsers/index.vue'),
        meta: {
          authority: ['superadmin', 'runners:browsers:read'],
          icon: 'lucide:globe',
          plugin: 'runners',
          title: $t('page.automation.browsers'),
        },
      },
      {
        name: 'AutomationProxies',
        path: 'proxies',
        component: () => import('#/views/automation/proxies/index.vue'),
        meta: {
          authority: ['superadmin', 'runners:proxies:read'],
          icon: 'lucide:network',
          plugin: 'runners',
          title: $t('page.automation.proxies'),
        },
      },
      {
        name: 'AutomationRunDetail',
        path: 'runs/:id',
        component: () => import('#/views/automation/runs/detail.vue'),
        meta: {
          authority: ['superadmin', 'automa:logs:read'],
          hideInMenu: true,
          icon: 'lucide:file-text',
          plugin: 'automa',
          title: $t('page.automation.runDetail'),
        },
      },
    ],
  },
];

export default routes;
