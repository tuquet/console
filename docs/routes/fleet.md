# Đặc Tả Route: Fleet & Runners (Hạ Tầng Thiết Bị Phân Tán)

> **Đường dẫn chính:** `/fleet/devices`, `/fleet/browsers`, `/fleet/proxies`  
> **Module File:** [`apps/web-admin/src/router/routes/modules/fleet.ts`](../../apps/web-admin/src/router/routes/modules/fleet.ts)  
> **Plugin Quản Lý:** `runners` (Plugin ID: `runners`)  
> **Schema Nguồn:** `runners` (Yêu cầu header PostgREST `Accept-Profile: runners`)  
> **Biểu tượng:** `lucide:cpu`

---

## 1. Định Nghĩa Tuyến Đường (Route Definitions)

```typescript
{
  path: '/fleet',
  name: 'Fleet',
  redirect: '/fleet/devices',
  meta: {
    title: 'Fleet & Runners',
    icon: 'lucide:cpu',
    plugin: 'runners',
    order: 20,
  },
  children: [
    {
      path: 'devices',
      name: 'FleetDevices',
      component: () => import('#/views/fleet/devices/index.vue'),
      meta: {
        title: 'Thiết bị & Nodes',
        icon: 'lucide:laptop',
        authority: ['superadmin', 'runners:devices:read'],
      },
    },
    {
      path: 'browsers',
      name: 'FleetBrowsers',
      component: () => import('#/views/fleet/browsers/index.vue'),
      meta: {
        title: 'Trình duyệt Chromium',
        icon: 'lucide:globe',
        authority: ['superadmin', 'runners:browsers:read'],
      },
    },
    {
      path: 'proxies',
      name: 'FleetProxies',
      component: () => import('#/views/fleet/proxies/index.vue'),
      meta: {
        title: 'Proxy Pool',
        icon: 'lucide:network',
        authority: ['superadmin', 'runners:proxies:read'],
      },
    },
  ]
}
```

---

## 2. Chi Tiết Từng Tuyến Con (Sub-routes)

### 2.1. Thiết Bị & Máy Trạm: `/fleet/devices`

- **Mục Đích:** Giám sát toàn bộ các worker nodes (máy trạm Specter Desk chạy macOS, Windows, Linux hoặc headless cloud VPS runners).
- **Nguồn Dữ Liệu:** Bảng `runners.devices`.
- **API Client:** [`getFleetDevicesApi(filter)`](../../apps/web-admin/src/api/core/fleet.ts) với `{ schema: 'runners' }`.
- **Query Parameters Hỗ Trợ:** `?tenant=<uuid>&status=online|busy|offline`
- **Các Thành Phần Giao Diện:**
  - **Metric Cards:** 4 thẻ đo đếm (Tổng số nodes, Online, Đang chạy tác vụ Busy, Mất kết nối Offline).
  - **Dual View:** Bảng Desktop hoặc Thẻ Mobile hiển thị chi tiết phần cứng (OS, RAM, CPU, Vùng mạng, IP, Heartbeat cuối).
  - **Modals:**
    - `connect-fleet-modal.vue`: Hướng dẫn kết nối node mới qua Specter CLI hoặc mã lệnh cURL.
    - `node-detail-modal.vue`: Bảng thông tin telemetry chuyên sâu của thiết bị.

### 2.2. Trình Duyệt Tự Động Hóa: `/fleet/browsers`

- **Mục Đích:** Kiểm soát danh sách các phiên bản Chromium chuyên dụng được tạo bởi Automator workers.
- **Nguồn Dữ Liệu:** Bảng `runners.browsers`.
- **API Client:** [`getFleetBrowsersApi(filter)`](../../apps/web-admin/src/api/core/fleet.ts) với `{ schema: 'runners' }`.
- **Thông Tin Hiển Thị:** Tên Profile, Thiết bị sở hữu (`device_id`), Cổng gỡ lỗi Chromium (`debug_port`), Trạng thái phiên (`active`, `idle`, `closed`), Fingerprint profile hash.

### 2.3. Quản Lý Proxy Mạng: `/fleet/proxies`

- **Mục Đích:** Giám sát pool proxy phân tán phục vụ thu thập dữ liệu và tác vụ tự động hóa chống chặn IP.
- **Nguồn Dữ Liệu:** Bảng `runners.proxies`.
- **API Client:** [`getFleetProxiesApi(filter)`](../../apps/web-admin/src/api/core/fleet.ts) với `{ schema: 'runners' }`.
- **Thông Tin Hiển Thị:** Địa chỉ Proxy (`protocol://ip:port`), Quốc gia / Nhà mạng (ISP), Độ trễ kết nối (Latency Ms), Thiết bị đang gán, Trạng thái sức khỏe (`active`, `inactive`, `error`).

---

## 3. Lưu Ý Kỹ Thuật (Gotchas & Guardrails)

1. **Loại Bỏ Hoàn Toàn Mock Data Fallback:**
   - Hệ thống cũ tự ý fallback về dữ liệu giả lập trong `localStorage` hoặc hàm `getInitialFallbackNodes()` khi truy vấn thất bại. Hệ thống V2 đã loại bỏ triệt để fallback này. Nếu không có thiết bị hoặc API trả về mảng rỗng, giao diện hiển thị Empty State sạch sẽ với biểu tượng Lucide `Laptop`.
2. **Bắt Buộc Schema runners:**
   - Schema `runners` không nằm trong đường dẫn mặc định của PostgREST. Mọi yêu cầu HTTP phải qua `supabaseRequest(url, { schema: 'runners' })` để tự động kèm header `Accept-Profile: runners`.
