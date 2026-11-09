import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';

import { createMockKernel, KERNEL_INJECTION_KEY } from '@operon/kernel';
import { initPreferences } from '@operon/preferences';
import '@operon/styles';

import { createPinia } from 'pinia';

import StarterView from './views/index.vue';

export async function bootstrap(namespace = 'operon-automation-dev') {
  await initPreferences({
    namespace,
  });

  const app = createApp(StarterView);
  const pinia = createPinia();
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/',
        component: StarterView,
      },
    ],
  });

  // Standalone dev mock kernel
  const mockKernel = createMockKernel();
  app.provide(KERNEL_INJECTION_KEY, mockKernel);

  app.use(pinia);
  app.use(router);
  app.mount('#app');
}
