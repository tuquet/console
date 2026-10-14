# Spec: `system-catalog`

> Module id: `system-catalog` (xem [capability-map.md](capability-map.md)) — **ĐÃ HOÀN THÀNH (ACCEPTED & IMPLEMENTED)**  
> Kiến trúc nguồn: [`docs/architecture/overview.md`](../architecture/overview.md)

---

## 1. Objective & Scope

Module này hoàn thiện phân hệ Quản Trị Hệ Thống & Danh Mục Đám Mây (**System Catalog**) bao gồm 2 màn hình nghiệp vụ:

1. `/system/plugins` (Quản trị Plugin Hệ Thống / Kernel & Dynamic Plugins)
2. `/system/plans` (Quản trị Gói Cước & Hạn Mức Dịch Vụ / SaaS Billing Plans)

Toàn bộ dữ liệu được truy vấn **100% đo đếm thực tế**:

- `/system/plugins` đọc từ `public.system_plugins`.
- `/system/plans` đọc từ `billing.plans` thông qua header `Accept-Profile: billing`.

### Trong phạm vi:

1. **Loại bỏ hoàn toàn Fake & Mock Data (AGENTS.md §5):**
   - Kết nối trực tiếp `public.system_plugins` và `billing.plans`.
   - Hiển thị Empty State chuẩn mực với icon Lucide khi chưa có plugin hoặc plan nào.
2. **Quản trị Plugin Hệ Thống (`/system/plugins`):**
   - Đọc dữ liệu từ `public.system_plugins` (`id`, `name`, `description`, `version`, `status`, `schema_name`, `manifest`, `installed_at`).
   - Phân biệt rõ Core Kernel Plugins (`core-iam`, `runners`, `automa`, `storage`, `subscriptions`, `webhooks`) với Dynamic Plugins mở rộng.
   - Hiển thị trạng thái: `installed` (xanh), `disabled` (xám), `pending` (vàng).
   - Dual View: Bảng đầy đủ trên Desktop (`hidden md:block`), Thẻ Compact chạm trên Mobile (`block md:hidden`).
3. **Quản trị Gói Cước Dịch Vụ (`/system/plans`):**
   - Đọc dữ liệu từ `billing.plans` (`id`, `name`, `description`, `price_monthly_usd`, `max_members`, `max_storage_mb`, `max_monthly_runs`, `is_active`, `metadata`, `created_at`).
   - Header `{ schema: 'billing' }`.
   - Trực quan hóa giá cước ($/tháng hoặc Miễn phí), hạn mức tài nguyên (Thành viên tối đa, Dung lượng lưu trữ MB/GB, Lượt chạy hàng tháng).
   - Hiển thị trạng thái `Kích Hoạt` (`is_active = true`) hoặc `Tạm Dừng`.
   - Dual View: Bảng trên Desktop, Thẻ trên Mobile.
4. **Tiêu chuẩn Giao diện & Kỹ thuật:**
   - 100% Lucide Icons, không dùng emoji (AGENTS.md §3).
   - Semantic tokens Shadcn Slate (`bg-card`, `border-border/60`, `rounded-xl`, etc.) (AGENTS.md §2).
   - Unit tests với Vitest cho data helpers & APIs.

### Ngoài phạm vi:

- Không tạo/sửa bảng hay trigger trong cloud DB (đã hoàn thiện).
- Không thêm các cài đặt cấu hình ERP thừa thãi (YAGNI).

---

## 2. Public Interfaces & Data Structures

### 2.1. Data Models (`apps/web-admin/src/api/core/system.ts`)

```ts
export interface SystemPluginItem {
  description: null | string;
  id: string;
  installed_at: string;
  is_core: boolean;
  manifest: Record<string, any>;
  name: string;
  schema_name: null | string;
  status: 'disabled' | 'installed' | 'pending' | string;
  version: string;
}

export interface BillingPlanItem {
  created_at: string;
  description: null | string;
  id: string;
  is_active: boolean;
  max_members: number;
  max_monthly_runs: number;
  max_storage_mb: number;
  metadata: Record<string, any>;
  name: string;
  price_monthly_usd: number;
}
```

### 2.2. API Functions Contract

```ts
export function isCorePlugin(id: string): boolean;

export function mapRawPlugin(raw: any): SystemPluginItem;

export async function getSystemPluginsApi(): Promise<SystemPluginItem[]>;

export async function getBillingPlansApi(): Promise<BillingPlanItem[]>;
```

---

## 3. Screen Designs & Components Breakdown

### 3.1. System Plugins Screen (`/system/plugins`)

- **Dual View Table & Cards:**
  - Cột/Trường: Tên Plugin + ID, Phiên bản + Schema, Phân loại (`Core Kernel` vs `Extension`), Trạng thái (`Đã Cài Đặt`, `Tạm Tắt`), Ngày cài đặt.
- **Header:** Nút Làm mới (`RefreshCw`).
- **Empty State:** Icon `Layers`, thông báo chưa có plugin nào.

### 3.2. Billing Plans Screen (`/system/plans`)

- **Dual View Table & Cards:**
  - Cột/Trường: Tên Gói + ID, Giá Cước ($/tháng), Hạn Mức Thành Viên (`max_members`), Dung Lượng Lưu Trữ (`max_storage_mb`), Lượt Chạy / Tháng (`max_monthly_runs`), Trạng Thái (`Kích Hoạt` / `Tạm Dừng`), Ngày Tạo.
- **Header:** Nút Làm mới (`RefreshCw`).
- **Empty State:** Icon `CreditCard`, thông báo chưa có gói cước nào.

---

## 4. Verification Plan

### Automated Vitest Unit Tests:

- `apps/web-admin/src/api/core/__tests__/system.test.ts`:
  - Kiểm tra `isCorePlugin` nhận diện đúng 6 core plugins (`core-iam`, `runners`, `automa`, `storage`, `subscriptions`, `webhooks`) và trả về `false` cho plugin khác.
  - Kiểm tra `mapRawPlugin` gán đúng trường `is_core` và fallback an toàn.
  - Kiểm tra `getBillingPlansApi` truy vấn với `{ schema: 'billing' }`.
  - Kiểm tra `getSystemPluginsApi` truy vấn đúng bảng `system_plugins`.

### Quality Gate Suite:

1. `pnpm exec vitest run apps/web-admin/src/api/core apps/web-admin/src/router`
2. `pnpm --filter @tuquet/admin-web run typecheck`
3. `npx oxlint apps/web-admin/src/`
4. `pnpm run lint`
5. `pnpm run build:admin`
