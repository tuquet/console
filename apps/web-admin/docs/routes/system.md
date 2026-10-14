# Đặc Tả Route: System Catalog & Superadmin Platform (Danh Mục Hệ Thống & Quản Trị Nền Tảng)

> **Đường dẫn chính:** `/system/*`  
> **Module File:** [`apps/web-admin/src/router/routes/modules/system.ts`](../../apps/web-admin/src/router/routes/modules/system.ts)  
> **Biểu tượng:** `lucide:shield-check`

---

## 1. Định Nghĩa Tuyến Đường (Route Definitions)

```typescript
{
  path: '/system',
  name: 'System',
  redirect: '/system/plugins',
  meta: {
    title: 'Hệ Thống',
    icon: 'lucide:shield-check',
    plugin: 'core-iam',
    order: 40,
  },
  children: [
    {
      path: 'plugins',
      name: 'SystemPlugins',
      component: () => import('#/views/system/plugins/index.vue'),
      meta: {
        title: 'Plugins Hệ Thống',
        icon: 'lucide:puzzle',
        plugin: 'core-iam',
        authority: ['superadmin', 'plugins:read'],
      },
    },
    {
      path: 'plans',
      name: 'SystemPlans',
      component: () => import('#/views/system/plans/index.vue'),
      meta: {
        title: 'Gói Cước & Quotas',
        icon: 'lucide:credit-card',
        plugin: 'subscriptions',
        authority: ['superadmin', 'subscriptions:read'],
      },
    },
    {
      path: 'users',
      name: 'SystemUsers',
      component: () => import('#/views/system/users/index.vue'),
      meta: {
        title: 'Người Dùng Nền Tảng',
        icon: 'lucide:users',
        plugin: 'core-iam',
        authority: ['superadmin'],
      },
    },
    {
      path: 'audit-logs',
      name: 'SystemAuditLogs',
      component: () => import('#/views/system/audit-logs/index.vue'),
      meta: {
        title: 'Nhật Ký Kiểm Toán',
        icon: 'lucide:scroll-text',
        plugin: 'core-iam',
        authority: ['superadmin'],
      },
    },
    {
      path: 'subscriptions',
      name: 'SystemSubscriptions',
      component: () => import('#/views/system/subscriptions/index.vue'),
      meta: {
        title: 'Quản Lý Thuê Bao',
        icon: 'lucide:receipt',
        plugin: 'subscriptions',
        authority: ['superadmin'],
      },
    },
    {
      path: 'roles',
      name: 'SystemRoles',
      component: () => import('#/views/system/roles/index.vue'),
      meta: {
        title: 'Vai Trò & Phân Quyền',
        icon: 'lucide:key-round',
        plugin: 'core-iam',
        authority: ['superadmin'],
      },
    },
  ]
}
```

---

## 2. Chi Tiết Từng Tuyến Con (Sub-routes)

### 2.1. Quản Lý Plugins: `/system/plugins`

- **Mục Đích:** Kiểm soát và hiển thị tình trạng các plugin vi dịch vụ (Microservice Pillars) đã cài đặt vào Tuquet Cloud.
- **Nguồn Dữ Liệu:** Bảng `public.system_plugins`.
- **API Client:** [`getSystemPluginsApi()`](../../apps/web-admin/src/api/core/system.ts).
- **Quy Tắc Nhận Diện 6 Core Kernel Plugins:**
  - Hệ thống áp dụng hàm thuần khiết `isCorePlugin(id)` để phân định 6 module nhân cốt lõi:
    1. `core-iam` (Multi-Tenant IAM & Auth)
    2. `runners` (Specter Runner Mesh & Hardware Telemetry)
    3. `automa` (Automa Automation Engine)
    4. `storage` (Media & Cloud Object Storage)
    5. `subscriptions` (SaaS Billing & Quotas Engine)
    6. `webhooks` (Event Hooks & Subscriptions)
  - Các plugin nhân này được gắn nhãn `Core Kernel` với màu sắc nhận diện đặc biệt (`bg-primary/10 text-primary border-primary/20`).

