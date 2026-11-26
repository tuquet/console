import type { Router } from 'vue-router';

import type { KernelContext, KernelWorkspaceRecord } from '@operon/kernel';

import type { Workspace } from '#/api/core/workspace';

import { reactive } from 'vue';

import { KernelApiError } from '@operon/kernel';
import { useAccessStore, useUserStore } from '@operon/stores';

import { toast } from '@operon-core/shadcn-ui';

import { getActiveWorkspaceId, hasCloudAuth, supabaseRequest } from '#/api';
import { useNotificationStore } from '#/store/notification';
import { useWorkspaceStore } from '#/store/workspace';

const DEFAULT_LOCAL_WORKSPACE_ID = 'local-default';

/**
 * Creates the real Host Kernel Context wired into Desktop's runtime.
 */
export function createHostKernel(router?: Router): KernelContext {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const notificationStore = useNotificationStore();
  const workspaceStore = useWorkspaceStore();

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
    get workspaceId() {
      return workspaceStore.activeWorkspaceId || getActiveWorkspaceId() || null;
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
    localDaemonFetch: async <T = unknown>(
      endpoint: string,
      options?: RequestInit,
    ) => {
      const url = endpoint.startsWith('http')
        ? endpoint
        : `http://127.0.0.1:${daemonPort}${endpoint}`;
      const res = await fetch(url, options);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new KernelApiError(
          err?.message || `Local daemon error: ${res.status}`,
          res.status,
        );
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

  const notifications = {
    getPermission: () => notificationStore.getPermission(),
    get platform() {
      return notificationStore.platform;
    },
    push: async (payload: Parameters<typeof notificationStore.push>[0]) => {
      await notificationStore.push(payload);
    },
    requestPermission: () => notificationStore.requestPermission(),
  };

  function mapWorkspaceToKernelRecord(t: Workspace): KernelWorkspaceRecord {
    return {
      avatarUrl: t.avatar_url ?? null,
      createdAt: t.created_at,
      createdBy: t.created_by ?? null,
      id: t.id,
      metadata: t.metadata,
      name: t.name,
      plan: String(
        t.metadata?.plan || (t.id.startsWith('local-') ? 'local' : 'free'),
      ),
      slug: t.slug,
      status: t.status,
      updatedAt: t.updated_at,
    };
  }

  const workspace = reactive({
    get activeId() {
      return (
        workspaceStore.activeWorkspaceId ||
        getActiveWorkspaceId() ||
        DEFAULT_LOCAL_WORKSPACE_ID
      );
    },
    get activeName() {
      return workspaceStore.activeWorkspace?.name || null;
    },
    get activeSlug() {
      return workspaceStore.activeWorkspace?.slug || null;
    },
    createWorkspace: async (input: {
      name: string;
      plan?: string;
      slug: string;
    }) => {
      const created = await workspaceStore.createWorkspace(input);
      return mapWorkspaceToKernelRecord(created);
    },
    deleteWorkspace: async (id: string) => {
      await workspaceStore.deleteWorkspace(id);
    },
    get isLoading() {
      return workspaceStore.isLoading;
    },
    get items() {
      return workspaceStore.workspaces.map((t) =>
        mapWorkspaceToKernelRecord(t),
      );
    },
    refresh: async (force?: boolean) => {
      const list = await workspaceStore.fetchWorkspaces(force);
      return list.map((t) => mapWorkspaceToKernelRecord(t));
    },
    switchWorkspace: (id: string) => {
      workspaceStore.setWorkspace(id);
    },
    updateWorkspace: async (
      id: string,
      patch: {
        name?: string;
        plan?: string;
        slug?: string;
        status?: 'active' | 'archived' | 'suspended';
      },
    ) => {
      const updated = await workspaceStore.updateWorkspace(id, patch);
      return mapWorkspaceToKernelRecord(updated);
    },
  });

  return {
    api,
    auth,
    events,
    notifications,
    workspace,
  };
}
