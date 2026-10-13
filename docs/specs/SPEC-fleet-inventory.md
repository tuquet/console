# Spec: `fleet-inventory`

> Module id: `fleet-inventory` (xem [capability-map.md](capability-map.md)) — **DRAFT, chờ duyệt**  
> Kiến trúc nguồn: [`docs/architecture/overview.md`](../architecture/overview.md)

---

## 1. Objective & Scope

Module này hoàn thiện phân hệ Quản Trị Máy Trạm & Hạ Tầng Chạy Tự Động (**Specter Fleet**) bao gồm 3 màn hình nghiệp vụ:

1. `/fleet/devices` (Quản trị Thiết bị / Physical Devices & Edge Worker Nodes)
2. `/fleet/browsers` (Quản trị Hồ sơ Trình duyệt / Cloud Anti-Detect Browser Profiles)
3. `/fleet/proxies` (Quản trị Bể Proxy / Proxy Network Pool)

Toàn bộ dữ liệu được truy vấn **100% đo đếm thực tế** từ schema `runners` của Tuquet Cloud thông qua header `Accept-Profile: runners`.

### Trong phạm vi:

1. **Loại bỏ hoàn toàn Fake / Mock Data:**
   - Xóa bỏ hoàn toàn hàm `getInitialFallbackNodes()`, biến cache `TUQUET_FLEET_NODES_CACHE`, và cơ chế fallback `localStorage` trong `apps/web-admin/src/api/core/fleet.ts`.
   - Kết nối trực tiếp tới `runners.devices`, `runners.browsers`, và `runners.proxies` với `{ schema: 'runners' }`.
   - Khi bảng dữ liệu rỗng (0 rows), hiển thị Empty State chuẩn mực với icon Lucide tương ứng và thông điệp hướng dẫn rõ ràng (tuân thủ AGENTS.md §5).
2. **Quản trị Thiết Bị (`/fleet/devices`):**
   - Đọc dữ liệu từ `runners.devices` (`id`, `tenant_id`, `name`, `machine_fingerprint`, `status`, `version`, `os_info`, `cpu_cores`, `ram_mb`, `capabilities`, `active_jobs`, `last_heartbeat_at`, `registered_at`, `metadata`).
   - Hỗ trợ trạng thái thiết bị theo đúng enum `runners.device_status`: `all`, `idle`, `busy`, `offline`, `maintenance`.
   - Thăm dò Loopback Specter CLI Daemon (:8765) không chặn (non-blocking) qua `probeLocalDaemonApi()`.
   - Thu hồi thiết bị qua API `DELETE /rest/v1/devices?id=eq.${id}` với `{ schema: 'runners' }`.
   - Hỗ trợ bộ lọc URL query parameters: `?tenant=&status=`.
   - Dual View: Bảng đầy đủ trên Desktop (`hidden md:block`), Thẻ Compact chạm cảm ứng trên Mobile (`block md:hidden`).
3. **Quản trị Hồ Sơ Trình Duyệt (`/fleet/browsers`):**
   - Đọc dữ liệu từ `runners.browsers` (`id`, `tenant_id`, `name`, `browser_type`, `engine_version`, `os_platform`, `os_version`, `cpu_cores`, `ram_gb`, `status`, `proxy_id`, `locked_by_device_id`, `cookies_count`, `storage_size_bytes`, `created_at`, `last_synced_at`).
   - Liên kết PostgREST foreign tables: `locked_by_device:locked_by_device_id(name)` và `proxy:proxy_id(host,port,protocol)`.
   - Trạng thái profile: `all`, `idle`, `running`, `syncing`, `error`.
   - Hỗ trợ bộ lọc URL query parameters: `?tenant=&status=`.
   - Dual View: Desktop table và Mobile cards.
4. **Quản trị Bể Proxy (`/fleet/proxies`):**
   - Đọc dữ liệu từ `runners.proxies` (`id`, `tenant_id`, `host`, `port`, `protocol`, `country_code`, `city`, `status`, `latency_ms`, `is_residential`, `error_count`, `last_checked_at`).
   - Trạng thái proxy: `all`, `active`, `failing`, `testing`, `disabled`.
   - Trực quan hóa độ trễ `latency_ms` (xanh: $< 300$ms, vàng: $300-800$ms, đỏ: $> 800$ms hoặc timeout).
   - Hỗ trợ bộ lọc URL query parameters: `?tenant=&status=`.
   - Dual View: Desktop table và Mobile cards.
5. **Tiêu chuẩn Giao diện & Kỹ thuật:**
   - 100% Lucide Icons, không dùng emoji (AGENTS.md §3).
   - Semantic tokens Shadcn Slate (`bg-card`, `border-border/60`, `rounded-xl`, etc.) (AGENTS.md §2).
   - Unit tests với Vitest cho các mappers và bộ tính metrics.

### Ngoài phạm vi:

- Không chỉnh sửa backend schema/RLS của Tuquet Cloud (đã hoàn thiện ở các module trước).
- Không triển khai các tính năng tạo proxy / browser profile mới từ giao diện web (YAGNI / CLI & runner daemons quản lý provision trực tiếp).

---

## 2. Public Interfaces & Data Structures

### 2.1. Data Models (`apps/web-admin/src/api/core/fleet.ts`)

