import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildDynamicVxeFormSchema,
  computeDirtyMutablePayload,
  evaluateRowRlsPolicy,
  executeDynamicSupabasePatch,
  inferResourceFromRouteAndRow,
  SUPABASE_TABLE_REGISTRY,
} from '../supabase-schema-registry';

const mockSupabaseRequest = vi.fn();

vi.mock('../supabase-client', () => ({
  SUPABASE_SCHEMA: {
    AUTOMA: 'automa',
    BILLING: 'billing',
    COMMERCE: 'commerce',
    EVENTS: 'events',
    MEDIA: 'media',
    PUBLIC: 'public',
    RUNNERS: 'runners',
  },
  supabaseRequest: (...args: any[]) => mockSupabaseRequest(...args),
}));

describe('supabase-schema-registry — Enterprise Dynamic Schema & RLS Engine', () => {
  beforeEach(() => {
    mockSupabaseRequest.mockReset();
  });

  it('registers all 18 canonical Supabase tables across 5 PostgREST schemas', () => {
    const keys = Object.keys(SUPABASE_TABLE_REGISTRY);
    expect(keys).toHaveLength(18);
    expect(keys).toEqual(
      expect.arrayContaining([
        'public.tenants',
        'automa.workflows',
        'automa.campaign_runs',
        'runners.devices',
        'runners.browsers',
        'runners.proxies',
        'commerce.orders',
        'commerce.products',
        'billing.wallet_transactions',
        'billing.payment_intents',
        'billing.payment_gateways',
        'billing.plans',
        'billing.subscriptions',
        'public.system_plugins',
        'public.profiles',
        'public.roles',
        'public.permissions',
        'public.audit_logs',
      ]),
    );
  });

  it('infers resource accurately from route paths and multi-grid row shapes', () => {
    expect(inferResourceFromRouteAndRow('/tenants', {})).toBe('public.tenants');
    expect(inferResourceFromRouteAndRow('/automation/workflows', {})).toBe(
      'automa.workflows',
    );
    expect(
      inferResourceFromRouteAndRow('/commerce/admin', {
        name: 'License Pro',
        product_type: 'serial_stock',
        visibility: 'public',
      }),
    ).toBe('commerce.products');
    expect(
      inferResourceFromRouteAndRow('/commerce/admin', {
        credits_amount: 500,
        reference_code: ' PAY_123',
      }),
    ).toBe('billing.payment_intents');
    expect(
      inferResourceFromRouteAndRow('/commerce/admin', {
        provider_code: 'bank_transfer',
        rate_per_credit: 1000,
      }),
    ).toBe('billing.payment_gateways');
    expect(
      inferResourceFromRouteAndRow('/system/roles', {
        is_system: true,
        name: 'owner',
        permission_count: 36,
      }),
    ).toBe('public.roles');
    expect(
      inferResourceFromRouteAndRow('/system/roles', {
        description: 'Manage workflows',
        id: 'automa.workflows.manage',
        module: 'automa',
      }),
    ).toBe('public.permissions');
  });

  it('evaluates Row-Level Security (RLS) policies accurately for immutable ledgers, system roles, and tenant RBAC', () => {
    const superadminAccess = {
      isSuperadmin: true,
      permissions: ['*'],
      tenantPermissions: {},
    };
    const viewerAccess = {
      isSuperadmin: false,
      permissions: ['automa.workflows.view'],
      tenantPermissions: {
        t_1: ['automa.workflows.view'],
      },
    };
    const managerAccess = {
      isSuperadmin: false,
      permissions: ['automa.workflows.manage'],
      tenantPermissions: {
        t_1: ['automa.workflows.manage'],
      },
    };

    // 1. Immutable append-only ledgers lock UPDATE even for superadmin
    const auditRls = evaluateRowRlsPolicy(
      'public.audit_logs',
      { id: 'log_1' },
      superadminAccess,
    );
    expect(auditRls.canUpdate.allowed).toBe(false);
    expect(auditRls.canUpdate.policyName).toBe('rls_append_only_ledger');

    const walletRls = evaluateRowRlsPolicy(
      'billing.wallet_transactions',
      { id: 'tx_1' },
      superadminAccess,
    );
    expect(walletRls.canUpdate.allowed).toBe(false);

    // 2. System roles (is_system: true) lock UPDATE even for superadmin
    const sysRoleRls = evaluateRowRlsPolicy(
      'public.roles',
      { id: 'r_owner', is_system: true, name: 'owner' },
      superadminAccess,
    );
    expect(sysRoleRls.canUpdate.allowed).toBe(false);
    expect(sysRoleRls.canUpdate.policyName).toBe('roles_system_immutable');

    // Custom role allows UPDATE when authorized
    const customRoleRls = evaluateRowRlsPolicy(
      'public.roles',
      { id: 'r_custom', is_system: false, name: 'ops' },
      superadminAccess,
    );
    expect(customRoleRls.canUpdate.allowed).toBe(true);

    // 3. Tenant RBAC enforcement on automa.workflows
    const viewerWorkflowRls = evaluateRowRlsPolicy(
      'automa.workflows',
      { id: 'wf_1', tenant_id: 't_1' },
      viewerAccess,
    );
    expect(viewerWorkflowRls.canUpdate.allowed).toBe(false);

    const managerWorkflowRls = evaluateRowRlsPolicy(
      'automa.workflows',
      { id: 'wf_1', tenant_id: 't_1' },
      managerAccess,
    );
    expect(managerWorkflowRls.canUpdate.allowed).toBe(true);
  });

  it('builds dynamic VxeForm schema merging grid columns, hidden mobile DB columns, and enum options', () => {
    const row = {
      _X_ROW_KEY: 'row_99',
      created_at: '2026-10-14T12:00:00Z',
      description: 'Sync TikTok shop orders',
      id: 'wf_01',
      name: 'TikTok Sync',
      nodeCount: 12,
      status: 'published',
      triggerSummary: 'Cron 5m',
      version: '1.2.0',
    };

    // Simulate mobile grid where only name and actions are in gridColumns
    const mobileGridColumns = [
      { field: 'name', title: 'common.name' },
      { field: 'actions', title: 'common.actions' },
    ];

    const schema = buildDynamicVxeFormSchema({
      gridColumns: mobileGridColumns,
      resource: 'automa.workflows',
      row,
      translate: (k) => k,
    });

    expect(schema.title).toBe('TikTok Sync');
    expect(schema.rls.canUpdate.allowed).toBe(true);

    const fieldMap = new Map(schema.fields.map((f) => [f.field, f]));
    // Hidden mobile columns (description, version, status, nodeCount, triggerSummary, id) are surfaced!
    expect(fieldMap.get('name')?.editable).toBe(true);
    expect(fieldMap.get('description')?.editable).toBe(true);
    expect(fieldMap.get('description')?.type).toBe('textarea');
    expect(fieldMap.get('version')?.editable).toBe(true);
    expect(fieldMap.get('status')?.editable).toBe(true);
    expect(fieldMap.get('status')?.options?.length).toBeGreaterThanOrEqual(3);
    expect(fieldMap.get('id')?.editable).toBe(false);
    expect(fieldMap.get('nodeCount')?.editable).toBe(false);
    expect(fieldMap.has('_X_ROW_KEY')).toBe(false);
  });

  it('locks core plugin status field while keeping name/description editable for superadmin', () => {
    const corePluginRow = {
      description: 'Core IAM',
      id: 'core-iam',
      is_core: true,
      name: 'Core IAM',
      status: 'installed',
      version: '1.0.0',
    };

    const schema = buildDynamicVxeFormSchema({
      resource: 'public.system_plugins',
      row: corePluginRow,
    });

    const fieldMap = new Map(schema.fields.map((f) => [f.field, f]));
    expect(fieldMap.get('name')?.editable).toBe(true);
    expect(fieldMap.get('status')?.editable).toBe(false);
  });

  it('computes dirty mutable payload and executes PostgREST PATCH with schema profile header', async () => {
    const originalRow = {
      created_at: '2026-10-14T00:00:00Z',
      description: 'Old desc',
      id: 'wf_123',
      name: 'Old Name',
      nodeCount: 8,
      status: 'draft',
      version: '1.0.0',
    };

    const formData = {
      ...originalRow,
      name: 'New Name',
      nodeCount: 999, // Virtual read-only field: must be stripped!
      status: 'published',
    };

    const dirty = computeDirtyMutablePayload(
      originalRow,
      formData,
      'automa.workflows',
    );
    expect(dirty).toEqual({
      name: 'New Name',
      status: 'published',
    });
    expect(dirty).not.toHaveProperty('nodeCount');

    mockSupabaseRequest.mockResolvedValueOnce([
      {
        ...originalRow,
        name: 'New Name',
        status: 'published',
      },
    ]);

    const result = await executeDynamicSupabasePatch(
      'automa.workflows',
      originalRow,
      formData,
    );

    expect(result.skipped).toBe(false);
    expect(result.updatedRow.name).toBe('New Name');
    expect(result.updatedRow.status).toBe('published');
    expect(mockSupabaseRequest).toHaveBeenCalledWith(
      '/rest/v1/workflows?id=eq.wf_123',
      expect.objectContaining({
        body: JSON.stringify({ name: 'New Name', status: 'published' }),
        method: 'PATCH',
        preferRepresentation: true,
        schema: 'automa',
      }),
    );
  });

  it('normalizes colon and dot permission delimiters and builds complete /system/* schemas', () => {
    const colonManagerAccess = {
      isSuperadmin: false,
      permissions: ['roles:manage'],
      tenantPermissions: {},
    };

    const customRoleRow = {
      created_at: '2026-10-15T00:00:00Z',
      description: 'Custom DevOps role',
      id: 'role_devops',
      is_system: false,
      name: 'devops',
      permission_count: 4,
      permissions: ['runners:devices:view', 'runners:devices:manage'],
    };

    const roleSchema = buildDynamicVxeFormSchema({
      access: colonManagerAccess,
      resource: 'public.roles',
      row: customRoleRow,
    });
    expect(roleSchema.rls.canUpdate.allowed).toBe(true);
    const roleFieldMap = new Map(roleSchema.fields.map((f) => [f.field, f]));
    expect(roleFieldMap.get('name')?.editable).toBe(true);
    expect(roleFieldMap.get('description')?.editable).toBe(true);
    expect(roleFieldMap.get('is_system')?.editable).toBe(false);

    // Billing plan schema excludes non-existent price_yearly_usd and exposes metadata as JSON
    const planSchema = buildDynamicVxeFormSchema({
      resource: 'billing.plans',
      row: {
        created_at: '2026-10-15T00:00:00Z',
        description: 'Pro tier',
        id: 'pro',
        is_active: true,
        max_members: 25,
        max_monthly_runs: 50_000,
        max_storage_mb: 10_240,
        metadata: { badge: 'popular' },
        name: 'Pro Plan',
        price_monthly_usd: 49,
      },
    });
    const planFieldMap = new Map(planSchema.fields.map((f) => [f.field, f]));
    expect(planFieldMap.has('price_yearly_usd')).toBe(false);
    expect(planFieldMap.get('price_monthly_usd')?.editable).toBe(true);
    expect(planFieldMap.get('metadata')?.group).toBe('json');
    expect(planFieldMap.get('metadata')?.editable).toBe(true);
  });
});
