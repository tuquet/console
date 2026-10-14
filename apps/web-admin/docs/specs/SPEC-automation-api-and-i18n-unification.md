# Spec: Hợp Nhất Tầng API & Đa Ngôn Ngữ Phân Hệ Tự Động Hóa (Module `automation-api-and-i18n-unification`)

> **Mã đặc tả:** `SPEC-automation-api-and-i18n-unification`  
> **Module id:** `automation-api-and-i18n-unification` (xem [`capability-map.md`](capability-map.md))  
> **Kiến trúc nguồn:** [`docs/architecture/overview.md`](../architecture/overview.md), [`ADR-004`](../decisions/0004-vxe-grid-form-and-i18n-terminology.md)  
> **Trạng thái:** **ĐÃ HOÀN THÀNH (ACCEPTED & IMPLEMENTED)**

---

## 1. Giả Định Ban Đầu (Assumptions)

1. **Giữ nguyên 2 Schema & Plugin độc lập ở tầng Database (`cloud/supabase/plugins/`):**
   - Schema `automa` (plugin `automa`: `workflows`, `campaign_runs`, `execution_logs`, `schedules`) và schema `runners` (plugin `runners`: `devices`, `browsers`, `proxies`, `node_browsers`) được giữ nguyên tách biệt ở tầng PostgreSQL / PostgREST.
   - Mô hình này song hành nhất quán với phân hệ `/system` (1 nhóm menu UI đại diện cho 2 plugin/schema DB là `core-iam`/`public` và `subscriptions`/`billing`), bảo toàn khả năng bật/tắt độc lập từng plugin và tương thích 100% với Rust CLI (`specter automa`, `specter runner`).
2. **Hợp nhất hoàn toàn tầng Frontend (`@tuquet/admin-web`) dưới tên miền `automation`:**
   - Sau khi đã hợp nhất Router (`src/router/routes/modules/automation.ts`), Views (`src/views/automation/*`), và Docs (`docs/routes/automation.md`), tầng API Core (`src/api/core/fleet.ts`) và khóa i18n điều hướng (`page.fleet.*`) cũng được hợp nhất vào `src/api/core/automation.ts` và `page.automation.*`.
3. **Không phá vỡ chữ ký hàm API (Zero Component Breakage):**
   - Các hàm và kiểu dữ liệu đang được export qua barrel [`src/api/core/index.ts`](../../src/api/core/index.ts) (`getFleetDevicesApi`, `getFleetBrowsersApi`, `getFleetProxiesApi`, `revokeFleetDeviceApi`, `probeLocalDaemonApi`, `calculateFleetMetrics`, `FleetDeviceItem`, `FleetBrowserItem`, `FleetProxyItem`, v.v.) giữ nguyên tên export khi chuyển vào `src/api/core/automation.ts` để không làm gãy bất kỳ component Vue nào đang import từ `#/api`.

---

## 2. Objective (Mục Tiêu & Phạm Vi)

Hoàn tất mảnh ghép cuối cùng của chiến dịch hợp nhất phân hệ `Fleet` vào `Automation` trên `@tuquet/admin-web` mà vẫn giữ nguyên kiến trúc Micro-Kernel 2 schema (`automa` + `runners`) dưới Supabase:

1. **Hợp nhất Tầng API Core (`src/api/core/fleet.ts` $\rightarrow$ `src/api/core/automation.ts`):**
   - Chuyển toàn bộ types, pure mappers/helpers (`mapRawDeviceToFleetNode`, `calculateFleetMetrics`, `buildFleetFilterQuery`), và các hàm truy vấn PostgREST `schema: 'runners'` + Loopback probe (`getFleetDevicesApi`, `revokeFleetDeviceApi`, `getFleetBrowsersApi`, `getFleetProxiesApi`, `probeLocalDaemonApi`) từ `src/api/core/fleet.ts` vào [`src/api/core/automation.ts`](../../src/api/core/automation.ts).
   - Xóa file `src/api/core/fleet.ts` và gỡ dòng `export * from './fleet';` trong [`src/api/core/index.ts`](../../src/api/core/index.ts).
