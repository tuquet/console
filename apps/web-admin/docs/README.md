# Tài Liệu Kỹ Thuật Tuquet Admin (`@tuquet/admin-web`)

> **Mã tài liệu:** `DOCS-INDEX`  
> **Áp dụng cho:** `tuquet/admin` (`apps/web-admin`)  
> **Trạng thái:** **ACTIVE & ACCEPTED**

Chào mừng đến với trung tâm tài liệu kỹ thuật chính thức (Single Source of Truth — SSOT) của ứng dụng **Tuquet Admin** (`admin.tuquet.com`). Toàn bộ kiến trúc, quyết định thiết kế, đặc tả tuyến đường và bản đặc tả tính năng được tổ chức thành 4 trụ cột dưới đây.

---

## 1. Kiến Trúc Nền Tảng (`architecture/`)

Định nghĩa mô hình tổng thể, giao thức đa schema PostgREST, mô hình phân quyền RBAC/Superadmin, chuẩn bảng dữ liệu `useVbenVxeGrid` (`VxeTable`) & `VxeForm`, và hệ thống Design Tokens.

- [`architecture/overview.md`](architecture/overview.md) — **Kiến trúc tổng thể hệ thống:** Multi-Schema PostgREST (`public`, `runners`, `automa`, `billing`, `media`), 2 chế độ truy cập (`Multi-Tenant Member` & `Platform Superadmin`), cơ chế lọc động `Plugin Gate`, polling 3s, và cây định tuyến 4 nhóm Sidebar.
- [`architecture/styling-guide.md`](architecture/styling-guide.md) — **Quy chuẩn giao diện & Design Tokens:** Bảng tra cứu Semantic CSS Variables (HSL), tương thích 14 Built-in Themes & Dark/Light Mode, quy chuẩn `VxeTable`/`VxeForm` và Typography.

---

## 2. Quyết Định Kiến Trúc — ADRs (`decisions/`)

Ghi nhận bối cảnh, quyết định và hệ quả của các lựa chọn kỹ thuật cốt lõi trong quá trình phát triển.

- [`decisions/0001-routing-architecture.md`](decisions/0001-routing-architecture.md) — **ADR-001:** Kiến trúc định tuyến, giao tiếp đa schema PostgREST (`Accept-Profile` / `Content-Profile`), quyền động từ DB và cơ chế Polling 3s cho Execution Logs.
- [`decisions/0002-typography-and-font-system.md`](decisions/0002-typography-and-font-system.md) — **ADR-002:** Phông chữ không chân tự host (`Inter`, `Roboto`), chuyển đổi nóng qua Preferences Drawer và thang đo Typography 7 cấp.
- [`decisions/0003-platform-superadmin.md`](decisions/0003-platform-superadmin.md) — **ADR-003:** Kiến trúc quản trị nền tảng Platform Superadmin (`public.is_platform_admin()`) và 4 tuyến giám sát xuyên tenant dưới `/system/*`.
- [`decisions/0004-vxe-grid-form-and-i18n-terminology.md`](decisions/0004-vxe-grid-form-and-i18n-terminology.md) — **ADR-004:** Chuẩn hóa bảng dữ liệu `useVbenVxeGrid` & biểu mẫu `VxeForm`, bảo toàn vị trí cuộn nội trang, hợp nhất menu `/automation`, và từ điển thuật ngữ chuẩn `term.json`.

---

## 3. Đặc Tả Tuyến Đường (`routes/`)

Tài liệu tham chiếu chi tiết cho toàn bộ **18 tuyến đường** (4 module nghiệp vụ + cụm xác thực lõi `core.ts`).

- [`routes/README.md`](routes/README.md) — **Danh mục tổng thể 18 tuyến đường**, sơ đồ cây Router, cơ chế `filterRoutesByPlugins()` và đánh giá quyền động.
- [`routes/dashboard.md`](routes/dashboard.md) — Nhóm `/dashboard` (`/dashboard/analytics` — Telemetry thực tế & thăm dò Loopback Daemon).
- [`routes/tenants.md`](routes/tenants.md) — Nhóm `/tenants` (`/tenants` danh sách Workspace & `/tenants/:id` chi tiết 4 tabs `overview`, `members`, `usage`, `audit`).
- [`routes/automation.md`](routes/automation.md) — Nhóm `/automation` hợp nhất kịch bản Automa và hạ tầng Runners (`/automation/workflows`, `/automation/runs`, `/automation/runs/:id`, `/automation/devices`, `/automation/browsers`, `/automation/proxies`).
- [`routes/system.md`](routes/system.md) — Nhóm `/system` (`/system/plugins`, `/system/plans` và 4 tuyến đặc quyền Superadmin: `users`, `audit-logs`, `subscriptions`, `roles`).
- [`routes/auth.md`](routes/auth.md) — Cụm tuyến xác thực (`/auth/login`, `register`, `forget-password`, `reset-password`, `callback`, `desktop` SSO Bridge) và `/profile`.

