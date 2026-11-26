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
      icon: 'lucide:globe',
      order: 10,
      platform: 'all',
      plugin: 'operon',
      title: $t('page.browsers.title'),
    },
    name: 'Browsers',
    path: '/browsers',
    redirect: '/browsers/index',
    children: [
      {
        name: 'BrowsersIndex',
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
          icon: 'lucide:globe',
          plugin: 'operon',
          title: $t('page.browsers.title'),
        },
      },
    ],
  },
];

export default routes;
