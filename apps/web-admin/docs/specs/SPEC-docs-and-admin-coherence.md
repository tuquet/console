# Spec: Đồng Bộ Kiến Trúc Tài Liệu & Củng Cố Định Tuyến Web Admin (Module `docs-and-admin-coherence`)

> **Mã đặc tả:** `SPEC-docs-and-admin-coherence`  
> **Module id:** `docs-and-admin-coherence` (xem [`capability-map.md`](capability-map.md))  
> **Kiến trúc nguồn:** [`docs/architecture/overview.md`](../architecture/overview.md)  
> **Trạng thái:** **ĐÃ HOÀN THÀNH (ACCEPTED & IMPLEMENTED)** (Cập nhật ngày 2026-10-14)

---

## 1. Giả Định Ban Đầu (Assumptions)

1. **Vị trí SSOT của tài liệu Web Admin:** Thư mục `apps/web-admin/docs/` là nơi lưu trữ chính thức (SSOT) cho toàn bộ kiến trúc, quyết định (ADR), định tuyến và đặc tả (SPEC) của ứng dụng `@tuquet/admin-web` sau commit `7642a4c5`.
2. **Kiến trúc bảng & biểu mẫu hiện hành:** Toàn bộ màn hình danh sách và biểu mẫu của `web-admin` đã chuyển sang chuẩn `useVbenVxeGrid` (`VxeTable`) và `VxeForm` (thay thế hoàn toàn mô hình HTML `<table>` + Mobile Touch Card thủ công trước đây).
3. **Cấu trúc Sidebar 4 nhóm gốc & Pre-Release Clean Slate:** Phân hệ `Fleet` và `Automation` hợp nhất vào một nhóm menu cấp 1 duy nhất là `/automation` (`order: 20`), giảm tổng số menu cấp 1 trên Sidebar xuống 4 nhóm (`/dashboard`, `/tenants`, `/automation`, `/system`). Toàn bộ thư mục view của `devices`, `browsers`, `proxies` được dời sang `src/views/automation/` và xóa bỏ triệt để các tuyến redirect cũ (`fleet.ts`, aliases trong `dashboard.ts`).
4. **Ranh giới Plugin Gate độc lập trong `/automation`:** Dù gộp chung dưới menu `/automation`, các tuyến kịch bản (`workflows`, `runs`, `runs/:id`) vẫn thuộc phạm vi plugin `automa` và các tuyến hạ tầng (`devices`, `browsers`, `proxies`) vẫn thuộc phạm vi plugin `runners`.
5. **Quy chuẩn chống rò rỉ dữ liệu hạ tầng (`AGENTS.md`):** Mọi địa chỉ IP thực (như Tailscale IP) và đường dẫn tuyệt đối trên máy trạm/VPS phải được thay thế bằng loopback (`127.0.0.1`), RFC 5737 (`198.51.100.x`), hoặc đường dẫn tương đối.

---

## 2. Objective (Mục Tiêu & Phạm Vi)

Sau quá trình nâng cấp nhanh (hợp nhất route `/fleet` vào `/automation`, chuyển đổi toàn diện sang `VxeTable`/`VxeForm`, bổ sung từ điển chuẩn `term.json`, và dời `docs/` vào `apps/web-admin/docs/`), giữa tài liệu và mã nguồn phát sinh 4 nhóm lệch pha cần khắc phục triệt để:

