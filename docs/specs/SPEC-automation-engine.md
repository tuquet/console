# Spec: `automation-engine`

> Module id: `automation-engine` (xem [capability-map.md](capability-map.md)) — **DRAFT, chờ duyệt**  
> Kiến trúc nguồn: [`docs/routing_architecture.md`](../routing_architecture.md) §1.2, §3, §4, §7

---

## 1. Objective & Scope

Module này hoàn thiện phân hệ Quản Trị Tự Động Hóa Quy Trình (**Automa Engine**) bao gồm 3 màn hình nghiệp vụ:

1. `/automation/workflows` (Quản trị Luồng Quy Trình / Visual Flow Graphs)
2. `/automation/runs` (Quản trị Phiên Chạy Chiến Dịch / Campaign Runs)
3. `/automation/runs/:id` (Chi tiết Phiên Chạy & Nhật Ký Thực Thi Thời Gian Thực / Execution Logs Polling)

Toàn bộ dữ liệu được truy vấn **100% đo đếm thực tế** từ schema `automa` (và bảng liên kết `runners.devices`) của Tuquet Cloud qua header `Accept-Profile: automa`.

### Trong phạm vi:

1. **Loại bỏ hoàn toàn Fake & Mock Data (AGENTS.md §5):**
   - Kết nối trực tiếp tới `automa.workflows`, `automa.campaign_runs`, và `automa.execution_logs`.
   - Hiển thị Empty State chuẩn mực với icon Lucide khi chưa có quy trình hoặc phiên chạy nào.
2. **Quản trị Luồng Quy Trình (`/automation/workflows`):**
   - Đọc dữ liệu từ `automa.workflows` (`id`, `tenant_id`, `name`, `description`, `version`, `status`, `created_at`, `updated_at`). RLS tự động lọc `deleted_at IS NULL`.
   - Hỗ trợ trạng thái workflow: `all`, `published`, `draft`, `archived`.
   - Hỗ trợ bộ lọc URL query parameters: `?tenant=&status=`.
   - Dual View: Bảng chi tiết trên Desktop (`hidden md:block`), Thẻ Compact chạm cảm ứng trên Mobile (`block md:hidden`).
3. **Quản trị Phiên Chạy Chiến Dịch (`/automation/runs`):**
   - Đọc dữ liệu từ `automa.campaign_runs` (`id`, `tenant_id`, `workflow_id`, `runner_id`, `name`, `status`, `total_tasks`, `completed_tasks`, `failed_tasks`, `started_at`, `ended_at`, `created_at`).
   - Liên kết PostgREST foreign tables: `workflow:workflow_id(name)` và `runner:runner_id(name)`.
   - Hỗ trợ trạng thái campaign run: `all`, `running`, `completed`, `failed`, `cancelled`, `queued`, `pending`.
   - Hiển thị tiến độ hoàn thành: thanh tiến trình `completed_tasks / total_tasks` (phần trăm).
   - Hỗ trợ bộ lọc URL query parameters: `?tenant=&status=&workflow=`.
   - Dual View: Desktop table và Mobile cards.
4. **Chi Tiết Phiên Chạy & Nhật Ký Thực Thi (`/automation/runs/:id`):**
   - Hiển thị thông số chi tiết của phiên chạy: Trạng thái, thời gian chạy (runtime duration), máy trạm runner đảm nhiệm, tóm tắt kết quả (`result_summary`), lỗi (nếu có).
   - **Cơ chế Polling 3s (Quyết định D3 & RFC §7.3):** Khi phiên chạy ở trạng thái `pending`, `queued`, hoặc `running`, hệ thống tự động thăm dò cập nhật `campaign_runs` và `execution_logs` mỗi 3000ms. Dừng polling ngay lập tức khi trạng thái chuyển sang `completed`, `failed`, `cancelled`, hoặc khi người dùng rời trang (`onUnmounted`).
   - Console nhật ký thực thi (`automa.execution_logs`): Phân loại màu sắc theo `level` (`info`, `warn`, `error`, `debug`, `trace`), hiển thị timestamp và bước thực thi (`step_name`).
   - Hỗ trợ nút "Hủy Phiên Chạy" (gọi cập nhật `status = 'cancelled'`).
5. **Tiêu chuẩn Giao diện & Kỹ thuật:**
   - 100% Lucide Icons, không dùng emoji (AGENTS.md §3).
   - Semantic tokens Shadcn Slate (`bg-card`, `border-border/60`, `rounded-xl`, etc.) (AGENTS.md §2).
   - Unit tests với Vitest cho các mappers và polling helpers.

### Ngoài phạm vi:

- Không chỉnh sửa visual graph editor (trình kéo thả Canvas Automa thực hiện trên ứng dụng mở rộng / extension).
- Không sửa backend schema/RLS của Tuquet Cloud.

---

## 2. Public Interfaces & Data Structures

### 2.1. Data Models (`apps/web-admin/src/api/core/automation.ts`)

