import type { OperonDb } from './client';

import { SUPABASE_SCHEMA } from '@operon/constants';

import { eq, gt, isNull, or } from 'drizzle-orm';

import { supabaseRequest } from '#/api/core/supabase-client';

import { browserProfiles } from './schema';

export interface SyncResult {
  pushed: number;
  pulled: number;
  conflicts: number;
  errors: string[];
}

export interface CloudBrowserProfile {
  id: string;
  tenant_id: string;
  name: string;
  release_id?: null | string;
  template_id?: null | string;
  proxy_id?: null | string;
  fingerprint?: Record<string, unknown>;
  cookies?: Record<string, unknown>[];
  storage_state?: Record<string, unknown>;
  is_locked?: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Pushes dirty local browser profiles (created/updated offline) to Supabase Cloud.
 */
export async function pushLocalBrowserProfilesToCloud(
  db: OperonDb,
  tenantId: string,
): Promise<{ pushed: number; errors: string[] }> {
  const errors: string[] = [];
  let pushed = 0;

  try {
    // Find profiles that are un-synced or modified after last sync
    const dirtyProfiles = await db
      .select()
      .from(browserProfiles)
      .where(
        or(
          isNull(browserProfiles.lastSyncedAt),
          gt(browserProfiles.updatedAt, browserProfiles.lastSyncedAt),
        ),
      );

    for (const local of dirtyProfiles) {
      try {
        const payload: CloudBrowserProfile = {
          id: local.id,
          tenant_id: tenantId,
          name: local.name,
          release_id: local.releaseId,
          template_id: local.templateId,
          proxy_id: local.proxyId,
          fingerprint: (local.fingerprint as Record<string, unknown>) || {},
          cookies: (local.cookies as Record<string, unknown>[]) || [],
          storage_state: (local.storageState as Record<string, unknown>) || {},
          is_locked: local.isLocked,
          created_at: local.createdAt,
          updated_at: local.updatedAt,
        };

        // Upsert to Supabase Cloud operon.browser_profiles
        await supabaseRequest('/rest/v1/browser_profiles', {
          method: 'POST',
          schema: SUPABASE_SCHEMA.OPERON,
          headers: {
            Prefer: 'resolution=merge-duplicates,return=minimal',
          },
          body: JSON.stringify(payload),
        });

        // Mark local record as synced
        const nowIso = new Date().toISOString();
        await db
          .update(browserProfiles)
          .set({ lastSyncedAt: nowIso })
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

  return { pushed, errors };
}

/**
 * Pulls browser profiles from Supabase Cloud and reconciles with local SQLite.
 * Employs Last-Write-Wins (LWW) conflict resolution based on updated_at.
 */
export async function pullCloudBrowserProfilesToLocal(
  db: OperonDb,
  tenantId: string,
): Promise<{ pulled: number; conflicts: number; errors: string[] }> {
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
      return { pulled, conflicts, errors };
    }

    for (const cloud of cloudProfiles) {
      try {
        const localMatches = await db
          .select()
          .from(browserProfiles)
          .where(eq(browserProfiles.id, cloud.id));

        const local = localMatches[0];

        if (local) {
          // Conflict Resolution: Last-Write-Wins (LWW)
          const cloudTime = new Date(cloud.updated_at).getTime();
          const localTime = new Date(local.updatedAt).getTime();

          if (cloudTime > localTime) {
            // Cloud is newer -> overwrite local
            await db
              .update(browserProfiles)
              .set({
                name: cloud.name,
                releaseId: cloud.release_id || null,
                templateId: cloud.template_id || null,
                proxyId: cloud.proxy_id || null,
                fingerprint: cloud.fingerprint || {},
                cookies: cloud.cookies || [],
                storageState: cloud.storage_state || {},
                isLocked: cloud.is_locked ?? false,
                updatedAt: cloud.updated_at,
                lastSyncedAt: new Date().toISOString(),
              })
              .where(eq(browserProfiles.id, local.id));
            pulled++;
            conflicts++;
          }
        } else {
          // New record from Cloud -> Insert into Local SQLite
          await db.insert(browserProfiles).values({
            id: cloud.id,
            name: cloud.name,
            releaseId: cloud.release_id || null,
            templateId: cloud.template_id || null,
            proxyId: cloud.proxy_id || null,
            fingerprint: cloud.fingerprint || {},
            cookies: cloud.cookies || [],
            storageState: cloud.storage_state || {},
            isLocked: cloud.is_locked ?? false,
            createdAt: cloud.created_at,
            updatedAt: cloud.updated_at,
            lastSyncedAt: new Date().toISOString(),
          });
          pulled++;
        }
      } catch (error: any) {
        errors.push(
          `Failed to reconcile profile ${cloud.id}: ${error?.message || error}`,
        );
      }
    }
  } catch (error: any) {
    errors.push(`Failed to pull cloud profiles: ${error?.message || error}`);
  }

  return { pulled, conflicts, errors };
}

/**
 * Full bidirectional synchronization orchestrator.
 */
export async function syncBrowserProfiles(
  db: OperonDb,
  tenantId: string,
): Promise<SyncResult> {
  const pushRes = await pushLocalBrowserProfilesToCloud(db, tenantId);
  const pullRes = await pullCloudBrowserProfilesToLocal(db, tenantId);

  return {
    pushed: pushRes.pushed,
    pulled: pullRes.pulled,
    conflicts: pullRes.conflicts,
    errors: [...pushRes.errors, ...pullRes.errors],
  };
}
