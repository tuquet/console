# Spec: Chuẩn Hóa Giao Diện Quản Trị Người Dùng & Vai Trò Hệ Thống Với VXE Grid (Module `system-iam-vxe-grid`)

> **Mã đặc tả:** `SPEC-system-iam-vxe-grid`  
> **Module id:** `system-iam-vxe-grid` (xem [`capability-map.md`](capability-map.md))  
> **Kiến trúc nguồn:** [`docs/architecture/overview.md`](../architecture/overview.md), [`ADR-004`](../decisions/0004-vxe-grid-form-and-i18n-terminology.md), [`docs/routes/system.md`](../routes/system.md)  
> **Trạng thái:** **ĐÃ HOÀN THÀNH (ACCEPTED & IMPLEMENTED)**

---

## 1. Giả Định Ban Đầu (Assumptions)

1. **Chuẩn Enterprise Cloud Console IAM (AWS IAM / GitHub Enterprise / Vercel / Supabase):**
   - **Vai trò & Quyền hạn (`/system/roles`):** Các vai trò cốt lõi (`is_system = true`: `owner`, `admin`, `member`, `viewer`) và 36 quyền hạt nhân thuộc 6 core plugins là **Immutable Platform Primitives** (Chính sách nền tảng bất biến — bảo vệ toàn vẹn RLS đa tenant), tập trung vào tra cứu bảng tốc độ cao (`useVbenVxeGrid`), lọc chéo Module $\leftrightarrow$ Role, sao chép nhanh mã quyền và hộp thoại **Role Policy Inspector** gom nhóm theo module.
   - **Người dùng nền tảng (`/system/users`):** Danh bạ trung tâm (**Enterprise User Directory**) hỗ trợ tìm kiếm đa trường tức thì (Họ tên, Email, UUID, Workspace), lọc theo trạng thái tổ chức và vai trò, sao chép UUID 1 chạm, và hộp thoại **Enterprise User Inspector Dialog** cho phép xem hồ sơ định danh và toàn bộ các Workspace mà user tham gia (kèm điều hướng nhanh tới `/tenants/:id`).
2. **Nguồn dữ liệu thực 100% từ PostgREST (`public` schema):**
   - `/system/users` truy vấn từ `public.profiles` kết hợp liên kết `public.tenant_members` (kèm thông tin `tenants` và `member_roles(roles)` nếu có) để vừa đếm chính xác `tenant_count`, vừa hiển thị danh sách tổ chức và vai trò của người dùng.
   - `/system/roles` truy vấn từ `public.roles` (kèm `role_permissions(permission_id)`) và `public.permissions`.
3. **Đồng bộ kiến trúc `useVbenVxeGrid` theo `ADR-004`:**
   - Thay thế toàn bộ danh sách thẻ (Card Grid) chưa có bộ lọc tại `/system/roles` và nâng cấp bảng `/system/users` sang cấu trúc `useVbenVxeGrid` chuẩn mực có thanh thống kê (`Stats Bar`), bộ lọc tích hợp (`formOptions`), phân trang (`pagerConfig`), cột thao tác xem chi tiết (`Dialog`), và `#empty` state đồng nhất với `/tenants`, `/system/plans`, `/system/plugins`.

---

## 2. Objective (Mục Tiêu & Phạm Vi)

Xây dựng lại giao diện hai trang quản trị định danh và phân quyền cốt lõi (`/system/users` và `/system/roles`) đạt chuẩn **Users & RBAC Management Console** hiện đại, tối ưu hóa cho việc tìm kiếm, lọc và tra cứu dữ liệu dạng bảng với `useVbenVxeGrid` (`vxe-table`):

### 2.1. Trang Người Dùng Nền Tảng (`/system/users` — [`src/views/system/users/index.vue`](../../src/views/system/users/index.vue))

1. **Khắc phục triệt để lỗi tìm kiếm đa trường (Multi-Field Search):**
   - Hiện tại `getPlatformUsersApi({ search })` chỉ lọc `full_name=ilike.*...*` ở phía server khiến việc tìm bằng **UUID (`id`)** hoặc **Email** bị rỗng kết quả.
   - Chuẩn hóa hàm lọc thuần khiết `filterPlatformUsers(users, filters)` hỗ trợ tìm kiếm tức thì không phân biệt hoa thường trên cả 4 trường: **Họ tên (`full_name`)**, **Email (`email`)**, **Định danh UUID (`id`)**, và **Tên/Slug tổ chức (`workspaces`)**.
