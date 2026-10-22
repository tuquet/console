import type {
  BrowserStatus,
  DeviceStatus,
  JobStatus,
  LogLevel,
  ProxyProtocol,
  ProxyStatus,
  WorkflowStatus,
} from '@tuquet/constants';

import {
  BROWSER_STATUS,
  DEVICE_STATUS,
  FILTER_ALL,
  JOB_STATUS,
  LOG_LEVEL,
  PROXY_PROTOCOL,
  PROXY_STATUS,
  SUPABASE_SCHEMA,
  WORKFLOW_STATUS,
} from '@tuquet/constants';

import { supabaseRequest } from './supabase-client';

// ============================================================================
// PART 1: WORKFLOW ORCHESTRATION & JOBS (PostgreSQL schema: 'automation')
// ============================================================================

export {
  BROWSER_STATUS,
  DEVICE_STATUS,
  JOB_STATUS,
  LOG_LEVEL,
  PROXY_PROTOCOL,
  PROXY_STATUS,
  WORKFLOW_STATUS,
};
export type {
  BrowserStatus,
  DeviceStatus,
  JobStatus,
  LogLevel,
  ProxyProtocol,
  ProxyStatus,
  WorkflowStatus,
};

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

export interface AutomationJobItem {
  completed_tasks: number;
  created_at: string;
  ended_at: null | string;
  error_message: null | string;
  failed_tasks: number;
  id: string;
  name: string;
  parameters?: Record<string, any>;
  result_summary?: Record<string, any>;
  worker?: null | {
    id?: string;
    name: string;
  };
  worker_id: null | string;
  started_at: null | string;
  status: JobStatus;
  tenant_id: string;
  total_tasks: number;
  workflow?: null | {
    id?: string;
    name: string;
  };
  workflow_id: null | string;
}

