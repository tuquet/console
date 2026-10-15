# Spec: Quản Trị Thiết Bị Runner, Hồ Sơ Trình Duyệt & Bể Proxy (`fleet-inventory`)

> **Mã đặc tả:** `SPEC-fleet-inventory`  
> **Module id:** `fleet-inventory` (xem [`capability-map.md`](capability-map.md))  
> **Kiến trúc nguồn:** [`docs/architecture/overview.md`](../architecture/overview.md), [`docs/routes/automation.md`](../routes/automation.md), [`ADR-004`](../decisions/0004-vxe-grid-form-and-i18n-terminology.md)  
> **Trạng thái:** **ĐÃ HOÀN THÀNH (ACCEPTED & IMPLEMENTED)**

---

## 1. Objective (Mục Tiêu & Phạm Vi)

Xây dựng phân hệ Quản trị Hạ tầng Thực thi (**Runners Fleet** — plugin `runners`) thuộc nhánh điều hướng `/automation/*`, kết nối **100% dữ liệu đo đếm thực tế** từ schema `runners` của Tuquet Cloud qua header `Accept-Profile: runners` và thăm dò cổng loopback cục bộ (`127.0.0.1:8765`):

1. **Quản Trị Thiết Bị & Máy Trạm (`/automation/devices`):**
   - Hiển thị danh mục thiết bị từ `runners.devices` (`id`, `tenant_id`, `name`, `machine_fingerprint`, `status`, `version`, `os_info`, `cpu_cores`, `ram_mb`, `capabilities`, `active_jobs`, `last_heartbeat_at`) qua bảng `useVbenVxeGrid`.
   - Hiển thị 4 thẻ chỉ số KPI thời gian thực: Tổng số máy trạm (`total_nodes`), Thiết bị trực tuyến (`online_nodes`: `idle` + `busy`), Tác vụ đang chạy (`active_jobs`), và Trạng thái kết nối Specter Loopback Daemon (`127.0.0.1:8765`).
   - Hỗ trợ xem chi tiết cấu hình phần cứng (`NodeDetailModal` với `VxeForm`), hướng dẫn ghép nối máy trạm (`ConnectFleetModal`), và thu hồi quyền thiết bị (`revokeFleetDeviceApi`).
2. **Quản Trị Hồ Sơ Trình Duyệt Anti-Detect (`/automation/browsers`):**
   - Hiển thị danh mục hồ sơ trình duyệt từ `runners.browsers` liên kết `locked_by_device:locked_by_device_id(name)` và `proxy:proxy_id(host,port,protocol)` qua bảng `useVbenVxeGrid`.
   - Hỗ trợ lọc theo trạng thái (`all`, `idle`, `running`, `syncing`, `error`) và theo Workspace (`?tenant=`).
3. **Quản Trị Bể Proxy Mạng Phân Tán (`/automation/proxies`):**
   - Hiển thị danh sách proxy từ `runners.proxies` (`host`, `port`, `protocol`, `country_code`, `city`, `status`, `latency_ms`, `is_residential`, `error_count`, `last_checked_at`) qua bảng `useVbenVxeGrid`.
   - Trực quan hóa độ trễ mạng `latency_ms` (`< 300ms` tốt, `300-800ms` trung bình, `> 800ms` cao) và lọc theo trạng thái (`all`, `active`, `failing`, `testing`, `disabled`).

---

## 2. Tech Stack

- **Framework:** Vue 3.5 (`<script setup lang="ts">`), Vue Router 4, TypeScript 5, `vue-i18n`.
- **Data Grid & Form Engine:** `useVbenVxeGrid` (`VxeTable`) và `VxeForm` từ [`src/adapter/vxe-table.ts`](../../src/adapter/vxe-table.ts).
- **UI & Icons:** `@tuquet/vue-ui` (`Badge`, `Button`, `Card`, `Dialog`, `toast`), `@lucide/vue`.
- **Unified Data Access Layer:** [`src/api/core/automation.ts`](../../src/api/core/automation.ts) (phần 2 kết nối `schema: 'runners'` và `probeLocalDaemonApi`).

---

## 3. Commands (Lệnh Thực Thi & Kiểm Định)

```bash
# 1. Chạy unit tests cho API Runners/Automation và Router Plugin Gate
pnpm exec vitest run apps/web-admin/src/api/core/__tests__/automation.test.ts apps/web-admin/src/router/__tests__/plugin-gate.test.ts

# 2. Kiểm tra kiểu dữ liệu TypeScript
pnpm --filter @tuquet/admin-web run typecheck

# 3. Kiểm tra linter và định dạng
npx oxlint apps/web-admin/src/
pnpm run lint

# 4. Đóng gói bản dựng production
pnpm run build:admin
```

---

## 4. Project Structure (Cấu Trúc Tệp Tác Động)

