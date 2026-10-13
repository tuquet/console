import { supabaseRequest } from './supabase-client';

export type DeviceStatus =
  | 'busy'
  | 'disabled'
  | 'idle'
  | 'maintenance'
  | 'offline';

export type BrowserStatus = 'error' | 'idle' | 'running' | 'syncing';

export type ProxyStatus = 'active' | 'disabled' | 'failing' | 'testing';

export interface FleetDeviceItem {
  active_jobs: number;
  capabilities: any[] | Record<string, any>;
  cpu_cores: number;
  driver_type?: string;
  hostname?: string;
  id: string;
  ip_address?: string;
  last_heartbeat_at: null | string;
  machine_fingerprint: string;
  metadata?: Record<string, any>;
  name: string;
  os_info: string;
  ram_gb: number;
  ram_mb: number;
  registered_at: string;
  status: DeviceStatus;
  tenant_id: string;
  updated_at: string;
  version: string;
}

/**
 * Backward compatibility alias for existing components
 */
export type FleetNodeItem = FleetDeviceItem;

export interface FleetBrowserItem {
  browser_type: string;
  cookies_count: number;
  cpu_cores: number;
  created_at: string;
  engine_version: string;
  id: string;
  last_synced_at: null | string;
  locked_by_device?: null | {
    id?: string;
    name: string;
  };
  name: string;
  os_platform: string;
  os_version: string;
  proxy?: null | {
    host: string;
    port: number;
    protocol: string;
  };
  ram_gb: number;
  status: BrowserStatus;
  storage_size_bytes: number;
  tenant_id: string;
}

export interface FleetProxyItem {
  city: null | string;
  country_code: null | string;
  created_at: string;
  error_count: number;
  host: string;
  id: string;
  ip_address?: null | string;
  is_residential: boolean;
  last_checked_at: null | string;
  latency_ms: null | number;
  port: number;
  protocol: 'http' | 'https' | 'socks4' | 'socks5' | string;
  status: ProxyStatus;
  tags: string[];
  tenant_id: string;
  username?: null | string;
}

export interface FleetMetricsData {
  active_jobs: number;
  loopback_online: boolean;
  loopback_port: number;
  online_nodes: number;
  total_nodes: number;
}

/**
 * Pure function: Map raw runners.devices row to FleetDeviceItem
 */
export function mapRawDeviceToFleetNode(raw: any): FleetDeviceItem {
  const ramMb =
    typeof raw.ram_mb === 'number' && raw.ram_mb > 0 ? raw.ram_mb : 1024;
  const ramGb = Number((ramMb / 1024).toFixed(1));
  const meta =
    raw.metadata && typeof raw.metadata === 'object' ? raw.metadata : {};
  const ip = meta.ip_address || meta.ip || raw.ip_address || '—';
  const driverType =
    Array.isArray(raw.capabilities) && raw.capabilities.length > 0
      ? String(raw.capabilities[0])
      : 'automa';

  return {
    active_jobs: typeof raw.active_jobs === 'number' ? raw.active_jobs : 0,
    capabilities: raw.capabilities ?? [],
    cpu_cores:
      typeof raw.cpu_cores === 'number' && raw.cpu_cores > 0
        ? raw.cpu_cores
        : 1,
    driver_type: driverType,
    hostname: raw.machine_fingerprint || raw.hostname || 'unknown-host',
    id: String(raw.id ?? ''),
    ip_address: ip,
    last_heartbeat_at: raw.last_heartbeat_at ?? null,
    machine_fingerprint: raw.machine_fingerprint ?? '',
    metadata: meta,
    name: raw.name || 'Unnamed Device',
    os_info: raw.os_info || 'linux',
    ram_gb: ramGb,
    ram_mb: ramMb,
    registered_at: raw.registered_at || new Date().toISOString(),
    status: raw.status || 'offline',
    tenant_id: raw.tenant_id ?? '',
    updated_at: raw.updated_at || new Date().toISOString(),
    version: raw.version || 'v0.1.0',
  };
}

/**
 * Pure function: Calculate fleet aggregate telemetry
 */
