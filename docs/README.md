# Tài Liệu Kỹ Thuật Admin (`@tuquet/admin-web`)

> **Mã tài liệu:** `DOCS-INDEX`  
> **Áp dụng cho:** `tuquet/admin` (`apps/web-admin`)  
> **Trạng thái:** **ACTIVE & ACCEPTED**

Chào mừng đến với trung tâm tài liệu kỹ thuật chính thức (Single Source of Truth — SSOT) của ứng dụng **Admin** (`admin.tuquet.com`). Toàn bộ kiến trúc, quyết định thiết kế, đặc tả tuyến đường và 15 bản đặc tả module chuẩn hóa được tổ chức thành 4 trụ cột dưới đây.

---

## 1. Kiến Trúc Nền Tảng (`architecture/`)

Định nghĩa mô hình tổng thể, giao thức đa schema PostgREST, mô hình phân quyền RBAC/Superadmin, chuẩn bảng dữ liệu `useVbenVxeGrid` (`VxeTable`) & `VxeForm`, và hệ thống Design Tokens.

- [`architecture/overview.md`](architecture/overview.md) — **Kiến trúc tổng thể hệ thống:** Multi-Schema PostgREST (`public`, `runners`, `automa`, `billing`, `commerce`, `media`, `events`), 2 chế độ truy cập (`Multi-Tenant Member` & `Platform Superadmin`) kèm Guest Storefront (`skipAuth`), cơ chế lọc động `Plugin Gate`, polling 3s, và cây định tuyến 27 routes (5 nhóm Sidebar + `core.ts`).
- [`architecture/styling-guide.md`](architecture/styling-guide.md) — **Quy chuẩn giao diện & Design Tokens:** Bảng tra cứu Semantic CSS Variables (HSL), tương thích 14 Built-in Themes & Dark/Light Mode, quy chuẩn `VxeTable`/`VxeForm` và Typography.

---

## 2. Quyết Định Kiến Trúc — ADRs (`decisions/`)

Ghi nhận bối cảnh, quyết định và hệ quả của các lựa chọn kỹ thuật cốt lõi.

- [`decisions/0001-routing-architecture.md`](decisions/0001-routing-architecture.md) — **ADR-001:** Kiến trúc định tuyến, giao tiếp đa schema PostgREST (`Accept-Profile` / `Content-Profile`), quyền động từ DB và cơ chế Polling 3s cho Execution Logs.
- [`decisions/0002-typography-and-font-system.md`](decisions/0002-typography-and-font-system.md) — **ADR-002:** Phông chữ không chân tự host (`Inter`, `Roboto`), chuyển đổi nóng qua Preferences Drawer và thang đo Typography 7 cấp.
- [`decisions/0003-platform-superadmin.md`](decisions/0003-platform-superadmin.md) — **ADR-003:** Kiến trúc quản trị nền tảng Platform Superadmin (`public.is_platform_admin()`) và 4 tuyến giám sát xuyên tenant dưới `/system/*`.
- [`decisions/0004-vxe-grid-form-and-i18n-terminology.md`](decisions/0004-vxe-grid-form-and-i18n-terminology.md) — **ADR-004:** Chuẩn hóa bảng dữ liệu `useVbenVxeGrid` & biểu mẫu `VxeForm`, bảo toàn vị trí cuộn nội trang, hợp nhất menu `/automation`, và từ điển thuật ngữ chuẩn `term.json`.

---

## 3. Đặc Tả Tuyến Đường (`routes/`)

Tài liệu tham chiếu chi tiết cho toàn bộ **27 tuyến đường** (5 module nghiệp vụ Sidebar + cụm tuyến xác thực và công khai `core.ts`).

