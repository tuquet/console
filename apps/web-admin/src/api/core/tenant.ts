import { supabaseRequest } from './supabase-client';

export interface TenantItem {
  avatar_url: null | string;
  created_at: string;
  created_by: null | string;
  id: string;
  metadata?: {
    plan?: string;
    region?: string;
    [key: string]: any;
  };
  name: string;
  slug: string;
  status: 'active' | 'archived' | 'suspended';
  updated_at: string;
}

export interface SystemPluginItem {
  dependencies: string[];
  description: null | string;
  id: string;
  installed_at: string;
  is_system: boolean;
  metadata: Record<string, any>;
  name: string;
  schema_name: string;
  status: string;
  version: string;
}

const ACTIVE_TENANT_KEY = 'TUQUET_ACTIVE_TENANT_ID';

export function getActiveTenantId(): string {
  return localStorage.getItem(ACTIVE_TENANT_KEY) || '';
}

export function setActiveTenantId(tenantId: string) {
  localStorage.setItem(ACTIVE_TENANT_KEY, tenantId);
}

/**
 * Fetch all tenants from Supabase Cloud
 */
export async function getTenantsApi(): Promise<TenantItem[]> {
  return supabaseRequest<TenantItem[]>(
    '/rest/v1/tenants?select=*&order=created_at.desc',
  );
}

/**
 * Create a new workspace / tenant
 */
export async function createTenantApi(data: {
  name: string;
  plan?: string;
  slug: string;
}): Promise<TenantItem> {
  const payload = {
    metadata: {
      plan: data.plan || 'pro',
      region: 'ap-southeast-1',
    },
    name: data.name,
    slug: data.slug,
    status: 'active',
  };

  const result = await supabaseRequest<TenantItem | TenantItem[]>(
    '/rest/v1/tenants',
    {
      body: JSON.stringify(payload),
      method: 'POST',
      preferRepresentation: true,
    },
  );

  const created = Array.isArray(result) ? result[0] : result;
  if (!created) {
    throw new Error('Failed to create tenant: empty response from server');
  }

  return created;
}

/**
 * Fetch system plugins from Supabase Cloud
 */
export async function getSystemPluginsApi(): Promise<SystemPluginItem[]> {
  return supabaseRequest<SystemPluginItem[]>(
    '/rest/v1/system_plugins?select=*&order=is_system.desc,name.asc',
  );
}