---

## 4. Đặc Tả Kỹ Thuật Theo Module — Specs (`specs/`)

Các bản đặc tả kỹ thuật được xây dựng theo quy trình **Spec-Driven Development** (Specify $\rightarrow$ Plan $\rightarrow$ Tasks $\rightarrow$ Implement).

- [`specs/capability-map.md`](specs/capability-map.md) — **Bản đồ năng lực hệ thống (Capability Map)** và thứ tự phụ thuộc giữa các module.
- [`specs/SPEC-platform-foundation.md`](specs/SPEC-platform-foundation.md) — Kiến trúc monorepo, hạ tầng build cục bộ `build:local`, PWA auto-update và cổng kiểm định chất lượng.
- [`specs/SPEC-data-access.md`](specs/SPEC-data-access.md) — Tầng truy cập đa schema `supabaseRequest()` và tính quyền động từ cơ sở dữ liệu.
- [`specs/SPEC-route-foundation.md`](specs/SPEC-route-foundation.md) — Phân rã module định tuyến, `meta.authority` và bộ lọc `filterRoutesByPlugins()`.
- [`specs/SPEC-tenants-truth.md`](specs/SPEC-tenants-truth.md) — Chi tiết Workspace 4 tabs với dữ liệu thật từ `public`, `billing`, `runners`.
- [`specs/SPEC-fleet-inventory.md`](specs/SPEC-fleet-inventory.md) — Quản trị thiết bị, hồ sơ trình duyệt Chromium và bể Proxy từ schema `runners`.
- [`specs/SPEC-automation-engine.md`](specs/SPEC-automation-engine.md) — Quản trị kịch bản Workflows, phiên chạy Campaign Runs và nhật ký Polling 3s từ schema `automa`.
- [`specs/SPEC-system-catalog.md`](specs/SPEC-system-catalog.md) — Quản trị Plugins hệ thống (`public.system_plugins`) và Gói cước (`billing.plans`).
- [`specs/SPEC-superadmin-routes.md`](specs/SPEC-superadmin-routes.md) — 4 tuyến đường đặc quyền dành riêng cho Platform Superadmin.
- [`specs/SPEC-layout-preferences-coherence.md`](specs/SPEC-layout-preferences-coherence.md) — Kiểm toán chống khóa giao diện (Anti-Lockout) và đồng bộ Preferences Drawer.
- [`specs/SPEC-i18n-en-vi.md`](specs/SPEC-i18n-en-vi.md) — Kiến trúc song ngữ `en-US` / `vi-VN` mặc định `en-US`.
- [`specs/SPEC-concise-common-i18n.md`](specs/SPEC-concise-common-i18n.md) — Tiêu chuẩn nhãn nút tối giản (Brevity), Sentence case tiếng Việt và tái sử dụng `$t('common.*')`.
- [`specs/SPEC-route-consolidation-automation-fleet.md`](specs/SPEC-route-consolidation-automation-fleet.md) — Hợp nhất phân hệ Fleet và Automation vào menu `/automation`.
- [`specs/SPEC-docs-and-admin-coherence.md`](specs/SPEC-docs-and-admin-coherence.md) — Đồng bộ kiến trúc tài liệu, dời thư mục view `automation/*`, khôi phục `meta.plugin` và làm sạch dữ liệu hạ tầng.
- [`specs/SPEC-automation-api-and-i18n-unification.md`](specs/SPEC-automation-api-and-i18n-unification.md) — Hợp nhất tầng API Core (`src/api/core/automation.ts`) và khóa đa ngôn ngữ (`page.automation.*`), chuẩn hóa mô hình 1 UI/API Module $\leftrightarrow$ 2 DB Schemas (`automa` + `runners`).
