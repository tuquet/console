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
        component: () =>
          import('@operon/system').then((m) => m.SystemOverviewView),
        meta: {
          authority: ['superadmin', 'plugins:read'],
          icon: 'lucide:activity',
          plugin: 'identity',
          title: $t('page.system.overview'),
        },
      },
      {
        name: 'SystemPlugins',
        path: 'plugins',
        component: () =>
          import('@operon/system').then((m) => m.SystemPluginsView),
        meta: {
          authority: ['superadmin', 'plugins:read'],
          icon: 'lucide:puzzle',
          plugin: 'identity',
          title: $t('page.system.plugins'),
        },
      },
      {
        name: 'SystemUsers',
        path: 'users',
        component: () =>
          import('@operon/system').then((m) => m.SystemUsersView),
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
        component: () =>
          import('@operon/system').then((m) => m.SystemAuditLogsView),
        meta: {
          authority: ['superadmin'],
          icon: 'lucide:scroll-text',
          plugin: 'identity',
          title: $t('page.system.auditLogs'),
        },
      },
      {
        name: 'SystemRoles',
        path: 'roles',
        component: () =>
          import('@operon/system').then((m) => m.SystemRolesView),
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