export interface AutomaExecutionLogItem {
  job_id: string;
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
 * Pure function: Kiểm tra xem job có đang trong trạng thái cần live polling hay không
 */
export function isRunActive(status: JobStatus): boolean {
  return (
    status === JOB_STATUS.PENDING ||
    status === JOB_STATUS.QUEUED ||
    status === JOB_STATUS.RUNNING
  );
}

/**
 * Pure function: Tính toán phần trăm tiến độ của một job
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

  if (params?.status && params.status !== FILTER_ALL) {
    queryParts.push(`status=eq.${encodeURIComponent(params.status)}`);
  }

  if (params?.workflowId && params.workflowId !== FILTER_ALL) {
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
      schema: SUPABASE_SCHEMA.AUTOMA,
      suppressErrorCapture: true,
    });
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    if (!error?.isAuthError && !error?.message?.includes('Invalid schema')) {
      console.error('[Automa] Failed to load workflows:', error);
    }
    return [];
  }
}

/**
 * Lấy danh sách các jobs từ schema automation.jobs
 */
export async function getJobsApi(params?: {
  status?: string;
  tenantId?: string;
  workflowId?: string;
}): Promise<AutomationJobItem[]> {
  try {
    const query = buildAutomationFilterQuery(
      '/rest/v1/jobs?select=id,tenant_id,workflow_id,worker_id,name,status,total_tasks,completed_tasks,failed_tasks,started_at,ended_at,created_at,error_message,workflow:workflow_id(name),worker:worker_id(name)&order=created_at.desc',
      params,
    );
    const data = await supabaseRequest<AutomationJobItem[]>(query, {
      schema: SUPABASE_SCHEMA.AUTOMA,
      suppressErrorCapture: true,
    });
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    if (!error?.isAuthError && !error?.message?.includes('Invalid schema')) {
      console.error('[Automation] Failed to load jobs:', error);
    }
    return [];
  }
}

/**
 * Lấy chi tiết của một job cụ thể
 */
export async function getJobDetailApi(
  runId: string,
): Promise<AutomationJobItem | null> {
  try {
    const query = `/rest/v1/jobs?id=eq.${encodeURIComponent(runId)}&select=id,tenant_id,workflow_id,worker_id,name,status,total_tasks,completed_tasks,failed_tasks,started_at,ended_at,created_at,error_message,result_summary,parameters,workflow:workflow_id(name),worker:worker_id(name)`;
    const data = await supabaseRequest<AutomationJobItem[]>(query, {
      schema: SUPABASE_SCHEMA.AUTOMA,
    });
    return Array.isArray(data) && data.length > 0 ? (data[0] ?? null) : null;
  } catch (error: any) {
    if (!error?.isAuthError) {
      console.error('[Automation] Failed to load job detail:', error);
    }
    return null;
  }
}

/**
 * Lấy nhật ký thực thi của một job từ schema automation.execution_logs
 */
export async function getExecutionLogsApi(
  runId: string,
  params?: { limit?: number; sinceId?: number },
): Promise<AutomaExecutionLogItem[]> {
  try {
    let query = `/rest/v1/execution_logs?job_id=eq.${encodeURIComponent(runId)}`;
    if (params?.sinceId) {
      query += `&id=gt.${params.sinceId}`;
    }
    const limit = params?.limit ?? 200;
    query += `&order=id.asc&limit=${limit}`;

    const data = await supabaseRequest<AutomaExecutionLogItem[]>(query, {
      schema: SUPABASE_SCHEMA.AUTOMA,
    });
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    if (!error?.isAuthError) {
      console.error('[Automation] Failed to load execution logs:', error);
    }
    return [];
  }
}

/**
 * Hủy một job đang thực thi
 */
export async function cancelJobApi(runId: string): Promise<void> {
  await supabaseRequest(`/rest/v1/jobs?id=eq.${encodeURIComponent(runId)}`, {
    body: JSON.stringify({
      ended_at: new Date().toISOString(),
      status: JOB_STATUS.CANCELLED,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'PATCH',
    schema: SUPABASE_SCHEMA.AUTOMA,
  });
}

// ============================================================================
// PART 2: COMPUTE DEVICES, BROWSERS & PROXIES (PostgreSQL schema: 'workers')
// ============================================================================

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
  protocol: ProxyProtocol | string;
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
 * Pure function: Map raw workers.devices row to FleetDeviceItem
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
    status: raw.status || DEVICE_STATUS.OFFLINE,
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
    (n) => n.status === DEVICE_STATUS.IDLE || n.status === DEVICE_STATUS.BUSY,
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

  if (params?.status && params.status !== FILTER_ALL) {
    queryParts.push(`status=eq.${encodeURIComponent(params.status)}`);
  }

  if (queryParts.length === 0) {
    return baseQuery;
  }

  const delimiter = baseQuery.includes('?') ? '&' : '?';
  return `${baseQuery}${delimiter}${queryParts.join('&')}`;
}

/**
 * Thăm dò trực tiếp cổng loopback SSO của CLI Daemon (:8765)
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
 * Lấy danh sách máy trạm từ schema workers.devices
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
    const data = await supabaseRequest<any[]>(query, {
      schema: SUPABASE_SCHEMA.WORKERS,
      suppressErrorCapture: true,
    });
    if (!Array.isArray(data)) return [];
    return data.map((row) => mapRawDeviceToFleetNode(row));
  } catch (error: any) {
    if (!error?.message?.includes('Invalid schema')) {
      console.error('[Automation] Failed to load devices:', error);
    }
    return [];
  }
}

/**
 * Thu hồi quyền truy cập của một máy trạm trong schema workers.devices
 */
export async function revokeFleetDeviceApi(deviceId: string): Promise<void> {
  await supabaseRequest(
    `/rest/v1/devices?id=eq.${encodeURIComponent(deviceId)}`,
    {
      method: 'DELETE',
      schema: SUPABASE_SCHEMA.WORKERS,
    },
  );
}

/**
 * Lấy danh sách browser profiles từ schema workers.browsers
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
      schema: SUPABASE_SCHEMA.WORKERS,
      suppressErrorCapture: true,
    });
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    if (!error?.message?.includes('Invalid schema')) {
      console.error('[Automation] Failed to load browsers:', error);
    }
    return [];
  }
}

/**
 * Lấy danh sách proxy pool từ schema workers.proxies
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
      schema: SUPABASE_SCHEMA.WORKERS,
      suppressErrorCapture: true,
    });
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    if (!error?.message?.includes('Invalid schema')) {
      console.error('[Automation] Failed to load proxies:', error);
    }
    return [];
  }
}

// ============================================================================
// PART 3: UNIFIED AUTOMATION OVERVIEW TELEMETRY (/automation/overview)
// ============================================================================

export interface AutomationOverviewSummary {
  browsers: {
    error: number;
    idle: number;
    running: number;
    total: number;
  };
  fleet: FleetMetricsData;
  proxies: {
    active: number;
    avgLatencyMs: number;
    failing: number;
    total: number;
  };
  recentDevices: FleetDeviceItem[];
  recentRuns: AutomationJobItem[];
  runs: {
    completed: number;
    failed: number;
    running: number;
    total: number;
  };
  workflows: {
    archived: number;
    draft: number;
    published: number;
    total: number;
  };
}

/**
 * Pure function: Aggregate unified telemetry across workflows, runs, devices, browsers, and proxies
 */
export function calculateAutomationOverviewSummary(input: {
  browsers: FleetBrowserItem[];
  devices: FleetDeviceItem[];
  loopbackOnline: boolean;
  proxies: FleetProxyItem[];
  runs: AutomationJobItem[];
  workflows: AutomaWorkflowItem[];
}): AutomationOverviewSummary {
  const { browsers, devices, loopbackOnline, proxies, runs, workflows } = input;

  const fleet = calculateFleetMetrics(devices, loopbackOnline);

  const workflowsSummary = {
    archived: workflows.filter((w) => w.status === WORKFLOW_STATUS.ARCHIVED)
      .length,
    draft: workflows.filter((w) => w.status === WORKFLOW_STATUS.DRAFT).length,
    published: workflows.filter((w) => w.status === WORKFLOW_STATUS.PUBLISHED)
      .length,
    total: workflows.length,
  };

  const runsSummary = {
    completed: runs.filter((r) => r.status === JOB_STATUS.COMPLETED).length,
    failed: runs.filter((r) => r.status === JOB_STATUS.FAILED).length,
    running: runs.filter((r) => isRunActive(r.status)).length,
    total: runs.length,
  };

  const browsersSummary = {
    error: browsers.filter((b) => b.status === BROWSER_STATUS.ERROR).length,
    idle: browsers.filter((b) => b.status === BROWSER_STATUS.IDLE).length,
    running: browsers.filter(
      (b) =>
        b.status === BROWSER_STATUS.RUNNING ||
        b.status === BROWSER_STATUS.SYNCING,
    ).length,
    total: browsers.length,
  };

  const measuredProxies = proxies.filter(
    (p) => typeof p.latency_ms === 'number' && p.latency_ms > 0,
  );
  const avgLatencyMs =
    measuredProxies.length > 0
      ? Math.round(
          measuredProxies.reduce((sum, p) => sum + (p.latency_ms || 0), 0) /
            measuredProxies.length,
        )
      : 0;

  const proxiesSummary = {
    active: proxies.filter((p) => p.status === PROXY_STATUS.ACTIVE).length,
    avgLatencyMs,
    failing: proxies.filter((p) => p.status === PROXY_STATUS.FAILING).length,
    total: proxies.length,
  };

  return {
    browsers: browsersSummary,
    fleet,
    proxies: proxiesSummary,
    recentDevices: devices.slice(0, 5),
    recentRuns: runs.slice(0, 5),
    runs: runsSummary,
    workflows: workflowsSummary,
  };
}

/**
 * Fetch and aggregate all Automation & Fleet metrics for /automation/overview
 */
export async function getAutomationOverviewApi(params?: {
  tenantId?: string;
}): Promise<AutomationOverviewSummary> {
  const tenantId = params?.tenantId;
  const [workflows, runs, devices, browsers, proxies, daemonProbe] =
    await Promise.all([
      getWorkflowsApi({ tenantId }),
      getJobsApi({ tenantId }),
      getFleetDevicesApi({ tenantId }),
      getFleetBrowsersApi({ tenantId }),
      getFleetProxiesApi({ tenantId }),
      probeLocalDaemonApi(),
    ]);

  return calculateAutomationOverviewSummary({
    browsers,
    devices,
    loopbackOnline: daemonProbe.online,
    proxies,
    runs,
    workflows,
  });
}
