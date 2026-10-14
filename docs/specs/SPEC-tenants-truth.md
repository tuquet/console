# Spec: `tenants-truth`

> Module id: `tenants-truth` (xem [capability-map.md](capability-map.md)) — **ĐÃ HOÀN THÀNH** | Kiến trúc nguồn: [`docs/architecture/overview.md`](../architecture/overview.md)

---

## 1. Objective & Scope

Module này loại bỏ toàn bộ dữ liệu mẫu (mock data), các lời gọi bảng không tồn tại (`/rest/v1/machines`), và hệ thống API Keys giả khỏi màn hình chi tiết Workspace (`/tenants/:id`). Thay thế bằng **100% dữ liệu đo đếm thực tế (telemetry)** từ các schema `public`, `billing`, và `runners` của Tuquet Cloud, đồng thời cấu hình chuyển đổi 4 tab thông qua URL query parameter `?tab=`.

### Trong phạm vi:

1. **4 Tab Chi Tiết Workspace (`/tenants/:id?tab=`):**
   - **Tab `overview`:** Hiển thị thông tin định danh Workspace (Name, Slug, Tenant ID, Ngày tạo), số lượng Runner Devices trực tuyến / tổng số, gói cước hiện hành, trạng thái (`active` / `archived`), và các thao tác (kích hoạt chọn workspace làm ngữ cảnh CLI, đổi tên/slug, xóa/lưu trữ).
   - **Tab `members`:** Danh sách thành viên thật từ `public.tenant_members` kèm thông tin `profiles` và vai trò thật qua `member_roles(role_id,roles(id,name,display_name))`.
     - Hỗ trợ 4 vai trò hệ thống: `owner` (Chủ sở hữu), `admin` (Quản trị viên), `member` (Thành viên), `viewer` (Người xem). Loại bỏ hoàn toàn role ảo `developer`.
     - Sửa chức năng mời thành viên: Ghi vào `public.tenant_invitations` với các trường bắt buộc thật (`role_id UUID`, `token_hash`, `invited_by UUID`, `expires_at`, `status = 'pending'`).
     - Sửa chức năng cập nhật vai trò: Cập nhật bản ghi trong bảng nối `public.member_roles`.
   - **Tab `usage`:** Hiển thị hạn mức và tài nguyên thực tế:
     - Gói cước và hạn mức tối đa đọc từ `billing.subscriptions` liên kết `billing.plans` (schema `billing`). Trường hợp tenant chưa có bản ghi subscription, tự động áp dụng gói `free` từ `billing.plans`.
     - Số lượng Runner devices đọc từ `runners.devices` (schema `runners`).
     - Số lượng thành viên đọc từ `public.tenant_members`.
     - Chỉ số đo lường bổ sung từ `billing.usage_meters`.
   - **Tab `audit`:** Hiển thị nhật ký kiểm toán an ninh của tenant từ `public.audit_logs` (lọc theo `tenant_id = eq.<tenantId>`).
2. **Loại Bỏ Tab API Keys (Quyết định D4):**
   - Ẩn hoàn toàn tab "Cấu hình & API Keys" và các modal liên quan đến API key (do backend Cloud chưa có bảng API Key chuyên biệt; credential headless thật là `runners.devices.device_token_hash`).
3. **Đồng Bộ URL Tab Navigation:**
   - Giá trị tab được đồng bộ 2 chiều với query parameter trên URL: `/tenants/:id?tab=overview|members|usage|audit` (mặc định: `overview`).

### Ngoài phạm vi:

- Không can thiệp các màn hình độc lập `/fleet/*` (thuộc module `fleet-inventory`).
- Không triển khai polling 3s cho Automa (thuộc module `automation-engine`).
- Không sửa backend schema/RLS của `tuquet/cloud` (đã hoàn thiện ở Module `data-access`).

---

## 2. Public Interfaces & Data Structures

### 2.1. Data Models (`workspace-detail.ts`)

