import { supabaseRequest } from './supabase-client';

export interface SystemPluginItem {
  dependencies?: string[];
  description: null | string;
  id: string;
  installed_at: string;
  is_core: boolean;
  is_system?: boolean;
  manifest: Record<string, any>;
  metadata?: Record<string, any>;
  name: string;
  schema_name: null | string;
  status: 'disabled' | 'installed' | 'pending' | string;
  version: string;
}

export interface BillingPlanItem {
  created_at: string;
  description: null | string;
  id: string;
  is_active: boolean;
  max_members: number;
  max_monthly_runs: number;
  max_storage_mb: number;
  metadata: Record<string, any>;
  name: string;
  price_monthly_usd: number;
}

export interface PlatformUserItem {
  avatar_url: null | string;
  created_at: string;
  email?: null | string;
  full_name: null | string;
  id: string;
  tenant_count: number;
  updated_at: string;
}

export interface GlobalAuditLogItem {
  action: string;
  actor_id: null | string;
  created_at: string;
  entity_id: string;
  entity_type: string;
  id: number | string;
  ip_address: null | string;
  new_values: null | Record<string, any>;
  old_values: null | Record<string, any>;
  tenant_id: string;
  user_agent: null | string;
}

export interface PlatformSubscriptionItem {
  cancel_at_period_end: boolean;
  created_at: string;
  current_period_end: string;
  current_period_start: string;
  id: string;
  plan_id: string;
  plan_name: string;
  price_monthly_usd: number;
  status:
    | 'active'
    | 'canceled'
    | 'free_tier'
    | 'past_due'
    | 'trialing'
    | 'unpaid'
    | string;
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
}

export interface SystemPermissionItem {
  description: null | string;
  id: string;
  module: string;
}

export interface SystemRoleItem {
  created_at: string;
  description: null | string;
  id: string;
  is_system: boolean;
  name: string;
  permissions: string[];
}

const CORE_PLUGIN_IDS = new Set([
  'automa',
  'core-iam',
  'runners',
  'storage',
  'subscriptions',
  'webhooks',
]);

/**
 * Pure function: Kiểm tra xem một plugin ID có thuộc 6 Core Kernel Plugins hay không
 */
export function isCorePlugin(id: string): boolean {
  if (!id) return false;
  return CORE_PLUGIN_IDS.has(id.toLowerCase());
}

/**
 * Pure function: Map bản ghi raw từ public.system_plugins sang SystemPluginItem
 */
export function mapRawPlugin(raw: any): SystemPluginItem {
  const pluginId = String(raw.id ?? '');
  const core = isCorePlugin(pluginId);
  return {
    dependencies: Array.isArray(raw.dependencies) ? raw.dependencies : [],
    description: raw.description ?? null,
    id: pluginId,
    installed_at: raw.installed_at || new Date().toISOString(),
    is_core: core,
    is_system: core,
    manifest:
      raw.manifest && typeof raw.manifest === 'object' ? raw.manifest : {},
    metadata:
      raw.metadata && typeof raw.metadata === 'object' ? raw.metadata : {},
    name: raw.name || pluginId || 'Unnamed Plugin',
    schema_name: raw.schema_name ?? null,
    status: raw.status || 'installed',
    version: raw.version || '1.0.0',
  };
}

/**
 * Pure function: Map bản ghi raw từ billing.plans sang BillingPlanItem
 */
export function mapRawBillingPlan(raw: any): BillingPlanItem {
  const price =
    typeof raw.price_monthly_usd === 'number'
      ? raw.price_monthly_usd
      : Number(raw.price_monthly_usd) || 0;

  return {
    created_at: raw.created_at || new Date().toISOString(),
    description: raw.description ?? null,
    id: String(raw.id ?? ''),
    is_active: typeof raw.is_active === 'boolean' ? raw.is_active : true,
    max_members: typeof raw.max_members === 'number' ? raw.max_members : 5,
    max_monthly_runs:
      typeof raw.max_monthly_runs === 'number' ? raw.max_monthly_runs : 1000,
    max_storage_mb:
      typeof raw.max_storage_mb === 'number' ? raw.max_storage_mb : 500,
    metadata:
      raw.metadata && typeof raw.metadata === 'object' ? raw.metadata : {},
    name: raw.name || String(raw.id ?? '') || 'Unnamed Plan',
    price_monthly_usd: price,
  };
}

