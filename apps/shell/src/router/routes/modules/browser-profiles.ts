import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: ['superadmin', 'local_operator'],
      hideChildrenInMenu: true,
      hideInMenu: true,
      icon: 'lucide:globe',
      order: 10,
      platform: 'all',
      plugin: 'operon',
      title: $t('page.browserProfiles.title'),
    },
    name: 'BrowserProfiles',
    path: '/browser-profiles',
    redirect: '/browsers/index',
    children: [
      {
        name: 'BrowserProfilesIndex',
        path: 'index',
        redirect: '/browsers/index',
        meta: {
          authority: ['superadmin', 'local_operator'],
          hideInMenu: true,
          icon: 'lucide:globe',
          plugin: 'operon',
          title: $t('page.browserProfiles.title'),
        },
      },
    ],
  },
];

export default routes;