1. **Củng Cố Định Tuyến, Dời Thư Mục View & Dọn Dẹp Mã Nguồn `web-admin` (`Admin Code Hardening`):**
   - **Dời thư mục View đồng bộ 100% với URL:** Chuyển `src/views/fleet/{devices,browsers,proxies}` sang `src/views/automation/{devices,browsers,proxies}` và cập nhật đường dẫn dynamic import trong [`src/router/routes/modules/automation.ts`](../../src/router/routes/modules/automation.ts).
   - **Xóa bỏ hoàn toàn các tuyến Redirect cũ (Pre-Release Clean Slate):** Xóa file `src/router/routes/modules/fleet.ts` và gỡ bỏ 3 alias redirect cũ (`workspace`, `workspace/:id`, `fleet`) khỏi [`src/router/routes/modules/dashboard.ts`](../../src/router/routes/modules/dashboard.ts).
   - **Khôi phục `meta.plugin` trong [`src/router/routes/modules/automation.ts`](../../src/router/routes/modules/automation.ts):** Gắn `plugin: 'automa'` cho `workflows`, `runs`, `runs/:id` và `plugin: 'runners'` cho `devices`, `browsers`, `proxies` để hàm `filterRoutesByPlugins()` hoạt động chính xác cho từng plugin con bên trong menu hợp nhất `/automation`.
   - **Bổ sung Unit Test cho `plugin-gate.test.ts`:** Kiểm thử kịch bản menu hợp nhất `/automation` khi chỉ cài đặt `automa`, chỉ cài đặt `runners`, hoặc tắt cả hai.
   - **Loại bỏ tệp locale mẫu dư thừa:** Xóa `src/locales/langs/en-US/demos.json` và `src/locales/langs/vi-VN/demos.json`.
2. **Sửa lỗi liên kết & Đồng bộ tài liệu theo mã nguồn thực tế (`Docs Truth Sync`):**
   - Khắc phục 100% liên kết tương đối bị gãy (chuyển về `../../src/...`) trong `docs/architecture/`, `docs/decisions/`, và `docs/routes/` do thay đổi độ sâu thư mục.
   - Hợp nhất nội dung đặc tả của `docs/routes/fleet.md` vào [`docs/routes/automation.md`](../routes/automation.md) và xóa file `docs/routes/fleet.md` (do nhánh route `/fleet` không còn tồn tại).
   - Cập nhật [`docs/architecture/overview.md`](../architecture/overview.md) và toàn bộ thư mục [`docs/routes/`](../routes/README.md) phản ánh đúng cây định tuyến 4 nhóm Sidebar (22 routes chuẩn, không còn legacy redirects), kiến trúc bảng `useVbenVxeGrid` + `VxeForm`, và hệ thống từ điển 3 tầng (`common.json`, `term.json`, `page.json`).
   - Đồng bộ trạng thái các bản đặc tả đã triển khai (`SPEC-automation-engine.md`, `SPEC-fleet-inventory.md`, `SPEC-system-catalog.md`, `SPEC-route-consolidation-automation-fleet.md`, `SPEC-i18n-en-vi.md`, `SPEC-layout-preferences-coherence.md`, `SPEC-concise-common-i18n.md`) sang **ACCEPTED & IMPLEMENTED** và cập nhật bảng tổng hợp tại [`docs/specs/capability-map.md`](capability-map.md).
3. **Tạo Cổng Tra Cứu `docs/README.md` & Bổ Sung `ADR-004` (`Documentation Index & ADR`):**
   - Tạo trang mục lục gốc [`docs/README.md`](../README.md) điều hướng trực quan giữa 4 trụ cột: `architecture/`, `decisions/`, `routes/`, `specs/`.
   - Ban hành [`docs/decisions/0004-vxe-grid-form-and-i18n-terminology.md`](../decisions/0004-vxe-grid-form-and-i18n-terminology.md) ghi nhận quyết định chuyển đổi sang `useVbenVxeGrid` + `VxeForm` (cập nhật D6 của `ADR-001`), cơ chế giữ vị trí cuộn nội trang (`Intra-Page Scroll Preservation`), hợp nhất menu `/automation`, và chuẩn hóa từ điển `term.json` + Sentence case.
