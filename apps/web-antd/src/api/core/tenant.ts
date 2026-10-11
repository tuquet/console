import { useAccessStore } from '@vben/stores';

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

const getSupabaseConfig = () => {
  const supabaseUrl =
    (import.meta.env.VITE_SUPABASE_URL as string) ||
    'https://dswhacsoaxgpfnkaxnhz.supabase.co';
  const anonKey =
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
    'sb_publishable_8Y-l9FtldJSSuFAWhzICqg_UobFOsua';
  return { anonKey, supabaseUrl };
};

const ACTIVE_TENANT_KEY = 'TUQUET_ACTIVE_TENANT_ID';

export function getActiveTenantId(): string {
  return localStorage.getItem(ACTIVE_TENANT_KEY) || '';
}

export function setActiveTenantId(tenantId: string) {
  localStorage.setItem(ACTIVE_TENANT_KEY, tenantId);
}

/**
 * Lấy danh sách toàn bộ Tenants từ Supabase Cloud
 */
export async function getTenantsApi(): Promise<TenantItem[]> {
  const { anonKey, supabaseUrl } = getSupabaseConfig();
  const accessStore = useAccessStore();
  const token = accessStore.accessToken;

  const res = await fetch(
    `${supabaseUrl}/rest/v1/tenants?select=*&order=created_at.desc`,
    {
      headers: {
        apikey: anonKey,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );

  if (!res.ok) {
    throw new Error('Failed to fetch tenants');
  }

  return (await res.json()) as TenantItem[];
}

/**
 * Tạo Workspace / Tenant mới
 */
export async function createTenantApi(data: {
  name: string;
  plan?: string;
  slug: string;
}): Promise<TenantItem> {
  const { anonKey, supabaseUrl } = getSupabaseConfig();
  const accessStore = useAccessStore();
  const token = accessStore.accessToken;

  const payload = {
    metadata: {
      plan: data.plan || 'pro',
      region: 'ap-southeast-1',
    },
    name: data.name,
    slug: data.slug,
    status: 'active',
  };

  const res = await fetch(`${supabaseUrl}/rest/v1/tenants`, {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      apikey: anonKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    method: 'POST',
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.message || 'Failed to create tenant');
  }

  const result = await res.json();
  return Array.isArray(result) ? result[0] : result;
}

/**
 * Lấy danh sách System Plugins từ Supabase Cloud
 */
export async function getSystemPluginsApi(): Promise<SystemPluginItem[]> {
  const { anonKey, supabaseUrl } = getSupabaseConfig();
  const accessStore = useAccessStore();
  const token = accessStore.accessToken;

  const res = await fetch(
    `${supabaseUrl}/rest/v1/system_plugins?select=*&order=is_system.desc,name.asc`,
    {
      headers: {
        apikey: anonKey,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );

  if (!res.ok) {
    throw new Error('Failed to fetch system plugins');
  }

  return (await res.json()) as SystemPluginItem[];
}
