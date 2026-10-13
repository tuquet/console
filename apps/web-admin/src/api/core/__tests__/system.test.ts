import { beforeEach, describe, expect, it, vi } from 'vitest';

import { supabaseRequest } from '../supabase-client';
import {
  getBillingPlansApi,
  getGlobalAuditLogsApi,
  getPlatformSubscriptionsApi,
  getPlatformUsersApi,
  getSystemPermissionsApi,
  getSystemPluginsApi,
  getSystemRolesApi,
  groupPermissionsByModule,
  isCorePlugin,
  mapRawBillingPlan,
  mapRawGlobalAuditLog,
  mapRawPlatformSubscription,
  mapRawPlatformUser,
  mapRawPlugin,
  mapRawSystemRole,
} from '../system';

vi.mock('../supabase-client', () => ({
  supabaseRequest: vi.fn(),
}));

describe('system core api & helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isCorePlugin', () => {
    it('should return true for all 6 core kernel plugins', () => {
      expect(isCorePlugin('core-iam')).toBe(true);
      expect(isCorePlugin('runners')).toBe(true);
      expect(isCorePlugin('automa')).toBe(true);
      expect(isCorePlugin('storage')).toBe(true);
      expect(isCorePlugin('subscriptions')).toBe(true);
      expect(isCorePlugin('webhooks')).toBe(true);
    });

    it('should return false for custom or empty plugin IDs', () => {
      expect(isCorePlugin('custom-ai')).toBe(false);
      expect(isCorePlugin('')).toBe(false);
    });
  });

  describe('mapRawPlugin', () => {
    it('should map valid raw plugin row and identify core plugin', () => {
      const raw = {
        description: 'Multi-Tenant IAM Kernel',
        id: 'core-iam',
        installed_at: '2026-10-11T00:00:00Z',
        manifest: { author: 'Tuquet' },
        name: 'Core IAM',
        schema_name: 'public',
        status: 'installed',
        version: '1.0.0',
      };

      const result = mapRawPlugin(raw);

      expect(result).toEqual({
        dependencies: [],
        description: 'Multi-Tenant IAM Kernel',
        id: 'core-iam',
        installed_at: '2026-10-11T00:00:00Z',
        is_core: true,
        is_system: true,
        manifest: { author: 'Tuquet' },
        metadata: {},
        name: 'Core IAM',
        schema_name: 'public',
        status: 'installed',
        version: '1.0.0',
      });
    });

    it('should provide safe defaults for incomplete rows', () => {
      const raw = { id: 'dynamic-extra' };
      const result = mapRawPlugin(raw);

      expect(result.id).toBe('dynamic-extra');
      expect(result.is_core).toBe(false);
      expect(result.version).toBe('1.0.0');
      expect(result.status).toBe('installed');
      expect(result.name).toBe('dynamic-extra');
    });
  });

  describe('mapRawBillingPlan', () => {
    it('should parse plan fields with string prices into clean numeric structure', () => {
      const raw = {
        created_at: '2026-10-01T00:00:00Z',
        description: 'Starter Plan',
        id: 'starter',
        is_active: true,
        max_members: 10,
        max_monthly_runs: 5000,
        max_storage_mb: 2048,
        name: 'Starter Tier',
        price_monthly_usd: '19.99',
      };

      const result = mapRawBillingPlan(raw);

      expect(result).toEqual({
        created_at: '2026-10-01T00:00:00Z',
        description: 'Starter Plan',
        id: 'starter',
        is_active: true,
        max_members: 10,
        max_monthly_runs: 5000,
        max_storage_mb: 2048,
        metadata: {},
        name: 'Starter Tier',
        price_monthly_usd: 19.99,
      });
    });
  });

  describe('superadmin mappers', () => {
    it('should map raw profile with tenant count', () => {
      const raw = {
        avatar_url: 'https://example.com/a.jpg',
        created_at: '2026-10-01T00:00:00Z',
        email: 'user@tuquet.com',
        full_name: 'Test User',
        id: 'u-99',
        tenant_members: [{ count: 4 }],
      };
      const result = mapRawPlatformUser(raw);
      expect(result.id).toBe('u-99');
      expect(result.full_name).toBe('Test User');
      expect(result.tenant_count).toBe(4);
      expect(result.avatar_url).toBe('https://example.com/a.jpg');
    });

    it('should map raw audit log with safe defaults', () => {
      const raw = {
        action: 'auth:login',
        entity_id: 'u-1',
        id: 42,
        tenant_id: 't-1',
      };
      const result = mapRawGlobalAuditLog(raw);
      expect(result.id).toBe(42);
      expect(result.action).toBe('auth:login');
      expect(result.entity_type).toBe('system');
      expect(result.actor_id).toBeNull();
    });

    it('should map raw platform subscription with plan and tenant join', () => {
      const raw = {
        cancel_at_period_end: false,
        id: 'sub-1',
        plan_id: 'enterprise',
        plans: { name: 'Enterprise VIP', price_monthly_usd: '199' },
        status: 'active',
        tenant_id: 't-1',
        tenants: { name: 'Alpha Org', slug: 'alpha' },
      };
      const result = mapRawPlatformSubscription(raw);
      expect(result.plan_name).toBe('Enterprise VIP');
      expect(result.price_monthly_usd).toBe(199);
      expect(result.tenant_name).toBe('Alpha Org');
      expect(result.tenant_slug).toBe('alpha');
    });

    it('should map raw system role with permissions list', () => {
      const raw = {
        description: 'Standard member',
        id: 'r-mem',
        name: 'member',
        role_permissions: [{ permission_id: 'runners:devices:read' }],
      };
      const result = mapRawSystemRole(raw);
      expect(result.name).toBe('member');
      expect(result.permissions).toEqual(['runners:devices:read']);
    });
  });

  describe('api functions for system catalog', () => {
    it('should query getSystemPluginsApi from public.system_plugins', async () => {
      vi.mocked(supabaseRequest).mockResolvedValueOnce([
        {
          id: 'core-iam',
          name: 'Core IAM',
          status: 'installed',
        },
      ]);

      const plugins = await getSystemPluginsApi();

      expect(supabaseRequest).toHaveBeenCalledWith(
        expect.stringContaining('/rest/v1/system_plugins?select='),
      );
      expect(plugins).toHaveLength(1);
      expect(plugins[0]?.is_core).toBe(true);
    });

    it('should query getBillingPlansApi with schema billing', async () => {
      vi.mocked(supabaseRequest).mockResolvedValueOnce([
        {
          id: 'free',
          max_members: 3,
          name: 'Free Tier',
          price_monthly_usd: 0,
        },
      ]);

      const plans = await getBillingPlansApi();

      expect(supabaseRequest).toHaveBeenCalledWith(
        expect.stringContaining('/rest/v1/plans?select='),
        { schema: 'billing' },
      );
      expect(plans).toHaveLength(1);
      expect(plans[0]?.name).toBe('Free Tier');
    });

    it('should query getPlatformUsersApi from public.profiles with tenant count', async () => {
      vi.mocked(supabaseRequest).mockResolvedValueOnce([
        {
          avatar_url: 'https://example.com/avatar.png',
          created_at: '2026-10-10T00:00:00Z',
          email: 'admin@tuquet.com',
          full_name: 'Admin User',
          id: 'u-1',
          tenant_members: [{ count: 3 }],
        },
      ]);

      const users = await getPlatformUsersApi({ search: 'Admin' });

      expect(supabaseRequest).toHaveBeenCalledWith(
        expect.stringContaining('/rest/v1/profiles?select='),
      );
      expect(users).toHaveLength(1);
      expect(users[0]?.full_name).toBe('Admin User');
      expect(users[0]?.tenant_count).toBe(3);
    });

    it('should query getGlobalAuditLogsApi from public.audit_logs', async () => {
      vi.mocked(supabaseRequest).mockResolvedValueOnce([
        {
          action: 'member:invited',
          actor_id: 'u-1',
          created_at: '2026-10-11T00:00:00Z',
          entity_id: 'm-1',
          entity_type: 'tenant_member',
          id: 101,
          tenant_id: 't-1',
        },
      ]);

      const logs = await getGlobalAuditLogsApi({
        action: 'invited',
        tenantId: 't-1',
      });

      expect(supabaseRequest).toHaveBeenCalledWith(
        expect.stringContaining('/rest/v1/audit_logs?select='),
      );
      expect(logs).toHaveLength(1);
      expect(logs[0]?.action).toBe('member:invited');
      expect(logs[0]?.id).toBe(101);
    });

    it('should query getPlatformSubscriptionsApi with schema billing and join', async () => {
      vi.mocked(supabaseRequest).mockResolvedValueOnce([
        {
          cancel_at_period_end: false,
          created_at: '2026-10-12T00:00:00Z',
          id: 'sub-1',
          plan_id: 'pro',
          plans: { name: 'Pro Plan', price_monthly_usd: 49 },
          status: 'active',
          tenant_id: 't-1',
          tenants: { name: 'Acme Corp', slug: 'acme' },
        },
      ]);

      const subs = await getPlatformSubscriptionsApi();

      expect(supabaseRequest).toHaveBeenCalledWith(
        expect.stringContaining('/rest/v1/subscriptions?select='),
        { schema: 'billing' },
      );
      expect(subs).toHaveLength(1);
      expect(subs[0]?.tenant_name).toBe('Acme Corp');
      expect(subs[0]?.plan_name).toBe('Pro Plan');
      expect(subs[0]?.price_monthly_usd).toBe(49);
    });

    it('should query getSystemRolesApi and map role_permissions', async () => {
      vi.mocked(supabaseRequest).mockResolvedValueOnce([
        {
          description: 'Tenant Owner',
          id: 'role-owner',
          is_system: true,
          name: 'owner',
          role_permissions: [
            { permission_id: 'tenants:manage' },
            { permission_id: 'runners:devices:manage' },
          ],
        },
      ]);

      const roles = await getSystemRolesApi();

      expect(supabaseRequest).toHaveBeenCalledWith(
        expect.stringContaining('/rest/v1/roles?select='),
      );
      expect(roles).toHaveLength(1);
      expect(roles[0]?.name).toBe('owner');
      expect(roles[0]?.permissions).toEqual([
        'tenants:manage',
        'runners:devices:manage',
      ]);
    });

    it('should query getSystemPermissionsApi and group permissions by module', async () => {
      vi.mocked(supabaseRequest).mockResolvedValueOnce([
        {
          description: 'Read devices',
          id: 'runners:devices:read',
          module: 'runners',
        },
        {
          description: 'Manage devices',
          id: 'runners:devices:manage',
          module: 'runners',
        },
        {
          description: 'Read workflows',
          id: 'automa:workflows:read',
          module: 'automa',
        },
      ]);

      const perms = await getSystemPermissionsApi();

      expect(perms).toHaveLength(3);
      const grouped = groupPermissionsByModule(perms);
      expect(Object.keys(grouped)).toEqual(['runners', 'automa']);
      expect(grouped.runners).toHaveLength(2);
      expect(grouped.automa).toHaveLength(1);
    });
  });
});
