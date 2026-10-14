# Spec: Superadmin Platform Routes (Module `superadmin-routes`)

> **Mã đặc tả:** `SPEC-superadmin-routes`  
> **Thuộc sáng kiến:** Kiến Trúc Định Tuyến & Phân Quyền Nền Tảng  
> **Tài liệu liên quan:** [`Kiến trúc nền tảng`](../architecture/overview.md), [`ADR-001`](../decisions/0001-routing-architecture.md), [`ADR-003`](../decisions/0003-platform-superadmin.md), [`capability-map.md`](capability-map.md)  
> **Trạng thái:** **ACCEPTED & IMPLEMENTED** (Đã hoàn thành triển khai và kiểm thử 2026-10-13)

---

## 1. Mục Tiêu (Objective)

Bổ sung các tuyến đường quản trị đặc quyền dành riêng cho **Platform Superadmin** (`authority: ['superadmin']`). Sau khi đã thiết lập hàm bypass RLS `public.is_platform_admin()` tại tầng cơ sở dữ liệu `tuquet/cloud`, Superadmin có quyền hạn tối cao để giám sát và điều hành toàn bộ nền tảng xuyên suốt mọi tenant:

1. **Quản lý người dùng nền tảng (`/system/users`):** Giám sát toàn bộ tài khoản người dùng đăng ký trên Tuquet Cloud từ `public.profiles`, xem số lượng workspace tham gia, trạng thái hoạt động và thông tin liên hệ.
2. **Nhật ký kiểm toán toàn cầu (`/system/audit-logs`):** Xem toàn bộ dòng nhật ký an ninh, phân quyền và thao tác dữ liệu trên toàn bộ hệ sinh thái từ `public.audit_logs` (thay vì chỉ xem cục bộ theo từng tenant).
3. **Quản lý thuê bao toàn hệ thống (`/system/subscriptions`):** Giám sát các hợp đồng thuê bao SaaS của tất cả các tenant từ `billing.subscriptions` và `billing.plans` (schema `billing`), theo dõi trạng thái gia hạn và doanh thu định kỳ.
4. **Danh mục vai trò & phân quyền (`/system/roles`):** Trực quan hóa ma trận RBAC gồm 4 vai trò hệ thống (`owner`, `admin`, `member`, `viewer`) và 36 quyền hạt nhân trong `public.permissions` được gom nhóm theo module (`core-iam`, `runners`, `automa`, `subscriptions`, `storage`, `webhooks`).

**Người dùng hưởng lợi:** Platform Superadmin (`admin@tuquet.com` hoặc tài khoản có claim `platform_role: 'superadmin'`).  
**Tiêu chí thành công:**

- 100% các tuyến đường này chỉ hiển thị và cho phép truy cập đối với user sở hữu quyền `superadmin` (User thông thường hoàn toàn bị ẩn và chặn bởi `meta.authority`).
- Toàn bộ dữ liệu hiển thị từ các bảng thật của Supabase Cloud (`public.profiles`, `public.audit_logs`, `billing.subscriptions`, `public.roles`).
- Đạt chuẩn **Mobile-First Dual View**, Lucide Icons, Shadcn Slate styling.
- Vượt qua 100% Cổng kiểm định cục bộ (Zero-Waste CI Gate).

---

## 2. Lệnh Thực Thi & Kiểm Định (Commands)

```bash
# 1. Chạy kiểm thử đơn vị cho API và Router
pnpm exec vitest run apps/web-admin/src/api/core apps/web-admin/src/router

# 2. Kiểm tra kiểu dữ liệu TypeScript (Zero errors)
pnpm --filter @tuquet/admin-web run typecheck

# 3. Quét tĩnh mã nguồn oxlint
npx oxlint apps/web-admin/src/

# 4. Kiểm tra format và lint toàn workspace
pnpm run lint

# 5. Tự động sửa lỗi định dạng
pnpm run format

# 6. Đóng gói sản phẩm web admin
pnpm run build:admin
```

---

## 3. Cấu Trúc Mã Nguồn (Project Structure)

```text
apps/web-admin/src/
├── api/core/
│   ├── system.ts                        → Mở rộng thêm UserItem, AuditLogItem, SubscriptionItem, RoleItem & APIs
│   └── __tests__/
│       └── system.test.ts               → Unit tests cho các hàm mappers và helpers mới
├── router/routes/modules/
│   └── system.ts                        → Đăng ký 4 routes mới thuộc nhóm /system với authority: ['superadmin']
└── views/system/
    ├── plugins/                         → Đã có
    ├── plans/                           → Đã có
    ├── users/
    │   └── index.vue                    → Dual View quản lý người dùng nền tảng
    ├── audit-logs/
    │   └── index.vue                    → Dual View nhật ký kiểm toán toàn cầu
    ├── subscriptions/
    │   └── index.vue                    → Dual View quản lý thuê bao SaaS toàn hệ thống
    └── roles/
        └── index.vue                    → Dual View ma trận vai trò & quyền hạn RBAC
```

---

## 4. Chuẩn Mực Mã Nguồn (Code Style & UI Patterns)