### 2.2. Gói Cước & Hạn Mức Quotas: `/system/plans`

- **Mục Đích:** Quản lý bảng giá thuê bao SaaS toàn hệ thống và các giới hạn tài nguyên phân bổ cho từng hạng thành viên.
- **Nguồn Dữ Liệu:** Bảng `billing.plans` (schema `billing`).
- **API Client:** [`getBillingPlansApi()`](../../apps/web-admin/src/api/core/system.ts) với `{ schema: 'billing' }`.
- **Quyền Hạn Yêu Cầu:** `['superadmin', 'subscriptions:read']`.

### 2.3. Người Dùng Nền Tảng: `/system/users` (Superadmin Only)

- **Mục Đích:** Quản lý danh bạ tài khoản người dùng đăng ký trên toàn nền tảng Tuquet Cloud, số lượng workspace tham gia, ngày gia nhập.
- **Nguồn Dữ Liệu:** Bảng `public.profiles` kết hợp đếm `tenant_members`.
- **API Client:** [`getPlatformUsersApi()`](../../apps/web-admin/src/api/core/system.ts).
- **Quyền Hạn Yêu Cầu:** `authority: ['superadmin']`.

### 2.4. Nhật Ký Kiểm Toán Toàn Cầu: `/system/audit-logs` (Superadmin Only)

- **Mục Đích:** Giám sát nhật ký an ninh, phân quyền và thao tác dữ liệu trên toàn bộ hệ thống không phân biệt tenant.
- **Nguồn Dữ Liệu:** Bảng `public.audit_logs`.
- **API Client:** [`getGlobalAuditLogsApi()`](../../apps/web-admin/src/api/core/system.ts).
- **Tính Năng:** Lọc theo hành động/tenant, hộp thoại xem chi tiết payload JSON `old_values` và `new_values`.
- **Quyền Hạn Yêu Cầu:** `authority: ['superadmin']`.

### 2.5. Quản Lý Thuê Bao Toàn Hệ Thống: `/system/subscriptions` (Superadmin Only)

- **Mục Đích:** Giám sát hợp đồng thuê bao SaaS của tất cả các tenant, theo dõi doanh thu định kỳ (MRR) và trạng thái thanh toán.
- **Nguồn Dữ Liệu:** Bảng `billing.subscriptions` kết nối `tenants` và `plans` (schema `billing`).
- **API Client:** [`getPlatformSubscriptionsApi()`](../../apps/web-admin/src/api/core/system.ts) với `{ schema: 'billing' }`.
- **Quyền Hạn Yêu Cầu:** `authority: ['superadmin']`, plugin `subscriptions`.

### 2.6. Vai Trò & Phân Quyền Hệ Thống: `/system/roles` (Superadmin Only)

- **Mục Đích:** Trực quan hóa ma trận RBAC gồm 4 vai trò hệ thống (`owner`, `admin`, `member`, `viewer`) và danh mục 36 quyền hạt nhân trong `public.permissions` gom theo module.
- **Nguồn Dữ Liệu:** Bảng `public.roles`, `public.permissions`, `public.role_permissions`.
- **API Client:** [`getSystemRolesApi()`](../../apps/web-admin/src/api/core/system.ts) và [`getSystemPermissionsApi()`](../../apps/web-admin/src/api/core/system.ts).
- **Quyền Hạn Yêu Cầu:** `authority: ['superadmin']`.

---

## 3. Lưu Ý Kỹ Thuật & Độc Lập Phụ Thuộc (Gotchas)

1. **Ranh Giới Bảo Mật Cấp Superadmin:**
   - 4 tuyến `/system/users`, `/system/audit-logs`, `/system/subscriptions`, `/system/roles` có `meta.authority: ['superadmin']`. User thông thường hoàn toàn bị ẩn và chặn bởi guard định tuyến.
2. **PostgREST Schema Switch:**
   - Tuyến `/system/subscriptions` và `/system/plans` bắt buộc phải truyền `{ schema: 'billing' }` để đính kèm header `Accept-Profile: billing`.
