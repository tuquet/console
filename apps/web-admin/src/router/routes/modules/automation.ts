import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:workflow',
      order: 30,
      plugin: 'automa',
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
          title: $t('page.automation.runs'),
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
          title: $t('page.automation.runDetail'),
        },
      },
    ],
  },
];

export default routes;