4. **Làm Sạch Dữ Liệu Nhạy Cảm (`Data Sanitization`):**
   - Quét và thay thế toàn bộ địa chỉ IP Tailscale nội bộ trong `docs/specs/*.md` và `tasks/*.md` bằng `127.0.0.1` hoặc địa chỉ kiểm thử chuẩn RFC 5737 (`198.51.100.1`).
   - Thay thế các đường dẫn tuyệt đối hệ thống trong `tasks/plan.md` và `tasks/todo.md` bằng đường dẫn tương đối chuẩn.

---

## 3. Tech Stack

- **Application:** `@tuquet/admin-web` (Vue 3, Vue Router 4, TypeScript, Tailwind CSS v4).
- **Data Grid & Form Adapter:** `useVbenVxeGrid` (`VxeTable` + `VxeForm` qua `#/adapter/vxe-table`).
- **i18n Architecture:** `vue-i18n` (`@vben/locales` với `common.json` + `term.json`, và `apps/web-admin` với `page.json`).
- **Testing & Quality Gate:** Vitest, `vue-tsc`, `oxlint`, `oxfmt`, `eslint`, `stylelint`.

---

## 4. Commands (Lệnh Thực Thi & Kiểm Định)

```bash
# 1. Chạy unit tests cho Router và API Core
pnpm exec vitest run apps/web-admin/src/router apps/web-admin/src/api/core

# 2. Kiểm tra tính toàn vẹn khóa i18n
pnpm run check:i18n

# 3. Kiểm tra kiểu dữ liệu TypeScript trên toàn bộ workspace
pnpm --filter @tuquet/admin-web run typecheck

# 4. Kiểm tra linter và định dạng mã nguồn (bao gồm cả Markdown docs)
npx oxlint apps/web-admin/src/
pnpm run lint

# 5. Build kiểm định đóng gói ứng dụng web-admin
pnpm run build:admin
```

---

## 5. Project Structure (Cấu Trúc Tệp Tác Động)

```text
admin/
├── tasks/
│   ├── plan.md                                                       # Kế hoạch triển khai Phase 2 & làm sạch IP/path
│   └── todo.md                                                       # Danh sách tasks Phase 3 & làm sạch IP/path
└── apps/web-admin/
    ├── docs/
    │   ├── README.md                                                 # MỚI: Mục lục trung tâm của bộ tài liệu
    │   ├── architecture/
    │   │   ├── overview.md                                           # Cập nhật 4 nhóm Sidebar, VxeGrid/VxeForm, sửa link
    │   │   └── styling-guide.md                                      # Bổ sung quy chuẩn VxeTable/VxeForm tokens & Typography
    │   ├── decisions/
    │   │   ├── 0001-routing-architecture.md                          # Ghi chú D6 được cập nhật bởi ADR-004
    │   │   ├── 0003-platform-superadmin.md                           # Sửa link tương đối & cập nhật VxeGrid
    │   │   └── 0004-vxe-grid-form-and-i18n-terminology.md            # MỚI: ADR-004 về VxeGrid/Form, Route Merge & term.json
    │   ├── routes/
    │   │   ├── README.md                                             # Cập nhật sơ đồ & bảng routes theo cấu trúc hợp nhất
    │   │   ├── auth.md                                               # Sửa link tương đối ../../src/
    │   │   ├── automation.md                                         # Hợp nhất 6 tuyến con (workflows, runs, runs/:id, devices, browsers, proxies)
    │   │   ├── dashboard.md                                          # Sửa link & gỡ bỏ alias redirects cũ
    │   │   ├── fleet.md                                              # XÓA: Đã hợp nhất vào automation.md
    │   │   ├── system.md                                             # Sửa link tương đối, order: 30, VxeGrid
    │   │   └── tenants.md                                            # Sửa link tương đối, VxeGrid & VxeForm modals
    │   └── specs/
    │       ├── capability-map.md                                     # Cập nhật đủ danh mục modules & trạng thái hoàn thành
    │       ├── SPEC-docs-and-admin-coherence.md                      # Bản đặc tả hiện tại (APPROVED)
    │       └── SPEC-*.md                                             # Đồng bộ trạng thái ACCEPTED & làm sạch IP nội bộ
    └── src/
        ├── locales/langs/
        │   ├── en-US/demos.json                                      # XÓA: Tệp mẫu dư thừa không sử dụng
        │   └── vi-VN/demos.json                                      # XÓA: Tệp mẫu dư thừa không sử dụng
        ├── router/
        │   ├── __tests__/plugin-gate.test.ts                         # Bổ sung test lọc độc lập automa & runners trong /automation
        │   └── routes/modules/
        │       ├── automation.ts                                     # Khôi phục meta.plugin & trỏ về #/views/automation/*
        │       ├── dashboard.ts                                      # Xóa bỏ các alias redirects cũ
        │       └── fleet.ts                                          # XÓA: Không giữ legacy redirects
        └── views/
            └── automation/
                ├── browsers/index.vue                                # DỜI TỪ views/fleet/browsers/index.vue
                ├── devices/                                          # DỜI TỪ views/fleet/devices/
                │   ├── index.vue
                │   └── components/
                └── proxies/index.vue                                 # DỜI TỪ views/fleet/proxies/index.vue
```

