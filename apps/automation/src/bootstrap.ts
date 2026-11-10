import { createApp, h } from 'vue';
import { createRouter, createWebHistory, RouterView } from 'vue-router';

import { createMockKernel, KERNEL_INJECTION_KEY } from '@operon/kernel';
import { initPreferences } from '@operon/preferences';
import '@operon/styles';

import { createPinia } from 'pinia';

import { automationManifest } from './manifest';

export async function bootstrap(namespace = 'operon-automation-dev') {
  await initPreferences({
    namespace,
  });

  const app = createApp({ render: () => h(RouterView) });
  const pinia = createPinia();
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/',
        component: { render: () => h(RouterView) },
        redirect: `/${automationManifest.defaultPath}`,
        children: automationManifest.routes((key) => key),
      },
    ],
  });

  // Standalone dev mock kernel
  const mockKernel = createMockKernel();
  app.provide(KERNEL_INJECTION_KEY, mockKernel);

  app.use(pinia);
  app.use(router);
  await router.isReady();
  app.mount('#app');
}