```text
apps/web-admin/src/
├── api/core/
│   ├── automation.ts                             # Tầng API hợp nhất (Phần 2: schema 'runners' & probeLocalDaemonApi)
│   └── __tests__/
│       └── automation.test.ts                    # Unit tests cho mapRawDeviceToFleetNode, calculateFleetMetrics, queries
├── locales/langs/
│   ├── en-US/page.json                           # Từ điển page.automation.{devices,browsers,proxies} (en-US)
│   └── vi-VN/page.json                           # Từ điển page.automation.{devices,browsers,proxies} (vi-VN)
├── router/routes/modules/
│   └── automation.ts                             # Định tuyến /automation/{devices,browsers,proxies} (plugin: 'runners')
└── views/automation/
    ├── devices/
    │   ├── index.vue                             # Bảng thiết bị Runner (useVbenVxeGrid) & 4 thẻ KPI
    │   └── components/
    │       ├── connect-fleet-modal.vue           # Hộp thoại hướng dẫn ghép nối Specter CLI Daemon
    │       └── node-detail-modal.vue             # Hộp thoại chi tiết phần cứng & thu hồi thiết bị (VxeForm)
    ├── browsers/
    │   └── index.vue                             # Bảng hồ sơ trình duyệt Chromium (useVbenVxeGrid)
    └── proxies/
        └── index.vue                             # Bảng bể Proxy mạng phân tán (useVbenVxeGrid)
```

---

## 5. Code Style & Kiến Trúc Chi Tiết

### 5.1. Mô Hình Dữ Liệu & Hợp Đồng API (`src/api/core/automation.ts`)

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

export interface FleetMetricsData {
  active_jobs: number;
  loopback_online: boolean;
  loopback_port: number;
  online_nodes: number;
  total_nodes: number;
}

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

### 5.2. Chuẩn Thăm Dò Loopback Daemon Không Chặn Giao Diện (PNA Safe Probe)

```ts
export async function probeLocalDaemonApi(port = 8765) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1200);
  const start = performance.now();
  try {
    await fetch(`http://127.0.0.1:${port}/api/v1/status`, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal,
    });
    return {
      online: true,
      port,
      latencyMs: Math.round(performance.now() - start),
    };
  } catch {
    return { online: false, port };
  } finally {
    clearTimeout(timeout);
  }
}
```

---

## 6. Testing Strategy (Chiến Lược Kiểm Thử)

1. **Unit Tests ([`automation.test.ts`](../../src/api/core/__tests__/automation.test.ts)):**
   - Kiểm tra `mapRawDeviceToFleetNode` chuẩn hóa đúng dung lượng RAM, danh sách `capabilities` và các trường mặc định.
   - Kiểm tra `calculateFleetMetrics` cộng chính xác số thiết bị trực tuyến (`idle` + `busy`) và tổng số `active_jobs`.
   - Kiểm tra `buildFleetFilterQuery` và các hàm `getFleetDevicesApi`, `revokeFleetDeviceApi`, `getFleetBrowsersApi`, `getFleetProxiesApi` gửi đúng header `{ schema: 'runners' }`.
2. **Router Plugin Gate Tests ([`plugin-gate.test.ts`](../../src/router/__tests__/plugin-gate.test.ts)):**
   - Xác minh 3 tuyến `devices`, `browsers`, `proxies` được lọc độc lập theo plugin `runners` bên trong menu `/automation`.

---

## 7. Boundaries (Ranh Giới Kỹ Thuật)

- **Always:**
  - Truyền `{ schema: 'runners' }` cho mọi truy vấn tới `devices`, `browsers`, `proxies`.
  - Gắn `meta.plugin: 'runners'` trên 3 tuyến `/automation/devices`, `/automation/browsers`, `/automation/proxies`.
  - Giới hạn timeout $\le 1200\text{ms}$ và `mode: 'no-cors'` khi gọi `probeLocalDaemonApi` để không bao giờ làm treo giao diện nếu người dùng chặn quyền Private Network Access (PNA).
- **Ask first:**
  - Thay đổi cấu trúc bảng trong schema `runners` tại `tuquet/cloud`.
- **Never:**
  - Không lưu trữ danh sách máy trạm giả lập trong `localStorage` để fallback khi bảng `runners.devices` rỗng.
  - Không để lộ chuỗi mật khẩu proxy (`password_encrypted`) lên giao diện bảng.

---

## 8. Success Criteria (Tiêu Chí Nghiệm Thu)

- [x] **SC1:** 3 màn hình `/automation/devices`, `/automation/browsers`, `/automation/proxies` hiển thị dữ liệu thực tế từ schema `runners` trên nền bảng `useVbenVxeGrid`.
- [x] **SC2:** Thăm dò Loopback Daemon (`127.0.0.1:8765`) trên `/automation/devices` hoạt động bất đồng bộ, an toàn PNA và hiển thị độ trễ thực tế.
- [x] **SC3:** Thao tác thu hồi thiết bị (`revokeFleetDeviceApi`) xóa bản ghi khỏi `runners.devices` và cập nhật lại bảng cùng 4 thẻ KPI.
- [x] **SC4:** Toàn bộ unit tests trong `automation.test.ts` và `plugin-gate.test.ts` pass 100%, `typecheck` đạt 0 lỗi.

---

## 9. Resolved Decisions (Các Quyết Định Đã Chốt)

1. **Hợp nhất điều hướng dưới `/automation/*` với ranh giới `plugin: 'runners'` độc lập:** Người vận hành theo dõi thiết bị, trình duyệt và proxy ngay trong cùng nhóm menu `/automation` với quy trình và phiên chạy, nhưng hệ thống vẫn kiểm tra quyền `runners:*:read` và trạng thái cài đặt plugin `runners` tách biệt với `automa`.
2. **Provisioning hạ tầng qua Specter CLI & Commerce:** Việc khởi tạo hồ sơ trình duyệt vật lý được thực hiện trực tiếp từ Specter Desk / CLI daemon hoặc cấp phát tự động qua Cửa hàng Tài nguyên Số (`/commerce/store`), giữ cho giao diện quản trị tập trung vào giám sát telemetry và điều phối.
