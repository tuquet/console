import { ref } from 'vue';

import { defineStore } from 'pinia';

export interface WorkspaceItem {
  id: string;
  name: string;
  slug: string;
  tier: 'enterprise' | 'free' | 'pro';
  memberCount: number;
}

/**
 * Sample Pinia store for @operon/tenants.
 * Note the namespaced store ID: 'tenants:workspace' to avoid collisions in Shell.
 */
export const useTenantsStore = defineStore('tenants:workspace', () => {
  const workspaces = ref<WorkspaceItem[]>([
    {
      id: 'ws-default',
      name: 'Default Workspace',
      slug: 'default',
      tier: 'enterprise',
      memberCount: 5,
    },
    {
      id: 'ws-marketing',
      name: 'Growth & Marketing',
      slug: 'marketing',
      tier: 'pro',
      memberCount: 3,
    },
  ]);
  const activeWorkspaceId = ref<string>('ws-default');

  function setActiveWorkspace(id: string) {
    activeWorkspaceId.value = id;
  }

  function addWorkspace(ws: WorkspaceItem) {
    workspaces.value.push(ws);
  }

  return {
    activeWorkspaceId,
    addWorkspace,
    setActiveWorkspace,
    workspaces,
  };
});
