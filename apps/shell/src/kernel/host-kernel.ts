import type { Router } from 'vue-router';

import type { KernelContext } from '@operon/kernel';

import { reactive } from 'vue';

import { useAccessStore, useUserStore } from '@operon/stores';

import { toast } from '@operon-core/shadcn-ui';

import { getActiveTenantId, hasCloudAuth, supabaseRequest } from '#/api';

/**
 * Creates the real Host Kernel Context wired into Workstation's runtime.
 */
export function createHostKernel(router?: Router): KernelContext {
  const accessStore = useAccessStore();
  const userStore = useUserStore();

  const auth = reactive({
    get accessToken() {
      return accessStore.accessToken || null;
    },
    get hasCloudAuth() {
      return hasCloudAuth();
    },
    get isSuperadmin() {
      return userStore.userRoles?.includes('superadmin') ?? false;
    },
    get roles() {
      return userStore.userRoles?.length
        ? userStore.userRoles
        : ['local_operator'];
    },
    get tenantId() {
      return getActiveTenantId() || null;
    },
    get userId() {
      return userStore.userInfo?.userId || 'local-operator';
    },
    get username() {
      return userStore.userInfo?.username || 'operator';
    },
  });

  const daemonPort = 8765;

  const api = {
    daemonPort,
    localDaemonFetch: async <T = any>(
      endpoint: string,
      options?: RequestInit,
    ) => {
      const url = endpoint.startsWith('http')
        ? endpoint
        : `http://127.0.0.1:${daemonPort}${endpoint}`;
      const res = await fetch(url, options);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || `Local daemon error: ${res.status}`);
      }
      return (await res.json()) as T;
    },
    supabaseRequest,
  };

  const events = {
    navigate: (path: string) => {
      if (router) {
        void router.push(path);
      }
    },
    notify: (
      type: 'error' | 'info' | 'success' | 'warning',
      message: string,
    ) => {
      switch (type) {
        case 'error': {
          toast.error(message);
          break;
        }
        case 'info': {
          toast.info(message);
          break;
        }
        case 'success': {
          toast.success(message);
          break;
        }
        case 'warning': {
          toast.warning(message);
          break;
        }
      }
    },
    openLoginModal: () => {
      accessStore.setLoginExpired(true);
    },
  };

  return {
    api,
    auth,
    events,
  };
}