export function calculateFleetMetrics(
  nodes: FleetDeviceItem[],
  loopbackOnline: boolean,
): FleetMetricsData {
  const total_nodes = nodes.length;
  const online_nodes = nodes.filter(
    (n) => n.status === 'idle' || n.status === 'busy',
  ).length;
  const active_jobs = nodes.reduce((sum, n) => sum + (n.active_jobs || 0), 0);

  return {
    active_jobs,
    loopback_online: loopbackOnline,
    loopback_port: 8765,
    online_nodes,
    total_nodes,
  };
}

/**
 * Pure helper: Build query string with tenant and status filters
 */
export function buildFleetFilterQuery(
  baseQuery: string,
  params?: { status?: string; tenantId?: string },
): string {
  const queryParts: string[] = [];

  if (params?.tenantId) {
    queryParts.push(`tenant_id=eq.${encodeURIComponent(params.tenantId)}`);
  }

  if (params?.status && params.status !== 'all') {
    queryParts.push(`status=eq.${encodeURIComponent(params.status)}`);
  }

  if (queryParts.length === 0) {
    return baseQuery;
  }

  const delimiter = baseQuery.includes('?') ? '&' : '?';
  return `${baseQuery}${delimiter}${queryParts.join('&')}`;
}

/**
 * Thăm dò trực tiếp cổng loopback SSO của Specter CLI Daemon (:8765)
 * Non-blocking, timeout <= 1200ms theo AGENTS.md §9
 */
export async function probeLocalDaemonApi(port = 8765): Promise<{
  latencyMs?: number;
  online: boolean;
  port: number;
}> {
  const startTime = performance.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    await fetch(`http://127.0.0.1:${port}/api/v1/status`, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const latencyMs = Math.round(performance.now() - startTime);
    return {
      latencyMs,
      online: true,
      port,
    };
  } catch {
    return {
      online: false,
      port,
    };
  }
}

/**
 * Lấy danh sách máy trạm Specter Fleet từ schema runners.devices
 */
export async function getFleetDevicesApi(params?: {
  status?: string;
  tenantId?: string;
}): Promise<FleetDeviceItem[]> {
  try {
    const query = buildFleetFilterQuery(
      '/rest/v1/devices?select=*&order=last_heartbeat_at.desc.nullslast',
      params,
    );
    const data = await supabaseRequest<any[]>(query, { schema: 'runners' });
    if (!Array.isArray(data)) return [];
    return data.map((row) => mapRawDeviceToFleetNode(row));
  } catch (error) {
    console.error('[Fleet] Failed to load fleet devices:', error);
    return [];
  }
}

/**
 * Backward compatibility alias
 */
export const getFleetNodesApi = getFleetDevicesApi;

/**
 * Thu hồi quyền truy cập của một máy trạm trong schema runners.devices
 */
export async function revokeFleetDeviceApi(deviceId: string): Promise<void> {
  await supabaseRequest(
    `/rest/v1/devices?id=eq.${encodeURIComponent(deviceId)}`,
    {
      method: 'DELETE',
      schema: 'runners',
    },
  );
}

/**
 * Backward compatibility alias
 */
export const revokeFleetNodeApi = revokeFleetDeviceApi;

/**
 * Lấy danh sách hồ sơ trình duyệt đám mây từ schema runners.browsers
 */
export async function getFleetBrowsersApi(params?: {
  status?: string;
  tenantId?: string;
}): Promise<FleetBrowserItem[]> {
  try {
    const query = buildFleetFilterQuery(
      '/rest/v1/browsers?select=id,tenant_id,name,browser_type,engine_version,os_platform,os_version,cpu_cores,ram_gb,status,storage_size_bytes,cookies_count,created_at,last_synced_at,locked_by_device:locked_by_device_id(name),proxy:proxy_id(host,port,protocol)&order=created_at.desc',
      params,
    );
    const data = await supabaseRequest<FleetBrowserItem[]>(query, {
      schema: 'runners',
    });
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[Fleet] Failed to load fleet browsers:', error);
    return [];
  }
}

/**
 * Lấy danh sách bể proxy từ schema runners.proxies
 */
export async function getFleetProxiesApi(params?: {
  status?: string;
  tenantId?: string;
}): Promise<FleetProxyItem[]> {
  try {
    const query = buildFleetFilterQuery(
      '/rest/v1/proxies?select=*&order=created_at.desc',
      params,
    );
    const data = await supabaseRequest<FleetProxyItem[]>(query, {
      schema: 'runners',
    });
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[Fleet] Failed to load fleet proxies:', error);
    return [];
  }
}