2. **Hợp nhất Bộ Kiểm Thử Đơn Vị (`fleet.test.ts` $\rightarrow$ `automation.test.ts`):**
   - Gộp toàn bộ 10 bài test đơn vị trong `src/api/core/__tests__/fleet.test.ts` vào [`src/api/core/__tests__/automation.test.ts`](../../src/api/core/__tests__/automation.test.ts) (nâng tổng số bài test trong file này lên 23 tests, kiểm tra cả header `schema: 'automa'` lẫn `schema: 'runners'`).
   - Xóa file `src/api/core/__tests__/fleet.test.ts`.
3. **Hợp nhất Không Gian Khóa Đa Ngôn Ngữ (`page.fleet.*` $\rightarrow$ `page.automation.*`) & Dọn Khóa Dư Thừa:**
   - Trong [`src/locales/langs/en-US/page.json`](../../src/locales/langs/en-US/page.json) và [`src/locales/langs/vi-VN/page.json`](../../src/locales/langs/vi-VN/page.json):
     - Chuyển `devices`, `devices_desc`, `browsers`, `browsers_desc`, `proxies`, `proxies_desc` từ `page.fleet` vào `page.automation` và xóa bỏ block `page.fleet`.
     - Xóa 3 khóa redirect cũ không còn sử dụng trong `page.dashboard` (`workspace`, `workspaceDetail`, `fleet`).
   - Cập nhật [`src/router/routes/modules/automation.ts`](../../src/router/routes/modules/automation.ts) và 3 màn hình [`devices/index.vue`](../../src/views/automation/devices/index.vue), [`browsers/index.vue`](../../src/views/automation/browsers/index.vue), [`proxies/index.vue`](../../src/views/automation/proxies/index.vue) chuyển sang dùng `$t('page.automation.*')` (khắc phục lỗi trang `/automation/devices` đang hiển thị tiêu đề cũ là `"Fleet"` thay vì `"Thiết bị"` / `"Devices"`).
4. **Ghi Nhận Quyết Định Kiến Trúc Dual-Schema & Đồng Bộ Tài Liệu (`Docs & ADR-004`):**
   - Bổ sung mục giải thích rõ kiến trúc **"1 Menu/API Module (`automation`) $\leftrightarrow$ 2 Database Schemas (`automa` + `runners`)"** vào [`ADR-004`](../decisions/0004-vxe-grid-form-and-i18n-terminology.md).
   - Cập nhật các liên kết trong [`docs/routes/automation.md`](../routes/automation.md), [`docs/specs/SPEC-fleet-inventory.md`](SPEC-fleet-inventory.md), [`docs/specs/SPEC-route-consolidation-automation-fleet.md`](SPEC-route-consolidation-automation-fleet.md), và [`docs/specs/capability-map.md`](capability-map.md) trỏ về `src/api/core/automation.ts` và `automation.test.ts`.

---

## 3. Tech Stack

- **Frontend Application:** `@tuquet/admin-web` (Vue 3, TypeScript, Vue Router 4, `vue-i18n`).
- **Data Access Layer:** PostgREST Direct API qua [`supabaseRequest`](../../src/api/core/supabase-client.ts) (`Accept-Profile` / `Content-Profile`: `automa` và `runners`).
- **Testing & Quality Gate:** Vitest, `vue-tsc`, `oxlint`, `oxfmt`.

---

## 4. Commands (Lệnh Thực Thi & Kiểm Định)

```bash
# 1. Chạy unit tests cho Router và API Core
pnpm exec vitest run apps/web-admin/src/router apps/web-admin/src/api/core

# 2. Kiểm tra kiểu dữ liệu TypeScript
pnpm --filter @tuquet/admin-web run typecheck

# 3. Kiểm tra linter và định dạng mã nguồn
npx oxlint apps/web-admin/src/
npx oxfmt apps/web-admin/src/ apps/web-admin/docs/ tasks/

# 4. Build kiểm định đóng gói ứng dụng web-admin
pnpm --filter @tuquet/admin-web run build
```

---

## 5. Project Structure (Cấu Trúc Tệp Tác Động)

