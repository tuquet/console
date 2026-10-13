import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:cpu',
      order: 20,
      plugin: 'runners',
      title: $t('page.fleet.title'),
    },
    name: 'Fleet',
    path: '/fleet',
    redirect: '/fleet/devices',
    children: [
      {
        name: 'FleetDevices',
        path: 'devices',
        component: () => import('#/views/fleet/devices/index.vue'),
        meta: {
          authority: ['superadmin', 'runners:devices:read'],
          icon: 'lucide:laptop',
          title: $t('page.fleet.devices'),
        },
      },
      {
        name: 'FleetBrowsers',
        path: 'browsers',
        component: () => import('#/views/fleet/browsers/index.vue'),
        meta: {
          authority: ['superadmin', 'runners:browsers:read'],
          icon: 'lucide:globe',
          title: $t('page.fleet.browsers'),
        },
      },
      {
        name: 'FleetProxies',
        path: 'proxies',
        component: () => import('#/views/fleet/proxies/index.vue'),
        meta: {
          authority: ['superadmin', 'runners:proxies:read'],
          icon: 'lucide:network',
          title: $t('page.fleet.proxies'),
        },
      },
    ],
  },
];

export default routes;
