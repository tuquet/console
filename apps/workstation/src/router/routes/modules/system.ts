import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:shield-check',
      order: 30,
      plugin: 'identity',
      requiresCloud: true,
      title: $t('page.system.title'),
    },
    name: 'System',
    path: '/system',
    redirect: '/system/overview',
    children: [
      {
        name: 'SystemOverview',
        path: 'overview',
        component: () => import('#/views/system/overview/index.vue'),
        meta: {
          authority: ['superadmin', 'plugins:read', 'licensing:read'],
          icon: 'lucide:activity',
          plugin: ['identity', 'licensing'],
          title: $t('page.system.overview'),
        },
      },
      {
        name: 'SystemPlugins',
        path: 'plugins',
        component: () => import('#/views/system/plugins/index.vue'),
        meta: {
          authority: ['superadmin', 'plugins:read'],
          icon: 'lucide:puzzle',
          plugin: 'identity',
          title: $t('page.system.plugins'),
        },
      },
      {
        name: 'SystemPlans',
        path: 'plans',
        component: () => import('#/views/system/plans/index.vue'),
        meta: {
          authority: ['superadmin', 'licensing:read'],
          icon: 'lucide:credit-card',
          plugin: 'licensing',
          title: $t('page.system.plans'),
        },
      },
      {
        name: 'SystemUsers',
        path: 'users',
        component: () => import('#/views/system/users/index.vue'),
        meta: {
          authority: ['superadmin'],
          icon: 'lucide:users',
          plugin: 'identity',
          title: $t('page.system.users'),
        },
      },
      {
        name: 'SystemAuditLogs',
        path: 'audit-logs',
        component: () => import('#/views/system/audit-logs/index.vue'),
        meta: {
          authority: ['superadmin'],
          icon: 'lucide:scroll-text',
          plugin: 'identity',
          title: $t('page.system.auditLogs'),
        },
      },
      {
        name: 'SystemSubscriptions',
        path: 'subscriptions',
        component: () => import('#/views/system/subscriptions/index.vue'),
        meta: {
          authority: ['superadmin'],
          icon: 'lucide:receipt',
          plugin: 'licensing',
          title: $t('page.system.subscriptions'),
        },
      },
      {
        name: 'SystemRoles',
        path: 'roles',
        component: () => import('#/views/system/roles/index.vue'),
        meta: {
          authority: ['superadmin'],
          icon: 'lucide:key-round',
          plugin: 'identity',
          title: $t('page.system.roles'),
        },
      },
    ],
  },
];

export default routes;
