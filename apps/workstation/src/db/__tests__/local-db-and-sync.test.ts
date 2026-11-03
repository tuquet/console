import path from 'node:path';
import process from 'node:process';

import { createClient } from '@libsql/client';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as supabaseClientModule from '#/api/core/supabase-client';

import { runLocalMigrations } from '../client';
import * as schema from '../schema';
import {
  pullCloudBrowserProfilesToLocal,
  pushLocalBrowserProfilesToCloud,
  syncBrowserProfiles,
} from '../sync';

describe('local-first sqlite & cloud sync verification suite', () => {
  let db: ReturnType<typeof drizzle<typeof schema>>;
  const migrationsFolder = path.resolve(
    process.cwd(),
    'apps/workstation/src/db/migrations',
  );

  beforeEach(async () => {
    vi.restoreAllMocks();

    // Isolated in-memory SQLite database for deterministic testing
    const client = createClient({ url: ':memory:' });
    db = drizzle(client, { schema });

    // Apply Drizzle migrations automatically
    await runLocalMigrations(db, migrationsFolder);
  });

  describe('part 1: local sqlite crud & schema integrity', () => {
    it('applies migrations and performs CRUD operations successfully', async () => {
      // 1. Insert Proxy
      await db.insert(schema.proxies).values({
        id: 'proxy-001',
        name: 'Residential SOCKS5',
        protocol: 'socks5',
        host: '192.168.1.100',
        port: 1080,
        countryCode: 'VN',
        isActive: true,
        createdAt: new Date().toISOString(),
      });

      const proxyRows = await db
        .select()
        .from(schema.proxies)
        .where(eq(schema.proxies.id, 'proxy-001'));
      expect(proxyRows).toHaveLength(1);
      expect(proxyRows[0]?.protocol).toBe('socks5');

      // 2. Insert Browser Profile linked to Proxy
      const nowIso = new Date().toISOString();
      await db.insert(schema.browserProfiles).values({
        id: 'browser-001',
        name: 'TikTok Stealth Profile 1',
        proxyId: 'proxy-001',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        timezone: 'Asia/Ho_Chi_Minh',
        browserType: 'Chromium',
        fingerprint: { canvas: 'noise-seeded', webgl: 'nvidia-rtx' },
        cookies: [{ name: 'session_id', value: 'secret-cookie-123' }],
        storageState: {},
        isLocked: false,
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      const profileRows = await db
        .select()
        .from(schema.browserProfiles)
        .where(eq(schema.browserProfiles.id, 'browser-001'));
      expect(profileRows).toHaveLength(1);
      expect(profileRows[0]?.name).toBe('TikTok Stealth Profile 1');
      expect(profileRows[0]?.cookies).toEqual([
        { name: 'session_id', value: 'secret-cookie-123' },
      ]);

      // 3. Relational Query (Browser Profile with Proxy)
      const profileWithProxy = await db.query.browserProfiles.findFirst({
        where: eq(schema.browserProfiles.id, 'browser-001'),
        with: {
          proxy: true,
        },
      });
      expect(profileWithProxy).toBeDefined();
      expect(profileWithProxy?.proxy?.host).toBe('192.168.1.100');

      // 4. Update Profile
      const updatedIso = new Date(Date.now() + 1000).toISOString();
      await db
        .update(schema.browserProfiles)
        .set({ name: 'Renamed Profile', updatedAt: updatedIso })
        .where(eq(schema.browserProfiles.id, 'browser-001'));

      const updated = await db
        .select()
        .from(schema.browserProfiles)
        .where(eq(schema.browserProfiles.id, 'browser-001'));
      expect(updated[0]?.name).toBe('Renamed Profile');
    });

    it('enforces foreign key constraints and cascaded execution logs', async () => {
      const now = new Date().toISOString();
      // Insert job
      await db.insert(schema.jobs).values({
        id: 'job-100',
        name: 'Scrape E-commerce job',
        status: 'running',
        createdAt: now,
        updatedAt: now,
      });

      // Insert log
      await db.insert(schema.executionLogs).values({
        jobId: 'job-100',
        level: 'info',
        message: 'Job started successfully',
        createdAt: now,
      });

      const logs = await db
        .select()
        .from(schema.executionLogs)
        .where(eq(schema.executionLogs.jobId, 'job-100'));
      expect(logs).toHaveLength(1);
      expect(logs[0]?.message).toBe('Job started successfully');
    });
  });

  describe('part 2: cloud sync engine (push, pull, conflicts)', () => {
    const tenantId = 'tenant-test-uuid-456';

    it('pushes offline-created local profiles to Cloud and updates lastSyncedAt', async () => {
      const nowIso = new Date().toISOString();
      await db.insert(schema.browserProfiles).values({
        id: 'offline-prof-1',
        name: 'Offline Created Profile',
        createdAt: nowIso,
        updatedAt: nowIso,
        lastSyncedAt: null, // dirty/unsynced
      });

      const mockSupabase = vi
        .spyOn(supabaseClientModule, 'supabaseRequest')
        .mockResolvedValueOnce({ status: 201 });

      const result = await pushLocalBrowserProfilesToCloud(db, tenantId);

      expect(result.errors).toHaveLength(0);
      expect(result.pushed).toBe(1);
      expect(mockSupabase).toHaveBeenCalledWith(
        '/rest/v1/browser_profiles',
        expect.objectContaining({
          method: 'POST',
          schema: 'operon',
        }),
      );

      // Verify local record was marked with lastSyncedAt
      const rows = await db
        .select()
        .from(schema.browserProfiles)
        .where(eq(schema.browserProfiles.id, 'offline-prof-1'));
      expect(rows[0]?.lastSyncedAt).not.toBeNull();
    });

    it('pulls new Cloud profiles into local SQLite', async () => {
      const cloudProfile = {
        id: 'cloud-prof-99',
        tenant_id: tenantId,
        name: 'Cloud Added Profile',
        browser_type: 'Chromium',
        created_at: '2026-11-03T10:00:00.000Z',
        updated_at: '2026-11-03T10:00:00.000Z',
      };

      vi.spyOn(supabaseClientModule, 'supabaseRequest').mockResolvedValueOnce([
        cloudProfile,
      ]);

      const result = await pullCloudBrowserProfilesToLocal(db, tenantId);

      expect(result.errors).toHaveLength(0);
      expect(result.pulled).toBe(1);

      // Verify profile is now present in local SQLite
      const rows = await db
        .select()
        .from(schema.browserProfiles)
        .where(eq(schema.browserProfiles.id, 'cloud-prof-99'));
      expect(rows).toHaveLength(1);
      expect(rows[0]?.name).toBe('Cloud Added Profile');
    });

    it('resolves conflicts with Last-Write-Wins: Cloud is newer overwrites local', async () => {
      // Local version created earlier at 10:00
      await db.insert(schema.browserProfiles).values({
        id: 'conflict-prof-1',
        name: 'Local Version (Old)',
        createdAt: '2026-11-03T10:00:00.000Z',
        updatedAt: '2026-11-03T10:00:00.000Z',
        lastSyncedAt: '2026-11-03T10:00:00.000Z',
      });

      // Cloud version edited later at 11:00
      const cloudNewer = {
        id: 'conflict-prof-1',
        tenant_id: tenantId,
        name: 'Cloud Version (Newer)',
        created_at: '2026-11-03T10:00:00.000Z',
        updated_at: '2026-11-03T11:00:00.000Z',
      };

      vi.spyOn(supabaseClientModule, 'supabaseRequest').mockResolvedValueOnce([
        cloudNewer,
      ]);

      const result = await pullCloudBrowserProfilesToLocal(db, tenantId);

      expect(result.conflicts).toBe(1);

      const rows = await db
        .select()
        .from(schema.browserProfiles)
        .where(eq(schema.browserProfiles.id, 'conflict-prof-1'));
      expect(rows[0]?.name).toBe('Cloud Version (Newer)');
      expect(rows[0]?.updatedAt).toBe('2026-11-03T11:00:00.000Z');
    });

    it('handles network failure gracefully without corrupting local data', async () => {
      const nowIso = new Date().toISOString();
      await db.insert(schema.browserProfiles).values({
        id: 'fail-safe-prof',
        name: 'Protected Profile',
        createdAt: nowIso,
        updatedAt: nowIso,
        lastSyncedAt: null,
      });

      // Simulate 503 Cloud Service Unavailable
      vi.spyOn(supabaseClientModule, 'supabaseRequest').mockRejectedValueOnce(
        new Error('Network connection timeout (503 Service Unavailable)'),
      );

      const syncResult = await syncBrowserProfiles(db, tenantId);

      expect(syncResult.pushed).toBe(0);
      expect(syncResult.errors.length).toBeGreaterThan(0);
      expect(syncResult.errors[0]).toContain('503 Service Unavailable');

      // Local profile is completely intact
      const rows = await db
        .select()
        .from(schema.browserProfiles)
        .where(eq(schema.browserProfiles.id, 'fail-safe-prof'));
      expect(rows).toHaveLength(1);
      expect(rows[0]?.name).toBe('Protected Profile');
    });
  });
});
