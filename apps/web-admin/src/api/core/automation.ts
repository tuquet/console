import { supabaseRequest } from './supabase-client';

// ============================================================================
// PART 1: WORKFLOW ORCHESTRATION & CAMPAIGN RUNS (PostgreSQL schema: 'automa')
// ============================================================================

export type WorkflowStatus = 'archived' | 'draft' | 'published';

export type CampaignStatus =
  | 'cancelled'
  | 'completed'
  | 'failed'
  | 'paused'
  | 'pending'
  | 'queued'
  | 'running';

export type LogLevel = 'debug' | 'error' | 'fatal' | 'info' | 'trace' | 'warn';

export interface AutomaWorkflowItem {
  created_at: string;
  description: null | string;
  id: string;
  name: string;
  status: WorkflowStatus;
  tenant_id: string;
  updated_at: string;
  version: string;
}

export interface AutomaCampaignRunItem {
  completed_tasks: number;
  created_at: string;
  ended_at: null | string;
  error_message: null | string;
  failed_tasks: number;
  id: string;
  name: string;
  parameters?: Record<string, any>;
  result_summary?: Record<string, any>;
  runner?: null | {
    id?: string;
    name: string;
  };
  runner_id: null | string;
  started_at: null | string;
  status: CampaignStatus;
  tenant_id: string;
  total_tasks: number;
  workflow?: null | {
    id?: string;
    name: string;
  };
  workflow_id: null | string;
}

export interface AutomaExecutionLogItem {
  campaign_run_id: string;
  id: number;
  level: LogLevel;
  logged_at: string;
  message: string;
  node_id: null | string;
  payload: Record<string, any>;
  step_name: null | string;
  tenant_id: string;
}

/**
 * Pure function: Kiểm tra xem phiên chạy có đang trong trạng thái cần live polling hay không
 */
export function isRunActive(status: CampaignStatus): boolean {
  return status === 'pending' || status === 'queued' || status === 'running';
}

/**
 * Pure function: Tính toán phần trăm tiến độ của một campaign run
 */
export function calculateProgressPercentage(
  completed: number,
  total: number,
): number {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
}

/**
 * Pure helper: Xây dựng query string lọc quy trình hoặc phiên chạy
 */
export function buildAutomationFilterQuery(
  baseQuery: string,
  params?: { status?: string; tenantId?: string; workflowId?: string },
): string {
  const queryParts: string[] = [];

  if (params?.tenantId) {
    queryParts.push(`tenant_id=eq.${encodeURIComponent(params.tenantId)}`);
  }

  if (params?.status && params.status !== 'all') {
    queryParts.push(`status=eq.${encodeURIComponent(params.status)}`);
  }

  if (params?.workflowId && params.workflowId !== 'all') {
    queryParts.push(`workflow_id=eq.${encodeURIComponent(params.workflowId)}`);
  }

  if (queryParts.length === 0) {
    return baseQuery;
  }

  const delimiter = baseQuery.includes('?') ? '&' : '?';
  return `${baseQuery}${delimiter}${queryParts.join('&')}`;
}

/**
 * Lấy danh sách quy trình tự động từ schema automa.workflows
 */
export async function getWorkflowsApi(params?: {
  status?: string;
  tenantId?: string;
}): Promise<AutomaWorkflowItem[]> {
  try {
    const query = buildAutomationFilterQuery(
      '/rest/v1/workflows?select=id,tenant_id,name,description,version,status,created_at,updated_at&order=created_at.desc',
      params,
    );
    const data = await supabaseRequest<AutomaWorkflowItem[]>(query, {
      schema: 'automa',
    });
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    if (!error?.isAuthError) {
      console.error('[Automa] Failed to load workflows:', error);
    }
    return [];
  }
}

/**
 * Lấy danh sách các phiên chạy chiến dịch từ schema automa.campaign_runs
 */
export async function getCampaignRunsApi(params?: {
  status?: string;
  tenantId?: string;
  workflowId?: string;
}): Promise<AutomaCampaignRunItem[]> {
  try {
    const query = buildAutomationFilterQuery(
      '/rest/v1/campaign_runs?select=id,tenant_id,workflow_id,runner_id,name,status,total_tasks,completed_tasks,failed_tasks,started_at,ended_at,created_at,error_message,workflow:workflow_id(name),runner:runner_id(name)&order=created_at.desc',
      params,
    );
    const data = await supabaseRequest<AutomaCampaignRunItem[]>(query, {
      schema: 'automa',
    });
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    if (!error?.isAuthError) {
      console.error('[Automa] Failed to load campaign runs:', error);
    }
    return [];
  }
}

/**
 * Lấy chi tiết của một phiên chạy chiến dịch cụ thể
 */
export async function getCampaignRunDetailApi(
  runId: string,
): Promise<AutomaCampaignRunItem | null> {
  try {
    const query = `/rest/v1/campaign_runs?id=eq.${encodeURIComponent(runId)}&select=id,tenant_id,workflow_id,runner_id,name,status,total_tasks,completed_tasks,failed_tasks,started_at,ended_at,created_at,error_message,result_summary,parameters,workflow:workflow_id(name),runner:runner_id(name)`;
    const data = await supabaseRequest<AutomaCampaignRunItem[]>(query, {
      schema: 'automa',
    });
    return Array.isArray(data) && data.length > 0 ? (data[0] ?? null) : null;
  } catch (error: any) {
    if (!error?.isAuthError) {
      console.error('[Automa] Failed to load campaign run detail:', error);
    }
    return null;
  }
}

/**
 * Lấy nhật ký thực thi của một phiên chạy từ schema automa.execution_logs
 */
export async function getExecutionLogsApi(
  runId: string,
  params?: { limit?: number; sinceId?: number },
): Promise<AutomaExecutionLogItem[]> {
  try {
    let query = `/rest/v1/execution_logs?campaign_run_id=eq.${encodeURIComponent(runId)}`;
    if (params?.sinceId) {
      query += `&id=gt.${params.sinceId}`;
    }
    const limit = params?.limit ?? 200;
    query += `&order=id.asc&limit=${limit}`;

    const data = await supabaseRequest<AutomaExecutionLogItem[]>(query, {
      schema: 'automa',
    });
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    if (!error?.isAuthError) {
      console.error('[Automa] Failed to load execution logs:', error);
    }
    return [];
  }
}

/**
 * Hủy một phiên chạy đang thực thi
 */
export async function cancelCampaignRunApi(runId: string): Promise<void> {
  await supabaseRequest(
    `/rest/v1/campaign_runs?id=eq.${encodeURIComponent(runId)}`,
    {
      body: JSON.stringify({
        ended_at: new Date().toISOString(),
        status: 'cancelled',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      schema: 'automa',
    },
  );
}

// ============================================================================
// PART 2: COMPUTE DEVICES, BROWSERS & PROXIES (PostgreSQL schema: 'runners')
// ============================================================================

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
 * Lấy danh sách máy trạm Specter từ schema runners.devices
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
    console.error('[Automation] Failed to load devices:', error);
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
 * Lấy danh sách browser profiles từ schema runners.browsers
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
    console.error('[Automation] Failed to load browsers:', error);
    return [];
  }
}

/**
 * Lấy danh sách proxy pool từ schema runners.proxies
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
    console.error('[Automation] Failed to load proxies:', error);
    return [];
  }
}
