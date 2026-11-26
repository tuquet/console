import { createApp, h } from 'vue';
import { createRouter, createWebHistory, RouterView } from 'vue-router';

import { createMockKernel, KERNEL_INJECTION_KEY } from '@operon/kernel';
import { initPreferences } from '@operon/preferences';
import '@operon/styles';

import { createPinia } from 'pinia';

import { $t, setupStandaloneI18n } from './locales';
import { logsManifest } from './manifest';

export async function bootstrap(namespace = 'operon-logs-dev') {
  await initPreferences({
    namespace,
  });

  const app = createApp({ render: () => h(RouterView) });
  await setupStandaloneI18n(app);

  const pinia = createPinia();
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/',
        component: { render: () => h(RouterView) },
        redirect: `/${logsManifest.defaultPath}`,
        children: logsManifest.routes($t),
      },
    ],
  });

  const fallbackKernel = createMockKernel();
  const mockKernel = createMockKernel({
    api: {
      ...fallbackKernel.api,
      localDaemonFetch: async <T = unknown>(
        endpoint: string,
        options?: RequestInit,
      ) => {
        if (endpoint === '/api/v1/system/ci-logs') {
          const res = await fetch('/__local-ci/logs', options);
          if (!res.ok) {
            throw new Error(`Standalone CI logs error: HTTP ${res.status}`);
          }
          return (await res.json()) as T;
        }
        if (endpoint === '/api/v1/system/ci-run') {
          const res = await fetch('/__local-ci/run', options);
          const payload = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          if (!res.ok) {
            throw new Error(
              payload.error || `Standalone CI runner error: HTTP ${res.status}`,
            );
          }
          return payload as T;
        }
        return fallbackKernel.api.localDaemonFetch<T>(endpoint, options);
      },
    },
  });
  app.provide(KERNEL_INJECTION_KEY, mockKernel);

  app.use(pinia);
  app.use(router);
  await router.isReady();
  app.mount('#app');
}
