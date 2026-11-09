import type { KernelContext } from './types';

/**
 * Creates a mock Kernel Context for standalone micro-app development and testing.
 */
export function createMockKernel(
  overrides?: Partial<KernelContext>,
): KernelContext {
  const defaultDaemonPort = 8765;

  return {
    auth: {
      accessToken: null,
      hasCloudAuth: false,
      userId: 'local-operator',
      tenantId: null,
      roles: ['local_operator'],
      isSuperadmin: false,
      username: 'operator',
      ...overrides?.auth,
    },
    api: {
      daemonPort: defaultDaemonPort,
      supabaseRequest: async <T = any>(path: string) => {
        console.warn(
          `[MockKernel] supabaseRequest called on path "${path}" without active cloud auth.`,
        );
        return [] as unknown as T;
      },
      localDaemonFetch: async <T = any>(
        endpoint: string,
        options?: RequestInit,
      ) => {
        const url = endpoint.startsWith('http')
          ? endpoint
          : `http://127.0.0.1:${defaultDaemonPort}${endpoint}`;
        const res = await fetch(url, options);
        if (!res.ok) {
          throw new Error(`Local daemon responded with HTTP ${res.status}`);
        }
        return (await res.json()) as T;
      },
      ...overrides?.api,
    },
    events: {
      notify: (type, message) => {
        console.warn(
          `[MockKernel Notification - ${type.toUpperCase()}]: ${message}`,
        );
      },
      openLoginModal: () => {
        console.warn('[MockKernel] openLoginModal requested.');
      },
      navigate: (path) => {
        console.warn(`[MockKernel Navigate]: ${path}`);
      },
      ...overrides?.events,
    },
  };
}