```ts
export type DeviceStatus =
  'busy' | 'disabled' | 'idle' | 'maintenance' | 'offline';
export type BrowserStatus = 'error' | 'idle' | 'running' | 'syncing';
export type ProxyStatus = 'active' | 'disabled' | 'failing' | 'testing';

export interface FleetDeviceItem {
  active_jobs: number;
  capabilities: Record<string, any> | string[];
  cpu_cores: number;
  id: string;
  last_heartbeat_at: null | string;
  machine_fingerprint: string;
  metadata?: Record<string, any>;
  name: string;
  os_info: string;
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
```

### 2.2. API Functions Contract

```ts
export function buildFleetFilterQuery(
  basePath: string,
  params?: { status?: string; tenantId?: string },
): string;

export function calculateFleetMetrics(
  nodes: FleetDeviceItem[],
  loopbackOnline: boolean,
): FleetMetricsData;

export function mapRawDeviceToFleetNode(raw: any): FleetDeviceItem;

export async function getFleetDevicesApi(params?: {
  status?: string;
  tenantId?: string;
}): Promise<FleetDeviceItem[]>;

export async function revokeFleetDeviceApi(deviceId: string): Promise<void>;

export async function probeLocalDaemonApi(port?: number): Promise<{
  latencyMs?: number;
  online: boolean;
  port: number;
}>;

export async function getFleetBrowsersApi(params?: {
  status?: string;
  tenantId?: string;
}): Promise<FleetBrowserItem[]>;

export async function getFleetProxiesApi(params?: {
  status?: string;
  tenantId?: string;
}): Promise<FleetProxyItem[]>;
```

---

## 3. Screen Designs & Components Breakdown

### 3.1. Devices Screen (`/fleet/devices`)

- **Metric Cards (4 thẻ):**
  1. Tổng số máy trạm (`total_nodes`)
  2. Thiết bị trực tuyến (`online_nodes` - trạng thái `idle` hoặc `busy`)
  3. Tác vụ đang thực thi (`active_jobs`)
  4. Specter Loopback Daemon (:8765 status, latency ms)
- **Status Filter:** Tất Cả, Sẵn Sàng (`idle`), Đang Bận (`busy`), Ngoại Tuyến (`offline`), Bảo Trì (`maintenance`).
- **Dual View Table & Cards:**
  - Cột/Trường: Tên thiết bị + Fingerprint, Hệ điều hành + CPU/RAM, Trạng thái (Badge), Heartbeat gần nhất, Tác vụ đang chạy, Hành động (Xem chi tiết, Thu hồi quyền).
- **Modals:**
  - `NodeDetailModal`: Chi tiết fingerprint, cấu hình phần cứng, capabilities, metadata JSON, nút Thu hồi.
  - `ConnectFleetModal`: Hướng dẫn ghép nối thiết bị qua Specter CLI Daemon loopback bridge (:8765).

### 3.2. Cloud Browsers Screen (`/fleet/browsers`)

- **Dual View Table & Cards:**
  - Cột/Trường: Tên Profile + Phiên bản engine, OS Platform, Bể Proxy được gán (`host:port` hoặc Trực tiếp), Lease Lock (`locked_by_device.name` hoặc "Chưa khóa"), Cookie / Snapshot Storage (`cookies_count`, KB/MB size), Trạng thái (`idle`, `running`, `syncing`, `error`), Ngày tạo.
- **Status Filter:** Tất Cả, Rảnh (`idle`), Đang Chạy (`running`), Đang Đồng Bộ (`syncing`), Lỗi (`error`).
- **Empty State:** Icon `Globe`, mô tả rõ ràng khi tenant chưa có cloud browser profile nào.

### 3.3. Proxy Pool Screen (`/fleet/proxies`)

- **Dual View Table & Cards:**
  - Cột/Trường: Endpoint (`protocol://host:port`), Vị trí (`country_code`, `city`), Loại (`Residential` / `Datacenter`), Độ trễ (`latency_ms` kèm badge xanh/vàng/đỏ), Trạng thái (`active`, `failing`, `testing`, `disabled`), Lỗi tích lũy (`error_count`), Lần kiểm tra cuối.
- **Status Filter:** Tất Cả, Hoạt Động (`active`), Lỗi (`failing`), Kiểm Tra (`testing`), Vô Hiệu (`disabled`).
- **Empty State:** Icon `Network`, mô tả rõ ràng khi chưa có proxy nào trong pool.

---

## 4. Verification Plan

### Automated Vitest Unit Tests:

- `apps/web-admin/src/api/core/__tests__/fleet.test.ts`:
  - Kiểm tra `mapRawDeviceToFleetNode` chuyển đổi đúng `ram_mb` sang MB, nhận diện `capabilities` mảng/object, và gán default hợp lệ.
  - Kiểm tra `calculateFleetMetrics` tính toán chính xác tổng nodes, số node trực tuyến (`idle` + `busy`), và tổng jobs.
  - Kiểm tra `buildFleetFilterQuery` tạo đúng PostgREST query string với `tenant_id=eq.` và `status=eq.`.

### Quality Gate Suite:

1. `pnpm exec vitest run apps/web-admin/src/api/core apps/web-admin/src/router`
2. `pnpm --filter @tuquet/admin-web run typecheck`
3. `npx oxlint apps/web-admin/src/`
4. `pnpm run lint`
5. `pnpm run build:admin`