- [`routes/README.md`](routes/README.md) — **Danh mục tổng thể 27 tuyến đường**, sơ đồ cây Router, cơ chế `filterRoutesByPlugins()` và đánh giá quyền động.
- [`routes/dashboard.md`](routes/dashboard.md) — Nhóm `/dashboard` (`/dashboard/analytics` — Telemetry thực tế & thăm dò Loopback Daemon).
- [`routes/tenants.md`](routes/tenants.md) — Nhóm `/tenants` (`/tenants` danh sách Workspace & `/tenants/:id` chi tiết 4 chế độ `overview`, `members`, `usage`, `audit`).
- [`routes/automation.md`](routes/automation.md) — Nhóm `/automation` hợp nhất kịch bản Automa và hạ tầng Runners (`/automation/workflows`, `/automation/runs`, `/automation/runs/:id`, `/automation/devices`, `/automation/browsers`, `/automation/proxies`).
- [`routes/commerce.md`](routes/commerce.md) — Nhóm `/commerce` (`/commerce/store`, `/commerce/orders`, `/commerce/wallet`, `/commerce/admin`) và cửa hàng công khai `/store` (`PublicStorefront`).
- [`routes/system.md`](routes/system.md) — Nhóm `/system` (`/system/plugins`, `/system/plans` và 4 tuyến đặc quyền Superadmin: `users`, `audit-logs`, `subscriptions`, `roles`).
- [`routes/auth.md`](routes/auth.md) — Cụm tuyến xác thực (`/auth/login`, `register`, `forget-password`, `reset-password`, `callback`, `desktop` SSO Bridge), `/profile`, và `/store`.

---

## 4. Đặc Tả Kỹ Thuật Theo Module — Specs (`specs/`)

Bộ **15 bản đặc tả kỹ thuật chuẩn hóa (Canonical Module Specs)** được xây dựng theo quy trình **Spec-Driven Development** (Specify $\rightarrow$ Plan $\rightarrow$ Tasks $\rightarrow$ Implement) với cấu trúc 9 mục đồng nhất.

