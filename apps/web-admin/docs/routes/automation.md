# Đặc Tả Route: Automation Engine & Runners Fleet (Tự Động Hóa & Hạ Tầng Thực Thi)

> **Đường dẫn chính:** `/automation/workflows`, `/automation/runs`, `/automation/runs/:id`, `/automation/devices`, `/automation/browsers`, `/automation/proxies`  
> **Module File:** [`src/router/routes/modules/automation.ts`](../../src/router/routes/modules/automation.ts)  
> **Plugins Quản Lý:** `automa` (cho kịch bản & phiên chạy) và `runners` (cho thiết bị, trình duyệt & proxy)  
> **Schemas Nguồn:** `automa` (`Accept-Profile: automa`) và `runners` (`Accept-Profile: runners`)  
> **Biểu tượng:** `lucide:workflow`

---

## 1. Định Nghĩa Tuyến Đường (Route Definitions)

```typescript
{
  meta: {
    icon: 'lucide:workflow',
    order: 20,
    title: $t('page.automation.title'),
  },
  name: 'Automation',
  path: '/automation',
  redirect: '/automation/workflows',
  children: [
    {
      name: 'AutomationWorkflows',
      path: 'workflows',
      component: () => import('#/views/automation/workflows/index.vue'),
      meta: {
        authority: ['superadmin', 'automa:workflows:read'],
        icon: 'lucide:git-branch',
        plugin: 'automa',
        title: $t('page.automation.workflows'),
      },
    },
    {
      name: 'AutomationRuns',
      path: 'runs',
      component: () => import('#/views/automation/runs/index.vue'),
      meta: {
        authority: ['superadmin', 'automa:campaigns:read'],
        icon: 'lucide:play-circle',
        plugin: 'automa',
        title: $t('page.automation.runs'),
      },
    },
    {
      name: 'AutomationDevices',
      path: 'devices',
      component: () => import('#/views/automation/devices/index.vue'),
      meta: {
        authority: ['superadmin', 'runners:devices:read'],
        icon: 'lucide:laptop',
        plugin: 'runners',
        title: $t('page.automation.devices'),
      },
    },
    {
      name: 'AutomationBrowsers',
      path: 'browsers',
      component: () => import('#/views/automation/browsers/index.vue'),
      meta: {
        authority: ['superadmin', 'runners:browsers:read'],
        icon: 'lucide:globe',
        plugin: 'runners',
        title: $t('page.automation.browsers'),
      },
    },
    {
      name: 'AutomationProxies',
      path: 'proxies',
      component: () => import('#/views/automation/proxies/index.vue'),
      meta: {
        authority: ['superadmin', 'runners:proxies:read'],
        icon: 'lucide:network',
        plugin: 'runners',
        title: $t('page.automation.proxies'),
      },
    },
    {
      name: 'AutomationRunDetail',
      path: 'runs/:id',
      component: () => import('#/views/automation/runs/detail.vue'),
      meta: {
        authority: ['superadmin', 'automa:logs:read'],
        hideInMenu: true,
        icon: 'lucide:file-text',
        plugin: 'automa',
        title: $t('page.automation.runDetail'),
      },
    },
  ],
}
```

---

## 2. Chi Tiết Từng Tuyến Con (Sub-routes)

### 2.1. Quy Trình Tự Động Hóa: `/automation/workflows` (`automa`)

- **Mục Đích:** Quản lý danh mục các sơ đồ quy trình tự động hóa đồ họa (Automa Canvas Schemas).
- **Nguồn Dữ Liệu:** Bảng `automa.workflows`.
- **API Client:** [`getWorkflowsApi(filter)`](../../src/api/core/automation.ts) với `{ schema: 'automa' }`.
- **Giao Diện:** Bảng dữ liệu `useVbenVxeGrid` tích hợp thanh lọc `formOptions` theo trạng thái (`published`, `draft`, `archived`) và từ khóa tìm kiếm.

### 2.2. Lịch Sử Thực Thi: `/automation/runs` (`automa`)

- **Mục Đích:** Theo dõi tiến độ chạy của các đợt chiến dịch hoặc tác vụ tự động hóa hàng loạt.
- **Nguồn Dữ Liệu:** Bảng `automa.campaign_runs`.
- **API Client:** [`getCampaignRunsApi(filter)`](../../src/api/core/automation.ts) với `{ schema: 'automa' }`.
- **Các Chỉ Số Tính Toán:**
  - **Tiến độ (%):** Tính toán qua `calculateProgressPercentage(completed_tasks, total_tasks)`.
  - **Thời gian chạy (Duration):** Tính khoảng cách giữa `started_at` và `ended_at` (hoặc thời điểm hiện tại nếu run đang chạy).

### 2.3. Chi Tiết Lần Chạy & Console Nhật Ký: `/automation/runs/:id` (`automa`)

