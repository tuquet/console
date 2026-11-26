import type { RouteRecordRaw } from 'vue-router';

import { automationManifest } from '@operon/automation';

import { $t } from '#/locales';

const browsersRoute = automationManifest
  .routes($t)
  .find((route) => route.name === 'AutomationBrowsers');

const loadBrowsersComponent = browsersRoute?.component as
  | (() => Promise<unknown>)
  | undefined;

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: ['superadmin', 'local_operator'],
      hideChildrenInMenu: true,
      icon: 'lucide:radar',
      order: 10,
      platform: 'all',
      plugin: 'operon',
      title: $t('page.browserCenter.title'),
    },
    name: 'BrowserCenter',
    path: '/browsers',
    redirect: '/browsers/index',
    children: [
      {
        name: 'BrowserCenterIndex',
        path: 'index',
        component: loadBrowsersComponent
          ? async () => {
              const [component] = await Promise.all([
                loadBrowsersComponent(),
                automationManifest.setupLocales(),
              ]);
              return component;
            }
          : () => import('#/views/_core/fallback/not-found.vue'),
        meta: {
          authority: ['superadmin', 'local_operator'],
          icon: 'lucide:radar',
          plugin: 'operon',
          title: $t('page.browserCenter.title'),
        },
      },
    ],
  },
];

export default routes;
