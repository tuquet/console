import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: ['superadmin', 'local_operator'],
      hideChildrenInMenu: true,
      hideInMenu: true,
      icon: 'lucide:cpu',
      order: 15,
      platform: 'all',
      plugin: 'operon',
      title: $t('page.browserDrivers.title'),
    },
    name: 'BrowserDrivers',
    path: '/browser-drivers',
    redirect: '/browsers/index?panel=drivers',
    children: [
      {
        name: 'BrowserDriversIndex',
        path: 'index',
        redirect: '/browsers/index?panel=drivers',
        meta: {
          authority: ['superadmin', 'local_operator'],
          hideInMenu: true,
          icon: 'lucide:cpu',
          plugin: 'operon',
          title: $t('page.browserDrivers.title'),
        },
      },
    ],
  },
];

export default routes;