- **Mục Đích:** Giám sát trực tiếp quá trình thực thi, xem log đầu ra chi tiết của từng bước và hủy tác vụ khi cần.
- **Nguồn Dữ Liệu:** `automa.campaign_runs` và `automa.execution_logs`.
- **Giao Diện:** Biểu mẫu thông tin chi tiết xây dựng trên `VxeForm` kết hợp Terminal Logs Viewer nền tối.
- **Cơ Chế Polling Động (3-Second Live Polling):**
  - Khi lần chạy ở trạng thái chưa kết thúc (`pending`, `queued`, `running`), hệ thống tự động kích hoạt bộ đếm thời gian polling **mỗi 3000ms** để cập nhật tiến độ và tải thêm các dòng log mới nhất.
  - Khi lần chạy chuyển sang trạng thái kết thúc (`completed`, `failed`, `cancelled`) hoặc khi unmount component, timer lập tức được giải phóng.
- **Hành Động Hủy Lần Chạy (Cancel Run):**
  - Kích hoạt hàm `cancelCampaignRunApi(id)` gửi lệnh PATCH cập nhật `status = 'cancelled'` lên `automa.campaign_runs`.

### 2.4. Thiết Bị & Máy Trạm: `/automation/devices` (`runners`)

- **Mục Đích:** Giám sát toàn bộ các worker nodes (máy trạm Specter Desk chạy macOS, Windows, Linux hoặc headless cloud VPS runners).
- **Nguồn Dữ Liệu:** Bảng `runners.devices`.
- **API Client:** [`getFleetDevicesApi(filter)`](../../src/api/core/automation.ts) với `{ schema: 'runners' }`.
- **Các Thành Phần Giao Diện:**
  - **Metric Cards ([`fleet-metrics.vue`](../../src/views/automation/devices/components/fleet-metrics.vue)):** 4 thẻ đo đếm (Tổng số máy trạm, Thiết bị trực tuyến, Tác vụ đang chạy, trạng thái Loopback Daemon `:8765`).
  - **Bảng `useVbenVxeGrid`:** Hiển thị chi tiết phần cứng (OS, RAM, CPU, Fingerprint, Heartbeat cuối) kèm bộ lọc trạng thái (`idle`, `busy`, `offline`, `maintenance`).
  - **Modals:**
    - [`connect-fleet-modal.vue`](../../src/views/automation/devices/components/modals/connect-fleet-modal.vue): Hướng dẫn ghép nối thiết bị qua Specter CLI hoặc cầu nối SSO.
    - [`node-detail-modal.vue`](../../src/views/automation/devices/components/modals/node-detail-modal.vue): Chi tiết telemetry phần cứng của thiết bị hiển thị qua `VxeForm`.

### 2.5. Hồ Sơ Trình Duyệt: `/automation/browsers` (`runners`)

- **Mục Đích:** Kiểm soát danh sách các hồ sơ trình duyệt Chromium chuyên dụng được vận hành bởi Automator workers.
- **Nguồn Dữ Liệu:** Bảng `runners.browsers`.
- **API Client:** [`getFleetBrowsersApi(filter)`](../../src/api/core/automation.ts) với `{ schema: 'runners' }`.
- **Thông Tin Hiển Thị (`useVbenVxeGrid`):** Tên hồ sơ, Phiên bản engine, Hệ điều hành, Proxy gắn kết, Thiết bị đang giữ khóa (`locked_by_device`), Dung lượng lưu trữ & số lượng cookies, Trạng thái (`idle`, `running`, `syncing`, `error`).

### 2.6. Pool Proxy Mạng: `/automation/proxies` (`runners`)

- **Mục Đích:** Giám sát pool proxy phân tán phục vụ thu thập dữ liệu và tác vụ tự động hóa.
- **Nguồn Dữ Liệu:** Bảng `runners.proxies`.
- **API Client:** [`getFleetProxiesApi(filter)`](../../src/api/core/automation.ts) với `{ schema: 'runners' }`.
- **Thông Tin Hiển Thị (`useVbenVxeGrid`):** Endpoint (`protocol://host:port`), Quốc gia / Thành phố, Phân loại (`Residential` / `Datacenter`), Độ trễ kết nối (`latency_ms`), Số lỗi tích lũy, Trạng thái (`active`, `failing`, `testing`, `disabled`).

---

## 3. Lưu Ý Kỹ Thuật (Gotchas & Guardrails)

1. **Phân Tách Plugin Gate Cấp Tuyến Con:**
   - Tuyến cha `/automation` chứa cả các tuyến thuộc plugin `automa` và `runners`. Hàm [`filterRoutesByPlugins()`](../../src/router/plugin-gate.ts) lọc độc lập từng tuyến con và chỉ ẩn `/automation` khi cả 2 plugin đều chưa cài đặt.
2. **Không Sử Dụng Supabase Realtime WebSocket Cho Logs (Quyết định D3):**
   - Bảng `automa.execution_logs` không đưa vào `supabase_realtime` publication để bảo vệ WebSocket worker. Cơ chế Polling 3s có điều kiện dừng là giải pháp chuẩn.
3. **Bắt Buộc Schema Header:**
   - Các truy vấn tới `automa.*` phải truyền `{ schema: 'automa' }` và các truy vấn tới `runners.*` phải truyền `{ schema: 'runners' }`.
