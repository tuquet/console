import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:shopping-bag',
      order: 25,
      title: $t('page.commerce.title'),
    },
    name: 'Commerce',
    path: '/commerce',
    redirect: '/commerce/store',
    children: [
      {
        name: 'CommerceStore',
        path: 'store',
        component: () => import('#/views/commerce/store/index.vue'),
        meta: {
          authority: ['superadmin', 'commerce:read'],
          icon: 'lucide:store',
          plugin: 'commerce',
          title: $t('page.commerce.store'),
        },
      },
      {
        name: 'CommerceOrders',
        path: 'orders',
        component: () => import('#/views/commerce/orders/index.vue'),
        meta: {
          authority: ['superadmin', 'commerce:read'],
          icon: 'lucide:package-check',
          plugin: 'commerce',
          title: $t('page.commerce.orders'),
        },
      },
      {
        name: 'CommerceWallet',
        path: 'wallet',
        component: () => import('#/views/commerce/wallet/index.vue'),
        meta: {
          authority: ['superadmin', 'subscriptions:read', 'commerce:read'],
          icon: 'lucide:wallet',
          plugin: 'subscriptions',
          title: $t('page.commerce.wallet'),
        },
      },
      {
        name: 'CommerceAdmin',
        path: 'admin',
        component: () => import('#/views/commerce/admin/index.vue'),
        meta: {
          authority: ['superadmin', 'commerce:manage'],
          icon: 'lucide:sliders-horizontal',
          plugin: 'commerce',
          title: $t('page.commerce.admin'),
        },
      },
    ],
  },
];

export default routes;
