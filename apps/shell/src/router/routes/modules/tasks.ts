import type { RouteRecordRaw } from 'vue-router';

import { tasksManifest } from '@operon/tasks';

import { $t } from '#/locales';

const tasksRoute = tasksManifest
  .routes($t)
  .find((route) => route.name === 'TasksTasks');

const loadTasksComponent = tasksRoute?.component as
  | (() => Promise<unknown>)
  | undefined;

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: ['superadmin', 'local_operator'],
      hideChildrenInMenu: true,
      icon: 'lucide:list-todo',
      order: 20,
      platform: 'all',
      plugin: 'operon',
      title: $t('page.tasks.title'),
    },
    name: 'Tasks',
    path: '/tasks',
    redirect: '/tasks/index',
    children: [
      {
        name: 'TasksIndex',
        path: 'index',
        component: loadTasksComponent
          ? async () => {
              const [component] = await Promise.all([
                loadTasksComponent(),
                tasksManifest.setupLocales(),
              ]);
              return component;
            }
          : () => import('#/views/_core/fallback/not-found.vue'),
        meta: {
          authority: ['superadmin', 'local_operator'],
          icon: 'lucide:list-todo',
          plugin: 'operon',
          title: $t('page.tasks.title'),
        },
      },
    ],
  },
];

export default routes;