```ts
export type TenantDetailTab = 'audit' | 'members' | 'overview' | 'usage';

export interface WorkspaceMemberRole {
  display_name: string;
  id: string;
  name: 'admin' | 'member' | 'owner' | 'viewer';
}

export interface WorkspaceMember {
  avatar_url?: null | string;
  email: string;
  full_name?: null | string;
  id: string; // tenant_member id
  joined_at: string;
  role: WorkspaceMemberRole;
  status: 'active' | 'invited' | 'suspended';
  user_id: string;
}

export interface WorkspaceSubscriptionPlan {
  description?: null | string;
  id: string;
  max_members: number;
  max_monthly_runs: number;
  max_storage_mb: number;
  name: string;
  price_monthly_usd: number;
}

export interface WorkspaceSubscription {
  cancel_at_period_end: boolean;
  current_period_end: string;
  current_period_start: string;
  id: string;
  plan: WorkspaceSubscriptionPlan;
  plan_id: string;
  status: string;
  tenant_id: string;
}

export interface WorkspaceUsageQuota {
  max_devices: number;
  max_members: number;
  max_monthly_runs: number;
  max_storage_mb: number;
  plan_name: string;
  used_devices: number;
  used_members: number;
  used_monthly_runs: number;
  used_storage_mb: number;
}

export interface TenantAuditLog {
  action: string;
  actor_email?: null | string;
  actor_id?: null | string;
  actor_name?: null | string;
  created_at: string;
  entity_id: string;
  entity_type: string;
  id: number | string;
}

export interface WorkspaceDetailData {
  active_devices_count: number;
  members: WorkspaceMember[];
  quota: WorkspaceUsageQuota;
  subscription: null | WorkspaceSubscription;
  tenant: TenantItem;
  total_devices_count: number;
}
```

### 2.2. API Functions Exported (`workspace-detail.ts`)

```ts
/**
 * Lấy chi tiết Workspace từ tenants, tenant_members, runners.devices, và billing.subscriptions
 */
export async function getWorkspaceDetailApi(
  tenantId: string,
): Promise<WorkspaceDetailData>;

/**
 * Lấy danh sách nhật ký an ninh của Tenant
 */
export async function getTenantAuditLogsApi(
  tenantId: string,
  limit?: number,
): Promise<TenantAuditLog[]>;

/**
 * Lấy danh sách các vai trò hệ thống có thể gán (owner, admin, member, viewer)
 */
export async function getAvailableRolesApi(): Promise<WorkspaceMemberRole[]>;

/**
 * Mời thành viên mới vào Tenant qua public.tenant_invitations thật
 */
export async function inviteWorkspaceMemberApi(params: {
  email: string;
  invitedBy: string;
  roleId: string;
  tenantId: string;
}): Promise<void>;

/**
 * Cập nhật vai trò của thành viên trong public.member_roles
 */
export async function updateWorkspaceMemberRoleApi(params: {
  memberId: string;
  roleId: string;
  tenantId: string;
}): Promise<void>;

/**
 * Xóa thành viên khỏi Tenant (public.tenant_members)
 */
export async function removeWorkspaceMemberApi(memberId: string): Promise<void>;

/**
 * Cập nhật thông tin Workspace (Tên, Slug)
 */
export async function updateWorkspaceInfoApi(
  tenantId: string,
  data: { name?: string; slug?: string },
): Promise<TenantItem>;

/**
 * Xóa hoặc lưu trữ Workspace
 */
export async function deleteWorkspaceApi(tenantId: string): Promise<void>;
```

---

## 3. PostgREST Protocol Contracts

| Mục đích | Schema | PostgREST Endpoint & Params |
| :-- | :-- | :-- |
| Tenant Info | `public` | `GET /rest/v1/tenants?id=eq.<tenantId>&select=*` |
| Thành viên & Roles | `public` | `GET /rest/v1/tenant_members?tenant_id=eq.<tenantId>&select=id,status,joined_at,user_id,profiles(id,full_name,email,avatar_url),member_roles(role_id,roles(id,name,display_name))` |
| Danh sách Runner Devices | `runners` | `GET /rest/v1/devices?tenant_id=eq.<tenantId>&select=id,status` |
| Gói cước & Subscription | `billing` | `GET /rest/v1/subscriptions?tenant_id=eq.<tenantId>&select=id,tenant_id,plan_id,status,current_period_start,current_period_end,cancel_at_period_end,plans:plan_id(*)` |
| Hạn ngạch mặc định (Free) | `billing` | `GET /rest/v1/plans?id=eq.free&select=*` |
| Bộ đếm tài nguyên | `billing` | `GET /rest/v1/usage_meters?tenant_id=eq.<tenantId>&select=metric_name,current_value` |
| Nhật ký kiểm toán | `public` | `GET /rest/v1/audit_logs?tenant_id=eq.<tenantId>&select=id,action,entity_type,entity_id,created_at,actor_id,profiles(id,full_name,email)&order=created_at.desc&limit=50` |
| Gán vai trò thành viên | `public` | `POST /rest/v1/member_roles` (hoặc `PATCH` / `DELETE` + `POST` để đổi role) |
| Lời mời gia nhập | `public` | `POST /rest/v1/tenant_invitations` (`role_id`, `token_hash`, `invited_by`, `expires_at`) |

---

## 4. UI Components & Layout Specs

### 4.1. Cấu Trúc Tab Container (`views/tenants/detail.vue`)

