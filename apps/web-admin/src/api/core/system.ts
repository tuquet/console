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

export interface PlatformUserWorkspaceSummary {
  role_name: string;
  status: string;
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
}

export interface PlatformUserItem {
  avatar_url: null | string;
  created_at: string;
  email?: null | string;
  full_name: null | string;
  id: string;
  primary_role?: string;
  tenant_count: number;
  updated_at: string;
  workspaces?: PlatformUserWorkspaceSummary[];
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
  } catch (error: any) {
    if (!error?.isAuthError) {
      console.error('[System] Failed to load system plugins:', error);
    }
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
  } catch (error: any) {
    if (!error?.isAuthError) {
      console.error('[System] Failed to load billing plans:', error);
    }
    return [];
  }
}

export const ROLE_PRIORITY: Record<string, number> = {
  admin: 2,
  member: 1,
  owner: 3,
  viewer: 0,
};

/**
 * Pure function: Sắp xếp danh sách tên vai trò theo thứ tự ưu tiên giảm dần (owner > admin > member > viewer)
 */
export function sortRoleNamesByPriority(roleNames: string[]): string[] {
  if (!Array.isArray(roleNames)) return [];
  return roleNames
    .filter(Boolean)
    .toSorted(
      (a, b) =>
        (ROLE_PRIORITY[b.toLowerCase()] ?? 0) -
        (ROLE_PRIORITY[a.toLowerCase()] ?? 0),
    );
}

/**
 * Pure function: Map bản ghi raw từ public.profiles sang PlatformUserItem
 */
export function mapRawPlatformUser(raw: any): PlatformUserItem {
  let tenantCount = 0;
  const workspaces: PlatformUserWorkspaceSummary[] = [];

  if (Array.isArray(raw.tenant_members)) {
    const firstItem = raw.tenant_members[0];
    if (firstItem && typeof firstItem.count === 'number') {
      tenantCount = firstItem.count;
    } else {
      tenantCount = raw.tenant_members.length;
      for (const tm of raw.tenant_members) {
        if (!tm || typeof tm !== 'object') continue;
        const assignedRoles: string[] = Array.isArray(tm.member_roles)
          ? sortRoleNamesByPriority(
              tm.member_roles.map((mr: any) => mr?.roles?.name),
            )
          : [];
        const topRole = assignedRoles[0] || 'member';
        const tenantObj = tm.tenants || {};
        workspaces.push({
          role_name: topRole,
          status: tm.status || 'active',
          tenant_id: String(tm.tenant_id || tenantObj.id || ''),
          tenant_name: tenantObj.name || 'Workspace',
          tenant_slug: tenantObj.slug || '',
        });
      }
    }
  } else if (typeof raw.tenant_members?.count === 'number') {
    tenantCount = raw.tenant_members.count;
  }

  const sortedRoles = sortRoleNamesByPriority(
    workspaces.map((w) => w.role_name),
  );

  return {
    avatar_url: raw.avatar_url ?? null,
    created_at: raw.created_at || new Date().toISOString(),
    email: raw.email ?? null,
    full_name: raw.full_name || 'Người dùng ẩn danh',
    id: String(raw.id ?? ''),
    primary_role: sortedRoles[0],
    tenant_count: Number(tenantCount) || 0,
    updated_at: raw.updated_at || raw.created_at || new Date().toISOString(),
    workspaces,
  };
}

/**
 * Pure function: Lọc danh sách người dùng nền tảng theo tổ chức, vai trò và từ khóa đa trường
 */
export function filterPlatformUsers(
  users: PlatformUserItem[],
  filters?: {
    role_filter?: string;
    search?: string;
    tenant_filter?: string;
  },
): PlatformUserItem[] {
  if (!Array.isArray(users)) return [];
  let result = users;

  if (filters?.tenant_filter === 'has_tenants') {
    result = result.filter((u) => u.tenant_count > 0);
  } else if (filters?.tenant_filter === 'no_tenants') {
    result = result.filter((u) => u.tenant_count === 0);
  }

  if (filters?.role_filter && filters.role_filter !== 'all') {
    const roleTarget = filters.role_filter.toLowerCase().trim();
    result = result.filter(
      (u) =>
        u.primary_role?.toLowerCase() === roleTarget ||
        u.workspaces?.some((w) => w.role_name.toLowerCase() === roleTarget),
    );
  }

  if (filters?.search?.trim()) {
    const kw = filters.search.toLowerCase().trim();
    result = result.filter(
      (u) =>
        (u.full_name && u.full_name.toLowerCase().includes(kw)) ||
        (u.email && u.email.toLowerCase().includes(kw)) ||
        u.id.toLowerCase().includes(kw) ||
        u.workspaces?.some(
          (w) =>
            w.tenant_name.toLowerCase().includes(kw) ||
            w.tenant_slug.toLowerCase().includes(kw),
        ),
    );
  }

  return result;
}

