# Đặc Tả Route: Automation Engine (Động Cơ Tự Động Hóa & Kịch Bản)

> **Đường dẫn chính:** `/automation/workflows`, `/automation/runs`, `/automation/runs/:id`  
> **Module File:** [`apps/web-admin/src/router/routes/modules/automation.ts`](../../apps/web-admin/src/router/routes/modules/automation.ts)  
> **Plugin Quản Lý:** `automa` (Plugin ID: `automa`)  
> **Schema Nguồn:** `automa` (Yêu cầu header PostgREST `Accept-Profile: automa`)  
> **Biểu tượng:** `lucide:workflow`

---

## 1. Định Nghĩa Tuyến Đường (Route Definitions)

```typescript
{
  path: '/automation',
  name: 'Automation',
  redirect: '/automation/workflows',
  meta: {
    title: 'Tự Động Hóa',
    icon: 'lucide:workflow',
    plugin: 'automa',
    order: 30,
  },
  children: [
    {
      path: 'workflows',
      name: 'AutomationWorkflows',
      component: () => import('#/views/automation/workflows/index.vue'),
      meta: {
        title: 'Kịch bản Workflows',
        icon: 'lucide:git-branch',
        authority: ['superadmin', 'automa:workflows:read'],
      },
    },
    {
      path: 'runs',
      name: 'AutomationRuns',
      component: () => import('#/views/automation/runs/index.vue'),
      meta: {
        title: 'Lịch sử Thực thi (Runs)',
        icon: 'lucide:play-circle',
        authority: ['superadmin', 'automa:campaigns:read'],
      },
    },
    {
      path: 'runs/:id',
      name: 'AutomationRunDetail',
      component: () => import('#/views/automation/runs/detail.vue'),
      meta: {
        title: 'Chi tiết Lần chạy',
        icon: 'lucide:file-text',
        authority: ['superadmin', 'automa:logs:read'],
        hideInMenu: true,
      },
    },
  ]
}
```

---

## 2. Chi Tiết Từng Tuyến Con (Sub-routes)

### 2.1. Kịch Bản Workflows: `/automation/workflows`

- **Mục Đích:** Quản lý danh mục các sơ đồ quy trình tự động hóa đồ họa (Automa Canvas Schemas).
- **Nguồn Dữ Liệu:** Bảng `automa.workflows`.
- **API Client:** [`getWorkflowsApi(filter)`](../../apps/web-admin/src/api/core/automation.ts) với `{ schema: 'automa' }`.
- **Query Parameters Hỗ Trợ:** `?tenant=<uuid>&status=published|draft|archived`
- **Thông Tin Hiển Thị:** Tên kịch bản, Số lượng node xử lý (`nodes_count`), Kiểu kích hoạt Trigger (Manual, Cron, Webhook), Trạng thái phát hành, Ngày cập nhật cuối.

### 2.2. Lịch Sử Thực Thi: `/automation/runs`

- **Mục Đích:** Theo dõi tiến độ chạy của các đợt chiến dịch hoặc tác vụ tự động hóa hàng loạt.
- **Nguồn Dữ Liệu:** Bảng `automa.campaign_runs`.
- **API Client:** [`getCampaignRunsApi(filter)`](../../apps/web-admin/src/api/core/automation.ts) với `{ schema: 'automa' }`.
- **Query Parameters Hỗ Trợ:** `?tenant=<uuid>&status=running|completed|failed|cancelled&workflow=<uuid>`
- **Các Chỉ Số Tính Toán:**
  - **Tiến độ (%):** Tính toán từ `(completed_tasks + failed_tasks) / total_tasks * 100`.
  - **Thời gian chạy (Duration):** Tính toán khoảng cách giữa `started_at` và `completed_at` (hoặc thời điểm hiện tại nếu run đang chạy).

### 2.3. Chi Tiết Lần Chạy & Console Nhật Ký: `/automation/runs/:id`

- **Mục Đích:** Giám sát trực tiếp quá trình thực thi, xem log đầu ra chi tiết của từng bước và hủy tác vụ khi cần.
- **Nguồn Dữ Liệu:**
  - Thông tin Run: `automa.campaign_runs`
  - Nhật ký thực thi: `automa.execution_logs`
- **Cơ Chế Polling Động (3-Second Live Polling):**
  - Khi lần chạy ở các trạng thái chưa kết thúc (`pending`, `queued`, `running`), hệ thống tự động kích hoạt bộ đếm thời gian polling **mỗi 3000ms** để cập nhật tiến độ và tải thêm các dòng log mới nhất.
  - Khi lần chạy chuyển sang trạng thái kết thúc (`completed`, `failed`, `cancelled`), timer lập tức được giải phóng để tiết kiệm tài nguyên mạng.
- **Console Log Trực Quan (Terminal Logs Viewer):**
  - Giao diện nền tối phong cách hacker terminal (`bg-[#090d16] font-mono text-xs`).
  - Phân loại cấp độ log theo màu sắc chuẩn Lucide: `error` (đỏ), `warn` (vàng), `info` (xanh lam), `debug`/`trace` (xám mờ).
  - Tự động cuộn xuống cuối (Auto-scroll to bottom) kèm nút gạt bật/tắt tiện dụng.
- **Hành Động Hủy Lần Chạy (Cancel Run):**
  - Nút "Hủy lần chạy" mở hộp thoại xác nhận an toàn, kích hoạt hàm `cancelCampaignRunApi(id)` gửi lệnh PATCH cập nhật `status = 'cancelled'` lên `automa.campaign_runs`.

---

## 3. Lưu Ý Kỹ Thuật (Gotchas & Guardrails)

1. **Không Sử Dụng Supabase Realtime WebSocket Cho Logs (Quyết định D3 & B8):**
   - Bảng `automa.execution_logs` không được đưa vào `supabase_realtime` publication trên Tuquet Cloud vì lưu lượng log cực lớn có thể làm nghẽn WebSocket worker. Polling 3s có điều kiện dừng là giải pháp tối ưu và an toàn nhất.
2. **Serializing JSON Payload:**
   - Khi gửi lệnh PATCH (như hủy run), `body` phải được bao gói bằng `JSON.stringify()` để tương thích với `supabaseRequest()`.