- Header: Nút "Back" về `/tenants`, Hero Card thông tin workspace (Tên, Slug, Trạng thái, Badge Active).
- Tab Navigation: 4 tab phẳng chuẩn Shadcn Slate:
  1. `<TabsTrigger value="overview">` (Icon: `LayoutDashboard` hoặc `Layers`)
  2. `<TabsTrigger value="members">` (Icon: `Users`)
  3. `<TabsTrigger value="usage">` (Icon: `Gauge`)
  4. `<TabsTrigger value="audit">` (Icon: `ShieldCheck` hoặc `History`)
- Tự động sync query: `router.replace({ query: { ...route.query, tab: newTab } })`.

### 4.2. Tab Chi Tiết

- **`WorkspaceOverviewTab.vue`:**
  - Card 1: Thông tin cơ bản (Tenant ID sao chép 1 chạm, Slug, Ngày thành lập, Trạng thái hoạt động).
  - Card 2: Trạng thái Fleet Runner liên kết (Số máy online, tổng số thiết bị đã đăng ký, nút tắt "Quản lý Fleet").
  - Card 3: Thao tác nâng cao (Kích hoạt cho Specter CLI, Đổi tên/slug, Xóa workspace).
- **`WorkspaceMembersTab.vue`:**
  - Bảng thành viên Dual View (Table trên desktop, Card trên mobile).
  - Badge vai trò chuẩn: `Owner` (tím), `Admin` (xanh dương), `Member` (xanh lá), `Viewer` (xám).
  - Modal mời thành viên: Cho phép chọn vai trò từ `getAvailableRolesApi()`.
- **`WorkspaceUsageTab.vue` (thay thế Quotas):**
  - Thanh tiến trình đo lường: Thành viên đã dùng / Hạn mức gói; Thiết bị Runners đang kết nối / Hạn mức; Dung lượng lưu trữ / Hạn mức gói.
  - Thông tin gói cước từ `billing.plans` (Tên gói, giá tháng, kỳ hạn gia hạn tiếp theo).
- **`WorkspaceAuditTab.vue`:**
  - Dòng thời gian / Bảng sự kiện an ninh: Thời gian, Người thực hiện (Tên + Email), Hành động (`action`), Đối tượng (`entity_type` + `entity_id`).

---

## 5. Acceptance Criteria (Tiêu Chí Nghiệm Thu)

- [ ] **AC1:** Truy cập `/tenants/:id` hiển thị đầy đủ thông tin Workspace thật mà không gọi bảng giả `/rest/v1/machines`.
- [ ] **AC2:** URL query param phản ánh đúng tab đang chọn (ví dụ `/tenants/:id?tab=usage`). Refresh trang giữ nguyên tab hiện tại.
- [ ] **AC3:** Tab `overview` hiển thị đúng số Runner Devices trực tuyến từ schema `runners.devices`.
- [ ] **AC4:** Tab `members` hiển thị chính xác danh sách thành viên kèm role thật từ `member_roles`. Không còn xuất hiện role giả `developer`.
- [ ] **AC5:** Gửi lời mời thành viên tạo thành công bản ghi trong `public.tenant_invitations` với `role_id` UUID hợp lệ và `token_hash`.
- [ ] **AC6:** Đổi vai trò thành viên cập nhật thành công bảng nối `public.member_roles`.
- [ ] **AC7:** Tab `usage` đọc đúng thông tin từ `billing.subscriptions` và `billing.plans`. Nếu chưa có subscription, tự động hiển thị hạn mức gói `free` từ database.
- [ ] **AC8:** Tab `audit` đọc và hiển thị danh sách sự kiện từ `public.audit_logs` của tenant tương ứng.
- [ ] **AC9:** Tab API Keys và mọi modal/code liên quan đến API Keys giả bị loại bỏ hoàn toàn khỏi giao diện theo quyết định D4.
- [ ] **AC10:** Toàn bộ test suite Vitest mới cho `workspace-detail` và các helper logic đạt 100% pass.
- [ ] **AC11:** Toàn bộ các bước kiểm tra chất lượng:
  ```bash
  pnpm exec vitest run apps/web-admin/src/api/core
  pnpm --filter @tuquet/admin-web run typecheck
  npx oxlint apps/web-admin/src/
  pnpm run lint
  pnpm run build:admin
  ```
  đều đạt **0 errors, 0 warnings**.

---

## 6. Status & Sign-off Request

Spec này được xây dựng bám sát kiến trúc hệ thống và Capability Map đã duyệt.

> [!IMPORTANT] **Theo quy trình Spec-Driven Development, Agent dừng turn tại đây để User xem xét và phê duyệt `SPEC-tenants-truth.md` trước khi tiến hành lập kế hoạch chi tiết (Phase 2: Plan & Tasks) và triển khai mã nguồn.**