/**
 * Lấy danh sách các plugins hệ thống từ public.system_plugins
 */
export async function getSystemPluginsApi(): Promise<SystemPluginItem[]> {
  try {
    const data = await supabaseRequest<any[]>(
      '/rest/v1/system_plugins?select=*&order=installed_at.asc',
    );
    if (!Array.isArray(data)) return [];
    return data.map((row) => mapRawPlugin(row));
  } catch (error) {
    console.error('[System] Failed to load system plugins:', error);
    return [];
  }
}

/**
 * Lấy danh sách các gói cước SaaS từ billing.plans (schema: billing)
 */
export async function getBillingPlansApi(): Promise<BillingPlanItem[]> {
  try {
    const data = await supabaseRequest<any[]>(
      '/rest/v1/plans?select=*&order=price_monthly_usd.asc',
      { schema: 'billing' },
    );
    if (!Array.isArray(data)) return [];
    return data.map((row) => mapRawBillingPlan(row));
  } catch (error) {
    console.error('[System] Failed to load billing plans:', error);
    return [];
  }
}

/**
 * Pure function: Map bản ghi raw từ public.profiles sang PlatformUserItem
 */
export function mapRawPlatformUser(raw: any): PlatformUserItem {
  let tenantCount = 0;
  if (Array.isArray(raw.tenant_members)) {
    tenantCount = raw.tenant_members[0]?.count ?? raw.tenant_members.length;
  } else if (typeof raw.tenant_members?.count === 'number') {
    tenantCount = raw.tenant_members.count;
  }

  return {
    avatar_url: raw.avatar_url ?? null,
    created_at: raw.created_at || new Date().toISOString(),
    email: raw.email ?? null,
    full_name: raw.full_name || 'Người dùng ẩn danh',
    id: String(raw.id ?? ''),
    tenant_count: Number(tenantCount) || 0,
    updated_at: raw.updated_at || raw.created_at || new Date().toISOString(),
  };
}

/**
 * Pure function: Map bản ghi raw từ public.audit_logs sang GlobalAuditLogItem
 */
export function mapRawGlobalAuditLog(raw: any): GlobalAuditLogItem {
  return {
    action: raw.action || 'unknown',
    actor_id: raw.actor_id ?? null,
    created_at: raw.created_at || new Date().toISOString(),
    entity_id: String(raw.entity_id ?? ''),
    entity_type: raw.entity_type || 'system',
    id: raw.id ?? '',
    ip_address: raw.ip_address ?? null,
    new_values:
      raw.new_values && typeof raw.new_values === 'object'
        ? raw.new_values
        : null,
    old_values:
      raw.old_values && typeof raw.old_values === 'object'
        ? raw.old_values
        : null,
    tenant_id: String(raw.tenant_id ?? ''),
    user_agent: raw.user_agent ?? null,
  };
}

/**
 * Pure function: Map bản ghi raw từ billing.subscriptions sang PlatformSubscriptionItem
 */
export function mapRawPlatformSubscription(raw: any): PlatformSubscriptionItem {
  const plan = raw.plans || {};
  const tenant = raw.tenants || {};

  return {
    cancel_at_period_end: Boolean(raw.cancel_at_period_end),
    created_at: raw.created_at || new Date().toISOString(),
    current_period_end: raw.current_period_end || new Date().toISOString(),
    current_period_start: raw.current_period_start || new Date().toISOString(),
    id: String(raw.id ?? ''),
    plan_id: String(raw.plan_id ?? ''),
    plan_name: plan.name || raw.plan_id || 'Free Tier',
    price_monthly_usd: Number(plan.price_monthly_usd) || 0,
    status: raw.status || 'free_tier',
    tenant_id: String(raw.tenant_id ?? ''),
    tenant_name: tenant.name || 'Không rõ Workspace',
    tenant_slug: tenant.slug || '',
  };
}

/**
 * Pure function: Map bản ghi raw từ public.roles sang SystemRoleItem
 */