2. **Nâng cấp Bộ Lọc `formOptions` & Thanh Thống Kê (`Stats Bar`):**
   - Bổ sung thanh thống kê tổng quan phía trên bảng: **Tổng người dùng**, **Đã tham gia workspace**, và **Chưa có tổ chức**.
   - Bộ lọc `formOptions` gồm 3 tiêu chí:
     - `tenant_filter` (`Select`): `Tất cả người dùng` (`all`), `Đã tham gia tổ chức` (`has_tenants`), `Chưa có tổ chức` (`no_tenants`).
     - `role_filter` (`Select`): `Tất cả vai trò` (`all`), `Owner` (`owner`), `Admin` (`admin`), `Member` (`member`), `Viewer` (`viewer`).
     - `search` (`Input`, `clearable: true`): Tìm theo họ tên, email, UUID hoặc tên workspace.
   - Nút hành động chuẩn hóa dùng `$t('common.filter')` và `$t('common.reset')`.
3. **Chuẩn hóa Cột Bảng `vxe-table` & Hộp Thoại Chi Tiết Người Dùng:**
   - **Cột `Người dùng` (`full_name`):** Avatar + Họ tên + Email (căn trái, chống tràn text).
   - **Cột `Định danh UUID` (`id`):** Mã UUID rút gọn kèm nút sao chép nhanh (`Copy` icon + phản hồi `toast.success`).
   - **Cột `Workspaces & vai trò` (`tenant_count`):** Badge số lượng tổ chức + hiển thị nhanh các badge vai trò (`RoleBadge`) hoặc tên workspace tiêu biểu.
   - **Cột `Ngày tham gia` (`created_at`, `sortable: true`):** Định dạng ngày tháng chuẩn kèm cập nhật cuối.
   - **Cột `Thao tác` (`actions`):** Nút `Chi tiết` mở `Dialog` hiển thị hồ sơ đầy đủ của người dùng và danh sách các Workspace đang tham gia (kèm nút chuyển hướng nhanh tới `/tenants/:id`).

### 2.2. Trang Vai Trò & Quyền Hạn (`/system/roles` — [`src/views/system/roles/index.vue`](../../src/views/system/roles/index.vue))

1. **Chuyển đổi từ Card Grid tĩnh sang `useVbenVxeGrid` (`vxe-table`) có Tìm Kiếm & Phân Trang:**
   - Giữ thanh chuyển chế độ (Mode Selector Tabs) gồm 2 chế độ: **Vai trò hệ thống (`roles`)** và **Danh mục quyền hạn (`permissions`)**, kèm số lượng tổng ở mỗi tab và thanh thống kê (`Stats Bar`).
2. **Tab 1 — Bảng Vai Trò Hệ Thống (`RolesGrid` — `useVbenVxeGrid<SystemRoleItem>`):**
   - **Bộ lọc `formOptions`:**
     - `role_type` (`Select`): `Tất cả phân loại` (`all`), `System Role` (`system`), `Custom Role` (`custom`).
     - `module` (`Select`): Lọc các vai trò có chứa quyền thuộc phân hệ (`all`, `core-iam`, `runners`, `automa`, `storage`, `subscriptions`, `webhooks`...).
     - `search` (`Input`, `clearable: true`): Tìm theo tên vai trò, mô tả hoặc mã quyền hạn (`owner`, `runners:devices:manage`...).
   - **Cột bảng `vxe-table`:**
     - `name` (`Vai trò`, `minWidth: 220`): Icon + `RoleBadge` + mô tả vai trò.
     - `is_system` (`Phân loại`, `width: 140`): Badge `System Role` / `Custom`.
     - `permissions` (`Quyền được gán`, `minWidth: 300`): Hiển thị số lượng quyền (`N quyền`) + preview 3 mã quyền đầu tiên + badge `+X quyền khác`.
     - `created_at` (`Ngày tạo`, `width: 150`).
     - `actions` (`Thao tác`, `width: 110`, `align: 'right'`): Nút `Chi tiết` mở `Dialog` hiển thị toàn bộ danh sách quyền hạn của vai trò đó được gom nhóm trực quan theo từng Module.