- [`specs/capability-map.md`](specs/capability-map.md) — **Bản đồ năng lực hệ thống (15/15 Canonical Modules)** và sơ đồ phụ thuộc kiến trúc.
- [`specs/SPEC-platform-foundation.md`](specs/SPEC-platform-foundation.md) — Kiến trúc monorepo, hạ tầng build cục bộ `build:local`, PWA auto-update và cổng kiểm định chất lượng.
- [`specs/SPEC-layout-preferences-coherence.md`](specs/SPEC-layout-preferences-coherence.md) — Kiểm toán chống khóa giao diện (Anti-Lockout), bảo vệ điều hướng Sidebar và đồng bộ Preferences Drawer.
- [`specs/SPEC-i18n-en-vi.md`](specs/SPEC-i18n-en-vi.md) — Kiến trúc đa ngôn ngữ `en-US` / `vi-VN`, từ điển thuật ngữ `term.json`, tái sử dụng `$t('common.*')` và chuẩn Sentence case tiếng Việt.
- [`specs/SPEC-specter-3d-ghost-banner.md`](specs/SPEC-specter-3d-ghost-banner.md) — Bộ 3 banner tương tác trên trang xác thực (`phone`, `robot 3d`, `ghost 3d` WebGL 60fps).
- [`specs/SPEC-data-access.md`](specs/SPEC-data-access.md) — Tầng truy cập đa schema `supabaseRequest({ schema, skipAuth })` (7 schemas) và nạp quyền động từ cơ sở dữ liệu.
- [`specs/SPEC-route-foundation.md`](specs/SPEC-route-foundation.md) — Kiến trúc 27 routes, bộ lọc `filterRoutesByPlugins()` và bảo toàn vị trí cuộn nội trang.
- [`specs/SPEC-tenants-truth.md`](specs/SPEC-tenants-truth.md) — Quản trị `/tenants` và `/tenants/:id` (4 chế độ `overview / members / usage / audit` với `useVbenVxeGrid` & `VxeForm`).
- [`specs/SPEC-automation-engine.md`](specs/SPEC-automation-engine.md) — Quản trị kịch bản `/automation/workflows`, phiên chạy `/automation/runs` và nhật ký `/automation/runs/:id` (Polling 3s) qua `src/api/core/automation.ts`.
- [`specs/SPEC-fleet-inventory.md`](specs/SPEC-fleet-inventory.md) — Quản trị thiết bị `/automation/devices`, hồ sơ trình duyệt `/automation/browsers` và bể proxy `/automation/proxies` dùng `useVbenVxeGrid`.
- [`specs/SPEC-system-catalog.md`](specs/SPEC-system-catalog.md) — Quản trị kho Plugins hệ thống `/system/plugins` (Core Kernel & Extension Plugins) và Gói cước `/system/plans`.
- [`specs/SPEC-superadmin-routes.md`](specs/SPEC-superadmin-routes.md) — 4 tuyến đường đặc quyền Platform Superadmin (`/system/users`, `/system/roles`, `/system/subscriptions`, `/system/audit-logs`) chuẩn hóa trên `useVbenVxeGrid`.
- [`specs/SPEC-payment-gateway.md`](specs/SPEC-payment-gateway.md) — Cổng thanh toán đa kênh (VietQR, MoMo, Stripe, USDT, Ví Xu `internal_wallet`), sổ cái `billing.wallets` (`BIGINT`) và Edge Function `payment-webhook`.
- [`specs/SPEC-digital-commerce.md`](specs/SPEC-digital-commerce.md) — Kho sản phẩm số (`schema: commerce`), chống bán trùng `FOR UPDATE SKIP LOCKED` và giao hàng tự động xuyên schema (Auto-Fulfillment).
- [`specs/admin-commerce-portal.md`](specs/SPEC-admin-commerce-portal.md) — Cổng thương mại điện tử nội bộ `/commerce/{store,orders,wallet,admin}`.
- [`specs/public-storefront.md`](specs/SPEC-public-storefront.md) — Cửa hàng sản phẩm số công khai `/store` (Guest Checkout & tra cứu `claim_token`).
- [`specs/SPEC-tauri-desktop.md`](specs/SPEC-tauri-desktop.md) — Ứng dụng Native Desktop hoàn chỉnh trên nền tảng Tauri v2 (Frameless Titlebar, System Tray, SSO Deep Linking `tuquet://`).

---

## 5. Chiến Lược Lộ Trình 5 Giai Đoạn — Phases (`phases/`)

Hồ sơ phân tích chi tiết mục tiêu kinh doanh, gói sản phẩm bàn giao, tiêu chuẩn kỹ thuật và KPI nghiệm thu:

- [`phases/README.md`](phases/README.md) — **Tổng quan lộ trình 5 Phase chiến lược**.
- [`phases/phase-01-enterprise-iam-multitenancy/README.md`](phases/phase-01-enterprise-iam-multitenancy/README.md) — **Phase 01:** Enterprise IAM & Multi-Tenancy (18/10 – 08/11/2026).
- [`phases/phase-02-omnichannel-payment-gateway/README.md`](phases/phase-02-omnichannel-payment-gateway/README.md) — **Phase 02:** Omnichannel Payment Gateway (09/11 – 30/11/2026).
- [`phases/phase-03-digital-commerce-fulfillment/README.md`](phases/phase-03-digital-commerce-fulfillment/README.md) — **Phase 03:** Digital Commerce & Fulfillment (01/12 – 22/12/2026).
- [`phases/phase-04-cloud-automation-fleet/README.md`](phases/phase-04-cloud-automation-fleet/README.md) — **Phase 04:** Cloud Automation & Fleet (05/01 – 15/02/2027).
- [`phases/phase-05-white-label-marketplace/README.md`](phases/phase-05-white-label-marketplace/README.md) — **Phase 05:** White-Label & Marketplace (01/03 – 30/04/2027).
