import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:shopping-bag',
      order: 25,
      platform: 'web',
      plugin: 'store',
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
          authority: ['superadmin', 'store:read'],
          icon: 'lucide:store',
          platform: 'web',
          plugin: 'store',
          title: $t('page.commerce.store'),
        },
      },
      {
        name: 'CommerceOrders',
        path: 'orders',
        component: () => import('#/views/commerce/orders/index.vue'),
        meta: {
          authority: ['superadmin', 'store:read'],
          icon: 'lucide:package-check',
          platform: 'web',
          plugin: 'store',
          title: $t('page.commerce.orders'),
        },
      },
      {
        name: 'CommerceAdmin',
        path: 'admin',
        component: () => import('#/views/commerce/admin/index.vue'),
        meta: {
          authority: ['superadmin', 'store:manage'],
          icon: 'lucide:sliders-horizontal',
          platform: 'web',
          plugin: 'store',
          title: $t('page.commerce.admin'),
        },
      },
    ],
  },
];

export default routes;
