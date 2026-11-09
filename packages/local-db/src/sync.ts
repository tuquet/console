import type { OperonDb } from './client';
import type { BrowserProfile } from './schema/automation';

import { SUPABASE_SCHEMA } from '@operon/constants';

import { and, eq, gt, isNull, or } from 'drizzle-orm';

import { supabaseRequest } from './requester';
import { browserProfiles, proxies, workflows } from './schema/automation';

export * from './requester';

export interface SyncResult {
  conflicts: number;
  errors: string[];
  pushed: number;
  pulled: number;
}

export interface CloudBrowserProfile {
  cookies?: Record<string, unknown>[];
  created_at: string;
  deleted_at?: null | string;
  fingerprint?: Record<string, unknown>;
  id: string;
  is_locked?: boolean;
  name: string;
  proxy_id?: null | string;
  release_id?: null | string;
  storage_state?: Record<string, unknown>;
  template_id?: null | string;
  tenant_id: string;
  updated_at: string;
}

export interface CloudWorkflow {
  created_at: string;
  deleted_at?: null | string;
  description?: null | string;
  edges?: Record<string, unknown>[];
  id: string;
  is_active: boolean;
  name: string;
  nodes?: Record<string, unknown>[];
  settings?: Record<string, unknown>;
  tenant_id: string;
  updated_at: string;
  version: string;
}

/**
 * Soft-deletes a local browser profile by stamping deleted_at.
 */
export async function softDeleteBrowserProfile(
  db: OperonDb,
  id: string,
): Promise<void> {
  const nowIso = new Date().toISOString();
  await db
    .update(browserProfiles)
    .set({ deletedAt: nowIso, updatedAt: nowIso })
    .where(eq(browserProfiles.id, id));
}

/**
 * Soft-deletes a local workflow.
 */
export async function softDeleteWorkflow(
  db: OperonDb,
  id: string,
): Promise<void> {
  const nowIso = new Date().toISOString();
  await db
    .update(workflows)
    .set({ deletedAt: nowIso, updatedAt: nowIso })
    .where(eq(workflows.id, id));
}

/**
 * Soft-deletes a local proxy.
 */
export async function softDeleteProxy(db: OperonDb, id: string): Promise<void> {
  const nowIso = new Date().toISOString();
  await db
    .update(proxies)
    .set({ deletedAt: nowIso, updatedAt: nowIso })
    .where(eq(proxies.id, id));
}

/**
 * Queries active (non-deleted) browser profiles for a tenant.
 */
export async function getActiveBrowserProfiles(
  db: OperonDb,
  tenantId?: string,
): Promise<BrowserProfile[]> {
  const conditions = [isNull(browserProfiles.deletedAt)];
  if (tenantId) {
    conditions.push(eq(browserProfiles.tenantId, tenantId));
  }
  return db
    .select()
    .from(browserProfiles)
    .where(and(...conditions));
}

/**
 * Pushes dirty local browser profiles (created, updated, or soft-deleted) to Supabase Cloud.
 */