export function mapRawSystemRole(raw: any): SystemRoleItem {
  const permissions: string[] = Array.isArray(raw.role_permissions)
    ? raw.role_permissions.map((rp: any) => rp.permission_id).filter(Boolean)
    : [];

  return {
    created_at: raw.created_at || new Date().toISOString(),
    description: raw.description ?? null,
    id: String(raw.id ?? ''),
    is_system: typeof raw.is_system === 'boolean' ? raw.is_system : true,
    name: raw.name || 'unnamed_role',
    permissions,
  };
}

/**
 * Pure function: Gom nhóm permissions theo module
 */
export function groupPermissionsByModule(
  permissions: SystemPermissionItem[],
): Record<string, SystemPermissionItem[]> {
  const grouped: Record<string, SystemPermissionItem[]> = {};
  for (const perm of permissions) {
    const mod = perm.module || 'other';
    if (!grouped[mod]) {
      grouped[mod] = [];
    }
    grouped[mod].push(perm);
  }
  return grouped;
}

/**
 * Lấy danh sách toàn bộ người dùng trên nền tảng (Platform Users)
 */
export async function getPlatformUsersApi(params?: {
  search?: string;
}): Promise<PlatformUserItem[]> {
  try {
    let url =
      '/rest/v1/profiles?select=*,tenant_members(count)&order=created_at.desc';
    if (params?.search) {
      const q = encodeURIComponent(`*${params.search}*`);
      url += `&full_name=ilike.${q}`;
    }
    const data = await supabaseRequest<any[]>(url);
    if (!Array.isArray(data)) return [];
    return data.map((row) => mapRawPlatformUser(row));
  } catch (error) {
    console.error('[System] Failed to load platform users:', error);
    return [];
  }
}

/**
 * Lấy nhật ký kiểm toán an ninh toàn cầu (Global Audit Logs)
 */
export async function getGlobalAuditLogsApi(filter?: {
  action?: string;
  limit?: number;
  tenantId?: string;
}): Promise<GlobalAuditLogItem[]> {
  try {
    const limit = filter?.limit || 50;
    let url = `/rest/v1/audit_logs?select=*&order=created_at.desc&limit=${limit}`;
    if (filter?.tenantId) {
      url += `&tenant_id=eq.${encodeURIComponent(filter.tenantId)}`;
    }
    if (filter?.action) {
      url += `&action=ilike.*${encodeURIComponent(filter.action)}*`;
    }
    const data = await supabaseRequest<any[]>(url);
    if (!Array.isArray(data)) return [];
    return data.map((row) => mapRawGlobalAuditLog(row));
  } catch (error) {
    console.error('[System] Failed to load global audit logs:', error);
    return [];
  }
}

/**
 * Lấy danh sách hợp đồng thuê bao toàn hệ thống (Platform Subscriptions)
 */
export async function getPlatformSubscriptionsApi(): Promise<
  PlatformSubscriptionItem[]
> {
  try {
    const data = await supabaseRequest<any[]>(
      '/rest/v1/subscriptions?select=*,tenants(name,slug),plans(name,price_monthly_usd)&order=created_at.desc',
      { schema: 'billing' },
    );
    if (!Array.isArray(data)) return [];
    return data.map((row) => mapRawPlatformSubscription(row));
  } catch (error) {
    console.error('[System] Failed to load platform subscriptions:', error);
    return [];
  }
}

/**
 * Lấy danh mục các vai trò hệ thống và quyền tương ứng
 */
export async function getSystemRolesApi(): Promise<SystemRoleItem[]> {
  try {
    const data = await supabaseRequest<any[]>(
      '/rest/v1/roles?select=*,role_permissions(permission_id)&order=name.asc',
    );
    if (!Array.isArray(data)) return [];
    return data.map((row) => mapRawSystemRole(row));
  } catch (error) {
    console.error('[System] Failed to load system roles:', error);
    return [];
  }
}

/**
 * Lấy danh mục 36 quyền hệ thống (System Permissions Catalog)
 */
export async function getSystemPermissionsApi(): Promise<
  SystemPermissionItem[]
> {
  try {
    const data = await supabaseRequest<any[]>(
      '/rest/v1/permissions?select=*&order=module.asc,id.asc',
    );
    if (!Array.isArray(data)) return [];
    return data.map((row) => ({
      description: row.description ?? null,
      id: String(row.id ?? ''),
      module: row.module || 'other',
    }));
  } catch (error) {
    console.error('[System] Failed to load system permissions:', error);
    return [];
  }
}