### 4.1. Khai Báo Tuyến Đường Trong `src/router/routes/modules/system.ts`

```typescript
// Ví dụ cấu hình route chuẩn mực
{
  path: 'users',
  name: 'SystemUsers',
  component: () => import('#/views/system/users/index.vue'),
  meta: {
    title: $t('page.system.users'),
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
    title: $t('page.system.auditLogs'),
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
    title: $t('page.system.subscriptions'),
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
    title: $t('page.system.roles'),
    icon: 'lucide:key-round',
    plugin: 'core-iam',
    authority: ['superadmin'],
  },
}
```

### 4.2. Thiết Kế Dual View (Mobile-First)

```html
<!-- Khung Dual View chuẩn: Desktop Table ẩn trên mobile, Mobile Cards ẩn trên desktop -->
<div
  class="hidden md:block overflow-hidden rounded-xl border border-border/60 bg-card"
>
  <table>
    ...
  </table>
</div>

<div class="block md:hidden space-y-3">
  <div
    v-for="item in items"
    :key="item.id"
    class="rounded-xl border border-border/60 bg-card p-4 space-y-3"
  >
    <!-- Touch Card: min 40px touch targets, zero horizontal scrolling -->
  </div>
</div>
```

---

## 5. Chiến Lược Kiểm Thử (Testing Strategy)

- **Framework:** Vitest 4.x.
- **Vị trí file test:** `apps/web-admin/src/api/core/__tests__/system.test.ts`.
- **Nội dung kiểm thử bắt buộc:**
  1. `mapRawUser`: Chuyển đổi bản ghi `public.profiles` an toàn khi thiếu metadata.
  2. `mapRawGlobalAuditLog`: Chuyển đổi bản ghi `public.audit_logs` có parsing JSON an toàn.
  3. `mapRawSubscription`: Chuyển đổi bản ghi `billing.subscriptions` và tính toán hạn sử dụng.
  4. `mapRawRole`: Nhóm danh mục `permissions` theo từng tiền tố module (`runners`, `automa`...).
  5. Đảm bảo API `getSubscriptionsApi` gửi kèm header `{ schema: 'billing' }`.

---

## 6. Ranh Giới Kỹ Thuật (Boundaries)

- **BẮT BUỘC (Always Do):**
  - Gắn chặt `meta.authority: ['superadmin']` cho toàn bộ 4 routes mới.
  - Sử dụng hàm dùng chung `supabaseRequest()`.
  - Chỉ dùng Lucide icons (`@lucide/vue`), tuyệt đối không dùng Emoji.
  - Triển khai Dual View và xử lý Empty State khi cơ sở dữ liệu rỗng.
- **CẦN HỎI TRƯỚC (Ask First):**
  - Bổ sung hành động xóa người dùng vĩnh viễn khỏi Auth GoTrue (hard delete).
  - Thay đổi cấu trúc bảng `billing.subscriptions`.
- **TUYỆT ĐỐI KHÔNG (Never Do):**
  - Không tạo thêm route vào sidebar nếu người dùng không phải là superadmin.
  - Không nhồi mock data hoặc dữ liệu giả lập.
  - Không push code lên GitHub khi chưa chạy xong bộ ba pre-push quality gate.

---

## 7. Tiêu Chí Nghiệm Thu (Success Criteria)

1. **Định tuyến & Menu:**
   - 4 routes mới xuất hiện ngay ngắn trong menu `/system` khi đăng nhập bằng tài khoản Superadmin (`admin@tuquet.com`).
   - 4 routes này hoàn toàn biến mất khỏi menu khi đăng nhập bằng user thông thường.
2. **Hiển thị & Telemetry:**
   - `/system/users`: Đọc danh sách từ `public.profiles`.
   - `/system/audit-logs`: Đọc danh sách từ `public.audit_logs`.
   - `/system/subscriptions`: Đọc danh sách từ `billing.subscriptions` với header `Accept-Profile: billing`.
   - `/system/roles`: Đọc bảng vai trò và quyền hạn từ `public.roles` và `public.permissions`.
3. **Cổng kiểm định CI:**
   - `vue-tsc` trả về **0 lỗi**.
   - `npx oxlint` trả về **0 warnings, 0 errors**.
   - `pnpm run lint` trả về **0 errors**.
   - `pnpm run build:admin` đóng gói thành công.

---

## 8. Các Giả Định Đang Thực Hiện (Assumptions Made)

1. **Phạm vi thẩm quyền:** Superadmin quản trị toàn bộ dữ liệu hệ thống thông qua hàm `public.is_platform_admin()` đã tạo tại `tuquet/cloud`.
2. **Plugin Gating:** Tuyến `/system/subscriptions` tiếp tục gắn với plugin `subscriptions`; 3 tuyến còn lại gắn với `core-iam`.
3. **Quyền thao tác:** Trong giai đoạn này, các trang tập trung vào chế độ **Read-First & Telemetry** (Giám sát, tìm kiếm, lọc, xem chi tiết), thao tác chỉnh sửa vai trò nền tảng được kiểm soát chặt chẽ.
