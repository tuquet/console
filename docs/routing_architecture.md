# Tuquet Admin Routing Architecture Specification (Tuquet Cloud Aligned)

> **Mã định danh tài liệu:** `RFC-2026-ADMIN-ROUTES-V1`  
> **Áp dụng cho:** `tuquet/admin` (`apps/web-admin`), `admin.tuquet.com`  
> **Tiêu chuẩn tham chiếu:** `tuquet/cloud` (`docs/architecture.md`, `docs/terminology_dictionary.md`), `tuquet/admin/AGENTS.md`  
> **Nguyên tắc cốt lõi:** Micro-Kernel + Schema Plugins Isolation, NIST RBAC O(1), KISS & YAGNI, Mobile-First Dual View, 100% Real Telemetry.

---

## 1. Bối Cảnh & Mục Tiêu

Hệ thống quản trị **`admin.tuquet.com`** là bảng điều khiển vận hành trung tâm kết nối trực tiếp đến **Tuquet Cloud** (`tuquet/cloud` chạy trên nền tảng Supabase / PostgreSQL 15+).

Hiện tại, hệ thống routes của Admin đang ở dạng phôi thai với cấu trúc phẳng gom toàn bộ trang dưới `/dashboard` (`/dashboard/workspace`, `/dashboard/fleet`, `/dashboard/analytics`). Cấu trúc này bộc lộ các hạn chế:
1. **Lệch chuẩn thuật ngữ**: Sử dụng URL `/workspace` trong khi thực thể gốc trong cơ sở dữ liệu `tuquet/cloud` là `Tenant` (`public.tenants`).
2. **Thiếu ánh xạ với Plugin Schemas**: `tuquet/cloud` mở rộng tính năng qua 5 isolated schema plugins (`runners`, `automa`, `billing`, `media`, `events`), nhưng web admin chưa có cấu trúc định tuyến tương ứng.
3. **Vi phạm nguyên tắc SRP & Mở rộng**: Gom toàn bộ chức năng vào 1 file `dashboard.ts` gây phình to mã nguồn và khó phân quyền (RBAC).

**Mục tiêu của kiến trúc này:** Chuẩn hóa toàn bộ hệ thống routes của Admin để **ánh xạ 1:1 với kiến trúc Micro-Kernel và Schema Plugins của Tuquet Cloud**, đồng thời giữ vững nguyên tắc **KISS & YAGNI** (tối đa 5 nhóm menu chính, không bloat giao diện).

---

## 2. Các Tiêu Chuẩn Kỹ Thuật Bắt Buộc (Invariants)

### 2.1. Phân định Data Layer (`Tenant`) và Presentation Layer (`Workspace`)
- **Tầng dữ liệu & API (Canonical)**: Tên thực thể luôn là **`Tenant`** (`public.tenants`, `tenant_id`). Mọi API call, route canonical và state store phải sử dụng danh từ `tenant` (ví dụ: `/tenants`, `/tenants/:id`).
- **Tầng hiển thị (Presentation Label)**: Nhãn hiển thị trên giao diện người dùng có thể là "Workspace" hoặc "Không gian làm việc" theo từ điển ngữ nghĩa kinh doanh, nhưng tài liệu kỹ thuật và URL chuẩn phải là `/tenants`.
- **Tương thích ngược (Backward Compatibility)**: Thiết lập redirect alias từ `/dashboard/workspace` và `/workspace` về `/tenants`.

