import type { Workspace, WorkspaceStatus } from '#/api/core/workspace';

import { computed, ref } from 'vue';

import { WORKSPACE_STATUS } from '@operon/constants';
import { useAccessStore } from '@operon/stores';

import { toast } from '@operon-core/shadcn-ui';

import { defineStore } from 'pinia';

import {
  createWorkspace as createCloudWorkspace,
  deleteWorkspace as deleteCloudWorkspace,
  getActiveWorkspaceId,
  listWorkspaces,
  setActiveWorkspaceId,
  updateWorkspace as updateCloudWorkspace,
} from '#/api/core/workspace';
import { $t } from '#/locales';
import { captureError, setBugsinkTag } from '#/utils/bugsink';

export const LOCAL_DEFAULT_WORKSPACE_ID = 'local-default';
const LOCAL_WORKSPACES_KEY = 'operon:local-workspaces';

export interface WorkspacePatchInput {
  name?: string;
  plan?: string;
  slug?: string;
  status?: WorkspaceStatus;
}

function createDefaultLocalWorkspace(): Workspace {
  const now = new Date().toISOString();
  return {
    avatar_url: null,
    created_at: now,
    created_by: 'local',
    id: LOCAL_DEFAULT_WORKSPACE_ID,
    metadata: { plan: 'local' },
    name: $t('page.workspace.local_workspace'),
    slug: 'local',
    status: WORKSPACE_STATUS.ACTIVE,
    updated_at: now,
  };
}