---

## 6. Code Style & Quy Chuẩn Kỹ Thuật

### 6.1. Phân Tách `meta.plugin` & Đường Dẫn View Chuẩn Trong `automation.ts`

```typescript
// apps/web-admin/src/router/routes/modules/automation.ts
const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:workflow',
      order: 20,
      title: $t('page.automation.title'),
    },
    name: 'Automation',
    path: '/automation',
    redirect: '/automation/workflows',
    children: [
      {
        name: 'AutomationWorkflows',
        path: 'workflows',
        component: () => import('#/views/automation/workflows/index.vue'),
        meta: {
          authority: ['superadmin', 'automa:workflows:read'],
          icon: 'lucide:git-branch',
          plugin: 'automa',
          title: $t('page.automation.workflows'),
        },
      },
      // ... runs, runs/:id -> plugin: 'automa'
      {
        name: 'AutomationDevices',
        path: 'devices',
        component: () => import('#/views/automation/devices/index.vue'),
        meta: {
          authority: ['superadmin', 'runners:devices:read'],
          icon: 'lucide:laptop',
          plugin: 'runners',
          title: $t('page.fleet.devices'),
        },
      },
      // ... browsers, proxies -> component: '#/views/automation/...', plugin: 'runners'
    ],
  },
];
```

### 6.2. Quy Chuẩn Liên Kết Tương Đối Trong `apps/web-admin/docs/`

- Từ `apps/web-admin/docs/<folder>/<file>.md` trỏ tới mã nguồn `apps/web-admin/src/...`:
  - **ĐÚNG:** ``[`supabase-client.ts`](../../src/api/core/supabase-client.ts)``
  - **SAI:** Dạng thừa tiền tố `apps/web-admin/` sau `../../` (do thư mục `docs` đã nằm bên trong `apps/web-admin/`).

---

## 7. Testing Strategy (Chiến Lược Kiểm Thử)

1. **Unit Tests (`Vitest`):**
   - Mở rộng [`apps/web-admin/src/router/__tests__/plugin-gate.test.ts`](../../src/router/__tests__/plugin-gate.test.ts) để kiểm tra nhánh `/automation` hỗn hợp (`automa` + `runners`):
     - Khi chỉ có `['core-iam', 'automa']`: giữ lại `workflows`, `runs`, `runs/:id`; ẩn `devices`, `browsers`, `proxies`.
     - Khi chỉ có `['core-iam', 'runners']`: giữ lại `devices`, `browsers`, `proxies`; ẩn `workflows`, `runs`, `runs/:id`.
     - Khi chỉ có `['core-iam']`: toàn bộ nhánh `/automation` bị cắt tỉa (pruned) vì 0 children còn lại.