export async function pushLocalBrowserProfilesToCloud(
  db: OperonDb,
  tenantId: string,
): Promise<{ errors: string[]; pushed: number }> {
  const errors: string[] = [];
  let pushed = 0;

  try {
    const dirtyProfiles = await db
      .select()
      .from(browserProfiles)
      .where(
        and(
          or(
            eq(browserProfiles.tenantId, tenantId),
            isNull(browserProfiles.tenantId),
          ),
          or(
            isNull(browserProfiles.lastSyncedAt),
            gt(browserProfiles.updatedAt, browserProfiles.lastSyncedAt),
          ),
        ),
      );

    for (const local of dirtyProfiles) {
      try {
        const nowIso = new Date().toISOString();

        if (local.deletedAt) {
          await supabaseRequest(
            `/rest/v1/browser_profiles?id=eq.${encodeURIComponent(local.id)}&tenant_id=eq.${encodeURIComponent(tenantId)}`,
            {
              method: 'DELETE',
              schema: SUPABASE_SCHEMA.OPERON,
            },
          );
        } else {
          const payload: CloudBrowserProfile = {
            cookies: (local.cookies as Record<string, unknown>[]) || [],
            created_at: local.createdAt,
            deleted_at: null,
            fingerprint: (local.fingerprint as Record<string, unknown>) || {},
            id: local.id,
            is_locked: local.isLocked,
            name: local.name,
            proxy_id: local.proxyId,
            release_id: local.releaseId,
            storage_state:
              (local.storageState as Record<string, unknown>) || {},
            template_id: local.templateId,
            tenant_id: tenantId,
            updated_at: local.updatedAt,
          };

          await supabaseRequest('/rest/v1/browser_profiles', {
            body: JSON.stringify(payload),
            headers: {
              Prefer: 'resolution=merge-duplicates,return=minimal',
            },
            method: 'POST',
            schema: SUPABASE_SCHEMA.OPERON,
          });
        }

        await db
          .update(browserProfiles)
          .set({ lastSyncedAt: nowIso, tenantId })
          .where(eq(browserProfiles.id, local.id));

        pushed++;
      } catch (error: any) {
        errors.push(
          `Failed to push profile ${local.id}: ${error?.message || error}`,
        );
      }
    }
  } catch (error: any) {
    errors.push(`Failed to query dirty profiles: ${error?.message || error}`);
  }

  return { errors, pushed };
}

/**
 * Pulls browser profiles from Supabase Cloud and reconciles with local SQLite.
 */
export async function pullCloudBrowserProfilesToLocal(
  db: OperonDb,
  tenantId: string,
): Promise<{ conflicts: number; errors: string[]; pulled: number }> {
  const errors: string[] = [];
  let pulled = 0;
  let conflicts = 0;

  try {
    const cloudProfiles = await supabaseRequest<CloudBrowserProfile[]>(
      `/rest/v1/browser_profiles?tenant_id=eq.${encodeURIComponent(tenantId)}&select=*`,
      {
        schema: SUPABASE_SCHEMA.OPERON,
      },
    );

    if (!Array.isArray(cloudProfiles)) {
      return { conflicts, errors, pulled };
    }

    const cloudIds = new Set(cloudProfiles.map((cp) => cp.id));

    for (const cloud of cloudProfiles) {
      try {
        const localMatches = await db
          .select()
          .from(browserProfiles)
          .where(eq(browserProfiles.id, cloud.id));

        const local = localMatches[0];

        if (local) {
          const cloudTime = new Date(cloud.updated_at).getTime();
          const localTime = new Date(local.updatedAt).getTime();

          if (cloudTime > localTime) {
            await db
              .update(browserProfiles)
              .set({
                cookies: cloud.cookies || [],
                deletedAt: cloud.deleted_at || null,
                fingerprint: cloud.fingerprint || {},
                isLocked: cloud.is_locked ?? false,
                lastSyncedAt: new Date().toISOString(),
                name: cloud.name,
                proxyId: cloud.proxy_id || null,
                releaseId: cloud.release_id || null,
                storageState: cloud.storage_state || {},
                templateId: cloud.template_id || null,
                tenantId: cloud.tenant_id,
                updatedAt: cloud.updated_at,
              })
              .where(eq(browserProfiles.id, local.id));
            pulled++;
            conflicts++;
          }
        } else {
          await db.insert(browserProfiles).values({
            browserType: 'Chromium',
            cookies: cloud.cookies || [],
            createdAt: cloud.created_at,
            deletedAt: cloud.deleted_at || null,
            fingerprint: cloud.fingerprint || {},
            id: cloud.id,
            isLocked: cloud.is_locked ?? false,
            lastSyncedAt: new Date().toISOString(),
            name: cloud.name,
            proxyId: cloud.proxy_id || null,
            releaseId: cloud.release_id || null,
            storageState: cloud.storage_state || {},
            templateId: cloud.template_id || null,
            tenantId: cloud.tenant_id,
            updatedAt: cloud.updated_at,
          });
          pulled++;
        }
      } catch (error: any) {
        errors.push(
          `Failed to reconcile profile ${cloud.id}: ${error?.message || error}`,
        );
      }
    }

    const syncedLocals = await db
      .select()
      .from(browserProfiles)
      .where(
        and(
          eq(browserProfiles.tenantId, tenantId),
          isNull(browserProfiles.deletedAt),
        ),
      );

    for (const local of syncedLocals) {
      if (local.lastSyncedAt && !cloudIds.has(local.id)) {
        const nowIso = new Date().toISOString();
        await db
          .update(browserProfiles)
          .set({ deletedAt: nowIso, lastSyncedAt: nowIso })
          .where(eq(browserProfiles.id, local.id));
        pulled++;
      }
    }
  } catch (error: any) {
    errors.push(`Failed to pull cloud profiles: ${error?.message || error}`);
  }

  return { conflicts, errors, pulled };
}

