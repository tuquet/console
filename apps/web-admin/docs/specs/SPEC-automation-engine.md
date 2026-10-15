# Spec: Quản Trị Kịch Bản Tự Động Hóa & Nhật Ký Thực Thi (`automation-engine`)

> **Mã đặc tả:** `SPEC-automation-engine`  
> **Module id:** `automation-engine` (xem [`capability-map.md`](capability-map.md))  
> **Kiến trúc nguồn:** [`docs/architecture/overview.md`](../architecture/overview.md), [`docs/routes/automation.md`](../routes/automation.md), [`ADR-004`](../decisions/0004-vxe-grid-form-and-i18n-terminology.md)  
> **Trạng thái:** **ĐÃ HOÀN THÀNH (ACCEPTED & IMPLEMENTED)**

---

## 1. Objective (Mục Tiêu & Phạm Vi)

Xây dựng phân hệ Quản trị Kịch bản Tự động hóa (**Automa Engine** — plugin `automa`) thuộc nhánh điều hướng `/automation/*`, kết nối **100% dữ liệu đo đếm thực tế** từ schema `automa` của Tuquet Cloud qua header `Accept-Profile: automa`:

1. **Quản Trị Quy Trình Tự Động Hóa (`/automation/workflows`):**
   - Hiển thị danh mục kịch bản từ `automa.workflows` (`id`, `tenant_id`, `name`, `description`, `version`, `status`, `created_at`, `updated_at`) qua bảng `useVbenVxeGrid`.
   - Hỗ trợ lọc theo trạng thái (`all`, `published`, `draft`, `archived`), lọc theo Workspace (`?tenant=`) và tìm kiếm từ khóa.
2. **Quản Trị Phiên Chạy Chiến Dịch (`/automation/runs`):**
   - Hiển thị lịch sử các đợt thực thi từ `automa.campaign_runs` liên kết `workflow:workflow_id(name)` và `runner:runner_id(name)` qua bảng `useVbenVxeGrid`.
   - Trực quan hóa tiến độ hoàn thành (`completed_tasks / total_tasks` kèm thanh phần trăm), lọc theo trạng thái (`running`, `completed`, `failed`, `cancelled`, `queued`, `pending`) và điều hướng sang trang chi tiết nhật ký.
3. **Chi Tiết Phiên Chạy & Nhật Ký Thời Gian Thực (`/automation/runs/:id`):**
   - Hiển thị thông số chi tiết của phiên chạy bằng `VxeForm` và bảng điều khiển nhật ký thực thi (`automa.execution_logs`) phân màu theo `level` (`info`, `warn`, `error`, `fatal`, `debug`, `trace`).
   - **Cơ chế Polling 3 giây:** Khi phiên chạy đang hoạt động (`pending`, `queued`, `running`), hệ thống tự động thăm dò cập nhật `campaign_runs` và `execution_logs` mỗi `3000ms` (`sinceId` tăng dần) và tự động hủy bộ đếm ngay khi phiên chạy kết thúc hoặc khi rời trang (`onUnmounted`).
   - Hỗ trợ nút hủy phiên chạy tức thì (`cancelCampaignRunApi`).

---

## 2. Tech Stack

- **Framework:** Vue 3.5 (`<script setup lang="ts">`), Vue Router 4, TypeScript 5, `vue-i18n`.
- **Data Grid & Form Engine:** `useVbenVxeGrid` (`VxeTable`) và `VxeForm` từ [`src/adapter/vxe-table.ts`](../../src/adapter/vxe-table.ts).
- **UI & Icons:** `@tuquet/vue-ui` (`Badge`, `Button`, `Card`, `Dialog`, `toast`), `@lucide/vue`.
- **Unified Data Access Layer:** [`src/api/core/automation.ts`](../../src/api/core/automation.ts) (phần 1 kết nối `schema: 'automa'`, dùng chung module với `schema: 'runners'`).

---

## 3. Commands (Lệnh Thực Thi & Kiểm Định)

```bash
# 1. Chạy unit tests cho API Automation (cả schema automa & runners) và Router
pnpm exec vitest run apps/web-admin/src/api/core/__tests__/automation.test.ts apps/web-admin/src/router

# 2. Kiểm tra kiểu dữ liệu TypeScript
pnpm --filter @tuquet/admin-web run typecheck

# 3. Kiểm tra linter và định dạng
npx oxlint apps/web-admin/src/
pnpm run lint

# 4. Đóng gói bản dựng production
pnpm run build:admin
```

---

## 4. Project Structure (Cấu Trúc Tệp Tác Động)