```text
apps/web-admin/
├── docs/
│   ├── decisions/
│   │   └── 0004-vxe-grid-form-and-i18n-terminology.md   # Bổ sung nguyên lý 1 UI/API Module <-> 2 DB Schemas (automa + runners)
│   ├── routes/
│   │   └── automation.md                                # Cập nhật link API về src/api/core/automation.ts & khóa page.automation.*
│   └── specs/
│       ├── capability-map.md                            # Bổ sung module automation-api-and-i18n-unification
│       ├── SPEC-automation-api-and-i18n-unification.md  # Bản đặc tả hiện tại
│       ├── SPEC-fleet-inventory.md                      # Cập nhật đường dẫn sang src/api/core/automation.ts & automation.test.ts
│       └── SPEC-route-consolidation-automation-fleet.md # Cập nhật khóa i18n page.automation.{devices,browsers,proxies}
└── src/
    ├── api/core/
    │   ├── __tests__/
    │   │   ├── automation.test.ts                       # Hợp nhất 23 unit tests (cả schema automa & schema runners)
    │   │   └── fleet.test.ts                            # XÓA: Đã gộp vào automation.test.ts
    │   ├── automation.ts                                # Hợp nhất toàn bộ hàm & types củaทั้ง automa và runners
    │   ├── fleet.ts                                     # XÓA: Đã gộp vào automation.ts
    │   └── index.ts                                     # Gỡ dòng export * from './fleet'
    ├── locales/langs/
    │   ├── en-US/page.json                              # Gộp page.fleet.* vào page.automation.*, xóa khóa thừa
    │   └── vi-VN/page.json                              # Gộp page.fleet.* vào page.automation.*, xóa khóa thừa
    ├── router/routes/modules/
    │   └── automation.ts                                # Đổi $t('page.fleet.*') -> $t('page.automation.*')
    └── views/automation/
        ├── browsers/index.vue                           # Đổi $t('page.fleet.browsers*') -> $t('page.automation.browsers*')
        ├── devices/index.vue                            # Đổi $t('page.fleet.title/desc') -> $t('page.automation.devices/devices_desc')
        └── proxies/index.vue                            # Đổi $t('page.fleet.proxies*') -> $t('page.automation.proxies*')
```

---

## 6. Code Style & Quy Chuẩn Kỹ Thuật

### 6.1. Cấu Trúc Dual-Schema Trong `src/api/core/automation.ts`

```typescript
// apps/web-admin/src/api/core/automation.ts
import { supabaseRequest } from './supabase-client';

// ============================================================================
// PART 1: WORKFLOW ORCHESTRATION & CAMPAIGN RUNS (PostgreSQL schema: 'automa')
// ============================================================================
export async function getWorkflowsApi(params?: {
  status?: string;
  tenantId?: string;
}): Promise<AutomaWorkflowItem[]> {
  const query = buildAutomationFilterQuery(
    '/rest/v1/workflows?select=id,tenant_id,name,description,version,status,created_at,updated_at&order=created_at.desc',
    params,
  );
  const data = await supabaseRequest<AutomaWorkflowItem[]>(query, {
    schema: 'automa',
  });
  return Array.isArray(data) ? data : [];
}

// ============================================================================
// PART 2: COMPUTE DEVICES, BROWSERS & PROXIES (PostgreSQL schema: 'runners')
// ============================================================================
export async function getFleetDevicesApi(params?: {
  status?: string;
  tenantId?: string;
}): Promise<FleetDeviceItem[]> {
  const query = buildFleetFilterQuery(
    '/rest/v1/devices?select=*&order=last_heartbeat_at.desc.nullslast',
    params,
  );
  const data = await supabaseRequest<any[]>(query, { schema: 'runners' });
  return Array.isArray(data)
    ? data.map((row) => mapRawDeviceToFleetNode(row))
    : [];
}
```

### 6.2. Cấu Trúc Từ Điển `page.automation` Hợp Nhất (`vi-VN/page.json` & `en-US/page.json`)