/**
 * Bidirectional synchronization for Browser Profiles.
 */
export async function syncBrowserProfiles(
  db: OperonDb,
  tenantId: string,
): Promise<SyncResult> {
  const pushRes = await pushLocalBrowserProfilesToCloud(db, tenantId);
  const pullRes = await pullCloudBrowserProfilesToLocal(db, tenantId);

  return {
    conflicts: pullRes.conflicts,
    errors: [...pushRes.errors, ...pullRes.errors],
    pushed: pushRes.pushed,
    pulled: pullRes.pulled,
  };
}

/**
 * Pushes dirty local workflows to Supabase Cloud.
 */
export async function pushLocalWorkflowsToCloud(
  db: OperonDb,
  tenantId: string,
): Promise<{ errors: string[]; pushed: number }> {
  const errors: string[] = [];
  let pushed = 0;

  try {
    const dirtyWorkflows = await db
      .select()
      .from(workflows)
      .where(
        and(
          or(eq(workflows.tenantId, tenantId), isNull(workflows.tenantId)),
          or(
            isNull(workflows.lastSyncedAt),
            gt(workflows.updatedAt, workflows.lastSyncedAt),
          ),
        ),
      );

    for (const local of dirtyWorkflows) {
      try {
        const nowIso = new Date().toISOString();

        if (local.deletedAt) {
          await supabaseRequest(
            `/rest/v1/workflows?id=eq.${encodeURIComponent(local.id)}&tenant_id=eq.${encodeURIComponent(tenantId)}`,
            {
              method: 'DELETE',
              schema: SUPABASE_SCHEMA.OPERON,
            },
          );
        } else {
          const payload: CloudWorkflow = {
            created_at: local.createdAt,
            deleted_at: null,
            description: local.description,
            edges: (local.edges as Record<string, unknown>[]) || [],
            id: local.id,
            is_active: local.isActive,
            name: local.name,
            nodes: (local.nodes as Record<string, unknown>[]) || [],
            settings: (local.settings as Record<string, unknown>) || {},
            tenant_id: tenantId,
            updated_at: local.updatedAt,
            version: local.version,
          };

          await supabaseRequest('/rest/v1/workflows', {
            body: JSON.stringify(payload),
            headers: {
              Prefer: 'resolution=merge-duplicates,return=minimal',
            },
            method: 'POST',
            schema: SUPABASE_SCHEMA.OPERON,
          });
        }

        await db
          .update(workflows)
          .set({ lastSyncedAt: nowIso, tenantId })
          .where(eq(workflows.id, local.id));

        pushed++;
      } catch (error: any) {
        errors.push(
          `Failed to push workflow ${local.id}: ${error?.message || error}`,
        );
      }
    }
  } catch (error: any) {
    errors.push(`Failed to query dirty workflows: ${error?.message || error}`);
  }

  return { errors, pushed };
}

/**
 * Pulls workflows from Supabase Cloud and reconciles with local SQLite.
 */
