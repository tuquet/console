import type { Tenant } from '#/api/core/tenant';

import { computed, ref } from 'vue';

import { TENANT_STATUS } from '@operon/constants';
import { useAccessStore } from '@operon/stores';

import { toast } from '@operon-core/shadcn-ui';

import { defineStore } from 'pinia';

import {
  createTenant,
  getActiveTenantId,
  listTenants,
  setActiveTenantId,
} from '#/api/core/tenant';
import { $t } from '#/locales';
import { captureError, setBugsinkTag } from '#/utils/bugsink';

const LOCAL_WORKSPACES_KEY = 'operon:local-workspaces';

function createDefaultLocalWorkspace(): Tenant {
  const now = new Date().toISOString();
  return {
    avatar_url: null,
    created_at: now,
    created_by: 'local',
    id: 'local-default',
    metadata: { plan: 'local' },
    name: $t('page.workspace.local_workspace'),
    slug: 'local',
    status: TENANT_STATUS.ACTIVE,
    updated_at: now,
  };
}

function loadLocalWorkspaces(): Tenant[] {
  try {
    const raw = localStorage.getItem(LOCAL_WORKSPACES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Tenant[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback to default local workspace
  }
  const initial = [createDefaultLocalWorkspace()];
  saveLocalWorkspaces(initial);
  return initial;
}

function saveLocalWorkspaces(list: Tenant[]) {
  try {
    localStorage.setItem(LOCAL_WORKSPACES_KEY, JSON.stringify(list));
  } catch {
    // ignore storage quota errors
  }
}

export const useWorkspaceStore = defineStore('workspace', () => {
  const workspaces = ref<Tenant[]>([]);
  const activeWorkspaceId = ref<string>(getActiveTenantId());
  const isLoading = ref<boolean>(false);

  const activeWorkspace = computed<null | Tenant>(() => {
    if (workspaces.value.length === 0) return null;
    return (
      workspaces.value.find((w) => w.id === activeWorkspaceId.value) ||
      workspaces.value[0] ||
      null
    );
  });

  function ensureValidActiveWorkspace() {
    const currentActiveExists = workspaces.value.some(
      (w) => w.id === activeWorkspaceId.value,
    );
    if (!currentActiveExists && workspaces.value.length > 0) {
      const first = workspaces.value[0];
      if (first?.id) {
        activeWorkspaceId.value = first.id;
        setActiveTenantId(first.id);
      }
    }
    if (activeWorkspaceId.value) {
      setBugsinkTag('workspace_id', activeWorkspaceId.value);
    }
  }

  async function fetchWorkspaces(force = false) {
    const accessStore = useAccessStore();
    if (!accessStore.accessToken) {
      workspaces.value = loadLocalWorkspaces();
      ensureValidActiveWorkspace();
      return workspaces.value;
    }

    if (workspaces.value.length > 0 && !force) {
      return workspaces.value;
    }
    try {
      isLoading.value = true;
      const list = await listTenants();
      workspaces.value = Array.isArray(list) ? list : [];
      ensureValidActiveWorkspace();
      return workspaces.value;
    } catch (error) {
      captureError(error, { action: 'fetchWorkspaces' });
      workspaces.value = loadLocalWorkspaces();
      ensureValidActiveWorkspace();
      return workspaces.value;
    } finally {
      isLoading.value = false;
    }
  }

  function setWorkspace(id: string, notify = true) {
    if (activeWorkspaceId.value === id) return;
    const target = workspaces.value.find((w) => w.id === id);
    activeWorkspaceId.value = id;
    setActiveTenantId(id);
    setBugsinkTag('workspace_id', id);

    if (notify && target) {
      toast.success($t('page.workspace.switched_to', { name: target.name }));
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('opn:workspace-changed', {
          detail: { tenantId: id, tenant: target },
        }),
      );
    }
  }

  async function createWorkspace(data: {
    name: string;
    plan?: string;
    slug: string;
  }) {
    const accessStore = useAccessStore();
    if (!accessStore.accessToken) {
      const now = new Date().toISOString();
      const localTenant: Tenant = {
        avatar_url: null,
        created_at: now,
        created_by: 'local',
        id: `local-${crypto.randomUUID().slice(0, 8)}`,
        metadata: { plan: data.plan || 'local' },
        name: data.name,
        slug: data.slug,
        status: TENANT_STATUS.ACTIVE,
        updated_at: now,
      };
      const current = loadLocalWorkspaces();
      const next = [localTenant, ...current];
      saveLocalWorkspaces(next);
      workspaces.value = next;
      setWorkspace(localTenant.id, false);
      toast.success(
        $t('page.workspace.create_success', { name: localTenant.name }),
      );
      return localTenant;
    }

    try {
      isLoading.value = true;
      const created = await createTenant(data);
      if (created?.id) {
        workspaces.value = [created, ...workspaces.value];
        setWorkspace(created.id, true);
        toast.success(
          $t('page.workspace.create_success', { name: created.name }),
        );
      }
      return created;
    } catch (error: any) {
      captureError(error, { action: 'createWorkspace', slug: data.slug });
      toast.error(error?.message || $t('page.workspace.create_failed'));
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  function $reset() {
    workspaces.value = [];
    activeWorkspaceId.value = '';
    setBugsinkTag('workspace_id', null);
    isLoading.value = false;
  }

  return {
    $reset,
    activeWorkspace,
    activeWorkspaceId,
    createWorkspace,
    fetchWorkspaces,
    isLoading,
    setWorkspace,
    workspaces,
  };
});
