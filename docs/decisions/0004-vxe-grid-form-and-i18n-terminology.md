# ADR-004: Chuẩn Hóa Bảng Dữ Liệu VXE Grid, Biểu Mẫu VXE Form, Hợp Nhất Định Tuyến `/automation` & Từ Điển Thuật Ngữ `term.json`

## Trạng Thái (Status)

**Accepted** (Đã thông qua và hoàn thành triển khai ngày 2026-10-14 — cập nhật Quyết định D6 của [`ADR-001`](0001-routing-architecture.md))

## Ngày (Date)

2026-10-14

## Bối Cảnh (Context)

Sau giai đoạn hoàn thiện kết nối dữ liệu thực tế cho toàn bộ các phân hệ của `apps/web-admin`, hệ thống phát sinh 4 nhu cầu cải tiến cốt lõi về kiến trúc giao diện và trải nghiệm vận hành:

1. **Hạn chế của mô hình Dual View thủ công (HTML `<table>` + Mobile Touch Card):** Việc duy trì hai nhánh DOM song song (`hidden md:block` và `block md:hidden`) trong từng file `.vue` gây lặp mã nguồn, thiếu đồng nhất ở thanh công cụ lọc dữ liệu, phân trang và xử lý bảng lớn.
2. **Hiện tượng nháy trang & nhảy cuộn khi đổi Query String:** Khi chuyển tab hoặc bộ lọc qua URL query (`?tab=members`, `?status=running`) trên cùng một tuyến đường, việc dùng `route.fullPath` làm `router-view` key khiến component bị unmount/remount, kích hoạt hiệu ứng chuyển cảnh thừa và cuộn ngược lên đầu trang.
3. **Phân mảnh giữa kịch bản tự động hóa (`Automation`) và hạ tầng thực thi (`Fleet`):** Người vận hành thường xuyên kiểm tra quy trình (`workflows`), phiên chạy (`runs`) song hành cùng máy trạm (`devices`), trình duyệt (`browsers`) và proxy (`proxies`). Tách thành 2 menu cấp 1 riêng biệt làm tăng độ phức tạp điều hướng trên Sidebar.
4. **Tính nhất quán thuật ngữ đa ngôn ngữ (i18n Terminology & Brevity):** Các thuật ngữ miền (Workspace, Quy trình, Phiên chạy, Thiết bị, Hồ sơ trình duyệt, Gói cước...) và các nút hành động (`Tạo`, `Làm mới`, `Lọc`, `Đặt lại`) cần một nguồn từ điển chuẩn duy nhất, tuân thủ Sentence case tiếng Việt và nguyên tắc "nói ít hiểu nhiều" (Anti-Verbosity).

---

## Quyết Định Kiến Trúc (Decisions)

### D1: Chuẩn Hóa Bảng Dữ Liệu Với `useVbenVxeGrid` (`VxeTable`) & Biểu Mẫu Với `VxeForm` (Cập nhật D6 của ADR-001)

- **Quyết định:**
  - Thay thế toàn bộ các bảng HTML `<table>` và thẻ Mobile Card thủ công trên mọi màn hình danh sách (`tenants`, `automation/*`, `system/*`) bằng adapter chuẩn `useVbenVxeGrid` từ [`src/adapter/vxe-table.ts`](../../apps/web-admin/src/adapter/vxe-table.ts).
  - Tích hợp thanh lọc tìm kiếm trực tiếp qua `formOptions` của VXE Grid.
  - Chuẩn hóa toàn bộ các trang chi tiết (`runs/detail.vue`, `workspace-overview-tab.vue`, `profile/index.vue`) và toàn bộ các hộp thoại Modal sang sử dụng `VxeForm`, `VxeFormItem`, `VxeFormGroup`.
  - Định nghĩa đường kẻ phân tách bằng semantic CSS variables tinh tế (`--vxe-ui-table-border-color: hsl(var(--border) / 40%)`), hỗ trợ cuộn ngang tự nhiên (`overflow-x: auto`) và phân trang căn giữa gọn gàng trên thiết bị di động.

### D2: Bảo Toàn Vị Trí Cuộn & Triệt Tiêu Chuyển Cảnh Nội Trang (`Intra-Page Scroll Preservation`)

- **Quyết định:**
  - Sử dụng `route.path` làm khóa định danh mặc định (`rawKey`) cho `router-view` thay vì `fullPath`, ngăn chặn Virtual DOM hủy và tạo lại component khi chỉ thay đổi query parameters (`?tab=`, `?status=`).
  - Vô hiệu hóa hiệu ứng transition (`fade-slide`) và giữ nguyên vị trí cuộn (`scrollBehavior`) khi `to.path === from.path`.

### D3: Hợp Nhất Phân Hệ `Fleet` Vào `Automation` Ở Tầng Frontend & Bảo Toàn Kiến Trúc 2 Schema DB (`automa` + `runners`)