```text
apps/web-admin/src/
├── api/core/
│   ├── automation.ts                             # Tầng API hợp nhất (Phần 1: schema 'automa' | Phần 2: schema 'runners')
│   └── __tests__/
│       └── automation.test.ts                    # Unit tests kiểm định isRunActive, calculateProgressPercentage, queries
├── locales/langs/
│   ├── en-US/page.json                           # Từ điển page.automation.* (en-US)
│   └── vi-VN/page.json                           # Từ điển page.automation.* (vi-VN)
├── router/routes/modules/
│   └── automation.ts                             # Định tuyến /automation/{workflows,runs,runs/:id} (plugin: 'automa')
└── views/automation/
    ├── workflows/
    │   └── index.vue                             # Bảng quy trình tự động hóa (useVbenVxeGrid)
    └── runs/
        ├── index.vue                             # Bảng lịch sử phiên chạy (useVbenVxeGrid)
        └── detail.vue                            # Chi tiết phiên chạy (VxeForm) & Terminal Logs Console (Polling 3s)
```

---

## 5. Code Style & Kiến Trúc Chi Tiết

### 5.1. Mô Hình Dữ Liệu & Hợp Đồng API (`src/api/core/automation.ts`)

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
  runner?: null | { id?: string; name: string };
  runner_id: null | string;
  started_at: null | string;
  status: CampaignStatus;
  tenant_id: string;
  total_tasks: number;
  workflow?: null | { id?: string; name: string };
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

### 5.2. Cơ Chế Polling 3 Giây Có Điều Kiện

```ts
// Chỉ duy trì bộ đếm 3000ms khi phiên chạy còn ở trạng thái hoạt động
export function isRunActive(status: CampaignStatus): boolean {
  return status === 'pending' || status === 'queued' || status === 'running';
}
```

---

## 6. Testing Strategy (Chiến Lược Kiểm Thử)

1. **Unit Tests ([`automation.test.ts`](../../src/api/core/__tests__/automation.test.ts)):**
   - Kiểm tra `isRunActive` nhận diện đúng các trạng thái cần poll (`running`, `queued`, `pending`) và dừng poll ở trạng thái kết thúc (`completed`, `failed`, `cancelled`).
   - Kiểm tra `calculateProgressPercentage` tính chính xác tỷ lệ phần trăm và xử lý an toàn khi `total = 0`.
   - Kiểm tra `buildAutomationFilterQuery` và các hàm `getWorkflowsApi`, `getCampaignRunsApi`, `getExecutionLogsApi`, `cancelCampaignRunApi` gửi đúng header `{ schema: 'automa' }`.
2. **Typecheck & Lint Gate:** `pnpm --filter @tuquet/admin-web run typecheck` và `pnpm run lint` đạt `0 errors`.

---

## 7. Boundaries (Ranh Giới Kỹ Thuật)

- **Always:**
  - Truyền `{ schema: 'automa' }` cho mọi truy vấn tới `workflows`, `campaign_runs`, `execution_logs`.
  - Gắn `meta.plugin: 'automa'` trên 3 tuyến `/automation/workflows`, `/automation/runs`, `/automation/runs/:id`.
  - Hủy `clearInterval` của bộ đếm polling ngay trong `onUnmounted` hoặc khi `isRunActive(run.status)` trả về `false`.
- **Ask first:**
  - Thay đổi chu kỳ polling mặc định (`3000ms`) hoặc đưa bảng `automa.execution_logs` vào Supabase Realtime publication.
- **Never:**
  - Không duy trì polling ngầm khi người dùng đã chuyển sang trang khác.
  - Không dùng dữ liệu mẫu giả lập cho danh sách quy trình hoặc nhật ký thực thi.

---

## 8. Success Criteria (Tiêu Chí Nghiệm Thu)

- [x] **SC1:** `/automation/workflows` và `/automation/runs` hiển thị dữ liệu thực tế từ schema `automa` qua bảng `useVbenVxeGrid` kèm bộ lọc trạng thái và Workspace.
- [x] **SC2:** `/automation/runs/:id` hiển thị thông tin chi tiết phiên chạy (`VxeForm`) và bảng điều khiển nhật ký thực thi có tự động nạp dòng mới mỗi 3 giây (`sinceId`) khi đang chạy.
- [x] **SC3:** Thao tác hủy phiên chạy (`cancelCampaignRunApi`) cập nhật trạng thái về `'cancelled'` và ngắt vòng lặp polling.
- [x] **SC4:** Toàn bộ 23 bài kiểm thử đơn vị trong `automation.test.ts` pass 100% và `typecheck` đạt 0 lỗi.

---

## 9. Resolved Decisions (Các Quyết Định Đã Chốt)

1. **Polling 3 giây thay cho WebSocket Realtime trên `automa.execution_logs`:** Do bảng nhật ký thực thi sinh lượng bản ghi lớn trong các chiến dịch song song, cơ chế HTTP Polling 3 giây theo con trỏ `id.gt.<sinceId>` chỉ kích hoạt khi người vận hành mở trang chi tiết phiên chạy đang hoạt động, bảo vệ băng thông WAL của PostgreSQL.
2. **Kiến trúc 1 Tầng API Frontend (`automation.ts`) $\leftrightarrow$ 2 Schema DB (`automa` + `runners`):** Toàn bộ hàm truy vấn của nhánh `/automation/*` và khóa dịch `page.automation.*` được gom chung về một điểm tập trung ở frontend nhưng vẫn phân tách rõ `schema: 'automa'` và `schema: 'runners'` ở tầng PostgREST.