### 2.2. Quy Tắc Thuật Ngữ Bất Biến (Anti-Hallucination Lexicon)
Tuân thủ nghiêm ngặt [**`cloud/docs/terminology_dictionary.md`**](file:///root/tuquet/cloud/docs/terminology_dictionary.md):
- **Máy trạm / Nút tính toán**: Sử dụng **`Runner`** hoặc **`Device`** (`runners.devices`). Tuyệt đối **CẤM** dùng `worker`, `bot`, `agent node`.
- **Trình duyệt ảo**: Sử dụng **`Browser`** (`runners.browsers`). Tuyệt đối **CẤM** gọi là `browser profile` (để tránh xung đột với hồ sơ người dùng `public.profiles`).
- **Lưu trữ đám mây**: Sử dụng **`Storage`** hoặc **`Media`** (`media.assets`). Tuyệt đối **CẤM** dùng `vault` trong môi trường cloud (`vault` chỉ tồn tại trong `tuquet-automa` offline).
- **Điều phối tác vụ**: Sử dụng **`Workflow`** (`automa.workflows`), **`Campaign Run`** (`automa.campaign_runs`), và **`Execution Log`** (`automa.execution_logs`).

### 2.3. Triết Lý Thiết Kế KISS & YAGNI
- **Tối đa 5 nhóm module chính** trên thanh sidebar để người quản trị tập trung cao độ.
- **Loại bỏ hoàn toàn**: Chrome virtual tabbar trong SPA (`tabbar: { enable: false }`), widget chọn múi giờ, lock screen thừa thãi, breadcrumb lặp lại tên trang.
- **Biểu tượng giao diện**: 100% sử dụng **Lucide Icons** (`lucide:...`). Tuyệt đối cấm emoji.
- **Mobile-First Dual View**: Mọi màn hình danh sách hỗ trợ **Dual View** — hiển thị bảng dữ liệu (Data Table) trên Desktop (`≥ 768px`) và tự động chuyển sang thẻ cảm ứng (Touch Cards) trên Mobile (`< 768px`).

---

## 3. Bản Đồ Định Tuyến Tổng Thể (Site Map & Tree Structure)

```text
/ (Root Layout - BasicLayout)
│
├── 📊 /dashboard (Tổng quan & Đo lường)
│   └── /analytics                  # Telemetry thời gian thực, phân bổ plan, độ trễ edge
│
├── 🏢 /tenants (Base Kernel IAM - Schema: public)
│   ├── /tenants                    # Danh sách Tenant (Dual-view Table/Card, Bộ lọc Status/Plan)
│   └── /tenants/:id                # Chi tiết Tenant (Thông tin, Thành viên, Phân quyền, Hạn mức)
│
├── ⚡ /fleet (Plugin: runners - Schema: runners)
│   ├── /fleet/devices              # Workstations & Compute Nodes (PNA loopback probe :8765)
│   ├── /fleet/browsers             # Cloud Anti-detect Browsers (GoLogin-style seeds)
│   └── /fleet/proxies              # Kho Proxy Pool (HTTP/SOCKS5, health check latency)
│
├── 🤖 /automation (Plugin: automa - Schema: automa)
│   ├── /automation/workflows       # Quản lý DAG Workflows (JSON AST, draft/published)
│   ├── /automation/campaigns       # Lịch sử chiến dịch chạy phân tán (Campaign Runs)
│   └── /automation/campaigns/:id   # Real-time Execution Logs (stream log từng block)
│
└── 🛡️ /system (System Operations & Core Plugins)
    ├── /system/plugins             # Master Plugins Registry (public.system_plugins)
    ├── /system/plans               # SaaS Subscription Plans (billing.plans)
    └── /system/audit-logs          # Toàn bộ nhật ký kiểm toán hệ thống (public.audit_logs)
```

---

## 4. Chi Tiết Từng Route Module

### 4.1. Module 1: Dashboard (`/dashboard`)
- **Mục đích**: Cung cấp bức tranh tổng thể về sức khỏe hệ thống và phân bổ tài nguyên.
- **Nguồn dữ liệu**: Truy vấn trực tiếp từ `public.tenants`, `public.system_plugins`, và probe độ trễ REST API.
- **File route**: `src/router/routes/modules/dashboard.ts`

| Route Path | Tên Route | Component Path | Icon Lucide | Quyền (Permission) |
| :--- | :--- | :--- | :--- | :--- |
| `/dashboard` | `Dashboard` | Redirect: `/dashboard/analytics` | `lucide:layout-dashboard` | Authenticated |
| `/dashboard/analytics` | `Analytics` | `#/views/dashboard/analytics/index.vue` | `lucide:area-chart` | Authenticated |

---

### 4.2. Module 2: Tenancy & IAM (`/tenants`)
- **Mục đích**: Quản trị không gian làm việc (Tenants), phân quyền thành viên (NIST RBAC), hạn mức và khóa API Headless.
- **Nguồn dữ liệu**: `public.tenants`, `public.tenant_members`, `public.roles`, `public.permissions`, `billing.subscriptions`, `billing.usage_meters`.
- **File route**: `src/router/routes/modules/tenants.ts`

| Route Path | Tên Route | Component Path | Icon Lucide | Quyền (Permission) |
| :--- | :--- | :--- | :--- | :--- |
| `/tenants` | `Tenants` | `#/views/tenants/index.vue` | `lucide:building-2` | `tenants:read` |
| `/tenants/:id` | `TenantDetail` | `#/views/tenants/detail.vue` | `lucide:settings` | `tenants:read` |

> **Cấu trúc Tab trong `TenantDetail` (`/tenants/:id`):**
> 1. **Tổng quan (Overview)**: Tên, vanity slug, trạng thái (`active`, `suspended`, `archived`), ngày khởi tạo.
> 2. **Thành viên & Vai trò (Members & RBAC)**: Quản lý danh sách thành viên (`tenant_members`), phân bổ System Role (`owner`, `admin`, `member`, `viewer`) hoặc Custom Tenant Role.
> 3. **Hạn mức & Sử dụng (Quotas & Metering)**: Thước đo thời gian thực từ `billing.usage_meters` (số thiết bị, dung lượng storage MB, số lượt chạy automa/tháng).
> 4. **Khóa API (API Keys)**: Quản lý access keys headless cho CLI/Runner kết nối trực tiếp.

---

### 4.3. Module 3: Compute Fleet & Browsers (`/fleet`)
- **Mục đích**: Giám sát máy trạm vật lý (`runners.devices`), trình duyệt vân tay cố định (`runners.browsers`), và kho proxy đa giao thức (`runners.proxies`).
- **Nguồn dữ liệu**: Schema `runners` (`runners.devices`, `runners.browsers`, `runners.proxies`, `runners.node_browsers`).
- **File route**: `src/router/routes/modules/fleet.ts`

| Route Path | Tên Route | Component Path | Icon Lucide | Quyền (Permission) |
| :--- | :--- | :--- | :--- | :--- |
| `/fleet` | `Fleet` | Redirect: `/fleet/devices` | `lucide:cpu` | `runners:devices:read` |
| `/fleet/devices` | `FleetDevices` | `#/views/fleet/devices/index.vue` | `lucide:laptop` | `runners:devices:read` |
| `/fleet/browsers` | `FleetBrowsers`| `#/views/fleet/browsers/index.vue` | `lucide:globe` | `runners:browsers:read` |
| `/fleet/proxies` | `FleetProxies` | `#/views/fleet/proxies/index.vue` | `lucide:network` | `runners:proxies:read` |

> **Đặc tả tính năng từng tab:**
> - **Devices**: Hiển thị thông số OS, CPU cores, RAM GB, trạng thái heartbeat (`idle`, `busy`, `offline`). Tích hợp nút probe trực tiếp cổng local loopback `:8765` với cờ `no-cors` và timeout $\le 1200\text{ms}$.
> - **Browsers**: Hiển thị danh sách cloud browser, engine version (Chromium 148+), seed vân tay (`fingerprint_seed`), và hệ điều hành giả lập (`windows`, `macos`, `linux`).
> - **Proxies**: Danh sách proxy HTTP/HTTPS/SOCKS5, hiển thị quốc gia (country_code), độ trễ (latency_ms), và cờ gán với thiết bị/browser.

---

### 4.4. Module 4: Automation Engine (`/automation`)
- **Mục đích**: Quản trị quy trình tự động hóa đồ thị DAG (`automa.workflows`) và giám sát tiến độ thực thi chiến dịch (`automa.campaign_runs`).
- **Nguồn dữ liệu**: Schema `automa` (`automa.workflows`, `automa.campaign_runs`, `automa.execution_logs`).
- **File route**: `src/router/routes/modules/automation.ts`

| Route Path | Tên Route | Component Path | Icon Lucide | Quyền (Permission) |
| :--- | :--- | :--- | :--- | :--- |
| `/automation` | `Automation` | Redirect: `/automation/workflows` | `lucide:play-circle` | `automa:workflows:read` |
| `/automation/workflows` | `AutomationWorkflows` | `#/views/automation/workflows/index.vue` | `lucide:workflow` | `automa:workflows:read` |
| `/automation/campaigns` | `AutomationCampaigns` | `#/views/automation/campaigns/index.vue` | `lucide:activity` | `automa:campaigns:read` |
| `/automation/campaigns/:id` | `CampaignRunDetail` | `#/views/automation/campaigns/detail.vue` | `lucide:file-text` | `automa:logs:read` |

> **Đặc tả tính năng:**
> - **Workflows**: Danh sách kịch bản tự động hóa, phiên bản (SemVer), trạng thái (`draft`, `published`, `archived`), số lượng nodes/blocks.
> - **Campaigns**: Trạng thái phiên chạy (`pending`, `queued`, `running`, `completed`, `failed`), runner thực thi, tổng số tác vụ, tỷ lệ thành công.
> - **Campaign Detail**: Luồng streaming log từng block theo thời gian thực (Trace, Debug, Info, Warn, Error).

---

### 4.5. Module 5: System Operations & Platform Settings (`/system`)
- **Mục đích**: Dành cho Quản trị viên nền tảng (Platform Operators / Super-Admins) để giám sát các plugin hệ thống và cấu hình gói thuê bao.
- **Nguồn dữ liệu**: `public.system_plugins`, `billing.plans`, `public.audit_logs`.
- **File route**: `src/router/routes/modules/system.ts`

| Route Path | Tên Route | Component Path | Icon Lucide | Quyền (Permission) |
| :--- | :--- | :--- | :--- | :--- |
| `/system` | `System` | Redirect: `/system/plugins` | `lucide:shield-check` | `plugins:read` |
| `/system/plugins` | `SystemPlugins` | `#/views/system/plugins/index.vue` | `lucide:blocks` | `plugins:read` |
| `/system/plans` | `BillingPlans` | `#/views/system/plans/index.vue` | `lucide:credit-card` | `billing:read` |
| `/system/audit-logs` | `SystemAuditLogs` | `#/views/system/audit/index.vue` | `lucide:scroll-text` | `audit:read` |

> **Đặc tả tính năng:**
> - **Plugins**: Danh sách 6 core plugins (`core-iam`, `runners`, `automa`, `storage`, `subscriptions`, `webhooks`), phiên bản, trạng thái schema (`installed`), cờ bảo vệ `is_system`.
> - **Plans**: Cấu hình các gói SaaS (Free, Pro, Enterprise), hạn mức tối đa `max_members`, `max_storage_mb`, `max_monthly_runs`.
> - **Audit Logs**: Lịch sử kiểm toán toàn bộ thao tác người dùng (Actor, Action, Entity Type, Client IP `INET`).

---

### 4.6. Core & Authentication Routes (Giữ nguyên chuẩn hiện hành)
Nằm trong `src/router/routes/core.ts`:
- `/auth/login`: Đăng nhập email/mật khẩu & GitHub OAuth.
- `/auth/register`: Đăng ký tài khoản mới.
- `/auth/forget-password` & `/auth/reset-password`: Luồng khôi phục mật khẩu.
- `/auth/callback`: Tiếp nhận Supabase GoTrue OAuth redirect (`https://admin.tuquet.com/auth/callback`).
- `/auth/desktop`: Trang SSO loopback bridge chuyển token về cho Tuquet CLI/Desk (`127.0.0.1:8765`).
- `/profile`: Thông tin cá nhân của người dùng hiện tại (`public.profiles`).

---

## 5. Ma Trận Ánh Xạ Đường Dẫn Cũ Sang Chuẩn Mới

| Đường dẫn hiện tại | Đường dẫn chuẩn hóa | Schema / Table Backend tương ứng | Trạng thái tương thích ngược |
| :--- | :--- | :--- | :--- |
| `/dashboard/analytics` | `/dashboard/analytics` | `public.tenants`, `public.system_plugins` | Giữ nguyên URL |
| `/dashboard/workspace` | `/tenants` | `public.tenants` | Redirect alias `/dashboard/workspace` $\rightarrow$ `/tenants` |
| `/dashboard/workspace/:id` | `/tenants/:id` | `public.tenants`, `public.tenant_members` | Redirect alias `/dashboard/workspace/:id` $\rightarrow$ `/tenants/:id` |
| `/dashboard/fleet` | `/fleet/devices` | `runners.devices` | Redirect alias `/dashboard/fleet` $\rightarrow$ `/fleet/devices` |
| *(Mới)* | `/fleet/browsers` | `runners.browsers` | Bổ sung mới cho tính năng Cloud Browser |
| *(Mới)* | `/fleet/proxies` | `runners.proxies` | Bổ sung mới cho tính năng Quản lý Proxy |
| *(Mới)* | `/automation/workflows` | `automa.workflows` | Bổ sung mới cho Automa Workflow Engine |
| *(Mới)* | `/automation/campaigns` | `automa.campaign_runs` | Bổ sung mới cho Automa Campaign Coordinator |
| *(Mới)* | `/system/plugins` | `public.system_plugins` | Bổ sung mới cho Kiểm tra Trạng thái Plugin |
| *(Mới)* | `/system/plans` | `billing.plans` | Bổ sung mới cho Bảng cước & Hạn mức |
| *(Mới)* | `/system/audit-logs` | `public.audit_logs` | Bổ sung mới cho Nhật ký kiểm toán |

---

## 6. Lộ Trình Triển Khai Kỹ Thuật (Implementation Roadmap)

### Giai đoạn 1: Chuẩn hóa Routes & Decouple Modules (Không gây gián đoạn)
1. Tách file `dashboard.ts` hiện tại thành các file module riêng biệt trong `src/router/routes/modules/`:
   - `dashboard.ts` (chỉ giữ `/dashboard/analytics`)
   - `tenants.ts` (`/tenants`, `/tenants/:id` kèm redirect alias cho `/dashboard/workspace`)
   - `fleet.ts` (`/fleet/devices` kèm redirect alias cho `/dashboard/fleet`)
2. Di chuyển các view hiện tại:
   - `views/dashboard/workspace/` $\rightarrow$ `views/tenants/`
   - `views/dashboard/fleet/` $\rightarrow$ `views/fleet/devices/`
3. Cập nhật các liên kết nội bộ trong component và menu breadcrumb.

### Giai đoạn 2: Mở rộng Fleet (Cloud Browsers & Proxy Pool)
1. Thêm view `views/fleet/browsers/index.vue` kết nối bảng `runners.browsers`.
2. Thêm view `views/fleet/proxies/index.vue` kết nối bảng `runners.proxies`.
3. Tích hợp tab điều hướng mượt mà trong giao diện `/fleet`.

### Giai đoạn 3: Tích hợp Automa Engine
1. Xây dựng view danh sách Workflows (`views/automation/workflows/index.vue`) từ `automa.workflows`.
2. Xây dựng view danh sách và chi tiết Campaign Runs (`views/automation/campaigns/index.vue` và `detail.vue`) hiển thị logs từ `automa.execution_logs`.

### Giai đoạn 4: System Operations & Plugin Registry
1. Xây dựng view giám sát trạng thái 6 Core Plugins (`views/system/plugins/index.vue`) từ `public.system_plugins`.
2. Xây dựng view quản lý Gói cước SaaS (`views/system/plans/index.vue`) từ `billing.plans`.
3. Xây dựng view Nhật ký kiểm toán (`views/system/audit/index.vue`) từ `public.audit_logs`.

---

## 7. Kết Luận

Kiến trúc định tuyến trên giúp **`admin.tuquet.com`**:
1. Đồng bộ hoàn hảo với mô hình **Micro-Kernel + Isolated Schema Plugins** của `tuquet/cloud`.
2. Đảm bảo tính độc lập, dễ dàng mở rộng khi có thêm các dynamic plugin mới trong tương lai mà không cần cấu trúc lại toàn bộ hệ thống.
3. Giữ trọn vẹn triết lý **KISS & YAGNI**, trải nghiệm mượt mà trên cả máy tính lẫn thiết bị di động với chuẩn **Shadcn Slate** và **Lucide Icons**.