3. **Tab 2 — Bảng Danh Mục Quyền Hạn (`PermissionsGrid` — `useVbenVxeGrid<SystemPermissionItem>`):**
   - **Bộ lọc `formOptions`:**
     - `module` (`Select`): Lọc theo module (`Tất cả module` + danh sách module động từ dữ liệu).
     - `role` (`Select`): Lọc các quyền được gán cho một vai trò cụ thể (`Tất cả vai trò`, `owner`, `admin`, `member`, `viewer`).
     - `search` (`Input`, `clearable: true`): Tìm theo mã định danh quyền (`id`) hoặc mô tả (`description`).
   - **Cột bảng `vxe-table`:**
     - `id` (`Mã quyền hạn`, `minWidth: 240`): Mã `code` font-mono kèm nút sao chép nhanh.
     - `module` (`Module`, `width: 150`): Badge định danh phân hệ (`core-iam`, `runners`, `automa`...).
     - `description` (`Mô tả quyền hạn`, `minWidth: 260`): Mô tả chi tiết tác vụ được cấp phép.
     - `assigned_roles` (`Vai trò sở hữu`, `minWidth: 220`): Hiển thị trực tiếp các `RoleBadge` (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`) đang sở hữu quyền hạn này.

---

## 3. Tech Stack

- **Frontend Application:** `@tuquet/admin-web` (Vue 3 `<script setup lang="ts">`, TypeScript, Vue Router 4, `vue-i18n`).
- **Table & Form Engine:** `useVbenVxeGrid` từ [`src/adapter/vxe-table.ts`](../../src/adapter/vxe-table.ts) (`@vben/plugins/vxe-table` + `vxe-table`).
- **UI Components & Icons:** `@tuquet/vue-ui` (`Avatar`, `Badge`, `Button`, `Dialog`, `toast`), `@lucide/vue`, và [`RoleBadge`](../../src/components/iam/role-badge.vue).
- **Data Access Layer:** PostgREST Direct API qua [`supabaseRequest`](../../src/api/core/supabase-client.ts).

---

## 4. Commands (Lệnh Thực Thi & Kiểm Định)

```bash
# 1. Chạy unit tests cho API Core và Router
pnpm exec vitest run apps/web-admin/src/api/core apps/web-admin/src/router

# 2. Kiểm tra kiểu dữ liệu TypeScript (Zero errors)
pnpm --filter @tuquet/admin-web run typecheck

# 3. Quét tĩnh mã nguồn oxlint & kiểm tra định dạng oxfmt
npx oxlint apps/web-admin/src/
npx oxfmt --check apps/web-admin/src/ apps/web-admin/docs/

# 4. Đóng gói sản phẩm web-admin
pnpm --filter @tuquet/admin-web run build
```

---

## 5. Project Structure (Cấu Trúc Tệp Tác Động)

```text
apps/web-admin/
├── docs/
│   ├── routes/
│   │   └── system.md                                # Cập nhật đặc tả bảng VXE Grid cho /system/users và /system/roles
│   └── specs/
│       ├── capability-map.md                        # Bổ sung module system-iam-vxe-grid
│       └── SPEC-system-iam-vxe-grid.md              # Bản đặc tả hiện tại
└── src/
    ├── api/core/
    │   ├── system.ts                                # Mở rộng PlatformUserItem (workspaces/roles), thêm pure helpers filterPlatformUsers, filterSystemRoles, filterSystemPermissions
    │   └── __tests__/
    │       └── system.test.ts                       # Unit tests cho mappers và bộ lọc tìm kiếm users/roles/permissions
    └── views/system/
        ├── roles/
        │   └── index.vue                            # Xây dựng lại bằng useVbenVxeGrid (RolesGrid + PermissionsGrid) & Role Detail Dialog
        └── users/
            └── index.vue                            # Nâng cấp useVbenVxeGrid với Stats Bar, lọc đa trường, Copy UUID & User Detail Dialog
```

---

## 6. Code Style & Quy Chuẩn Kỹ Thuật

### 6.1. Pure Filter Helpers Trong `src/api/core/system.ts`

```typescript
export interface PlatformUserWorkspaceSummary {
  role_name: string;
  status: string;
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
}

export interface PlatformUserItem {
  avatar_url: null | string;
  created_at: string;
  email?: null | string;
  full_name: null | string;
  id: string;
  primary_role?: string;
  tenant_count: number;
  updated_at: string;
  workspaces?: PlatformUserWorkspaceSummary[];
}

export function filterPlatformUsers(
  users: PlatformUserItem[],
  filters?: {
    role_filter?: string;
    search?: string;
    tenant_filter?: string;
  },
): PlatformUserItem[] {
  let result = users;

  if (filters?.tenant_filter === 'has_tenants') {
    result = result.filter((u) => u.tenant_count > 0);
  } else if (filters?.tenant_filter === 'no_tenants') {
    result = result.filter((u) => u.tenant_count === 0);
  }

  if (filters?.role_filter && filters.role_filter !== 'all') {
    const roleTarget = filters.role_filter.toLowerCase();
    result = result.filter((u) =>
      u.workspaces?.some((w) => w.role_name.toLowerCase() === roleTarget),
    );
  }

  if (filters?.search?.trim()) {
    const kw = filters.search.toLowerCase().trim();
    result = result.filter(
      (u) =>
        (u.full_name && u.full_name.toLowerCase().includes(kw)) ||
        (u.email && u.email.toLowerCase().includes(kw)) ||
        u.id.toLowerCase().includes(kw) ||
        u.workspaces?.some(
          (w) =>
            w.tenant_name.toLowerCase().includes(kw) ||
            w.tenant_slug.toLowerCase().includes(kw),
        ),
    );
  }

  return result;
}
```

### 6.2. Cấu Hình `useVbenVxeGrid` Chuẩn Cho Quản Trị Bảng (`users/index.vue` & `roles/index.vue`)

```typescript
const [Grid, gridApi] = useVbenVxeGrid<PlatformUserItem>({
  formOptions: {
    schema: [
      {
        component: 'Select',
        fieldName: 'tenant_filter',
        label: 'Tổ chức',
        defaultValue: 'all',
        componentProps: {
          options: [
            { label: 'Tất cả người dùng', value: 'all' },
            { label: 'Đã tham gia tổ chức', value: 'has_tenants' },
            { label: 'Chưa có tổ chức', value: 'no_tenants' },
          ],
        },
      },
      {
        component: 'Select',
        fieldName: 'role_filter',
        label: 'Vai trò',
        defaultValue: 'all',
        componentProps: {
          options: [
            { label: 'Tất cả vai trò', value: 'all' },
            { label: 'Owner', value: 'owner' },
            { label: 'Admin', value: 'admin' },
            { label: 'Member', value: 'member' },
            { label: 'Viewer', value: 'viewer' },
          ],
        },
      },
      {
        component: 'Input',
        fieldName: 'search',
        label: 'Tìm kiếm',
        componentProps: {
          placeholder: 'Họ tên, email, UUID hoặc workspace...',
          clearable: true,
        },
      },
    ],
    layout: 'vertical',
    showCollapseButton: false,
    submitButtonOptions: { content: $t('common.filter') },
    resetButtonOptions: { content: $t('common.reset') },
    actionWrapperClass: 'flex items-center justify-end gap-2 pt-2 sm:pt-6',
    wrapperClass: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3',
  },
  gridOptions: {
    border: false,
    round: true,
    showOverflow: true,
    sortConfig: { multiple: false },
    pagerConfig: {
      pageSize: 15,
      pageSizes: [10, 15, 30, 50],
    },
    // ...
  },
});
```

---

## 7. Testing Strategy (Chiến Lược Kiểm Thử)

1. **Unit Tests (`Vitest`):**
   - Mở rộng [`apps/web-admin/src/api/core/__tests__/system.test.ts`](../../src/api/core/__tests__/system.test.ts):
     - Kiểm thử `mapRawPlatformUser` với cả định dạng đếm `[{ count: N }]` và định dạng danh sách chi tiết `tenant_members` kèm `tenants` + `member_roles`.
     - Kiểm thử `filterPlatformUsers`: lọc theo `tenant_filter` (`has_tenants`, `no_tenants`), `role_filter` (`owner`, `admin`...), và tìm kiếm `search` khớp chính xác theo `full_name`, `email`, `id` (UUID), hoặc `tenant_name`.
     - Kiểm thử `filterSystemRoles` và `filterSystemPermissions`: lọc theo phân loại vai trò (`system`/`custom`), theo `module`, theo `role`, và từ khóa tìm kiếm.
2. **Local Browser Verification (Playwright):**
   - Kiểm thử trực quan tại `http://localhost:5666/system/users` và `http://localhost:5666/system/roles` ở cả 2 chế độ:
     - Desktop (`1280 x 800`)
     - Mobile (`375 x 812`)
   - Lưu ảnh chụp nghiệm thu vào thư mục `scratch/`.

---

## 8. Boundaries (Ranh Giới Kỹ Thuật)

- **Always (Bắt buộc):**
  - Sử dụng `useVbenVxeGrid` từ `#/adapter/vxe-table` cho cả `/system/users` và `/system/roles`.
  - Sử dụng 100% Lucide Icons (`@lucide/vue`) và semantic classes của Shadcn Slate (`bg-card`, `border-border/60`, `text-foreground`, `text-muted-foreground`).
  - Bảo toàn tính tương thích ngược cho toàn bộ các unit tests hiện hữu trong `system.test.ts`.
  - Sử dụng nhãn nút chuẩn từ `$t('common.*')` (`filter`, `reset`, `refresh`, `detail`).
- **Ask First (Hỏi trước):**
  - Thêm các thao tác ghi/xóa trực tiếp vào bảng hệ thống `public.roles`, `public.permissions` hoặc xóa tài khoản khỏi GoTrue Auth.
- **Never (Tuyệt đối không):**
  - Không dùng Mock Data hoặc dữ liệu giả lập.
  - Không dùng mã màu tĩnh hardcode hoặc Emoji.
  - Không chạy `git push` khi chưa được yêu cầu.

---

## 9. Success Criteria (Tiêu Chí Nghiệm Thu)

- [x] **SC1 (`/system/users`):** Tìm kiếm trong `useVbenVxeGrid` hoạt động chính xác với cả Họ tên, Email, Định danh UUID và Tên Workspace; lọc được theo trạng thái tham gia tổ chức và vai trò; có thanh thống kê (`Stats Bar`), nút sao chép UUID và hộp thoại `Dialog` xem chi tiết hồ sơ + danh sách tổ chức của người dùng.
- [x] **SC2 (`/system/roles`):** Chuyển đổi hoàn toàn cả 2 tab (`Vai trò hệ thống` và `Danh mục quyền hạn`) từ Card Grid tĩnh sang bảng `useVbenVxeGrid` (`vxe-table`) có bộ lọc tìm kiếm (`formOptions`), phân trang, cột hiển thị vai trò sở hữu quyền hạn (`RoleBadge`), và hộp thoại `Dialog` xem chi tiết quyền hạn theo module của từng vai trò.
- [x] **SC3 (Unit Tests):** Toàn bộ bài test trong `apps/web-admin/src/api/core/__tests__/system.test.ts` (bao gồm các test mới cho `filterPlatformUsers`, `filterSystemRoles`, `filterSystemPermissions`) đều PASS 100%.
- [x] **SC4 (Quality Gate):** `pnpm --filter @tuquet/admin-web run typecheck`, `npx oxlint apps/web-admin/src/`, và `pnpm --filter @tuquet/admin-web run build` kết thúc với **0 lỗi**.

---

## 10. Open Questions (Câu Hỏi Mở)

- Không còn câu hỏi mở (Đã chốt theo **Chuẩn Enterprise Cloud Console IAM** của AWS IAM / GitHub Enterprise / Vercel / Supabase: bảo vệ tính bất biến của System Roles & Kernel Permissions với Policy Inspector Dialog trên `/system/roles`, và cung cấp Enterprise User Directory + Cross-Tenant Membership Inspector trên `/system/users`).
