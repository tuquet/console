import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: ['superadmin', 'licensing:read', 'store:read'],
      hideChildrenInMenu: true,
      icon: 'lucide:wallet',
      order: 26,
      platform: 'web',
      plugin: 'licensing',
      title: $t('page.commerce.wallet'),
    },
    name: 'WalletRoot',
    path: '/wallet',
    redirect: '/wallet',
    children: [
      {
        name: 'CommerceWallet',
        path: '',
        alias: '/commerce/wallet',
        component: () => import('#/views/commerce/wallet/index.vue'),
        meta: {
          authority: ['superadmin', 'licensing:read', 'store:read'],
          icon: 'lucide:wallet',
          title: $t('page.commerce.wallet'),
        },
      },
    ],
  },
];

export default routes;