export async function pullCloudWorkflowsToLocal(
  db: OperonDb,
  tenantId: string,
): Promise<{ conflicts: number; errors: string[]; pulled: number }> {
  const errors: string[] = [];
  let pulled = 0;
  let conflicts = 0;

  try {
    const cloudWorkflows = await supabaseRequest<CloudWorkflow[]>(
      `/rest/v1/workflows?tenant_id=eq.${encodeURIComponent(tenantId)}&select=*`,
      {
        schema: SUPABASE_SCHEMA.OPERON,
      },
    );

    if (!Array.isArray(cloudWorkflows)) {
      return { conflicts, errors, pulled };
    }

    const cloudIds = new Set(cloudWorkflows.map((cw) => cw.id));

    for (const cloud of cloudWorkflows) {
      try {
        const localMatches = await db
          .select()
          .from(workflows)
          .where(eq(workflows.id, cloud.id));

        const local = localMatches[0];

        if (local) {
          const cloudTime = new Date(cloud.updated_at).getTime();
          const localTime = new Date(local.updatedAt).getTime();

          if (cloudTime > localTime) {
            await db
              .update(workflows)
              .set({
                deletedAt: cloud.deleted_at || null,
                description: cloud.description || null,
                edges: cloud.edges || [],
                isActive: cloud.is_active,
                lastSyncedAt: new Date().toISOString(),
                name: cloud.name,
                nodes: cloud.nodes || [],
                settings: cloud.settings || {},
                tenantId: cloud.tenant_id,
                updatedAt: cloud.updated_at,
                version: cloud.version,
              })
              .where(eq(workflows.id, local.id));
            pulled++;
            conflicts++;
          }
        } else {
          await db.insert(workflows).values({
            createdAt: cloud.created_at,
            deletedAt: cloud.deleted_at || null,
            description: cloud.description || null,
            edges: cloud.edges || [],
            id: cloud.id,
            isActive: cloud.is_active,
            lastSyncedAt: new Date().toISOString(),
            name: cloud.name,
            nodes: cloud.nodes || [],
            settings: cloud.settings || {},
            tenantId: cloud.tenant_id,
            updatedAt: cloud.updated_at,
            version: cloud.version,
          });
          pulled++;
        }
      } catch (error: any) {
        errors.push(
          `Failed to reconcile workflow ${cloud.id}: ${error?.message || error}`,
        );
      }
    }

    const syncedLocals = await db
      .select()
      .from(workflows)
      .where(
        and(eq(workflows.tenantId, tenantId), isNull(workflows.deletedAt)),
      );

    for (const local of syncedLocals) {
      if (local.lastSyncedAt && !cloudIds.has(local.id)) {
        const nowIso = new Date().toISOString();
        await db
          .update(workflows)
          .set({ deletedAt: nowIso, lastSyncedAt: nowIso })
          .where(eq(workflows.id, local.id));
        pulled++;
      }
    }
  } catch (error: any) {
    errors.push(`Failed to pull cloud workflows: ${error?.message || error}`);
  }

  return { conflicts, errors, pulled };
}

/**
 * Bidirectional synchronization for Workflows.
 */
export async function syncWorkflows(
  db: OperonDb,
  tenantId: string,
): Promise<SyncResult> {
  const pushRes = await pushLocalWorkflowsToCloud(db, tenantId);
  const pullRes = await pullCloudWorkflowsToLocal(db, tenantId);

  return {
    conflicts: pullRes.conflicts,
    errors: [...pushRes.errors, ...pullRes.errors],
    pushed: pushRes.pushed,
    pulled: pullRes.pulled,
  };
}

/**
 * Master synchronizer: runs sync across all supported offline-first entities.
 */
export async function syncAll(
  db: OperonDb,
  tenantId: string,
): Promise<{
  profiles: SyncResult;
  workflows: SyncResult;
}> {
  const [profiles, workflowResults] = await Promise.all([
    syncBrowserProfiles(db, tenantId),
    syncWorkflows(db, tenantId),
  ]);

  return {
    profiles,
    workflows: workflowResults,
  };
}
