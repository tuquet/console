import { supabaseRequest } from './supabase-client';

export interface FleetNodeItem {
  active_jobs: number;
  cpu_cores: number;
  driver_type: 'agent' | 'automa' | 'browser' | 'shell';
  hostname: string;
  id: string;
  ip_address: string;
  last_heartbeat_at: string;
  name: string;
  os_info: 'linux' | 'macos' | 'windows' | string;
  ram_gb: number;
  registered_at: string;
  status: 'busy' | 'offline' | 'online' | 'unpaired';
  tenant_id?: string;
  tenant_name?: string;
  version?: string;
}

export interface FleetMetricsData {
  active_jobs: number;
  loopback_online: boolean;
  loopback_port: number;
  online_nodes: number;
  total_nodes: number;
}

const LOCAL_STORAGE_FLEET_KEY = 'TUQUET_FLEET_NODES_CACHE';

function getInitialFallbackNodes(): FleetNodeItem[] {
  return [
    {
      active_jobs: 1,
      cpu_cores: 16,
      driver_type: 'browser',
      hostname: 'DESKTOP-WIN32-OPERATOR',
      id: 'node-win-01',
      ip_address: '127.0.0.1',
      last_heartbeat_at: new Date().toISOString(),
      name: 'Local Workstation (Win32)',
      os_info: 'windows',
      ram_gb: 32,
      registered_at: new Date(Date.now() - 86_400_000 * 3).toISOString(),
      status: 'online',
      version: 'v0.8.4',
    },
    {
      active_jobs: 0,
      cpu_cores: 8,
      driver_type: 'automa',
      hostname: 'srv-cloud-runner-01',
      id: 'node-linux-02',
      ip_address: '192.168.1.105',
      last_heartbeat_at: new Date(Date.now() - 120_000).toISOString(),
      name: 'Cloud Worker Node 01',
      os_info: 'linux',
      ram_gb: 16,
      registered_at: new Date(Date.now() - 86_400_000 * 10).toISOString(),
      status: 'online',
      version: 'v0.8.4',
    },
    {
      active_jobs: 0,
      cpu_cores: 8,
      driver_type: 'shell',
      hostname: 'macbook-dev-air',
      id: 'node-mac-03',
      ip_address: '192.168.1.188',
      last_heartbeat_at: new Date(Date.now() - 86_400_000 * 2).toISOString(),
      name: 'MacBook Pro Operator',
      os_info: 'macos',
      ram_gb: 16,
      registered_at: new Date(Date.now() - 86_400_000 * 15).toISOString(),
      status: 'offline',
      version: 'v0.8.2',
    },
  ];
}

/**
 * Thăm dò trực tiếp cổng loopback SSO của Specter CLI Daemon (:8765)
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
 * Lấy danh sách máy trạm Specter Fleet (kết hợp Supabase REST & Local Daemon State)
 */
export async function getFleetNodesApi(
  tenantId?: string,
): Promise<FleetNodeItem[]> {
  let nodes: FleetNodeItem[] = [];

  // 1. Thử truy vấn từ bảng Supabase nếu có
  try {
    const query = tenantId
      ? `/rest/v1/devices?tenant_id=eq.${encodeURIComponent(tenantId)}&select=*`
      : `/rest/v1/devices?select=*&order=last_heartbeat_at.desc`;
    const data = await supabaseRequest<FleetNodeItem[]>(query);
    if (Array.isArray(data) && data.length > 0) {
      nodes = data;
    }
  } catch {
    // Nếu bảng chưa có trong schema Supabase, sử dụng bộ nhớ cache / fallback
    const cached = localStorage.getItem(LOCAL_STORAGE_FLEET_KEY);
    if (cached) {
      try {
        nodes = JSON.parse(cached);
      } catch {
        nodes = getInitialFallbackNodes();
      }
    } else {
      nodes = getInitialFallbackNodes();
      localStorage.setItem(LOCAL_STORAGE_FLEET_KEY, JSON.stringify(nodes));
    }
  }

  // 2. Thăm dò Specter daemon cục bộ để cập nhật trạng thái node Local Workstation
  try {
    const probe = await probeLocalDaemonApi(8765);
    const localNode = nodes.find(
      (n) => n.id === 'node-win-01' || n.ip_address === '127.0.0.1',
    );
    if (localNode) {
      localNode.status = probe.online ? 'online' : 'offline';
      if (probe.online) {
        localNode.last_heartbeat_at = new Date().toISOString();
      }
    }
  } catch {
    // Non-blocking
  }

  return nodes;
}

/**
 * Thu hồi quyền truy cập của một máy trạm
 */
export async function revokeFleetNodeApi(nodeId: string): Promise<void> {
  // Thử xóa trên Supabase
  try {
    await supabaseRequest(
      `/rest/v1/devices?id=eq.${encodeURIComponent(nodeId)}`,
      {
        method: 'DELETE',
      },
    );
  } catch {
    // Fallback: xóa trong bộ nhớ cục bộ
    const cached = localStorage.getItem(LOCAL_STORAGE_FLEET_KEY);
    if (cached) {
      try {
        const nodes: FleetNodeItem[] = JSON.parse(cached);
        const filtered = nodes.filter((n) => n.id !== nodeId);
        localStorage.setItem(LOCAL_STORAGE_FLEET_KEY, JSON.stringify(filtered));
      } catch {}
    }
  }
}

/**
 * Tính toán các chỉ số thống kê của toàn đội máy trạm
 */
export function calculateFleetMetrics(
  nodes: FleetNodeItem[],
  loopbackOnline: boolean,
): FleetMetricsData {
  const total_nodes = nodes.length;
  const online_nodes = nodes.filter(
    (n) => n.status === 'online' || n.status === 'busy',
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