```json
  "automation": {
    "title": "Tự động hóa",
    "workflows": "Quy trình",
    "workflows_desc": "Quản lý quy trình và điều phối luồng tự động hóa",
    "runs": "Phiên chạy",
    "runs_desc": "Theo dõi tiến độ và nhật ký thực thi quy trình trên các runner node",
    "runDetail": "Chi tiết phiên chạy",
    "devices": "Thiết bị",
    "devices_desc": "Quản lý thiết bị runner, máy trạm và trạng thái kết nối daemon",
    "browsers": "Browser profiles",
    "browsers_desc": "Quản lý profile và vân tay trình duyệt anti-detect",
    "proxies": "Proxy pool",
    "proxies_desc": "Quản lý proxy xoay vòng và định tuyến mạng"
  }
```

---

## 7. Testing Strategy (Chiến Lược Kiểm Thử)

1. **Unit Tests (`Vitest`):**
   - Trong [`apps/web-admin/src/api/core/__tests__/automation.test.ts`](../../src/api/core/__tests__/automation.test.ts):
     - Kiểm thử đầy đủ các hàm thuộc schema `automa` (`isRunActive`, `calculateProgressPercentage`, `buildAutomationFilterQuery`, `getWorkflowsApi`, `getCampaignRunsApi`, `getCampaignRunDetailApi`, `getExecutionLogsApi`, `cancelCampaignRunApi`).
     - Kiểm thử đầy đủ các hàm thuộc schema `runners` (`mapRawDeviceToFleetNode`, `calculateFleetMetrics`, `buildFleetFilterQuery`, `getFleetDevicesApi`, `revokeFleetDeviceApi`, `getFleetBrowsersApi`, `getFleetProxiesApi`).
2. **Kiểm Tra Đồng Bộ i18n & Typecheck:**
   - Đảm bảo 100% khóa trong `en-US/page.json` và `vi-VN/page.json` đối xứng hoàn toàn.
   - Chạy `pnpm --filter @tuquet/admin-web run typecheck` và `pnpm --filter @tuquet/admin-web run build` đạt 0 lỗi.

---

## 8. Boundaries (Ranh Giới Thực Thi)

- **Always:**
  - Giữ nguyên `schema: 'automa'` cho các bảng `workflows`, `campaign_runs`, `execution_logs` và `schema: 'runners'` cho `devices`, `browsers`, `proxies`.
  - Giữ nguyên tên các hàm/types được export qua `#/api` để bảo toàn khả năng tương thích với toàn bộ các component hiện có.
- **Ask first:**
  - Mọi thay đổi tác động tới SQL trong `cloud/supabase/plugins/`.
- **Never:**
  - Không gộp hoặc đổi tên schema PostgreSQL (`automa`, `runners`) dưới tầng `cloud/supabase/`.
  - Không chạy `git push` khi chưa có yêu cầu.

---

## 9. Success Criteria (Tiêu Chí Nghiệm Thu)

- [x] **SC1:** Toàn bộ nội dung của `src/api/core/fleet.ts` được hợp nhất vào `src/api/core/automation.ts`; file `src/api/core/fleet.ts` bị xóa và `src/api/core/index.ts` không còn import `./fleet`.
- [x] **SC2:** Toàn bộ unit tests của `fleet.test.ts` được hợp nhất vào `src/api/core/__tests__/automation.test.ts` (23/23 tests pass) và file `fleet.test.ts` bị xóa.
- [x] **SC3:** Block `page.fleet` được gộp vào `page.automation` trong cả `en-US/page.json` và `vi-VN/page.json`; xóa 3 khóa thừa `dashboard.{workspace,workspaceDetail,fleet}`; cập nhật `automation.ts` và 3 màn hình `devices`, `browsers`, `proxies` sang `$t('page.automation.*')`.
- [x] **SC4:** `ADR-004`, `docs/routes/automation.md`, và các file `SPEC-*.md` liên quan phản ánh rõ kiến trúc 1 UI/API Module (`automation`) $\leftrightarrow$ 2 DB Schemas (`automa` + `runners`).
- [x] **SC5:** `vitest`, `typecheck`, `oxlint`, và `pnpm --filter @tuquet/admin-web run build` hoàn tất với 0 lỗi.

---

## 10. Open Questions

- Không còn câu hỏi mở (Bạn đã xác nhận chọn **Phương án 1** ở bước trước).