- **Quyết định:**
  - **Đồng bộ 100% ở tầng Frontend (`@tuquet/admin-web`):**
    - **Router:** Hợp nhất 3 tuyến hạ tầng (`devices`, `browsers`, `proxies`) vào [`src/router/routes/modules/automation.ts`](../../apps/web-admin/src/router/routes/modules/automation.ts) dưới `/automation/devices`, `/automation/browsers`, `/automation/proxies` và xóa bỏ triệt để các tuyến redirect cũ (`fleet.ts`, aliases trong `dashboard.ts`).
    - **Views:** Di chuyển toàn bộ thư mục view từ `src/views/fleet/*` sang `src/views/automation/{devices,browsers,proxies}`.
    - **API Core & Tests:** Hợp nhất `src/api/core/fleet.ts` vào [`src/api/core/automation.ts`](../../apps/web-admin/src/api/core/automation.ts) và gộp `fleet.test.ts` vào [`src/api/core/__tests__/automation.test.ts`](../../apps/web-admin/src/api/core/__tests__/automation.test.ts).
    - **i18n Keyspace:** Hợp nhất các khóa điều hướng `page.fleet.*` vào `page.automation.*` trong `page.json`.
  - **Giữ nguyên 2 Schema & Plugin độc lập ở tầng Database (`cloud/supabase/plugins/`):**
    - Tương tự như phân hệ `/system` (1 nhóm menu/API frontend đại diện cho 2 schema DB: `public` của plugin `core-iam` và `billing` của plugin `subscriptions`), phân hệ `/automation` kết nối tới 2 schema PostgreSQL độc lập:
      - Schema `automa` (plugin `automa`): `workflows`, `campaign_runs`, `execution_logs`, `schedules`.
      - Schema `runners` (plugin `runners`): `devices`, `browsers`, `proxies`, `node_browsers`.
    - Cách tiếp cận này giúp Tenant có thể bật riêng `runners` (dùng Cloud Anti-Detect Browser & Proxy Pool) mà không bắt buộc bật `automa`, đồng thời giữ tương thích 100% với các pillar của CLI (`specter automa`, `specter runner`).
  - Rút gọn thanh điều hướng Sidebar cấp 1 xuống đúng **4 nhóm cốt lõi**: `Dashboard` (`/dashboard`), `Workspaces` (`/tenants`), `Automation` (`/automation`), và `System` (`/system`).

### D4: Kiến Trúc Từ Điển 3 Tầng (`common.json`, `term.json`, `page.json`) & Quy Tắc Tối Giản Nhãn Giao Diện

- **Quyết định:**
  - Thiết lập danh mục thuật ngữ chuẩn [`packages/locales/src/langs/{en-US,vi-VN}/term.json`](../../../../packages/locales/src/langs/vi-VN/term.json) làm SSOT cho các danh từ miền cốt lõi (`workspace`, `workflow`, `device`, `browserProfile`, `proxyPool`, `plugin`, `plan`, `subscription`, `role`, `auditLog`...).
  - Tái sử dụng triệt để `$t('common.*')` (`create`, `refresh`, `filter`, `reset`, `save`, `delete`, `detail`) cho các nút thao tác phổ quát.
  - Thực thi nghiêm ngặt chuẩn **Sentence case** cho tiếng Việt (chỉ viết hoa chữ cái đầu câu và danh từ riêng), loại bỏ dấu ngoặc đơn giải thích thừa trên nhãn UI, và rút gọn nhãn nút theo ngữ cảnh trang (ví dụ: dùng `Tạo` thay vì `Tạo workspace` khi đang ở trang Workspace).

---

## Hệ Quả (Consequences)

### Tích cực:

- **Đồng nhất 100% trải nghiệm dữ liệu & biểu mẫu:** Toàn bộ 11 màn hình danh sách và các hộp thoại modal vận hành trên cùng một kiến trúc `VxeGrid` / `VxeForm`, giảm đáng kể khối lượng mã template lặp lại.
- **Trải nghiệm điều hướng mượt mà:** Chuyển tab trong `/tenants/:id?tab=...` hoặc lọc trạng thái không gây giật trang hay mất vị trí cuộn.
- **Cấu trúc thư mục & tài liệu sạch sẽ:** Cây thư mục `src/views/automation/` khớp 1-1 với cây URL `/automation/*`; Sidebar gọn gàng với 4 nhóm chức năng.
- **Kiểm định tự động:** Lệnh `pnpm run check:i18n` và unit tests trong [`plugin-gate.test.ts`](../../apps/web-admin/src/router/__tests__/plugin-gate.test.ts) bảo vệ tính toàn vẹn của khóa dịch và bộ lọc route.

### Ràng buộc:

- Khi thêm màn hình danh sách hoặc modal mới, bắt buộc sử dụng `useVbenVxeGrid` / `VxeForm` từ `#/adapter/vxe-table` và tra cứu từ vựng trong `common.json` + `term.json` trước khi thêm khóa mới vào `page.json`.