/**
 * Pure function: Lọc danh sách vai trò hệ thống theo phân loại, module quyền hạn và từ khóa
 */
export function filterSystemRoles(
  roles: SystemRoleItem[],
  filters?: {
    module?: string;
    role_type?: string;
    search?: string;
  },
  permissionsCatalog?: SystemPermissionItem[],
): SystemRoleItem[] {
  if (!Array.isArray(roles)) return [];
  let result = roles;

  if (filters?.role_type === 'system') {
    result = result.filter((r) => r.is_system);
  } else if (filters?.role_type === 'custom') {
    result = result.filter((r) => !r.is_system);
  }

  if (filters?.module && filters.module !== 'all') {
    const modTarget = filters.module.toLowerCase().trim();
    const modulePermIds = new Set(
      (permissionsCatalog || [])
        .filter((p) => p.module.toLowerCase() === modTarget)
        .map((p) => p.id),
    );
    result = result.filter((r) =>
      r.permissions.some(
        (permId) =>
          modulePermIds.has(permId) ||
          permId.toLowerCase().startsWith(`${modTarget}:`),
      ),
    );
  }

  if (filters?.search?.trim()) {
    const kw = filters.search.toLowerCase().trim();
    result = result.filter(
      (r) =>
        r.name.toLowerCase().includes(kw) ||
        r.id.toLowerCase().includes(kw) ||
        (r.description && r.description.toLowerCase().includes(kw)) ||
        r.permissions.some((p) => p.toLowerCase().includes(kw)),
    );
  }

  return result;
}

/**
 * Pure function: Lọc danh sách quyền hạn hệ thống theo module, vai trò sở hữu và từ khóa
 */
export function filterSystemPermissions(
  permissions: SystemPermissionItem[],
  filters?: {
    module?: string;
    role?: string;
    search?: string;
  },
  roles?: SystemRoleItem[],
): SystemPermissionItem[] {
  if (!Array.isArray(permissions)) return [];
  let result = permissions;

  if (filters?.module && filters.module !== 'all') {
    const modTarget = filters.module.toLowerCase().trim();
    result = result.filter((p) => p.module.toLowerCase() === modTarget);
  }

  if (filters?.role && filters.role !== 'all' && Array.isArray(roles)) {
    const roleTarget = filters.role.toLowerCase().trim();
    const matchedRole = roles.find(
      (r) =>
        r.name.toLowerCase() === roleTarget ||
        r.id.toLowerCase() === roleTarget,
    );
    if (matchedRole) {
      const allowedSet = new Set(matchedRole.permissions);
      result = result.filter((p) => allowedSet.has(p.id));
    } else {
      result = [];
    }
  }

  if (filters?.search?.trim()) {
    const kw = filters.search.toLowerCase().trim();
    result = result.filter(
      (p) =>
        p.id.toLowerCase().includes(kw) ||
        p.module.toLowerCase().includes(kw) ||
        (p.description && p.description.toLowerCase().includes(kw)),
    );
  }

  return result;
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
  const searchSuffix = params?.search
    ? `&full_name=ilike.${encodeURIComponent(`*${params.search}*`)}`
    : '';
  try {
    const richUrl = `/rest/v1/profiles?select=*,tenant_members(id,status,tenant_id,tenants(id,name,slug),member_roles(roles(id,name)))&order=created_at.desc${searchSuffix}`;
    const data = await supabaseRequest<any[]>(richUrl);
    if (!Array.isArray(data)) return [];
    return data.map((row) => mapRawPlatformUser(row));
  } catch (error: any) {
    if (error?.isAuthError) {
      return [];
    }
    try {
      const fallbackUrl = `/rest/v1/profiles?select=*,tenant_members(count)&order=created_at.desc${searchSuffix}`;
      const fallbackData = await supabaseRequest<any[]>(fallbackUrl);
      if (!Array.isArray(fallbackData)) return [];
      return fallbackData.map((row) => mapRawPlatformUser(row));
    } catch (fallbackError: any) {
      if (!fallbackError?.isAuthError) {
        console.error('[System] Failed to load platform users:', fallbackError);
      }
      return [];
    }
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
  } catch (error: any) {
    if (!error?.isAuthError) {
      console.error('[System] Failed to load global audit logs:', error);
    }
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
  } catch (error: any) {
    if (!error?.isAuthError) {
      console.error('[System] Failed to load platform subscriptions:', error);
    }
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
  } catch (error: any) {
    if (!error?.isAuthError) {
      console.error('[System] Failed to load system roles:', error);
    }
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
  } catch (error: any) {
    if (!error?.isAuthError) {
      console.error('[System] Failed to load system permissions:', error);
    }
    return [];
  }
}
