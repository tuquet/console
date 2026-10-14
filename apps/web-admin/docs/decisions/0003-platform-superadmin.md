# ADR-003: Kiến Trúc Quản Trị Nền Tảng Platform Superadmin & Giám Sát Xuyên Tenant

## Trạng Thái (Status)

**Accepted** (Đã thông qua và hoàn thành triển khai ngày 2026-10-13)

## Ngày (Date)

2026-10-13

## Bối Cảnh (Context)

Trong kiến trúc Multi-Tenant của Tuquet Cloud, mỗi tổ chức (Workspace/Tenant) được cách ly nghiêm ngặt thông qua Row Level Security (RLS). Người dùng thông thường chỉ có thể thấy các thành viên, thiết bị, quy trình và nhật ký thuộc về những workspace mà họ được cấp quyền (`get_user_tenant_ids()`).

Tuy nhiên, đội ngũ vận hành hệ thống (**Platform Superadmin**) cần có khả năng giám sát toàn diện ở cấp độ hạ tầng trên toàn bộ nền tảng:

1. **Quản lý người dùng toàn hệ sinh thái:** Xem danh bạ tất cả các tài khoản đã đăng ký trên Tuquet Cloud (`public.profiles`), theo dõi số lượng workspace mà mỗi người dùng tham gia.
2. **Nhật ký an ninh toàn cầu (Global Audit Trail):** Giám sát các sự kiện an ninh, phân quyền, xóa workspace hoặc đổi mật khẩu trên phạm vi toàn hệ thống (`public.audit_logs`) mà không bị giới hạn theo từng tenant.
3. **Quản lý hợp đồng thuê bao SaaS (Platform Subscriptions):** Theo dõi toàn bộ các gói cước đang hoạt động, doanh thu định kỳ hàng tháng (MRR) và thời hạn gia hạn từ `billing.subscriptions` (schema `billing`).
4. **Ma trận vai trò & quyền hạn (RBAC Catalog):** Trực quan hóa 4 System Roles và danh mục 36 quyền hạn vi hạt từ `public.permissions` trên 6 module dịch vụ (`runners`, `automa`, `core-iam`, `subscriptions`, `storage`, `webhooks`).

---

## Quyết Định Kiến Trúc (Decisions)

### 1. Đồng Bộ Phân Quyền Giữa Backend và Frontend

- **Tầng Cơ Sở Dữ Liệu (`tuquet/cloud`):**
  - Hàm `public.is_platform_admin()` kiểm tra JWT claim `raw_app_meta_data.platform_role = 'superadmin'`.
  - Các chính sách bảo mật RLS trên `public.profiles`, `public.audit_logs`, `public.tenants`, `billing.subscriptions` bổ sung nhánh cho phép `is_platform_admin()` đọc toàn bộ dữ liệu.
- **Tầng Giao Diện (`tuquet/admin`):**
  - Khi xác thực phiên làm việc trong [`src/api/core/access.ts`](../../src/api/core/access.ts), nếu tài khoản là superadmin, hệ thống tự động gán vai trò `superadmin` vào bộ quyền hiệu lực.
  - Các route quản trị nền tảng được gắn cứng `meta.authority: ['superadmin']`. Đối với người dùng thông thường, router hoàn toàn ẩn các mục này khỏi menu và chặn điều hướng trực tiếp.

### 2. Tích Hợp Vào Nhóm Menu `/system` (KISS & Tối Giản Sidebar)

- Toàn bộ 4 tuyến đường quản trị nền tảng được đặt làm route con của `/system`, đảm bảo thanh điều hướng chỉ gồm 4 nhóm chính (`/dashboard`, `/tenants`, `/automation`, `/system`):
  - `/system/plugins` (Plugins hệ thống - Core IAM)
  - `/system/plans` (Gói cước SaaS - Subscriptions)
  - `/system/users` (Người dùng nền tảng - Superadmin Only)
  - `/system/audit-logs` (Nhật ký kiểm toán toàn cầu - Superadmin Only)
  - `/system/subscriptions` (Quản lý hợp đồng thuê bao - Superadmin Only)
  - `/system/roles` (Ma trận vai trò & phân quyền RBAC - Superadmin Only)

### 3. Nguyên Tắc Read-First & Giám Sát Dữ Liệu Thật (Zero Mock Data)

- Toàn bộ 4 view mới được thiết kế theo nguyên tắc Read-First & Telemetry:
  - `/system/users`: Đọc trực tiếp từ `public.profiles` kết hợp đếm số lượng tenant.
  - `/system/audit-logs`: Đọc từ `public.audit_logs` với bộ lọc linh hoạt theo hành động và tenant, có modal xem chi tiết payload JSON.
  - `/system/subscriptions`: Đọc từ `billing.subscriptions` kết nối `tenants` và `plans` qua header `Accept-Profile: billing`.
  - `/system/roles`: Đọc từ `public.roles` và `public.permissions`.
- Khi cơ sở dữ liệu rỗng, hiển thị Empty State chuẩn với Lucide Icon.

### 4. Chuẩn Hóa Bảng Dữ Liệu `useVbenVxeGrid` (Theo [`ADR-004`](0004-vxe-grid-form-and-i18n-terminology.md))

- Các trang danh sách quản trị nền tảng (`/system/users`, `/system/audit-logs`, `/system/subscriptions`) sử dụng `useVbenVxeGrid` (`VxeTable`) đồng nhất với thanh lọc `formOptions`, đường kẻ semantic token `border-border/40`, hỗ trợ cuộn ngang tự nhiên và phân trang đáp ứng trên cả Desktop và Mobile.

---

## Các Phương Án Đã Cân Nhắc (Alternatives Considered)

### 1. Tách Nhóm Menu Cấp 1 Mới: `/platform`

- **Bị từ chối:** Việc thêm `/platform` vào sidebar sẽ nâng tổng số nhóm sidebar lên 6, làm rối mắt người dùng và vi phạm quy chuẩn tối giản (KISS & YAGNI). Đặt dưới `/system` kết hợp `meta.authority: ['superadmin']` là giải pháp gọn gàng và tự nhiên nhất.

### 2. Kích Hoạt Thao Tác Xóa Vĩnh Viễn User Khỏi Auth GoTrue

- **Bị từ chối (Tạm hoãn):** Việc xóa user khỏi Auth schema có thể gây cascade delete diện rộng ảnh hưởng tới dữ liệu lịch sử của nhiều tenant. Ở giai đoạn này, ưu tiên năng lực giám sát và khóa tài khoản qua trạng thái, chưa cung cấp nút xóa cứng trên UI.

---

## Hệ Quả (Consequences)

### Tích cực:

- Quản trị viên nền tảng có cái nhìn toàn cảnh 360 độ về người dùng, an ninh, doanh thu định kỳ và phân quyền hệ thống.
- Bảo mật hai lớp: RLS ở cơ sở dữ liệu bảo vệ dữ liệu thực tế, `meta.authority` ở frontend định hướng giao diện chuẩn xác.
- Vượt qua 100% Cổng kiểm định cục bộ (Zero-Waste CI Gate).

### Ràng buộc:

- Bảng `billing.subscriptions` bắt buộc phải được truy vấn qua `{ schema: 'billing' }`.
- Tài khoản quản trị viên bắt buộc phải có claim `raw_app_meta_data.platform_role = 'superadmin'` để bypass RLS ở backend.
