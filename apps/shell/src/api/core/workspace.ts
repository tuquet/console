import type { WorkspacePlan, WorkspaceStatus } from '@operon/constants';

import {
  STORAGE_KEYS,
  WORKSPACE_PLAN,
  WORKSPACE_STATUS,
} from '@operon/constants';

import { hasCloudAuth, supabaseRequest } from './supabase-client';

export { WORKSPACE_PLAN, WORKSPACE_STATUS };
export type { WorkspacePlan, WorkspaceStatus };

export interface Workspace {
  avatar_url: null | string;
  created_at: string;
  created_by: null | string;
  id: string;
  metadata?: {
    plan?: string | WorkspacePlan;
    region?: string;
    [key: string]: any;
  };
  name: string;
  slug: string;
  status: WorkspaceStatus;
  updated_at: string;
}

export interface CreateWorkspaceInput {
  name: string;
  plan?: string;
  slug: string;
}

export interface UpdateWorkspaceInput {
  metadata?: Record<string, any>;
  name?: string;
  plan?: string;
  slug?: string;
  status?: WorkspaceStatus;
}

const ACTIVE_WORKSPACE_KEY = STORAGE_KEYS.ACTIVE_WORKSPACE_ID;

export function getActiveWorkspaceId(): string {
  return localStorage.getItem(ACTIVE_WORKSPACE_KEY) || '';
}

export function setActiveWorkspaceId(workspaceId: string) {
  localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspaceId);
}

/**
 * Fetch all workspaces from Supabase Cloud
 */
export async function listWorkspaces(): Promise<Workspace[]> {
  if (!hasCloudAuth()) {
    return [];
  }
  return supabaseRequest<Workspace[]>(
    '/rest/v1/workspaces?select=*&order=created_at.desc',
  );
}

/**
 * Create a new workspace
 */
export async function createWorkspace(
  data: CreateWorkspaceInput,
): Promise<Workspace> {
  const payload = {
    metadata: {
      plan: data.plan || WORKSPACE_PLAN.PRO,
      region: 'ap-southeast-1',
    },
    name: data.name,
    slug: data.slug,
    status: WORKSPACE_STATUS.ACTIVE,
  };

  const result = await supabaseRequest<Workspace | Workspace[]>(
    '/rest/v1/workspaces',
    {
      body: JSON.stringify(payload),
      method: 'POST',
      preferRepresentation: true,
    },
  );

  const created = Array.isArray(result) ? result[0] : result;
  if (!created) {
    throw new Error('Failed to create workspace: empty response from server');
  }

  return created;
}

/**
 * Update an existing Cloud workspace
 */
export async function updateWorkspace(
  id: string,
  data: UpdateWorkspaceInput,
): Promise<Workspace> {
  const payload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  if (data.name !== undefined) payload.name = data.name;
  if (data.slug !== undefined) payload.slug = data.slug;
  if (data.status !== undefined) payload.status = data.status;
  if (data.plan !== undefined || data.metadata !== undefined) {
    payload.metadata = {
      ...data.metadata,
      ...(data.plan ? { plan: data.plan } : {}),
    };
  }

  const result = await supabaseRequest<Workspace | Workspace[]>(
    `/rest/v1/workspaces?id=eq.${encodeURIComponent(id)}`,
    {
      body: JSON.stringify(payload),
      method: 'PATCH',
      preferRepresentation: true,
    },
  );

  const updated = Array.isArray(result) ? result[0] : result;
  if (!updated) {
    throw new Error('Failed to update workspace: empty response from server');
  }
  return updated;
}

/**
 * Permanently delete a Cloud workspace
 */
export async function deleteWorkspace(id: string): Promise<void> {
  await supabaseRequest(`/rest/v1/workspaces?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export const workspacesApi = {
  create: createWorkspace,
  delete: deleteWorkspace,
  list: listWorkspaces,
  update: updateWorkspace,
};