function loadLocalWorkspaces(): Workspace[] {
  try {
    const raw = localStorage.getItem(LOCAL_WORKSPACES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Workspace[];
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

function saveLocalWorkspaces(list: Workspace[]) {
  try {
    localStorage.setItem(LOCAL_WORKSPACES_KEY, JSON.stringify(list));
  } catch {
    // ignore storage quota errors
  }
}

function normalizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replaceAll(/[^\w\s-]/g, '')
    .replaceAll(/[\s_]+/g, '-')
    .replaceAll(/-+/g, '-')
    .replaceAll(/^-+|-+$/g, '');
}

async function syncDaemonWorkspace(targetId: string) {
  if (typeof fetch === 'undefined') return;
  try {
    await fetch('http://127.0.0.1:8765/api/v1/system/workspaces/switch', {
      body: JSON.stringify({ target: targetId }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
  } catch {
    // Daemon may be offline in web preview; non-blocking
  }
}

export const useWorkspaceStore = defineStore('workspace', () => {
  const workspaces = ref<Workspace[]>([]);
  const activeWorkspaceId = ref<string>(getActiveWorkspaceId());
  const isLoading = ref<boolean>(false);

  const activeWorkspace = computed<null | Workspace>(() => {
    if (workspaces.value.length === 0) return null;
    return (
      workspaces.value.find((t) => t.id === activeWorkspaceId.value) ||
      workspaces.value[0] ||
      null
    );
  });

  function ensureValidActiveWorkspace() {
    const currentActiveExists = workspaces.value.some(
      (t) =>
        t.id === activeWorkspaceId.value &&
        t.status === WORKSPACE_STATUS.ACTIVE,
    );
    if (!currentActiveExists && workspaces.value.length > 0) {
      const fallback =
        workspaces.value.find((t) => t.status === WORKSPACE_STATUS.ACTIVE) ||
        workspaces.value[0];
      if (fallback?.id) {
        activeWorkspaceId.value = fallback.id;
        setActiveWorkspaceId(fallback.id);
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
      const list = await listWorkspaces();
      workspaces.value = Array.isArray(list) ? list : [];
      ensureValidActiveWorkspace();
      return workspaces.value;
    } catch (error) {
      captureError(error, { action: 'fetchWorkspaces' });
      if (workspaces.value.length === 0) {
        workspaces.value = loadLocalWorkspaces();
      }
      ensureValidActiveWorkspace();
      return workspaces.value;
    } finally {
      isLoading.value = false;
    }
  }

  function setWorkspace(id: string, notify = true) {
    if (activeWorkspaceId.value === id) return;
    const target = workspaces.value.find((t) => t.id === id);
    if (target && target.status !== WORKSPACE_STATUS.ACTIVE) {
      toast.error($t('page.workspace.inactive_switch_blocked'));
      return;
    }

    activeWorkspaceId.value = id;
    setActiveWorkspaceId(id);
    setBugsinkTag('workspace_id', id);

    if (notify && target) {
      toast.success($t('page.workspace.switched_to', { name: target.name }));
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('opn:workspace-changed', {
          detail: { workspace: target, workspaceId: id },
        }),
      );
    }

    void syncDaemonWorkspace(id);
  }

  async function createWorkspace(data: {
    name: string;
    plan?: string;
    slug: string;
  }) {
    const trimmedName = data.name.trim();
    const cleanSlug = normalizeSlug(data.slug || trimmedName);
    if (trimmedName.length < 2 || cleanSlug.length < 2) {
      throw new Error($t('page.workspace.invalid_slug'));
    }

    const duplicateSlug = workspaces.value.some(
      (t) => t.slug.toLowerCase() === cleanSlug.toLowerCase(),
    );
    if (duplicateSlug) {
      throw new Error($t('page.workspace.duplicate_slug'));
    }

    const accessStore = useAccessStore();
    if (!accessStore.accessToken) {
      const now = new Date().toISOString();
      const localWorkspace: Workspace = {
        avatar_url: null,
        created_at: now,
        created_by: 'local',
        id: `local-${crypto.randomUUID().slice(0, 8)}`,
        metadata: { plan: data.plan || 'local' },
        name: trimmedName,
        slug: cleanSlug,
        status: WORKSPACE_STATUS.ACTIVE,
        updated_at: now,
      };
      const current = loadLocalWorkspaces();
      const next = [localWorkspace, ...current];
      saveLocalWorkspaces(next);
      workspaces.value = next;
      setWorkspace(localWorkspace.id, false);
      toast.success(
        $t('page.workspace.create_success', { name: localWorkspace.name }),
      );
      return localWorkspace;
    }

    try {
      isLoading.value = true;
      const created = await createCloudWorkspace({
        name: trimmedName,
        plan: data.plan,
        slug: cleanSlug,
      });
      if (created?.id) {
        workspaces.value = [created, ...workspaces.value];
        setWorkspace(created.id, true);
        toast.success(
          $t('page.workspace.create_success', { name: created.name }),
        );
      }
      return created;
    } catch (error: any) {
      captureError(error, { action: 'createWorkspace', slug: cleanSlug });
      toast.error(error?.message || $t('page.workspace.create_failed'));
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateWorkspace(id: string, patch: WorkspacePatchInput) {
    const existing = workspaces.value.find((t) => t.id === id);
    if (!existing) {
      throw new Error($t('page.workspace.not_found'));
    }

    const nextName =
      patch.name === undefined ? existing.name : patch.name.trim();
    const nextSlug =
      patch.slug === undefined ? existing.slug : normalizeSlug(patch.slug);
    if (nextName.length < 2 || nextSlug.length < 2) {
      throw new Error($t('page.workspace.invalid_slug'));
    }

    const duplicateSlug = workspaces.value.some(
      (t) => t.id !== id && t.slug.toLowerCase() === nextSlug.toLowerCase(),
    );
    if (duplicateSlug) {
      throw new Error($t('page.workspace.duplicate_slug'));
    }

    const accessStore = useAccessStore();
    if (!accessStore.accessToken || id.startsWith('local-')) {
      const now = new Date().toISOString();
      const updated: Workspace = {
        ...existing,
        metadata: {
          ...existing.metadata,
          ...(patch.plan ? { plan: patch.plan } : {}),
        },
        name: nextName,
        slug: nextSlug,
        status: patch.status ?? existing.status,
        updated_at: now,
      };
      const next = workspaces.value.map((t) => (t.id === id ? updated : t));
      saveLocalWorkspaces(next);
      workspaces.value = next;
      if (
        id === activeWorkspaceId.value &&
        updated.status !== WORKSPACE_STATUS.ACTIVE
      ) {
        ensureValidActiveWorkspace();
      }
      toast.success(
        $t('page.workspace.update_success', { name: updated.name }),
      );
      return updated;
    }

    try {
      isLoading.value = true;
      const updated = await updateCloudWorkspace(id, {
        metadata: existing.metadata,
        name: nextName,
        plan: patch.plan,
        slug: nextSlug,
        status: patch.status,
      });
      workspaces.value = workspaces.value.map((t) =>
        t.id === id ? updated : t,
      );
      if (
        id === activeWorkspaceId.value &&
        updated.status !== WORKSPACE_STATUS.ACTIVE
      ) {
        ensureValidActiveWorkspace();
      }
      toast.success(
        $t('page.workspace.update_success', { name: updated.name }),
      );
      return updated;
    } catch (error: any) {
      captureError(error, { action: 'updateWorkspace', id });
      toast.error(error?.message || $t('page.workspace.update_failed'));
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteWorkspace(id: string) {
    if (id === LOCAL_DEFAULT_WORKSPACE_ID) {
      const err = new Error($t('page.workspace.cannot_delete_default'));
      toast.error(err.message);
      throw err;
    }

    const existing = workspaces.value.find((t) => t.id === id);
    if (!existing) {
      throw new Error($t('page.workspace.not_found'));
    }

    if (workspaces.value.length <= 1) {
      const err = new Error($t('page.workspace.cannot_delete_last'));
      toast.error(err.message);
      throw err;
    }

    // Check daemon for active or owned browser profiles under this workspace
    let ownedBrowserIds: string[] = [];
    let runningCount = 0;
    if (typeof fetch !== 'undefined') {
      try {
        const res = await fetch(
          `http://127.0.0.1:8765/api/v1/browsers?workspaceId=${encodeURIComponent(id)}&scope=workspace`,
        );
        if (res.ok) {
          const rows = (await res.json()) as Array<{
            id: string;
            isOnline?: boolean;
          }>;
          if (Array.isArray(rows)) {
            runningCount = rows.filter((b) => b.isOnline).length;
            ownedBrowserIds = rows.map((b) => b.id).filter(Boolean);
          }
        }
      } catch {
        // Daemon may be offline in web-only mode; ignore unreachable probe
      }
    }

    if (runningCount > 0) {
      const err = new Error(
        $t('page.workspace.running_browsers_block', {
          count: runningCount,
        }),
      );
      toast.error(err.message);
      throw err;
    }

    const accessStore = useAccessStore();
    if (accessStore.accessToken && !id.startsWith('local-')) {
      try {
        isLoading.value = true;
        await deleteCloudWorkspace(id);
      } catch (error: any) {
        captureError(error, { action: 'deleteWorkspace', id });
        toast.error(error?.message || $t('page.workspace.delete_failed'));
        throw error;
      } finally {
        isLoading.value = false;
      }
    }

    const next = workspaces.value.filter((t) => t.id !== id);
    if (!accessStore.accessToken || id.startsWith('local-')) {
      saveLocalWorkspaces(next);
    }
    workspaces.value = next;

    if (activeWorkspaceId.value === id) {
      const fallback =
        next.find((t) => t.status === WORKSPACE_STATUS.ACTIVE) || next[0];
      if (fallback) {
        setWorkspace(fallback.id, false);
      }
    }

    if (ownedBrowserIds.length > 0 && typeof fetch !== 'undefined') {
      try {
        await fetch('http://127.0.0.1:8765/api/v1/browsers/batch/delete', {
          body: JSON.stringify({ force: false, ids: ownedBrowserIds }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        });
      } catch {
        // Non-blocking if daemon went offline mid-request
      }
    }

    toast.success($t('page.workspace.delete_success', { name: existing.name }));
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
    deleteWorkspace,
    fetchWorkspaces,
    isLoading,
    setWorkspace,
    workspaces,
    updateWorkspace,
  };
});