2. **Kiểm Tra Liên Kết & Chống Rò Rỉ (`Automated Audit`):**
   - Quét toàn bộ `apps/web-admin/docs/` đảm bảo 0 kết quả khớp với tiền tố đường dẫn cũ hoặc IP thực.
3. **Quality Gate 3 Bước:**
   - Chạy `typecheck`, `vitest`, `lint`, và `build:admin` đạt 0 lỗi.

---

## 8. Boundaries (Ranh Giới Thực Thi)

- **Always:**
  - Sử dụng đường dẫn tương đối chính xác từ vị trí thực tế của từng file `.md`.
  - Tuân thủ Sentence case tiếng Việt và không dùng dấu ngoặc đơn trên nhãn UI.
  - Chạy đầy đủ bộ kiểm thử Vitest và Typecheck trước khi hoàn tất.
- **Ask first:**
  - Thay đổi cấu trúc schema cơ sở dữ liệu hoặc các bảng PostgREST.
- **Never:**
  - Không đưa địa chỉ IP thực hoặc đường dẫn tuyệt đối của máy trạm/VPS vào tài liệu Markdown.
  - Không giữ lại các route redirect legacy không cần thiết (Pre-Release Clean Slate).
  - Không chạy `git push` khi chưa có yêu cầu.

---

## 9. Success Criteria (Tiêu Chí Nghiệm Thu)

- [x] **SC1:** Thư mục `src/views/fleet/{devices,browsers,proxies}` được chuyển sang `src/views/automation/{devices,browsers,proxies}`; xóa `src/router/routes/modules/fleet.ts` và các alias redirects cũ trong `dashboard.ts`.
- [x] **SC2:** `automation.ts` khôi phục đầy đủ `meta.plugin` (`automa` / `runners`) trên từng route con; unit tests trong `plugin-gate.test.ts` pass 100%; xóa 2 tệp dư thừa `locales/langs/*/demos.json`.
- [x] **SC3:** 0 liên kết gãy thừa tiền tố `apps/web-admin/src/` tồn tại trong `apps/web-admin/docs/`.
- [x] **SC4:** 0 địa chỉ IP Tailscale thực hoặc đường dẫn tuyệt đối hệ thống tồn tại trong `apps/web-admin/docs/` và `admin/tasks/`.
- [x] **SC5:** Tài liệu `overview.md`, `routes/README.md`, `routes/automation.md`, `routes/dashboard.md`, `routes/system.md`, `routes/tenants.md` phản ánh chính xác cấu trúc 4 nhóm menu Sidebar, `useVbenVxeGrid`/`VxeForm`, và `term.json` (xóa `routes/fleet.md`).
- [x] **SC6:** Có trang mục lục `apps/web-admin/docs/README.md` và quyết định kiến trúc `ADR-004` (`0004-vxe-grid-form-and-i18n-terminology.md`).
- [x] **SC7:** `capability-map.md` và tiêu đề trạng thái của toàn bộ các file `SPEC-*.md` đồng bộ chính xác với thực tế triển khai; `typecheck`, `lint`, `vitest`, và `build:admin` kết thúc với mã thoát 0.

---

## 10. Resolved Decisions (2026-10-14)

1. **Di chuyển thư mục View sang `src/views/automation/`:** Dời toàn bộ `src/views/fleet/{devices,browsers,proxies}` sang `src/views/automation/{devices,browsers,proxies}` để đồng bộ 100% giữa cấu trúc thư mục mã nguồn và cây URL `/automation/*`.
2. **Xóa bỏ triệt để Legacy Redirects (Pre-Release Clean Slate):** Không giữ lại `src/router/routes/modules/fleet.ts` cũng như các alias redirects cũ trong `dashboard.ts`; đồng thời hợp nhất `docs/routes/fleet.md` vào `docs/routes/automation.md` và xóa `docs/routes/fleet.md`.