```ts
export type WorkflowStatus = 'archived' | 'draft' | 'published';

export type CampaignStatus =
  | 'cancelled'
  | 'completed'
  | 'failed'
  | 'paused'
  | 'pending'
  | 'queued'
  | 'running';

export type LogLevel = 'debug' | 'error' | 'fatal' | 'info' | 'trace' | 'warn';

export interface AutomaWorkflowItem {
  created_at: string;
  description: null | string;
  id: string;
  name: string;
  status: WorkflowStatus;
  tenant_id: string;
  updated_at: string;
  version: string;
}

export interface AutomaCampaignRunItem {
  completed_tasks: number;
  created_at: string;
  ended_at: null | string;
  error_message: null | string;
  failed_tasks: number;
  id: string;
  name: string;
  runner?: null | {
    id?: string;
    name: string;
  };
  runner_id: null | string;
  started_at: null | string;
  status: CampaignStatus;
  tenant_id: string;
  total_tasks: number;
  workflow?: null | {
    id?: string;
    name: string;
  };
  workflow_id: null | string;
}

export interface AutomaExecutionLogItem {
  campaign_run_id: string;
  id: number;
  level: LogLevel;
  logged_at: string;
  message: string;
  node_id: null | string;
  payload: Record<string, any>;
  step_name: null | string;
  tenant_id: string;
}
```

### 2.2. API Functions Contract

```ts
export function isRunActive(status: CampaignStatus): boolean;

export function calculateProgressPercentage(
  completed: number,
  total: number,
): number;

export function buildAutomationFilterQuery(
  baseQuery: string,
  params?: { status?: string; tenantId?: string; workflowId?: string },
): string;

export async function getWorkflowsApi(params?: {
  status?: string;
  tenantId?: string;
}): Promise<AutomaWorkflowItem[]>;

export async function getCampaignRunsApi(params?: {
  status?: string;
  tenantId?: string;
  workflowId?: string;
}): Promise<AutomaCampaignRunItem[]>;

export async function getCampaignRunDetailApi(
  runId: string,
): Promise<AutomaCampaignRunItem | null>;

export async function getExecutionLogsApi(
  runId: string,
  params?: { limit?: number; sinceId?: number },
): Promise<AutomaExecutionLogItem[]>;

export async function cancelCampaignRunApi(runId: string): Promise<void>;
```

---

## 3. Screen Designs & Components Breakdown

### 3.1. Workflows Screen (`/automation/workflows`)

- **Status Filter:** Tất Cả, Xuất Bản (`published`), Bản Nháp (`draft`), Lưu Trữ (`archived`).
- **Dual View Table & Cards:**
  - Cột/Trường: Tên Luồng + Phiên bản, Mô tả, Trạng thái (Badge), Ngày tạo, Cập nhật gần nhất.
- **Empty State:** Icon `Workflow`, mô tả quy trình tự động chưa được đồng bộ từ extension/editor.

### 3.2. Campaign Runs Screen (`/automation/runs`)

- **Status Filter:** Tất Cả, Đang Chạy (`running`), Hoàn Thành (`completed`), Lỗi (`failed`), Đã Hủy (`cancelled`), Đang Chờ (`queued`/`pending`).
- **Dual View Table & Cards:**
  - Cột/Trường: Tên Phiên Chạy + Tên Workflow, Máy Trạm Thực Thi (`runner.name`), Tiến Độ (`completed_tasks / total_tasks` kèm Progress Bar), Trạng Thái (Badge sinh động), Bắt đầu / Kết thúc, Nút Xem Chi Tiết (`Eye`).
- **Empty State:** Icon `PlaySquare`, thông báo chưa có phiên chạy nào.

### 3.3. Run Detail & Live Logs (`/automation/runs/:id`)

- **Header:** Tên Run, Badge trạng thái, Máy trạm đảm nhiệm, Thời lượng thực thi (Runtime duration).
- **Thao tác:** Nút "Hủy Phiên Chạy" (hiển thị khi trạng thái là `running`, `queued`, `pending`).
- **Console Nhật Ký (Execution Logs Console):**
  - Giao diện Dark Console/Monospace với màu theo log level: xanh lá (`info`), vàng (`warn`), đỏ (`error`/`fatal`), lam (`debug`/`trace`).
  - Tự động cuộn theo dòng mới nhất khi polling.
  - Polling định kỳ 3000ms khi phiên chạy đang active, tự động hủy khi unmounted.

---

## 4. Verification Plan

### Automated Vitest Unit Tests:

- `apps/web-admin/src/api/core/__tests__/automation.test.ts`:
  - Kiểm tra `isRunActive` nhận diện đúng các trạng thái cần poll (`running`, `queued`, `pending`) và không poll với trạng thái kết thúc (`completed`, `failed`, `cancelled`).
  - Kiểm tra `calculateProgressPercentage` tính chính xác %, xử lý chia cho 0 an toàn.
  - Kiểm tra `buildAutomationFilterQuery` tạo đúng PostgREST query string với `tenant_id`, `status`, `workflow_id`.

### Quality Gate Suite:

1. `pnpm exec vitest run apps/web-admin/src/api/core apps/web-admin/src/router`
2. `pnpm --filter @tuquet/admin-web run typecheck`
3. `npx oxlint apps/web-admin/src/`
4. `pnpm run lint`
5. `pnpm run build:admin`
