import type {
  CreateKernelWorkspaceInput,
  KernelWorkspaceRecord,
  UpdateKernelWorkspacePatch,
} from '@operon/kernel';

import { computed, ref } from 'vue';

import { useKernel } from '@operon/kernel';

import { defineStore } from 'pinia';

export type WorkspaceRecord = KernelWorkspaceRecord;

/**
 * Kernel-backed Pinia store for @operon/workspaces.
 * Reads and mutates the host shell's reactive workspace context without importing apps/shell.
 */
export const useWorkspacesStore = defineStore('workspaces:store', () => {
  const kernel = useKernel();
  const standaloneFallback = ref<WorkspaceRecord[]>([]);

  const workspaces = computed<WorkspaceRecord[]>(() =>
    kernel.workspace.items.length > 0
      ? kernel.workspace.items
      : standaloneFallback.value,
  );

  const activeWorkspaceId = computed(() => kernel.workspace.activeId);

  const activeWorkspace = computed<null | WorkspaceRecord>(
    () =>
      workspaces.value.find((t) => t.id === activeWorkspaceId.value) ||
      workspaces.value[0] ||
      null,
  );

  const isLoading = computed(() => kernel.workspace.isLoading);

  async function fetchWorkspaces(force = false) {
    if (kernel.workspace.refresh) {
      return await kernel.workspace.refresh(force);
    }
    return workspaces.value;
  }

  function setActiveWorkspace(id: string) {
    kernel.workspace.switchWorkspace?.(id);
  }

  async function createWorkspace(input: CreateKernelWorkspaceInput) {
    if (kernel.workspace.createWorkspace) {
      return await kernel.workspace.createWorkspace(input);
    }
    const now = new Date().toISOString();
    const localItem: WorkspaceRecord = {
      avatarUrl: null,
      createdAt: now,
      createdBy: 'local',
      id: `local-${Date.now().toString(36)}`,
      name: input.name,
      plan: input.plan || 'local',
      slug: input.slug,
      status: 'active',
      updatedAt: now,
    };
    standaloneFallback.value = [localItem, ...standaloneFallback.value];
    return localItem;
  }

  async function updateWorkspace(
    id: string,
    patch: UpdateKernelWorkspacePatch,
  ) {
    if (kernel.workspace.updateWorkspace) {
      return await kernel.workspace.updateWorkspace(id, patch);
    }
    const existing = standaloneFallback.value.find((t) => t.id === id);
    if (!existing) {
      throw new Error('Workspace not found');
    }
    const updated: WorkspaceRecord = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    standaloneFallback.value = standaloneFallback.value.map((t) =>
      t.id === id ? updated : t,
    );
    return updated;
  }

  async function deleteWorkspace(id: string) {
    if (kernel.workspace.deleteWorkspace) {
      await kernel.workspace.deleteWorkspace(id);
      return;
    }
    standaloneFallback.value = standaloneFallback.value.filter(
      (t) => t.id !== id,
    );
  }

  return {
    activeWorkspace,
    activeWorkspaceId,
    createWorkspace,
    deleteWorkspace,
    fetchWorkspaces,
    isLoading,
    setActiveWorkspace,
    workspaces,
    updateWorkspace,
  };
});
