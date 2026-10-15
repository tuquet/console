# Danh Sách Nhiệm Vụ Triển Khai (Tasks / Todo)

## Lịch Sử Các Nhiệm Vụ Đã Hoàn Thành (Completed Tasks 1–15)

- [x] Task 1: Đồng bộ hạ tầng build cục bộ `build:local` và PWA auto-update
  - Acceptance: `scripts/build-local.sh` tồn tại với quyền thực thi, `package.json` có script `"build:local"`, và `apps/web-admin/vite.config.ts` có cấu hình PWA `autoUpdate`.
  - Verify: Chạy thử `bash ./scripts/build-local.sh` và kiểm tra `curl -s http://127.0.0.1/.build-meta.json`.
  - Files: `package.json`, `apps/web-admin/vite.config.ts`, `scripts/build-local.sh`.

- [x] Task 2: Chuẩn hóa ngôn ngữ tài liệu Pre-Release Clean Slate trong `apps/web-admin/docs/specs/`
  - Acceptance: Loại bỏ các từ ngữ so sánh "tương thích ngược" hoặc "chữ ký cũ" tại `SPEC-route-foundation.md` và `SPEC-data-access.md`.
  - Verify: `grep -rn "tương thích ngược" apps/web-admin/docs/` trả về rỗng.
  - Files: `apps/web-admin/docs/specs/SPEC-route-foundation.md`, `apps/web-admin/docs/specs/SPEC-data-access.md`.

- [x] Task 3: Nâng cấp cẩm nang kỹ thuật `specter-admin` (8 Trụ Cột)
  - Acceptance: Viết lại cẩm nang `specter-admin/SKILL.md` theo chuẩn Ponytail Standard với đầy đủ 8 trụ cột: Monorepo Topology, Routes, Supabase SSOT, Shadcn Slate Tokens, Preferences Engine Invariants, Quality Gate, Local Verification, Troubleshooting Recipes.
  - Verify: Kiểm tra file tồn tại, đúng định dạng YAML frontmatter và kiểm tra các liên kết.
  - Files: `skills/specter-admin/SKILL.md`.

- [x] Task 4: Kiểm tra và kiểm định chất lượng tổng thể (Quality Gate)
  - Acceptance: Toàn bộ 3 bước Pre-Push Gate và kiểm thử unit tests kết thúc với 0 lỗi.
  - Verify: `pnpm exec vitest run`, `pnpm run check:type`, `pnpm run lint`.
  - Files: Toàn bộ dự án.

- [x] Task 5: Sửa lỗi Preferences Reset trên Mobile (Bảo toàn `isMobile` & Clean Cache Purge)
  - Acceptance: Khi bấm Reset trên mobile:
    1. Runtime `isMobile` không bị ghi đè bởi `defaultPreferences.app.isMobile = false`.
    2. Drawer không bị unmount đột ngột qua `v-if="showPreferencesInDropdown"`.
    3. Desktop sidebar không bị kích hoạt hiển thị tràn màn hình mobile (`:dom-visible="!isMobile"`).
    4. `diffPreference` bỏ qua trạng thái viewport `isMobile`, loại bỏ chấm xanh false-diff trên nút Reset khi chưa có tùy biến cá nhân.
    5. Cache `preferences` và `preferences-custom` được dọn dẹp sạch sẽ theo nguyên tắc Pristine Cache Purge on Reset.
  - Verify: 36/36 tests `@core/preferences` passed, `check:type` 0 lỗi, `build-local.sh` thành công.
  - Files: `packages/@core/preferences/src/preferences.ts`, `packages/@core/preferences/src/use-preferences.ts`.

- [x] Task 6: Lưu giữ Quy chuẩn Bất biến qua `/learn` (Typography Enterprise & Viewport Isolation)
  - Acceptance:
    1. Bổ sung 2 bất biến bắt buộc vào `AGENTS.md`: _Runtime Viewport State Preservation on Reset_ và _Enterprise Typography & Sentence Case Invariant_.
    2. Nâng cấp cẩm nang kỹ thuật `skills/specter-admin/SKILL.md`: thêm Mục 4.4 (_Enterprise Typography Standards & 3 Allowed Uppercase Exceptions_) và cập nhật Mục 5 (_Preferences Engine 7 Invariants_).
  - Verify: Kiểm tra cấu trúc file và tính toàn vẹn của Markdown.
  - Files: `AGENTS.md`, `skills/specter-admin/SKILL.md`.

- [x] Task 7: Thực thi quy chuẩn UI Brevity & Anti-Verbosity Invariant
  - Acceptance:
    1. Bổ sung rule bất biến `UI Brevity & Anti-Verbosity Invariant` vào `AGENTS.md` và `skills/specter-admin/SKILL.md`.
    2. Sửa tiêu đề thẻ dài dòng thành `Phân bổ plugins` và `6 đang hoạt động` thông qua hệ thống i18n (`page.analytics.plugins_distribution` & `page.analytics.active`).
    3. Typecheck sạch 0 lỗi, local build thành công.
  - Verify: `turbo run typecheck` thành công, `oxfmt --check` đạt chuẩn, `build-local.sh` thành công.
  - Files: `AGENTS.md`, `skills/specter-admin/SKILL.md`, `apps/web-admin/src/views/dashboard/analytics/index.vue`, `apps/web-admin/src/locales/langs/vi-VN/page.json`, `apps/web-admin/src/locales/langs/en-US/page.json`.

- [x] Task 8: Chuẩn hóa thuật ngữ Cross-Platform & Tinh giản giao diện Fleet Metrics
  - Acceptance:
    1. Rà soát và loại bỏ hoàn toàn các thuật ngữ đặc thù Windows đơn nền tảng khỏi giao diện người dùng cuối.
    2. Thay thế bằng thuật ngữ đa nền tảng trung lập, trực quan: `Tác vụ đang chạy` / `Phiên tự động hóa nền tảng` (`Automated workflow sessions`).
    3. Di chuyển toàn bộ các chuỗi giao diện trong `fleet-metrics.vue` sang i18n chuẩn (`$t('page.fleet_view.*')`), tuân thủ triệt để Sentence case và UI Brevity.
  - Verify: `turbo run typecheck` 0 lỗi, `oxfmt --check` đạt chuẩn, `build-local.sh` thành công.
  - Files: `apps/web-admin/src/views/automation/devices/components/fleet-metrics.vue`, `apps/web-admin/src/locales/langs/vi-VN/page.json`, `apps/web-admin/src/locales/langs/en-US/page.json`.

- [x] Task 9: Tích hợp Vben VXE Table (`useVbenVxeGrid`) cho các danh sách dữ liệu hệ thống
  - Acceptance:
    1. Thay thế bảng HTML table thô bằng `useVbenVxeGrid` từ bộ core adapter `#/adapter/vxe-table`.
    2. Áp dụng cho 5 view danh sách cốt lõi: `system/users`, `system/plans`, `system/subscriptions`, `system/plugins`, `automation/workflows`.
  - Verify: `turbo run typecheck` 0 lỗi.
  - Files: `apps/web-admin/src/views/system/*/index.vue`, `apps/web-admin/src/views/automation/workflows/index.vue`.

- [x] Task 10: Xử lý triệt để hiệu ứng chuyển trang (Transition Effect) & Giữ nguyên vị trí cuộn (Scroll Preservation) khi thay đổi Query String
  - Acceptance:
    1. Chuẩn hóa `rawKey` trong `tabbar.ts`: mặc định dùng `path` cho router-view key, ngăn Virtual DOM unmount/remount khi thay đổi query params trên cùng một trang.
    2. Triệt tiêu hiệu ứng chuyển cảnh (`fade-slide`) trên cùng route path trong `useLayoutHook`.
    3. Giữ nguyên vị trí cuộn trên Mobile và Desktop khi chuyển tab query (`use-layout-scroll.ts` và Vue Router `scrollBehavior` không scroll về top 0 khi `to.path === from.path`).
    4. Cập nhật unit tests cho `tabbar.test.ts`, `use-layout.test.ts`, và `use-layout-scroll.test.ts` (100% passed).
  - Verify: 52 unit tests passed, `turbo run typecheck` 0 lỗi, `build-local.sh` triển khai thành công tại `http://127.0.0.1/`.

- [x] Task 11: Chuẩn hóa VxeTable toàn diện, loại bỏ CSS can thiệp thô bạo và tối ưu giao diện Mobile
  - Acceptance:
    1. Loại bỏ hoàn toàn các đoạn CSS hardcode thô bạo và khôi phục hệ thống đường kẻ phân tách dạng token tinh tế (`--vxe-ui-table-resizable-line-color: hsl(var(--border) / 50%)`, `--vxe-ui-table-border-color: hsl(var(--border) / 40%)`).
    2. Di chuyển toàn bộ các màn hình danh sách còn lại sang `useVbenVxeGrid`.
    3. Tích hợp bộ lọc tìm kiếm đầy đủ (`formOptions` với `Select` adapter, search keyword, layout vertical chuẩn).
    4. Tối ưu giao diện mobile tự nhiên: cuộn ngang linh hoạt (`overflow-x: auto`), phân trang căn giữa, tuân thủ nghiêm ngặt Enterprise Typography & Sentence case.
  - Verify: 52 unit tests passed, `turbo run typecheck` 0 lỗi trên toàn bộ monorepo, `build-local.sh` triển khai thành công tại `http://127.0.0.1/`.
  - Files: `packages/effects/plugins/src/vxe-table/style.css`, `apps/web-admin/src/views/**`.

- [x] Task 13: Tinh giản i18n & Tái sử dụng Common Actions (Nói ít hiểu nhiều)
  - Acceptance:
    1. Cài đặt công cụ CLI `vue-i18n-extract` và thiết lập lệnh `pnpm run check:i18n` vào root `package.json`.
    2. Mở rộng bộ từ vựng hành động dùng chung trong `packages/locales/src/langs/*/common.json`.
    3. Chuẩn hóa toàn bộ `vi-VN/common.json` về Sentence case.
    4. Tinh gọn nhãn nút trên trang Workspace thành `Tạo` / `Create`.
    5. Thay thế các chuỗi hardcode và nhãn nút lặp lại sang sử dụng `$t('common.*')`.
  - Verify: `pnpm run check:i18n` phát hiện chính xác, `pnpm run build:local` thành công.
  - Files: `package.json`, `packages/locales/src/langs/*/common.json`, `apps/web-admin/src/locales/langs/*/page.json`, `apps/web-admin/src/views/**`.

- [x] Task 14: Hợp nhất router tree phân hệ Fleet và Automation vào một menu
  - Acceptance:
    1. Chuyển toàn bộ 3 tuyến đường thiết bị runner, browser profiles và proxy pool vào module router `automation.ts`.
    2. Cấu trúc menu gốc Tự động hóa gồm 5 mục con theo thứ tự: Quy trình, Lịch sử chạy, Thiết bị, Browser profiles, Proxy pool.
    3. Cập nhật thứ tự hiển thị menu hệ thống thành 30.
    4. Đạt 100% kiểm thử 89 files và 667 unit tests pass, typecheck 0 lỗi.
  - Verify: 89 test files pass, `vue-tsc` 0 lỗi, `build-local.sh` thành công tại `http://127.0.0.1/`.
  - Files: `apps/web-admin/src/router/routes/modules/automation.ts`, `apps/web-admin/src/router/routes/modules/system.ts`.

- [x] Task 15: Chuẩn hóa toàn bộ các trang chi tiết và modal sang VXE UI Form
  - Acceptance:
    1. Đăng ký và tích hợp `VxeForm`, `VxeFormItem`, `VxeFormGroup`, `VxeFormGather` vào hệ thống core plugin và adapter `#/adapter/vxe-table`.
    2. Định kiểu CSS variables theme tối và sáng đồng nhất cùng thiết kế đáp ứng trên thiết bị di động trong `style.css`.
    3. Chuyển đổi toàn bộ các trang chi tiết và modal sang `VxeForm`.
    4. Đảm bảo toàn bộ nhãn và chuỗi giao diện tuân thủ Sentence case và không chứa dấu ngoặc đơn.
  - Verify: `pnpm --filter @tuquet/admin-web run typecheck` đạt 0 lỗi, `pnpm test:unit` pass 667/667.
  - Files: `packages/effects/plugins/src/vxe-table/*`, `apps/web-admin/src/adapter/vxe-table.ts`, `apps/web-admin/src/views/**`.

---

## Nhiệm Vụ Hiện Hành: Module `docs-and-admin-coherence` (`SPEC-docs-and-admin-coherence.md`)

## Task 16: Dời `src/views/fleet/*` sang `src/views/automation/*` và xóa bỏ các tuyến redirect cũ

**Description:** Di chuyển toàn bộ thư mục view của `devices`, `browsers`, `proxies` từ `apps/web-admin/src/views/fleet/` sang `apps/web-admin/src/views/automation/` để khớp 100% với cấu trúc đường dẫn `/automation/*`. Đồng thời xóa bỏ `src/router/routes/modules/fleet.ts` và 3 alias redirects cũ trong `src/router/routes/modules/dashboard.ts` theo nguyên tắc Pre-Release Clean Slate.

**Acceptance criteria:**

- [x] Thư mục `src/views/fleet/{devices,browsers,proxies}` được dời sang `src/views/automation/{devices,browsers,proxies}` và thư mục `src/views/fleet` không còn tồn tại.
- [x] `src/router/routes/modules/automation.ts` import các component từ `#/views/automation/{devices,browsers,proxies}/index.vue`.
- [x] File `src/router/routes/modules/fleet.ts` bị xóa hoàn toàn; `src/router/routes/modules/dashboard.ts` chỉ còn giữ route `/dashboard/analytics` (không còn `WorkspaceRedirect`, `WorkspaceDetailRedirect`, `FleetRedirect`).

**Verification:**

- [x] Tests pass: `pnpm exec vitest run apps/web-admin/src/router`
- [x] Build/Typecheck succeeds: `pnpm --filter @tuquet/admin-web run typecheck`
- [x] Manual check: Kiểm tra `Get-ChildItem apps/web-admin/src/views/automation` có đầy đủ 5 thư mục con (`browsers`, `devices`, `proxies`, `runs`, `workflows`).

**Dependencies:** None

**Files likely touched:**

- `apps/web-admin/src/views/automation/devices/**` (moved from `views/fleet/devices/**`)
- `apps/web-admin/src/views/automation/browsers/index.vue` (moved from `views/fleet/browsers/index.vue`)
- `apps/web-admin/src/views/automation/proxies/index.vue` (moved from `views/fleet/proxies/index.vue`)
- `apps/web-admin/src/router/routes/modules/automation.ts`
- `apps/web-admin/src/router/routes/modules/dashboard.ts`
- `apps/web-admin/src/router/routes/modules/fleet.ts` (deleted)

**Estimated scope:** Medium (3-5 logical units)

---

## Task 17: Khôi phục `meta.plugin` trong `automation.ts`, cập nhật `plugin-gate.test.ts` & xóa `demos.json`

**Description:** Bổ sung `plugin: 'automa'` cho các route `workflows`, `runs`, `runs/:id` và `plugin: 'runners'` cho `devices`, `browsers`, `proxies` trong `automation.ts` để `filterRoutesByPlugins()` lọc chính xác từng nhánh plugin độc lập. Mở rộng unit tests trong `plugin-gate.test.ts` và xóa 2 tệp locale mẫu dư thừa `demos.json`.

**Acceptance criteria:**

- [x] Trong `automation.ts`, 3 route `workflows`, `runs`, `runs/:id` có `meta.plugin: 'automa'` và 3 route `devices`, `browsers`, `proxies` có `meta.plugin: 'runners'`.
- [x] `src/router/__tests__/plugin-gate.test.ts` kiểm thử đầy đủ kịch bản menu hợp nhất `/automation`: chỉ cài `automa`, chỉ cài `runners`, cài cả hai, và không cài cả hai (tự động prune `/automation`).
- [x] Hai tệp `src/locales/langs/en-US/demos.json` và `src/locales/langs/vi-VN/demos.json` bị xóa hoàn toàn.

**Verification:**

- [x] Tests pass: `pnpm exec vitest run apps/web-admin/src/router/__tests__/plugin-gate.test.ts`
- [x] Build/Typecheck succeeds: `pnpm --filter @tuquet/admin-web run typecheck`
- [x] i18n check: `pnpm run check:i18n`

**Dependencies:** Task 16

**Files likely touched:**

- `apps/web-admin/src/router/routes/modules/automation.ts`
- `apps/web-admin/src/router/__tests__/plugin-gate.test.ts`
- `apps/web-admin/src/locales/langs/en-US/demos.json` (deleted)
- `apps/web-admin/src/locales/langs/vi-VN/demos.json` (deleted)

**Estimated scope:** Small (2-4 files)

---

## Checkpoint 1: After Tasks 16–17 (Code & Unit Tests Verification)

- [x] `pnpm exec vitest run apps/web-admin/src/router apps/web-admin/src/api/core` pass 100%
- [x] `pnpm --filter @tuquet/admin-web run typecheck` đạt 0 lỗi
- [x] Không còn tham chiếu `views/fleet` hoặc `demos.json` trong `apps/web-admin/src/`

---

## Task 18: Tạo mục lục `docs/README.md`, ban hành `ADR-004` & cập nhật `docs/architecture/` + `docs/decisions/`

**Description:** Tạo trang mục lục trung tâm `apps/web-admin/docs/README.md`, viết mới `docs/decisions/0004-vxe-grid-form-and-i18n-terminology.md` (ADR-004), đồng thời cập nhật `docs/architecture/overview.md`, `docs/architecture/styling-guide.md`, `docs/decisions/0001-routing-architecture.md`, và `docs/decisions/0003-platform-superadmin.md` để sửa link tương đối và phản ánh kiến trúc 4 nhóm Sidebar, `useVbenVxeGrid`/`VxeForm`, cùng từ điển `term.json`.

**Acceptance criteria:**

- [x] `apps/web-admin/docs/README.md` tồn tại và liên kết đầy đủ tới toàn bộ các file trong `architecture/`, `decisions/`, `routes/`, `specs/`.
- [x] `apps/web-admin/docs/decisions/0004-vxe-grid-form-and-i18n-terminology.md` ghi nhận rõ 4 quyết định: `useVbenVxeGrid` + `VxeForm`, `Intra-Page Scroll Preservation`, hợp nhất menu `/automation`, và từ điển `term.json` + Sentence case.
- [x] `overview.md`, `styling-guide.md`, `0001-routing-architecture.md`, `0003-platform-superadmin.md` sử dụng đường dẫn tương đối `../../src/...` chính xác và mô tả đúng cấu trúc 4 nhóm Sidebar + `VxeGrid`/`VxeForm`.

**Verification:**

- [x] Link audit: Không còn chuỗi liên kết thừa tiền tố `apps/web-admin/src/` trong `docs/architecture/` và `docs/decisions/`
- [x] Format check: `pnpm run lint`

**Dependencies:** Checkpoint 1

**Files likely touched:**

- `apps/web-admin/docs/README.md` (new)
- `apps/web-admin/docs/decisions/0004-vxe-grid-form-and-i18n-terminology.md` (new)
- `apps/web-admin/docs/architecture/overview.md`
- `apps/web-admin/docs/architecture/styling-guide.md`
- `apps/web-admin/docs/decisions/0001-routing-architecture.md`
- `apps/web-admin/docs/decisions/0003-platform-superadmin.md`

**Estimated scope:** Medium (5-6 files)

---

## Task 19: Đồng bộ thư mục `docs/routes/` (Hợp nhất `fleet.md` vào `automation.md`, xóa `fleet.md`, sửa link)

**Description:** Cập nhật toàn bộ tài liệu trong `apps/web-admin/docs/routes/` để khớp tuyệt đối với mã nguồn định tuyến hiện tại: hợp nhất nội dung của `fleet.md` vào `automation.md` (6 route con: `workflows`, `runs`, `runs/:id`, `devices`, `browsers`, `proxies`), xóa `fleet.md`, xóa các alias redirects cũ trong `dashboard.md`, sửa toàn bộ liên kết `../../src/...` và cập nhật mô tả bảng dữ liệu sang `useVbenVxeGrid` / `VxeForm`.

**Acceptance criteria:**

- [x] `docs/routes/fleet.md` được hợp nhất vào `docs/routes/automation.md` và file `docs/routes/fleet.md` bị xóa.
- [x] `docs/routes/README.md` hiển thị đúng 4 module định tuyến (`dashboard.ts`, `tenants.ts`, `automation.ts`, `system.ts`) + `core.ts` (22 routes chuẩn, không còn `/fleet/*` hay alias redirects cũ).
- [x] `auth.md`, `automation.md`, `dashboard.md`, `system.md`, `tenants.md` dùng đúng liên kết `../../src/...`, phản ánh `$t(...)` trong code snippet và kiến trúc `useVbenVxeGrid`/`VxeForm`.

**Verification:**

- [x] Link audit: Không còn liên kết thừa tiền tố `apps/web-admin/src/` hoặc liên kết tới `fleet.md` trong `docs/routes/`
- [x] Format check: `pnpm run lint`

**Dependencies:** Checkpoint 1

**Files likely touched:**

- `apps/web-admin/docs/routes/README.md`
- `apps/web-admin/docs/routes/automation.md`
- `apps/web-admin/docs/routes/fleet.md` (deleted)
- `apps/web-admin/docs/routes/dashboard.md`
- `apps/web-admin/docs/routes/system.md`
- `apps/web-admin/docs/routes/tenants.md`
- `apps/web-admin/docs/routes/auth.md`

**Estimated scope:** Medium (5-6 files)

---

## Task 20: Đồng bộ `docs/specs/` (Cập nhật `capability-map.md`, trạng thái SPEC & làm sạch IP nội bộ)

**Description:** Cập nhật `docs/specs/capability-map.md` liệt kê đầy đủ 13 modules của hệ thống, chuyển trạng thái các file `SPEC-*.md` đã triển khai sang `ACCEPTED & IMPLEMENTED`, và làm sạch toàn bộ địa chỉ IP Tailscale thực (chuyển về `127.0.0.1`) trong `docs/specs/*.md`.

**Acceptance criteria:**

- [x] `docs/specs/capability-map.md` liệt kê đầy đủ toàn bộ các module spec trong `docs/specs/` kèm trạng thái chính xác.
- [x] Toàn bộ các spec đã hoàn thành (`SPEC-automation-engine.md`, `SPEC-fleet-inventory.md`, `SPEC-system-catalog.md`, `SPEC-route-consolidation-automation-fleet.md`, `SPEC-docs-and-admin-coherence.md`) mang trạng thái `ACCEPTED & IMPLEMENTED`.
- [x] 0 kết quả khớp với IP Tailscale thực trong toàn bộ `apps/web-admin/docs/` và `admin/tasks/`.

**Verification:**

- [x] Regex scan: Quét `apps/web-admin/docs` và `tasks` cho liên kết gãy, IP Tailscale thực, và đường dẫn tuyệt đối hệ thống đều trả về 0 kết quả.
- [x] Full quality gate: `pnpm exec vitest run apps/web-admin/src/router apps/web-admin/src/api/core`, `pnpm --filter @tuquet/admin-web run typecheck`, `pnpm run lint`, `pnpm run build:admin`.

**Dependencies:** Task 18, Task 19

**Files likely touched:**

- `apps/web-admin/docs/specs/capability-map.md`
- `apps/web-admin/docs/specs/SPEC-automation-engine.md`
- `apps/web-admin/docs/specs/SPEC-fleet-inventory.md`
- `apps/web-admin/docs/specs/SPEC-system-catalog.md`
- `apps/web-admin/docs/specs/SPEC-route-consolidation-automation-fleet.md`
- `apps/web-admin/docs/specs/SPEC-platform-foundation.md`
- `apps/web-admin/docs/specs/SPEC-concise-common-i18n.md`
- `apps/web-admin/docs/specs/SPEC-i18n-en-vi.md`

**Estimated scope:** Medium (5-8 files)

---

## Checkpoint 2: Final Quality Gate & Complete Verification

- [x] All unit tests pass (`vitest run`)
- [x] Typecheck passes with 0 errors (`pnpm --filter @tuquet/admin-web run typecheck`)
- [x] Linter and formatter pass with 0 errors (`pnpm run lint`)
- [x] Production build succeeds (`pnpm run build:admin`)
- [x] Ready for human review

---

## Nhiệm Vụ Hiện Hành: Module `automation-api-and-i18n-unification` (`SPEC-automation-api-and-i18n-unification.md`)

## Task 21: Hợp nhất `src/api/core/fleet.ts` vào `src/api/core/automation.ts` & gộp Unit Tests

**Description:** Di chuyển toàn bộ kiểu dữ liệu (`FleetDeviceItem`, `FleetBrowserItem`, `FleetProxyItem`, `FleetMetricsData`, v.v.), các hàm thuần khiết (`mapRawDeviceToFleetNode`, `calculateFleetMetrics`, `buildFleetFilterQuery`), và các hàm truy vấn PostgREST `schema: 'runners'` + Loopback probe (`getFleetDevicesApi`, `revokeFleetDeviceApi`, `getFleetBrowsersApi`, `getFleetProxiesApi`, `probeLocalDaemonApi`) từ `src/api/core/fleet.ts` sang `src/api/core/automation.ts`. Đồng thời hợp nhất 10 unit tests từ `fleet.test.ts` vào `automation.test.ts`, xóa `fleet.ts` và `fleet.test.ts`, và gỡ dòng `export * from './fleet'` trong `src/api/core/index.ts`.

**Acceptance criteria:**

- [x] `src/api/core/automation.ts` chứa đầy đủ cả 2 nhóm hàm API (`schema: 'automa'` và `schema: 'runners'`), giữ nguyên chữ ký hàm và kiểu dữ liệu được export qua `#/api`.
- [x] `src/api/core/fleet.ts` và `src/api/core/__tests__/fleet.test.ts` được xóa hoàn toàn; `src/api/core/index.ts` không còn dòng `export * from './fleet'`.
- [x] `src/api/core/__tests__/automation.test.ts` kiểm thử toàn diện cả 23 kịch bản (13 kịch bản `automa` + 10 kịch bản `runners`).

**Verification:**

- [x] Tests pass: `pnpm exec vitest run apps/web-admin/src/api/core/__tests__/automation.test.ts`
- [x] Build/Typecheck succeeds: `pnpm --filter @tuquet/admin-web run typecheck`

**Dependencies:** None

**Files likely touched:**

- `apps/web-admin/src/api/core/automation.ts`
- `apps/web-admin/src/api/core/fleet.ts` (deleted)
- `apps/web-admin/src/api/core/index.ts`
- `apps/web-admin/src/api/core/__tests__/automation.test.ts`
- `apps/web-admin/src/api/core/__tests__/fleet.test.ts` (deleted)

**Estimated scope:** Small-Medium (5 files)

---

## Task 22: Hợp nhất khóa i18n `page.fleet.*` vào `page.automation.*` & cập nhật Router + Views

**Description:** Hợp nhất các khóa đa ngôn ngữ `devices`, `devices_desc`, `browsers`, `browsers_desc`, `proxies`, `proxies_desc` từ `page.fleet` vào `page.automation` trong cả `en-US/page.json` và `vi-VN/page.json`; xóa bỏ block `page.fleet` và 3 khóa thừa `dashboard.{workspace,workspaceDetail,fleet}`. Cập nhật `src/router/routes/modules/automation.ts` và 3 trang `devices/index.vue`, `browsers/index.vue`, `proxies/index.vue` sang dùng `$t('page.automation.*')`.

**Acceptance criteria:**

- [x] `en-US/page.json` và `vi-VN/page.json` có đầy đủ các khóa `devices`, `devices_desc`, `browsers`, `browsers_desc`, `proxies`, `proxies_desc` bên trong `page.automation`, không còn block `page.fleet` hay `dashboard.{workspace,workspaceDetail,fleet}`.
- [x] `src/router/routes/modules/automation.ts` sử dụng `$t('page.automation.devices')`, `$t('page.automation.browsers')`, `$t('page.automation.proxies')`.
- [x] `devices/index.vue` hiển thị tiêu đề `$t('page.automation.devices')` và mô tả `$t('page.automation.devices_desc')`; `browsers/index.vue` và `proxies/index.vue` sử dụng `$t('page.automation.browsers*')` và `$t('page.automation.proxies*')`.

**Verification:**

- [x] Search check: Không còn chuỗi `page.fleet.` trong `apps/web-admin/src/`
- [x] Typecheck succeeds: `pnpm --filter @tuquet/admin-web run typecheck`

**Dependencies:** None

**Files likely touched:**

- `apps/web-admin/src/locales/langs/en-US/page.json`
- `apps/web-admin/src/locales/langs/vi-VN/page.json`
- `apps/web-admin/src/router/routes/modules/automation.ts`
- `apps/web-admin/src/views/automation/devices/index.vue`
- `apps/web-admin/src/views/automation/browsers/index.vue`
- `apps/web-admin/src/views/automation/proxies/index.vue`

**Estimated scope:** Medium (6 files)

---

## Checkpoint 1: After Tasks 21–22 (Code, Unit Tests & Typecheck Verification)

- [x] `pnpm exec vitest run apps/web-admin/src/router apps/web-admin/src/api/core` pass 100% (7 test files, 72 tests)
- [x] `pnpm --filter @tuquet/admin-web run typecheck` đạt 0 lỗi
- [x] Không còn tham chiếu `api/core/fleet` hoặc `page.fleet.` trong `apps/web-admin/src/`

---

## Task 23: Ghi nhận kiến trúc Dual-Schema vào `ADR-004` & đồng bộ tài liệu `docs/`

**Description:** Cập nhật `docs/decisions/0004-vxe-grid-form-and-i18n-terminology.md` (`ADR-004`) giải thích rõ nguyên lý 1 Menu/API Module (`automation`) $\leftrightarrow$ 2 Database Schemas (`automa` + `runners`), đồng thời cập nhật `docs/routes/automation.md`, `SPEC-fleet-inventory.md`, `SPEC-route-consolidation-automation-fleet.md`, và `capability-map.md` để đồng bộ đường dẫn API (`src/api/core/automation.ts`) và khóa i18n (`page.automation.*`).

**Acceptance criteria:**

- [x] `ADR-004` có mục giải thích rõ kiến trúc Dual-Schema (`automa` + `runners`) dưới cùng một module frontend `automation`.
- [x] `docs/routes/automation.md`, `SPEC-fleet-inventory.md`, `SPEC-route-consolidation-automation-fleet.md` trỏ đúng về `src/api/core/automation.ts`, `automation.test.ts`, và `page.automation.*`.
- [x] `docs/specs/capability-map.md` liệt kê thêm module `automation-api-and-i18n-unification`.

**Verification:**

- [x] Full quality gate: `vitest`, `typecheck`, `oxlint`, `oxfmt`, và `pnpm --filter @tuquet/admin-web run build` đều đạt 0 lỗi.

**Dependencies:** Checkpoint 1

**Files likely touched:**

- `apps/web-admin/docs/decisions/0004-vxe-grid-form-and-i18n-terminology.md`
- `apps/web-admin/docs/routes/automation.md`
- `apps/web-admin/docs/specs/SPEC-fleet-inventory.md`
- `apps/web-admin/docs/specs/SPEC-route-consolidation-automation-fleet.md`
- `apps/web-admin/docs/specs/capability-map.md`

**Estimated scope:** Medium (5 files)

---

## Checkpoint 2: Final Quality Gate & Production Build

- [x] All unit tests pass (`vitest run`)
- [x] Typecheck passes with 0 errors (`pnpm --filter @tuquet/admin-web run typecheck`)
- [x] Linter and formatter pass with 0 errors (`oxlint` & `oxfmt`)
- [x] Production build succeeds (`pnpm --filter @tuquet/admin-web run build`)
- [x] Ready for human review

---

## Nhiệm Vụ Hiện Hành: Module `system-iam-vxe-grid` (`SPEC-system-iam-vxe-grid.md`)

## Task 24: Nâng cấp tầng API Core (`system.ts`) & Unit Tests (`system.test.ts`) cho Users/Roles/Permissions Filtering

**Description:** Mở rộng `PlatformUserItem` và `mapRawPlatformUser()` trong `apps/web-admin/src/api/core/system.ts` để hỗ trợ trích xuất danh sách `workspaces` và `primary_role` từ `tenant_members` (vẫn tương thích 100% với định dạng đếm `[{ count: N }]`). Bổ sung 3 hàm lọc thuần khiết `filterPlatformUsers`, `filterSystemRoles`, `filterSystemPermissions` phục vụ tìm kiếm đa trường và lọc chéo trong `useVbenVxeGrid`, kèm unit tests đầy đủ trong `apps/web-admin/src/api/core/__tests__/system.test.ts`.

**Acceptance criteria:**

- [x] `mapRawPlatformUser` xử lý chính xác cả dữ liệu `tenant_members: [{ count: N }]` lẫn danh sách chi tiết `tenant_members` chứa `tenants(id,name,slug)` và `member_roles(roles(id,name,display_name))`.
- [x] `filterPlatformUsers(users, filters)` lọc chính xác theo `tenant_filter` (`all`, `has_tenants`, `no_tenants`), `role_filter` (`owner`, `admin`, `member`, `viewer`), và từ khóa `search` (khớp không phân biệt hoa thường trên `full_name`, `email`, `id` UUID, hoặc tên/slug workspace).
- [x] `filterSystemRoles(roles, filters)` và `filterSystemPermissions(permissions, roles, filters)` lọc chính xác theo phân loại (`system`/`custom`), `module`, `role`, và từ khóa.
- [x] Toàn bộ unit tests cũ và mới trong `src/api/core/__tests__/system.test.ts` đều PASS 100%.

**Verification:**

- [x] Tests pass: `pnpm exec vitest run apps/web-admin/src/api/core/__tests__/system.test.ts`
- [x] Build/Typecheck succeeds: `pnpm --filter @tuquet/admin-web run typecheck`

**Dependencies:** None

**Files likely touched:**

- `apps/web-admin/src/api/core/system.ts`
- `apps/web-admin/src/api/core/__tests__/system.test.ts`

**Estimated scope:** Small (2 files)

---

## Task 25: Xây dựng lại `/system/users` chuẩn Enterprise User Directory với VXE Grid & User Inspector Dialog

**Description:** Nâng cấp `apps/web-admin/src/views/system/users/index.vue` theo chuẩn Enterprise User Directory: bổ sung thanh chỉ số tổng quan (`Stats Bar`: Tổng người dùng, Đã tham gia tổ chức, Chưa có tổ chức), tích hợp bộ lọc 3 chiều trong `formOptions` (`tenant_filter`, `role_filter`, `search` đa trường dùng `filterPlatformUsers`), cột hiển thị Workspace & `RoleBadge`, nút sao chép nhanh UUID 1 chạm, `#empty` state chuẩn mực, và hộp thoại **User Inspector Dialog** hiển thị hồ sơ đầy đủ + danh sách các Workspace mà người dùng tham gia (kèm nút điều hướng trực tiếp sang `/tenants/:id`).

**Acceptance criteria:**

- [x] Trang `/system/users` có `Stats Bar` hiển thị số liệu thực tế từ danh sách người dùng nền tảng.
- [x] Tìm kiếm bằng Họ tên, Email, Định danh UUID, hoặc Tên Workspace trong `useVbenVxeGrid` hoạt động chính xác 100%, kết hợp lọc theo trạng thái tổ chức và vai trò.
- [x] Cột `Định danh UUID` có nút sao chép nhanh kèm thông báo `toast.success`; cột `Thao tác` có nút `Chi tiết` mở hộp thoại `User Inspector Dialog` liệt kê các Workspace và vai trò của người dùng.

**Verification:**

- [x] Typecheck succeeds: `pnpm --filter @tuquet/admin-web run typecheck`
- [x] Linter check: `npx oxlint apps/web-admin/src/views/system/users/index.vue`
- [x] Manual check: Kiểm tra giao diện `/system/users` trên trình duyệt Desktop & Mobile.

**Dependencies:** Task 24

**Files likely touched:**

- `apps/web-admin/src/views/system/users/index.vue`

**Estimated scope:** Small-Medium (1-2 files)

---

## Task 26: Xây dựng lại `/system/roles` chuẩn Enterprise RBAC Console với 2 bảng VXE Grid & Role Policy Inspector

**Description:** Chuyển đổi hoàn toàn `apps/web-admin/src/views/system/roles/index.vue` từ Card Grid tĩnh sang kiến trúc 2 bảng `useVbenVxeGrid` (`RolesGrid` cho Vai trò hệ thống & `PermissionsGrid` cho Danh mục 36 quyền hạn), kèm `Stats Bar`, bộ lọc `formOptions` chuyên biệt cho từng tab, cột ánh xạ chéo hiển thị các `RoleBadge` sở hữu từng quyền hạn, nút sao chép nhanh mã quyền/vai trò, và hộp thoại **Role Policy Inspector Dialog** hiển thị toàn bộ quyền hạn của vai trò được gom nhóm theo Module.

**Acceptance criteria:**

- [x] Tab `Vai trò hệ thống` sử dụng `useVbenVxeGrid` với bộ lọc theo phân loại (`System Role`/`Custom`), theo `Module`, và tìm kiếm từ khóa; hiển thị `RoleBadge`, số lượng quyền + preview badges, và nút `Chi tiết` mở `Role Policy Inspector Dialog`.
- [x] Tab `Danh mục quyền hạn` sử dụng `useVbenVxeGrid` với bộ lọc theo `Module` (`core-iam`, `runners`, `automa`, `storage`, `subscriptions`, `webhooks`), theo `Vai trò sở hữu` (`owner`, `admin`, `member`, `viewer`), và tìm kiếm từ khóa (`id`, `description`); có cột hiển thị trực tiếp các `RoleBadge` sở hữu quyền đó.
- [x] Tuân thủ 100% quy chuẩn Lucide Icons, Shadcn Slate semantic tokens và Sentence case.

**Verification:**

- [x] Typecheck succeeds: `pnpm --filter @tuquet/admin-web run typecheck`
- [x] Linter check: `npx oxlint apps/web-admin/src/views/system/roles/index.vue`
- [x] Manual check: Kiểm tra cả 2 tab trên `/system/roles` ở chế độ Desktop & Mobile.

**Dependencies:** Task 24

**Files likely touched:**

- `apps/web-admin/src/views/system/roles/index.vue`

**Estimated scope:** Small-Medium (1-2 files)

---

## Checkpoint 1: After Tasks 24–26 (Code, Unit Tests & Typecheck Verification)

- [x] `pnpm exec vitest run apps/web-admin/src/api/core apps/web-admin/src/router` pass 100%
- [x] `pnpm --filter @tuquet/admin-web run typecheck` đạt 0 lỗi
- [x] `npx oxlint apps/web-admin/src/` đạt 0 warnings, 0 errors

---

## Task 27: Đồng bộ tài liệu `docs/routes/system.md`, `SPEC-system-iam-vxe-grid.md` & Nghiệm thu trực quan

**Description:** Cập nhật tài liệu đặc tả tuyến đường `apps/web-admin/docs/routes/system.md` và cập nhật trạng thái `SPEC-system-iam-vxe-grid.md` sang `ACCEPTED & IMPLEMENTED` cùng `capability-map.md`. Kiểm thử trực quan hai trang `http://localhost:5666/system/users` và `http://localhost:5666/system/roles` trên trình duyệt local (Desktop `1280x800` & Mobile `375x812`) và chạy toàn bộ cổng kiểm định chất lượng.

**Acceptance criteria:**

- [x] `docs/routes/system.md` mô tả chính xác kiến trúc `useVbenVxeGrid` cho cả `/system/users` và `/system/roles`.
- [x] `SPEC-system-iam-vxe-grid.md` và `capability-map.md` được cập nhật trạng thái hoàn thành.
- [x] Kiểm thử trình duyệt tại `http://localhost:5666/system/users` và `http://localhost:5666/system/roles` hiển thị chuẩn mực, không lỗi console.

**Verification:**

- [x] Full quality gate: `vitest`, `typecheck`, `oxlint`, `oxfmt`, và `pnpm --filter @tuquet/admin-web run build` đều đạt 0 lỗi.

**Dependencies:** Checkpoint 1

**Files likely touched:**

- `apps/web-admin/docs/routes/system.md`
- `apps/web-admin/docs/specs/SPEC-system-iam-vxe-grid.md`
- `apps/web-admin/docs/specs/capability-map.md`

**Estimated scope:** Small (3 files)

---

## Checkpoint 2: Final Quality Gate & Production Build

- [x] All unit tests pass (`vitest run`)
- [x] Typecheck passes with 0 errors (`pnpm --filter @tuquet/admin-web run typecheck`)
- [x] Linter and formatter pass with 0 errors (`oxlint` & `oxfmt`)
- [x] Production build succeeds (`pnpm --filter @tuquet/admin-web run build`)
- [x] Ready for human review

---

## Tasks 28–30: Interactive 3D Specter Ghost Banner (`specter-3d-ghost-banner`)

## Task 28: Xây dựng component `SpecterGhostBanner` (`specter-ghost-banner.vue`)

**Description:** Tạo component `apps/web-admin/src/components/common/specter-ghost-banner.vue` dựng mô hình 3D Specter Ghost bằng Three.js với vật liệu sứ mờ (Matte Ceramic), tà áo biến dạng sóng hài 3D theo thời gian thực, đôi mắt đen đính ngôi sao 4 cánh trắng liếc theo chuột, đôi má hồng dịu, miệng cười và cánh tay phải vẫy chào (tăng tốc độ vẫy + nảy người khi click/hover), kèm hiệu ứng `<Spotlight />` và cơ chế giải phóng tài nguyên GPU triệt để.

**Acceptance criteria:**

- [x] Component xuất các hàm toán học thuần khiết (`stepGhostPointer`, `computeSkirtWaveDisplacement`) để phục vụ kiểm thử đơn vị và dựng cảnh 3D 60fps.
- [x] Con ma 3D có đủ 3 đặc trưng của `specter-waving.svg`: mắt có ngôi sao 4 cánh lấp lánh liếc theo chuột, má hồng nhẹ/trung tính, tay phải vẫy chào tự nhiên và phản hồi khi click.
- [x] Tự động thích ứng ánh sáng và bóng đổ dưới chân theo Dark mode (`#0a0a0a`) và Light mode (`#fafafa`), giải phóng hoàn toàn WebGL context khi unmount.

**Verification:**

- [x] Typecheck succeeds: `pnpm --dir apps/web-admin run typecheck`

**Dependencies:** None

**Files likely touched:**

- `apps/web-admin/src/components/common/specter-ghost-banner.vue`

**Estimated scope:** Small (1 file)

---

## Task 29: Tích hợp chế độ `ghost 3d` vào bộ chuyển đổi trong `auth.vue`

**Description:** Cập nhật `apps/web-admin/src/layouts/auth.vue` để hỗ trợ 4 chế độ banner (`phone` · `robot 3d` · `ghost 3d` · `random`), lưu lựa chọn vào `localStorage` (`specter:auth-banner-mode`) và xoay vòng ngẫu nhiên giữa cả 3 cảnh khi chọn `random`.

**Acceptance criteria:**

- [x] Thanh chuyển đổi ở góc dưới bên trái hiển thị đủ 4 nút: `phone`, `robot 3d`, `ghost 3d`, `random`.
- [x] Chuyển đổi mượt mà giữa `HairlinePhoneBanner`, `SplineRobotBanner`, và `SpecterGhostBanner`.

**Verification:**

- [x] Typecheck succeeds: `pnpm --dir apps/web-admin run typecheck`

**Dependencies:** Task 28

**Files likely touched:**

- `apps/web-admin/src/layouts/auth.vue`

**Estimated scope:** XS (1 file)

---

## Task 30: Viết Unit Tests (`specter-ghost-banner.test.ts`) & Kiểm định Build

**Description:** Viết unit tests trong `apps/web-admin/src/components/common/__tests__/specter-ghost-banner.test.ts` kiểm tra các hàm toán học chuyển động (`stepGhostPointer`, `computeSkirtWaveDisplacement`), vòng đời mount/unmount của `SpecterGhostBanner`, và chạy kiểm tra `typecheck` + `build:admin`.

**Acceptance criteria:**

- [x] Unit tests trong `specter-ghost-banner.test.ts` pass 100%.
- [x] `pnpm --dir apps/web-admin run typecheck` và `pnpm run build:admin` đạt 0 lỗi.

**Verification:**

- [x] Tests pass: `pnpm exec vitest run apps/web-admin/src/components/common/__tests__/specter-ghost-banner.test.ts`
- [x] Build succeeds: `pnpm run build:admin`

**Dependencies:** Task 28, Task 29

**Files likely touched:**

- `apps/web-admin/src/components/common/__tests__/specter-ghost-banner.test.ts`
- `apps/web-admin/docs/specs/SPEC-specter-3d-ghost-banner.md`

**Estimated scope:** Small (2 files)

---

## Checkpoint: After Tasks 28–30

- [x] All unit tests pass (`vitest run`)
- [x] Typecheck passes with 0 errors (`pnpm --dir apps/web-admin run typecheck`)
- [x] Production build succeeds (`pnpm run build:admin`)

---

## Task 31: Chuẩn hóa 4 Spec nền tảng (`platform-foundation`, `layout-preferences-coherence`, `i18n-en-vi`, `specter-3d-ghost-banner`) & Gộp `SPEC-concise-common-i18n.md`

**Description:** Nâng cấp cấu trúc 4 bản Spec nền tảng theo khuôn mẫu 9 mục chuẩn SDD (`Objective`, `Tech Stack`, `Commands`, `Project Structure`, `Code Style`, `Testing Strategy`, `Boundaries`, `Success Criteria`, `Resolved Decisions`), hợp nhất toàn bộ quy chuẩn từ điển 3 tầng (`common.json`, `term.json`, `page.json`), Brevity và Sentence case từ `SPEC-concise-common-i18n.md` vào `SPEC-i18n-en-vi.md`, sau đó xóa `SPEC-concise-common-i18n.md`.

**Acceptance criteria:**

- [x] 4 file `SPEC-platform-foundation.md`, `SPEC-layout-preferences-coherence.md`, `SPEC-i18n-en-vi.md`, `SPEC-specter-3d-ghost-banner.md` có đầy đủ 9 mục chuẩn SDD và đóng toàn bộ `Open Questions` thành `Resolved Decisions`.
- [x] `SPEC-i18n-en-vi.md` bao hàm trọn vẹn kiến trúc 3 tầng từ điển (`common.json`, `term.json`, `page.json`), nguyên tắc Brevity và Sentence case tiếng Việt; file `SPEC-concise-common-i18n.md` được xóa bỏ.

**Verification:**

- [x] Audit script confirms all 4 specs have valid links and required SDD headings.

**Dependencies:** None

**Files likely touched:**

- `apps/web-admin/docs/specs/SPEC-platform-foundation.md`
- `apps/web-admin/docs/specs/SPEC-layout-preferences-coherence.md`
- `apps/web-admin/docs/specs/SPEC-i18n-en-vi.md`
- `apps/web-admin/docs/specs/SPEC-specter-3d-ghost-banner.md`
- `apps/web-admin/docs/specs/SPEC-concise-common-i18n.md` (delete)

**Estimated scope:** Medium (5 files)

---

## Task 32: Chuẩn hóa 3 Spec Core (`data-access`, `route-foundation`, `tenants-truth`) & Gộp 2 Spec Route/Coherence

**Description:** Cập nhật `SPEC-data-access.md` (đủ 7 schemas PostgREST gồm `commerce`, `skipAuth`), hợp nhất `SPEC-route-consolidation-automation-fleet.md` và `SPEC-docs-and-admin-coherence.md` vào `SPEC-route-foundation.md` theo nguyên tắc Pre-Release Clean Slate (27 routes trên 5 nhóm Sidebar + `core.ts`, `filterRoutesByPlugins()`, `Intra-Page Scroll Preservation`), nâng cấp `SPEC-tenants-truth.md` sang chuẩn `useVbenVxeGrid` / `VxeForm` và xóa 2 file spec trung gian.

**Acceptance criteria:**

- [x] `SPEC-data-access.md`, `SPEC-route-foundation.md`, `SPEC-tenants-truth.md` tuân thủ đầy đủ 9 mục chuẩn SDD.
- [x] `SPEC-route-foundation.md` phản ánh đúng 27 routes (5 nhóm Sidebar + `core.ts`), cơ chế `filterRoutesByPlugins()` và `Intra-Page Scroll Preservation`; xóa `SPEC-route-consolidation-automation-fleet.md` và `SPEC-docs-and-admin-coherence.md`.
- [x] `SPEC-tenants-truth.md` cập nhật sang kiến trúc bảng `useVbenVxeGrid` và biểu mẫu `VxeForm` theo `ADR-004`.

**Verification:**

- [x] Audit script confirms valid links and required SDD headings.

**Dependencies:** Task 31

**Files likely touched:**

- `apps/web-admin/docs/specs/SPEC-data-access.md`
- `apps/web-admin/docs/specs/SPEC-route-foundation.md`
- `apps/web-admin/docs/specs/SPEC-tenants-truth.md`
- `apps/web-admin/docs/specs/SPEC-route-consolidation-automation-fleet.md` (delete)
- `apps/web-admin/docs/specs/SPEC-docs-and-admin-coherence.md` (delete)

**Estimated scope:** Medium (5 files)

---

## Task 33: Chuẩn hóa 4 Spec Automation & System (`automation-engine`, `fleet-inventory`, `system-catalog`, `superadmin-routes`) & Gộp 2 Spec Trung gian

**Description:** Hợp nhất `SPEC-automation-api-and-i18n-unification.md` vào `SPEC-automation-engine.md` và `SPEC-fleet-inventory.md` (cập nhật đường dẫn `/automation/*`, `src/views/automation/*`, `src/api/core/automation.ts`, `page.automation.*`, và `useVbenVxeGrid`); nâng cấp `SPEC-system-catalog.md` (7 plugins hệ thống, `useVbenVxeGrid`); hợp nhất `SPEC-system-iam-vxe-grid.md` vào `SPEC-superadmin-routes.md` và xóa 2 file spec trung gian.

**Acceptance criteria:**

- [x] `SPEC-automation-engine.md`, `SPEC-fleet-inventory.md`, `SPEC-system-catalog.md`, `SPEC-superadmin-routes.md` có đủ 9 mục chuẩn SDD, sử dụng `useVbenVxeGrid` / `VxeForm` và không còn tham chiếu đường dẫn cũ (`views/fleet`, `api/core/fleet.ts`).
- [x] Xóa 2 file spec trung gian `SPEC-automation-api-and-i18n-unification.md` và `SPEC-system-iam-vxe-grid.md`.

**Verification:**

- [x] Audit script confirms 0 legacy path references and 100% required SDD headings across all 11 core/domain specs.

**Dependencies:** Task 32

**Files likely touched:**

- `apps/web-admin/docs/specs/SPEC-automation-engine.md`
- `apps/web-admin/docs/specs/SPEC-fleet-inventory.md`
- `apps/web-admin/docs/specs/SPEC-system-catalog.md`
- `apps/web-admin/docs/specs/SPEC-superadmin-routes.md`
- `apps/web-admin/docs/specs/SPEC-automation-api-and-i18n-unification.md` (delete)
- `apps/web-admin/docs/specs/SPEC-system-iam-vxe-grid.md` (delete)

**Estimated scope:** Medium (6 files)

---

## Checkpoint 1: After Tasks 31–33

- [x] 11 Core & Domain Specs pass structure, link, and Clean Slate verification.

---

## Task 34: Chuẩn hóa 4 Spec Thương mại Số & Cổng Thanh toán (`payment-gateway`, `digital-commerce`, `admin-commerce-portal`, `public-storefront`) & Cập nhật `capability-map.md`

**Description:** Việt hóa `SPEC-payment-gateway.md` và chuẩn hóa lệnh kiểm định; bổ sung đầy đủ 9 mục chuẩn SDD cho `SPEC-digital-commerce.md`, `SPEC-admin-commerce-portal.md`, `SPEC-public-storefront.md`; sửa liên kết gãy `TYPOGRAPHY.md`; cập nhật `capability-map.md` phản ánh đúng 15/15 Canonical Modules và dọn dẹp file spec tạm `SPEC-canonical-specs-consolidation.md`.

**Acceptance criteria:**

- [x] Toàn bộ 4 file Spec Thương mại số (`SPEC-payment-gateway.md`, `SPEC-digital-commerce.md`, `SPEC-admin-commerce-portal.md`, `SPEC-public-storefront.md`) viết bằng tiếng Việt chuẩn mực, đủ 9 mục SDD, và có `0 broken links`.
- [x] `capability-map.md` liệt kê chính xác 15/15 Canonical Modules và thứ tự phụ thuộc chuẩn.

**Verification:**

- [x] Audit script confirms 15/15 specs in `docs/specs/` have 0 broken links and 100% required SDD headings.

**Dependencies:** Task 33

**Files likely touched:**

- `apps/web-admin/docs/specs/SPEC-payment-gateway.md`
- `apps/web-admin/docs/specs/SPEC-digital-commerce.md`
- `apps/web-admin/docs/specs/SPEC-admin-commerce-portal.md`
- `apps/web-admin/docs/specs/SPEC-public-storefront.md`
- `apps/web-admin/docs/specs/capability-map.md`
- `apps/web-admin/docs/specs/SPEC-canonical-specs-consolidation.md` (delete)

**Estimated scope:** Medium (6 files)

---

## Task 35: Tạo mới `docs/routes/commerce.md` & Đồng bộ `docs/README.md`, `overview.md`, `routes/README.md`, `routes/auth.md`, `AGENTS.md`

**Description:** Tạo tệp `apps/web-admin/docs/routes/commerce.md` đặc tả chi tiết phân hệ `/commerce` (`/commerce/store`, `/commerce/orders`, `/commerce/wallet`, `/commerce/admin`) và `/store`; cập nhật `docs/routes/README.md`, `docs/routes/auth.md`, `docs/architecture/overview.md`, `docs/README.md`, và `AGENTS.md` phản ánh đồng bộ 27 routes (5 nhóm Sidebar + `core.ts`), 7 schemas PostgREST và 15 Canonical Specs.

**Acceptance criteria:**

- [x] `docs/routes/commerce.md` mô tả đầy đủ định nghĩa route, quyền hạn, plugin boundary (`commerce` & `subscriptions`) và luồng dữ liệu của 4 tuyến `/commerce/*` cùng `/store`.
- [x] `docs/README.md`, `docs/architecture/overview.md`, `docs/routes/README.md`, `docs/routes/auth.md`, và `AGENTS.md` đồng bộ 100% với 27 tuyến đường, 5 nhóm Sidebar, 7 schemas và 15 Canonical Specs.

**Verification:**

- [x] Link & Structure audit script passes with `0 errors`.
- [x] `pnpm run lint` passes with `0 errors`.

**Dependencies:** Task 34

**Files likely touched:**

- `apps/web-admin/docs/routes/commerce.md`
- `apps/web-admin/docs/routes/README.md`
- `apps/web-admin/docs/routes/auth.md`
- `apps/web-admin/docs/architecture/overview.md`
- `apps/web-admin/docs/README.md`
- `AGENTS.md`

**Estimated scope:** Medium (6 files)

---

## Checkpoint 2: After Tasks 34–35

- [x] All 25 markdown files in `apps/web-admin/docs/` pass link & SDD structure verification (`0 broken links`)
- [x] `pnpm run lint` and `pnpm --filter @tuquet/admin-web run typecheck` pass with `0 errors`

---

## Task 36: Mở rộng từ điển nền tảng (`common.json`, `term.json`) & Tích hợp Reactive `VxeTable` / `VbenForm` i18n

**Description:** Bổ sung các khóa trạng thái phổ biến (`all`, `active`, `inactive`, `online`, `offline`, `pending`, `completed`, `failed`, `suspended`), tiêu đề cột chung (`name`, `description`, `createdAt`, `updatedAt`, `email`, `type`, `version`, `price`, `amount`, `id`) vào `packages/locales/src/langs/{en-US,vi-VN}/common.json` và các thuật ngữ thương mại/hệ thống (`order`, `orders`, `wallet`, `product`, `products`, `transaction`, `transactions`, `category`, `stock`) vào `term.json`. Tích hợp `VxeUI.setConfig({ translate })` tại `apps/web-admin/src/adapter/vxe-table.ts` và theo dõi `locale` trong `packages/effects/plugins/src/vxe-table/use-vxe-grid.vue` để cột bảng đổi ngôn ngữ tức thì.

**Acceptance criteria:**

- [x] `common.json` và `term.json` đối xứng 100% giữa `en-US` và `vi-VN`, tuân thủ chuẩn `Sentence case`.
- [x] `VxeUI.setConfig({ translate })` tự động dịch các khóa i18n trong `columns[].title` và cập nhật tức thì khi đổi ngôn ngữ.

**Verification:**

- [x] `pnpm run check:i18n` passes with 0 missing keys.
- [x] `pnpm --filter @tuquet/admin-web run typecheck` passes with `0 errors`.

**Dependencies:** None

**Files likely touched:**

- `packages/locales/src/langs/en-US/common.json`
- `packages/locales/src/langs/vi-VN/common.json`
- `packages/locales/src/langs/en-US/term.json`
- `packages/locales/src/langs/vi-VN/term.json`
- `apps/web-admin/src/adapter/vxe-table.ts`
- `packages/effects/plugins/src/vxe-table/use-vxe-grid.vue`

**Estimated scope:** Medium (6 files)

---

## Task 37: Quốc tế hóa 100% Cụm Core, Auth, Profile, Shared Components & Biểu Đồ Analytics

**Description:** Chuyển đổi toàn bộ văn bản tĩnh còn lại trong cụm xác thực (`login.vue`, `forget-password.vue`, `reset-password.vue`, `callback.vue`, `desktop-bridge.vue`), trang hồ sơ cá nhân (`profile/index.vue`), các thành phần dùng chung (`cli-snippet-card.vue`, `danger-zone-card.vue`, `role-badge.vue`, `use-clipboard.ts`), thông điệp hệ thống (`access.ts`, `supabase-client.ts`, `system.ts`, `workspace-detail.ts`, `auth.vue`, `main.ts`, `core.ts`, `store/auth.ts`) và 3 biểu đồ Analytics (`growth-chart.vue`, `plans-chart.vue`, `plugins-chart.vue`) sang dùng `$t(...)`.

**Acceptance criteria:**

- [x] `0` dòng tiếng Việt hardcode trong `api/core`, `components`, `composables`, `layouts`, `router`, `store`, `views/_core`, và `views/dashboard`.
- [x] 3 biểu đồ Analytics (`growth-chart`, `plans-chart`, `plugins-chart`) và `role-badge.vue` hiển thị nhãn đa ngôn ngữ theo `$t(...)`.

**Verification:**

- [x] Static hardcode scanner confirms `0` hardcoded Vietnamese lines in the target directories.
- [x] `pnpm --filter @tuquet/admin-web run typecheck` passes with `0 errors`.

**Dependencies:** Task 36

**Files likely touched:**

- `packages/locales/src/langs/{en-US,vi-VN}/authentication.json`
- `packages/locales/src/langs/{en-US,vi-VN}/profile.json`
- `apps/web-admin/src/locales/langs/{en-US,vi-VN}/page.json`
- `apps/web-admin/src/views/_core/**`
- `apps/web-admin/src/views/dashboard/analytics/{growth-chart,plans-chart,plugins-chart}.vue`
- `apps/web-admin/src/components/**`

**Estimated scope:** Medium (grouped Core & Analytics slice)

---

## Checkpoint 1: After Tasks 36–37

- [x] `0` hardcoded strings in Core, Auth, Profile, Components, API, and Dashboard Analytics.
- [x] `pnpm run check:i18n` and `typecheck` pass with `0 errors`.

---

## Task 38: Quốc tế hóa 100% Phân hệ Workspace (`/tenants`, `/tenants/:id`, 5 Detail Tabs & 5 Modals)

**Description:** Quốc tế hóa toàn bộ cột bảng `VxeGrid`, bộ lọc `VbenForm`, huy hiệu trạng thái, thông báo `toast`, 5 tab chi tiết (`workspace-hero.vue`, `workspace-overview-tab.vue`, `workspace-members-tab.vue`, `workspace-usage-tab.vue`, `workspace-audit-tab.vue`) và 5 hộp thoại Modal (`create-workspace-modal.vue`, `edit-workspace-modal.vue`, `delete-workspace-modal.vue`, `invite-member-modal.vue`, `edit-member-modal.vue`) trong `apps/web-admin/src/views/tenants/`.

**Acceptance criteria:**

- [x] `0` dòng tiếng Việt hardcode trong toàn bộ thư mục `apps/web-admin/src/views/tenants/`.
- [x] Cột bảng và bộ lọc trên `/tenants` và các tab `/tenants/:id` tự động đổi ngôn ngữ tức thì khi chuyển `en-US` $\leftrightarrow$ `vi-VN`.

**Verification:**

- [x] Static hardcode scanner confirms `0` hardcoded Vietnamese lines in `apps/web-admin/src/views/tenants/`.
- [x] `pnpm --filter @tuquet/admin-web run typecheck` passes with `0 errors`.

**Dependencies:** Task 36

**Files likely touched:**

- `apps/web-admin/src/views/tenants/index.vue`
- `apps/web-admin/src/views/tenants/detail.vue`
- `apps/web-admin/src/views/tenants/components/*.vue`
- `apps/web-admin/src/views/tenants/components/modals/*.vue`
- `apps/web-admin/src/locales/langs/{en-US,vi-VN}/page.json`

**Estimated scope:** Medium (Workspace vertical slice)

---

## Task 39: Quốc tế hóa 100% Phân hệ Automation & Fleet Inventory (`runs/detail`, `devices`, `browsers`, `proxies` & Modals)

**Description:** Quốc tế hóa toàn bộ cột bảng `VxeGrid`, bộ lọc `VbenForm`, trạng thái rỗng, hộp thoại chi tiết nút mạng (`node-detail-modal.vue`), hộp thoại kết nối runner (`connect-fleet-modal.vue`), và trang chi tiết phiên chạy (`runs/detail.vue`) trong `apps/web-admin/src/views/automation/`.

**Acceptance criteria:**

- [x] `0` dòng tiếng Việt hardcode trong toàn bộ thư mục `apps/web-admin/src/views/automation/`.
- [x] Toàn bộ bảng `devices`, `browsers`, `proxies` và chi tiết `runs/:id` hiển thị đúng ngôn ngữ `en-US` / `vi-VN`.

**Verification:**

- [x] Static hardcode scanner confirms `0` hardcoded Vietnamese lines in `apps/web-admin/src/views/automation/`.
- [x] `pnpm --filter @tuquet/admin-web run typecheck` passes with `0 errors`.

**Dependencies:** Task 36

**Files likely touched:**

- `apps/web-admin/src/views/automation/runs/detail.vue`
- `apps/web-admin/src/views/automation/devices/index.vue`
- `apps/web-admin/src/views/automation/devices/components/modals/{connect-fleet-modal,node-detail-modal}.vue`
- `apps/web-admin/src/views/automation/browsers/index.vue`
- `apps/web-admin/src/views/automation/proxies/index.vue`
- `apps/web-admin/src/locales/langs/{en-US,vi-VN}/page.json`

**Estimated scope:** Medium (6 view/modal files + locales)

---

## Checkpoint 2: After Tasks 38–39

- [x] `0` hardcoded Vietnamese strings across `views/tenants/**` and `views/automation/**`.
- [x] `pnpm run check:i18n` passes with 100% key parity.

---

## Task 40: Quốc tế hóa 100% Phân hệ System & Superadmin Governance (`plugins`, `plans`, `subscriptions`, `users`, `roles`, `audit-logs`)

**Description:** Quốc tế hóa toàn bộ cột bảng `VxeGrid`, bộ lọc `VbenForm`, hộp thoại Modal tạo/sửa gói cước, vai trò, phân quyền RBAC, trạng thái người dùng và nhật ký kiểm toán trong 6 màn hình dưới `apps/web-admin/src/views/system/`.

**Acceptance criteria:**

- [x] `0` dòng tiếng Việt hardcode trong toàn bộ thư mục `apps/web-admin/src/views/system/`.
- [x] Các nhãn thuộc tính, quyền hạn, vai trò và gói cước tái sử dụng chuẩn xác `$t('term.*')` và `$t('common.*')`.

**Verification:**

- [x] Static hardcode scanner confirms `0` hardcoded Vietnamese lines in `apps/web-admin/src/views/system/`.
- [x] `pnpm --filter @tuquet/admin-web run typecheck` passes with `0 errors`.

**Dependencies:** Task 36

**Files likely touched:**

- `apps/web-admin/src/views/system/plugins/index.vue`
- `apps/web-admin/src/views/system/plans/index.vue`
- `apps/web-admin/src/views/system/subscriptions/index.vue`
- `apps/web-admin/src/views/system/users/index.vue`
- `apps/web-admin/src/views/system/roles/index.vue`
- `apps/web-admin/src/views/system/audit-logs/index.vue`
- `apps/web-admin/src/locales/langs/{en-US,vi-VN}/page.json`

**Estimated scope:** Medium (6 view files + locales)

---

## Task 41: Quốc tế hóa 100% Phân hệ Digital Commerce, Ví Xu & Public Storefront (`store`, `orders`, `wallet`, `admin`, `public-store`)

**Description:** Quốc tế hóa toàn bộ 5 màn hình thương mại số trong `apps/web-admin/src/views/commerce/` (`store/index.vue`, `orders/index.vue`, `wallet/index.vue`, `admin/index.vue`, `public-store/index.vue`), bao gồm danh mục sản phẩm, giỏ mua hàng, cổng thanh toán VietQR/MoMo/Stripe/Crypto/Ví Xu, sổ cái giao dịch, quản trị kho serial và trang nhận bàn giao công khai `/store`.

**Acceptance criteria:**

- [x] `0` dòng tiếng Việt hardcode trong toàn bộ thư mục `apps/web-admin/src/views/commerce/`.
- [x] Cả cổng nội bộ `/commerce/*` và cửa hàng công khai `/store` hoạt động mượt mà trên cả `en-US` và `vi-VN`.

**Verification:**

- [x] Static hardcode scanner confirms `0` hardcoded Vietnamese lines across the entire `apps/web-admin/src/` directory.
- [x] `pnpm run check:i18n`, `pnpm run check:type`, `pnpm run lint`, and `pnpm run build:local` pass with `0 errors`.

**Dependencies:** Task 36

**Files likely touched:**

- `apps/web-admin/src/views/commerce/store/index.vue`
- `apps/web-admin/src/views/commerce/orders/index.vue`
- `apps/web-admin/src/views/commerce/wallet/index.vue`
- `apps/web-admin/src/views/commerce/admin/index.vue`
- `apps/web-admin/src/views/commerce/public-store/index.vue`
- `apps/web-admin/src/locales/langs/{en-US,vi-VN}/page.json`

**Estimated scope:** Medium (5 view files + locales)

---

## Checkpoint 3: Complete 100% i18n Coverage Gate (After Tasks 40–41)

- [x] Static hardcode scanner reports `PASS: 0 hardcoded Vietnamese lines found` across all of `apps/web-admin/src/**/*.{vue,ts}`.
- [x] `pnpm run check:i18n` passes with 100% key parity between `en-US` and `vi-VN` (1,418 keys).
- [x] `pnpm run check:type` and `pnpm run lint` pass with `0 errors`.
- [x] `pnpm run build:local` succeeds and updates `http://100.68.217.61/`.

---

## Nhiệm Vụ Hiện Hành: Module `enum-constants-ssot` (`SPEC-enum-constants-ssot.md`)

## Task 36: Xây dựng nền tảng Enum Core, Schema & Tenant (`@vben/constants` + `supabase-client.ts` + `tenant.ts` + `views/tenants/index.vue`)

**Description:** Bổ sung `FILTER_ALL` (`'all'`) vào `packages/constants/src/core.ts`, khởi tạo `packages/constants/src/domains/schema.ts` (`SUPABASE_SCHEMA`, `STORAGE_KEYS`) và `packages/constants/src/domains/tenant.ts` (`TENANT_STATUS`, `TENANT_PLAN`, `INVITATION_STATUS`), sau đó đồng bộ sang `supabase-client.ts`, `tenant.ts` và `views/tenants/index.vue`.

**Acceptance criteria:**

- [x] `FILTER_ALL`, `SUPABASE_SCHEMA`, `STORAGE_KEYS`, `TENANT_STATUS`, `TENANT_PLAN`, `INVITATION_STATUS` được định nghĩa chuẩn `as const` và xuất qua `@vben/constants`.
- [x] `src/api/core/supabase-client.ts` và `src/api/core/tenant.ts` import và re-export kiểu từ `@vben/constants` (thay thế `'TUQUET_ACTIVE_TENANT_ID'` bằng `STORAGE_KEYS.ACTIVE_TENANT_ID`).
- [x] `src/views/tenants/index.vue` sử dụng `TENANT_STATUS`, `TENANT_PLAN`, `FILTER_ALL` thay cho chuỗi literal.

**Verification:**

- [x] Tests pass: `pnpm exec vitest run apps/web-admin/src/api/core`
- [x] Typecheck succeeds: `pnpm --filter @tuquet/admin-web run typecheck`

**Dependencies:** None

**Files likely touched:**

- `packages/constants/src/core.ts`
- `packages/constants/src/domains/schema.ts`
- `packages/constants/src/domains/tenant.ts`
- `packages/constants/src/index.ts`
- `apps/web-admin/src/api/core/supabase-client.ts`
- `apps/web-admin/src/api/core/tenant.ts`
- `apps/web-admin/src/views/tenants/index.vue`

**Estimated scope:** Medium (5-7 files)

---

## Task 37: Xây dựng tầng UI Enum Helpers (`STATUS_TONE`, `buildEnumFilterOptions`) & Unit Tests (`apps/web-admin/src/constants/`)

**Description:** Tạo thư mục `apps/web-admin/src/constants/` chứa `enum-helper.ts` (`STATUS_TONE`, `getStatusToneMeta`, `buildEnumFilterOptions`), `status-meta.ts` (bảng metadata ngữ nghĩa màu sắc & khóa dịch cho các miền) và viết bộ Unit Tests `enum-constants.test.ts` kiểm định toàn bộ hằng số miền và helper.

**Acceptance criteria:**

- [x] `buildEnumFilterOptions(metaMap, $t, options)` trả về danh sách `{ label, value }` phản ứng theo ngôn ngữ hiện hành và tự động chèn phần tử đầu `FILTER_ALL` (`'all'`) khi `includeAll !== false`.
- [x] `getStatusToneMeta(status, metaMap)` trả về đúng `{ badgeClass, dotClass, pulse, labelKey }` và fallback an toàn về `STATUS_TONE.NEUTRAL` khi gặp chuỗi trạng thái lạ.
- [x] Unit test `apps/web-admin/src/constants/__tests__/enum-constants.test.ts` pass 100%.

**Verification:**

- [x] Tests pass: `pnpm exec vitest run apps/web-admin/src/constants`
- [x] Typecheck succeeds: `pnpm --filter @tuquet/admin-web run typecheck`

**Dependencies:** Task 36

**Files likely touched:**

- `apps/web-admin/src/constants/enum-helper.ts`
- `apps/web-admin/src/constants/status-meta.ts`
- `apps/web-admin/src/constants/index.ts`
- `apps/web-admin/src/constants/__tests__/enum-constants.test.ts`

**Estimated scope:** Small (4 files)

---

## Task 38: Chuẩn hóa miền Automation & Fleet (`domains/automation.ts` + `api/core/automation.ts` + 5 màn hình `/automation/*`)

**Description:** Định nghĩa `WORKFLOW_STATUS`, `CAMPAIGN_STATUS`, `LOG_LEVEL`, `DEVICE_STATUS`, `BROWSER_STATUS`, `PROXY_STATUS`, `PROXY_PROTOCOL` trong `packages/constants/src/domains/automation.ts`; đồng bộ vào `src/api/core/automation.ts` và refactor 5 màn hình danh sách dưới `/automation/*` (`workflows`, `runs`, `devices`, `browsers`, `proxies`) sang dùng hằng số chuẩn và `buildEnumFilterOptions`.

**Acceptance criteria:**

- [x] `packages/constants/src/domains/automation.ts` định nghĩa đầy đủ 7 bộ Enum của miền Automation & Fleet và xuất qua `@vben/constants`.
- [x] `src/api/core/automation.ts` import và re-export các kiểu từ `@vben/constants` cùng `SUPABASE_SCHEMA.AUTOMA` / `SUPABASE_SCHEMA.RUNNERS`.
- [x] 5 màn hình `/automation/{workflows,runs,devices,browsers,proxies}/index.vue` sử dụng hằng số chuẩn (`WORKFLOW_STATUS`, `CAMPAIGN_STATUS`, `DEVICE_STATUS`, `BROWSER_STATUS`, `PROXY_STATUS`, `FILTER_ALL`) và `buildEnumFilterOptions`.

**Verification:**

- [x] Tests pass: `pnpm exec vitest run apps/web-admin/src/constants apps/web-admin/src/api/core`
- [x] Typecheck succeeds: `pnpm --filter @tuquet/admin-web run typecheck`

**Dependencies:** Task 37

**Files likely touched:**

- `packages/constants/src/domains/automation.ts`
- `apps/web-admin/src/api/core/automation.ts`
- `apps/web-admin/src/views/automation/workflows/index.vue`
- `apps/web-admin/src/views/automation/runs/index.vue`
- `apps/web-admin/src/views/automation/devices/index.vue`
- `apps/web-admin/src/views/automation/browsers/index.vue`
- `apps/web-admin/src/views/automation/proxies/index.vue`

**Estimated scope:** Medium (6-7 files)

---

## Checkpoint 1: After Tasks 36–38

- [x] `pnpm exec vitest run apps/web-admin/src/constants apps/web-admin/src/api/core` pass 100%
- [x] `pnpm --filter @tuquet/admin-web run typecheck` đạt `0 errors`

---

## Task 39: Chuẩn hóa miền Commerce & Billing (`domains/{commerce,billing}.ts` + `api/core/{commerce,billing}.ts` + `/commerce/*`)

**Description:** Định nghĩa `COMMERCE_PRODUCT_TYPE`, `COMMERCE_ORDER_STATUS`, `COMMERCE_STOCK_STATUS` trong `domains/commerce.ts` và `PAYMENT_CHANNEL`, `PAYMENT_INTENT_STATUS`, `WALLET_TX_TYPE`, `SUBSCRIPTION_STATUS` trong `domains/billing.ts`; đồng bộ vào `src/api/core/{commerce,billing}.ts` và các màn hình `/commerce/*`.

**Acceptance criteria:**

- [x] `domains/commerce.ts` và `domains/billing.ts` xuất đầy đủ hằng số và kiểu qua `@vben/constants`.
- [x] `src/api/core/commerce.ts` và `src/api/core/billing.ts` sử dụng hằng số từ `@vben/constants` và re-export kiểu giữ tương thích ngược.
- [x] Các màn hình `/commerce/{orders,admin,wallet,store}/index.vue` sử dụng hằng số chuẩn thay cho chuỗi literal rời rạc.

**Verification:**

- [x] Tests pass: `pnpm exec vitest run apps/web-admin/src/constants apps/web-admin/src/api/core`
- [x] Typecheck succeeds: `pnpm --filter @tuquet/admin-web run typecheck`

**Dependencies:** Checkpoint 1

**Files likely touched:**

- `packages/constants/src/domains/commerce.ts`
- `packages/constants/src/domains/billing.ts`
- `apps/web-admin/src/api/core/commerce.ts`
- `apps/web-admin/src/api/core/billing.ts`
- `apps/web-admin/src/views/commerce/orders/index.vue`
- `apps/web-admin/src/views/commerce/admin/index.vue`

**Estimated scope:** Medium (6 files)

---

## Task 40: Chuẩn hóa miền System Governance (`domains/system.ts` + `api/core/system.ts` + `/system/*`) & Kiểm định Build Local

**Description:** Định nghĩa `SYSTEM_PLUGIN_STATUS` trong `packages/constants/src/domains/system.ts`, đồng bộ vào `src/api/core/system.ts` và các màn hình `/system/{plugins,subscriptions}/index.vue`, cập nhật trạng thái hoàn thành trong `SPEC-enum-constants-ssot.md` và chạy kiểm định toàn cục cùng `pnpm run build:local`.

**Acceptance criteria:**

- [x] `SYSTEM_PLUGIN_STATUS` và `SUBSCRIPTION_STATUS` được áp dụng đồng bộ trong `src/api/core/system.ts`, `/system/plugins/index.vue`, và `/system/subscriptions/index.vue`.
- [x] `SPEC-enum-constants-ssot.md` đánh dấu hoàn thành `[x]` toàn bộ `Success Criteria` (`SC1–SC5`) và mang trạng thái `ACCEPTED & IMPLEMENTED`.
- [x] `pnpm run check:i18n`, `pnpm --filter @tuquet/admin-web run typecheck`, `pnpm run lint`, `pnpm run test:unit`, và `pnpm run build:local` đạt `0 errors`.

**Verification:**

- [x] Full test suite: `pnpm run test:unit`
- [x] Quality gates: `pnpm run check:i18n && pnpm --filter @tuquet/admin-web run typecheck && pnpm run lint`
- [x] Local Nginx preview: `pnpm run build:local` (`HTTP/1.1 200 OK` tại `http://100.68.217.61/`)

**Dependencies:** Task 39

**Files likely touched:**

- `packages/constants/src/domains/system.ts`
- `apps/web-admin/src/api/core/system.ts`
- `apps/web-admin/src/views/system/plugins/index.vue`
- `apps/web-admin/src/views/system/subscriptions/index.vue`
- `apps/web-admin/docs/specs/SPEC-enum-constants-ssot.md`

**Estimated scope:** Medium (5 files)

---

## Checkpoint 2: After Tasks 39–40 (Complete Quality Gate)

- [x] `pnpm run test:unit` pass 100%
- [x] `pnpm run check:i18n`, `pnpm --filter @tuquet/admin-web run typecheck`, và `pnpm run lint` đạt `0 errors`
- [x] `pnpm run build:local` cập nhật bản dựng mới thành công tại `http://100.68.217.61/`

---

## Tasks 36–38: Đồng Bộ Màu Sắc Biểu Đồ Theo Chủ Đề Built-in (`builtin-theme-chart-colors`)

## Task 36: Sinh biến CSS `--chart-1` .. `--chart-5` theo Built-in Theme (Zero-Mutation) trong `@vben/preferences`

**Description:** Cập nhật `packages/@core/preferences/src/update-css-variables.ts` để tự động tính toán và gán 5 biến `--chart-1` .. `--chart-5` trên `:root` mỗi khi cập nhật chủ đề Built-in (10 chủ đề có màu sắc + `custom` dùng sắc độ `--primary-500/400/600/300/700`; 4 chủ đề đơn sắc `zinc`, `neutral`, `slate`, `gray` dùng thang 5 bậc độ sáng tương phản cao theo Light/Dark mode), đồng thời loại bỏ phép gán đột biến `preferences.theme.colorPrimary = ...` bên trong `updateCSSVariables`.

**Acceptance criteria:**

- [x] `updateCSSVariables(preferences)` không làm đột biến đối tượng `preferences` đầu vào (Zero-Mutation).
- [x] Khi gọi `updateCSSVariables` hoặc `preferenceManager.updatePreferences({ theme: { builtinType, mode } })` với bất kỳ chủ đề nào trong 14 Built-in Themes hoặc `custom`, 5 biến `--chart-1` .. `--chart-5` trên `document.documentElement.style` được cập nhật đầy đủ và phân biệt rõ ràng ở cả Light và Dark mode.

**Verification:**

- [x] Tests pass: `pnpm exec vitest run packages/@core/preferences/__tests__/preferences.test.ts`

**Dependencies:** None

**Files likely touched:**

- `packages/@core/preferences/src/update-css-variables.ts`
- `packages/@core/preferences/__tests__/preferences.test.ts`

**Estimated scope:** Small (2 files)

---

## Task 37: Chuẩn hóa `defaultColors()` sang `hsl(var(--chart-1..5))` trong `@vben-core/shadcn-ui`

**Description:** Thay thế mảng mã màu Hex cố định trong `packages/@core/ui-kit/shadcn-ui/src/ui/chart/index.ts` bằng mảng biến CSS ngữ nghĩa `['hsl(var(--chart-1))', ..., 'hsl(var(--chart-5))']`, đồng bộ hóa `legendItems` trong `AreaChart.vue` và `BarChart.vue` khi `props.colors` hoặc `props.categories` thay đổi, và bổ sung unit tests kiểm chứng `defaultColors()`.

**Acceptance criteria:**

- [x] `defaultColors(count)` với `count <= 5` trả về đúng mảng `['hsl(var(--chart-1))', ...]` tương ứng.
- [x] `defaultColors(count)` với `count > 5` giữ nguyên cơ chế fallback chia dải `--vis-primary-color` và `--vis-secondary-color`.
- [x] `AreaChart.vue` và `BarChart.vue` cập nhật `legendItems` đồng bộ khi `colors` hoặc `categories` thay đổi.

**Verification:**

- [x] Tests pass: `pnpm exec vitest run packages/@core/ui-kit/shadcn-ui`

**Dependencies:** Task 36

**Files likely touched:**

- `packages/@core/ui-kit/shadcn-ui/src/ui/chart/index.ts`
- `packages/@core/ui-kit/shadcn-ui/src/ui/chart-area/AreaChart.vue`
- `packages/@core/ui-kit/shadcn-ui/src/ui/chart-bar/BarChart.vue`
- `packages/@core/ui-kit/shadcn-ui/src/ui/chart/__tests__/chart-colors.test.ts`

**Estimated scope:** Small (4 files)

---

## Task 38: Gỡ bỏ mã màu Hex cứng trong các biểu đồ Analytics & Cập nhật tài liệu

**Description:** Xóa bỏ mảng `:colors` Hex gán cứng trong `apps/web-admin/src/views/dashboard/analytics/growth-chart.vue`, `plans-chart.vue`, và `plugins-chart.vue` để sử dụng dải màu `--chart-1..5` từ `defaultColors()`; cập nhật tài liệu `SPEC-layout-preferences-coherence.md` cùng `styling-guide.md` và chạy `pnpm run build:local`.

**Acceptance criteria:**

- [x] `growth-chart.vue`, `plans-chart.vue`, và `plugins-chart.vue` không còn chứa bất kỳ mã màu Hex tĩnh nào (`#38bdf8`, `#94a3b8`, `#a855f7`, `#0284c7`, `#10b981`).
- [x] `SPEC-layout-preferences-coherence.md` và `styling-guide.md` phản ánh đầy đủ quy chuẩn `--chart-1..5`.
- [x] `pnpm --filter @tuquet/admin-web run typecheck` và `pnpm run build:local` hoàn tất với 0 lỗi.

**Verification:**

- [x] Typecheck passes: `pnpm --filter @tuquet/admin-web run typecheck`
- [x] Local build succeeds: `pnpm run build:local`

**Dependencies:** Task 37

**Files likely touched:**

- `apps/web-admin/src/views/dashboard/analytics/growth-chart.vue`
- `apps/web-admin/src/views/dashboard/analytics/plans-chart.vue`
- `apps/web-admin/src/views/dashboard/analytics/plugins-chart.vue`
- `apps/web-admin/docs/specs/SPEC-layout-preferences-coherence.md`
- `apps/web-admin/docs/architecture/styling-guide.md`

**Estimated scope:** Medium (5 files)

---

## Checkpoint: After Tasks 36–38

- [x] Unit tests in `@vben/preferences` and `@vben-core/shadcn-ui` pass 100%
- [x] `pnpm --filter @tuquet/admin-web run typecheck` passes with 0 errors
- [x] `pnpm run build:local` succeeds for live Tailscale inspection

---

## Tasks 39–41: Đồng Bộ SSOT Màu Built-in Theme Cho Specter SVG Logo & Hệ Thống Icon Lucide (`builtin-theme-logo-and-icons-ssot`)

## Task 39: Dựng Inline Theme-Reactive Specter SVG Logo trong `VbenLogo` & `AuthPageLayout` kèm Unit Tests

**Description:** Cập nhật `packages/@core/ui-kit/shadcn-ui/src/components/logo/logo.vue` và `packages/effects/layouts/src/authentication/authentication.vue` để dựng trực tiếp thẻ `<svg>` inline khi `src` là logo mặc định (`/logo.svg`, `/logo-app.svg`, hoặc rỗng), gắn dải màu `<linearGradient>` 3 điểm theo `hsl(var(--chart-4, var(--primary)))`, `hsl(var(--chart-1, var(--primary)))`, `hsl(var(--chart-3, var(--primary)))` và hào quang `hsl(var(--primary) / 0.22)`; đồng thời giữ fallback `<VbenAvatar />` khi truyền URL ảnh ngoài và viết unit test `logo.test.ts`.

**Acceptance criteria:**

- [x] Khi `src` là `/logo.svg`, `/logo-app.svg` hoặc rỗng, `VbenLogo` render `<svg>` inline có `<linearGradient>` tham chiếu `var(--chart-4`, `var(--chart-1`, `var(--chart-3` và quầng sáng `var(--primary)`.
- [x] Khi truyền `src` là URL ảnh tùy chỉnh khác (ví dụ `https://example.com/custom.png`), `VbenLogo` vẫn render `<VbenAvatar />` như cũ.
- [x] Trang Đăng nhập (`authentication.vue`) hiển thị logo Specter đồng bộ màu Built-in Theme.

**Verification:**

- [x] Tests pass: `pnpm exec vitest run packages/@core/ui-kit/shadcn-ui/src/components/logo/__tests__/logo.test.ts`

**Dependencies:** None

**Files likely touched:**

- `packages/@core/ui-kit/shadcn-ui/src/components/logo/logo.vue`
- `packages/effects/layouts/src/authentication/authentication.vue`
- `packages/@core/ui-kit/shadcn-ui/src/components/logo/__tests__/logo.test.ts` (new)

**Estimated scope:** Small (3 files)

---

## Task 40: Đồng bộ màu `--primary` cho Menu & Tabbar đang active ở chế độ Dark Mode

**Description:** Cập nhật `packages/@core/ui-kit/menu-ui/src/components/menu.vue`, `normal-menu/normal-menu.vue`, `packages/@core/ui-kit/tabs-ui/src/components/tabs/tabs.vue`, và `tabs-chrome/tabs.vue` để mục menu và tab đang chọn (`is-active`) ở chế độ Dark Mode giữ nguyên màu chữ/icon `hsl(var(--primary))` và nền `hsl(var(--primary) / 15%)` thay vì bị ghi đè sang `--accent-foreground` / `--accent`.

**Acceptance criteria:**

- [x] Trong `menu.vue`, nhánh `.is-dark` sử dụng `--menu-item-active-color: hsl(var(--primary))` và `--menu-item-active-background-color: hsl(var(--primary) / 15%)`.
- [x] Trong `normal-menu.vue`, mục `.is-active` ở Dark Mode sử dụng `dark:bg-primary/15` và giữ nguyên `text-primary`.
- [x] Trong `tabs.vue` và `tabs-chrome/tabs.vue`, tab `.is-active` ở Dark Mode sử dụng `dark:bg-primary/15` và `group-[.is-active]:dark:text-primary`.

**Verification:**

- [x] Typecheck & Lint pass: `pnpm --filter @tuquet/admin-web run typecheck`

**Dependencies:** Task 39

**Files likely touched:**

- `packages/@core/ui-kit/menu-ui/src/components/menu.vue`
- `packages/@core/ui-kit/menu-ui/src/components/normal-menu/normal-menu.vue`
- `packages/@core/ui-kit/tabs-ui/src/components/tabs/tabs.vue`
- `packages/@core/ui-kit/tabs-ui/src/components/tabs-chrome/tabs.vue`

**Estimated scope:** Small (4 files)

---

## Task 41: Thiết lập quy tắc CSS SSOT cho toàn bộ Lucide Icons trong `internal/tailwind-config/src/theme.css` & Build Local

**Description:** Bổ sung quy tắc CSS tập trung (SSOT) trong `internal/tailwind-config/src/theme.css` để tự động đồng bộ toàn bộ hộp chứa icon (`:has(> svg.lucide:only-child)`) trên KPI Card, Bảng, Modal Header, Empty State sang nền `hsl(var(--primary) / 10%)` + màu `hsl(var(--primary))`, và các icon `svg.lucide` độc lập sang `hsl(var(--primary))` mà không cần sửa thủ công các file `views/**`.

**Acceptance criteria:**

- [x] Mọi hộp chứa icon không phải nút bấm (`:is(.bg-muted, .bg-muted\/50, .bg-muted\/40):not(button, [role='button']):has(> svg.lucide:only-child)`) tự động nhận `background-color: hsl(var(--primary) / 10%)` và `color: hsl(var(--primary))`.
- [x] Các icon `svg.lucide` độc lập mang `.text-muted-foreground` hoặc `.text-foreground` (nằm ngoài `button`, `[role='button']`, `a` và ô tìm kiếm `input`) tự động nhận `color: hsl(var(--primary))`.
- [x] Các icon trạng thái ngữ nghĩa (`text-emerald-*`, `text-amber-*`, `text-rose-*`, `text-success`, `text-warning`, `text-destructive`) được bảo toàn tuyệt đối.
- [x] `pnpm run build:local` hoàn tất với 0 lỗi.

**Verification:**

- [x] Unit tests pass: `pnpm exec vitest run packages/@core/preferences packages/@core/ui-kit/shadcn-ui`
- [x] Typecheck & Lint pass: `pnpm --filter @tuquet/admin-web run typecheck` && `pnpm run lint`
- [x] Local build succeeds: `pnpm run build:local`

**Dependencies:** Task 40

**Files likely touched:**

- `internal/tailwind-config/src/theme.css`
- `apps/web-admin/docs/specs/SPEC-layout-preferences-coherence.md`

**Estimated scope:** Small (2 files)

---

## Tasks 42–45: Trang Tổng Quan Tự Động Hóa (`/automation/overview`) & Tinh Gọn Danh Sách Mobile-First (`SPEC-automation-dashboard.md`)

## Task 42: Nâng cấp tầng API (`calculateAutomationOverviewSummary`, `getAutomationOverviewApi`), Bộ lọc Plugin Đa Hợp (`plugin-gate.ts`), Định tuyến `/automation/overview` & Từ điển Đa ngôn ngữ (`page.json`) + Unit Tests

**Description:** Bổ sung kiểu `AutomationOverviewSummary`, hàm tính toán thuần khiết `calculateAutomationOverviewSummary()` và hàm truy vấn tổng hợp `getAutomationOverviewApi()` trong `apps/web-admin/src/api/core/automation.ts`; nâng cấp `filterRoutesByPlugins` trong `apps/web-admin/src/router/plugin-gate.ts` để hỗ trợ `meta.plugin: string | string[]`; đăng ký route `/automation/overview` làm route con đầu tiên và mặc định (`redirect: '/automation/overview'`) trong `apps/web-admin/src/router/routes/modules/automation.ts`; bổ sung khóa dịch đối xứng `en-US` / `vi-VN` trong `page.json` và viết unit tests trong `automation.test.ts` & `plugin-gate.test.ts`.

**Acceptance criteria:**

- [x] `calculateAutomationOverviewSummary()` tính đúng số lượng theo trạng thái cho `workflows`, `runs`, `devices`, `browsers`, `proxies` (kèm `avgLatencyMs`) và `fleet`.
- [x] `filterRoutesByPlugins` giữ lại `/automation/overview` khi cài `automa` hoặc `runners`, và cắt bỏ khi cả hai đều chưa cài.
- [x] `/automation` redirect mặc định về `/automation/overview` và có đầy đủ khóa dịch `en-US` / `vi-VN` đối xứng 100%.

**Verification:**

- [x] Tests pass: `pnpm exec vitest run apps/web-admin/src/api/core/__tests__/automation.test.ts apps/web-admin/src/router/__tests__/plugin-gate.test.ts`

**Dependencies:** None

**Files likely touched:**

- `apps/web-admin/src/api/core/automation.ts`
- `apps/web-admin/src/api/core/__tests__/automation.test.ts`
- `apps/web-admin/src/router/plugin-gate.ts`
- `apps/web-admin/src/router/__tests__/plugin-gate.test.ts`
- `apps/web-admin/src/router/routes/modules/automation.ts`
- `apps/web-admin/src/locales/langs/{en-US,vi-VN}/page.json`

**Estimated scope:** Medium (6 files)

---

## Task 43: Xây dựng Trang Tổng Quan Tự Động Hóa (`views/automation/overview/index.vue`) & Tối ưu `FleetMetrics` Mobile (`grid-cols-2 lg:grid-cols-4`)

**Description:** Tạo màn hình `apps/web-admin/src/views/automation/overview/index.vue` hiển thị tập trung: (1) 4 thẻ `FleetMetrics` (cập nhật sang lưới `grid-cols-2 lg:grid-cols-4` gọn gàng trên mobile), (2) Lưới 5 thẻ phân hệ (`Workflows`, `Runs`, `Devices`, `Browsers`, `Proxies` — `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`) cho phép bấm chuyển nhanh tới từng trang danh sách, và (3) Bảng rút gọn 5 phiên chạy gần nhất (kèm thanh tiến độ `%` và nút xem log `/automation/runs/:id`) cùng danh sách thiết bị đang hoạt động.

**Acceptance criteria:**

- [x] `views/automation/overview/index.vue` hiển thị đầy đủ dữ liệu từ `getAutomationOverviewApi()`, hỗ trợ lọc theo `?tenant=` và làm mới dữ liệu.
- [x] Các thẻ phân hệ điều hướng chính xác tới `/automation/{workflows,runs,devices,browsers,proxies}` và giữ nguyên `?tenant=` nếu có.
- [x] `fleet-metrics.vue` hiển thị 2 cột gọn gàng trên mobile (`grid-cols-2 lg:grid-cols-4`).

**Verification:**

- [x] Typecheck passes: `pnpm --filter @tuquet/admin-web run typecheck`

**Dependencies:** Task 42

**Files likely touched:**

- `apps/web-admin/src/views/automation/overview/index.vue` (new)
- `apps/web-admin/src/views/automation/devices/components/fleet-metrics.vue`

**Estimated scope:** Small (2 files)

---

## Checkpoint 1: After Tasks 42–43 (Foundation & Overview Dashboard)

- [x] Unit tests (`automation.test.ts` & `plugin-gate.test.ts`) pass 100%.
- [x] `pnpm --filter @tuquet/admin-web run typecheck` đạt `0 errors`.

---

## Task 44: Tinh gọn Mobile-First cho 2 màn hình Kịch bản & Phiên chạy (`workflows/index.vue`, `runs/index.vue`)

**Description:** Lược bỏ thanh `Stats Bar` (`border-b`) phía trên `<Grid>` trong `apps/web-admin/src/views/automation/workflows/index.vue` và `apps/web-admin/src/views/automation/runs/index.vue`; chuyển số lượng tổng lên `Badge` nhỏ cạnh tiêu đề `h1`; thu gọn Page Header trên 1 hàng ngang (ẩn phụ đề trên mobile `hidden sm:block`) và chuyển `formOptions.wrapperClass` sang `grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3` để bảng dữ liệu hiển thị ngay trong tầm mắt đầu tiên trên điện thoại.

**Acceptance criteria:**

- [x] `workflows/index.vue` và `runs/index.vue` không còn thanh `Stats Bar` rườm rà phía trên `<Grid>`.
- [x] Trên mobile (`< 640px`), Page Header nằm trên 1 hàng ngang kèm `Badge` tổng số bản ghi, bộ lọc `VbenForm` xếp 2 cột gọn gàng.

**Verification:**

- [x] Typecheck passes: `pnpm --filter @tuquet/admin-web run typecheck`

**Dependencies:** Task 43

**Files likely touched:**

- `apps/web-admin/src/views/automation/workflows/index.vue`
- `apps/web-admin/src/views/automation/runs/index.vue`

**Estimated scope:** Small (2 files)

---

## Task 45: Tinh gọn Mobile-First cho 3 màn hình Hạ tầng Runner (`devices/index.vue`, `browsers/index.vue`, `proxies/index.vue`) & Chạy `build:local`

**Description:** Gỡ bỏ `<FleetMetrics :metrics="metrics" />` khỏi `apps/web-admin/src/views/automation/devices/index.vue`; lược bỏ thanh `Stats Bar` (`border-b`) phía trên `<Grid>` ở cả 3 màn hình `devices/index.vue`, `browsers/index.vue`, `proxies/index.vue`; gắn `Badge` tổng số lượng cạnh tiêu đề `h1`; tối ưu Page Header 1 hàng ngang và bộ lọc `VbenForm` 2 cột (`grid-cols-2`) trên mobile; chạy kiểm định toàn diện và `pnpm run build:local`.

**Acceptance criteria:**

- [x] `devices/index.vue` không còn `<FleetMetrics />` và thanh `Stats Bar`; `browsers/index.vue` và `proxies/index.vue` không còn thanh `Stats Bar`.
- [x] Trên mobile (`< 640px`), cả 3 màn hình đều hiển thị Header 1 hàng + Bộ lọc 2 cột gọn nhẹ, bảng `VxeGrid` xuất hiện ngay ở nửa trên màn hình.
- [x] Pass 100% unit tests, `check:i18n`, `typecheck`, `lint` và cập nhật `pnpm run build:local` (`http://100.68.217.61/`).

**Verification:**

- [x] Unit tests pass: `pnpm exec vitest run apps/web-admin/src`
- [x] Typecheck & Lint pass: `pnpm --filter @tuquet/admin-web run typecheck && pnpm run lint`
- [x] Local build succeeds: `pnpm run build:local`

**Dependencies:** Task 43, Task 44

**Files likely touched:**

- `apps/web-admin/src/views/automation/devices/index.vue`
- `apps/web-admin/src/views/automation/browsers/index.vue`
- `apps/web-admin/src/views/automation/proxies/index.vue`
- `apps/web-admin/docs/specs/SPEC-automation-dashboard.md`

**Estimated scope:** Medium (4 files)

---

## Checkpoint 2: After Tasks 44–45 (Complete Quality Gate & Local Build)

- [x] Static hardcode scanner confirms `0` hardcoded Vietnamese lines across `apps/web-admin/src/**/*.{vue,ts}`.
- [x] `100%` key parity between `en-US` and `vi-VN` (`check:i18n`).
- [x] `vitest`, `typecheck`, and `lint` pass with `0 errors`.
- [x] `pnpm run build:local` succeeds and updates `http://100.68.217.61/`.

---

## Tasks 42–44: Cải Thiện Giao Diện & Responsive Chi Tiết Workspace (`/tenants/:id` — `SPEC-tenants-truth.md`)

## Task 42: Lưới Thông Tin Responsive Description Grid & Tinh Gọn Danger Zone trong `workspace-overview-tab.vue`

**Description:** Thay thế `<VxeForm custom-layout readonly>` (`span="12"`) trong `apps/web-admin/src/views/tenants/components/workspace-overview-tab.vue` bằng lưới CSS Grid chuẩn (`grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3`) với nhãn xếp phía trên giá trị để khắc phục triệt để lỗi chữ bị ép dọc 1 ký tự/dòng trên Mobile; đồng thời tinh gọn thẻ thao tác phía dưới thành khu vực quản lý vòng đời (`Archive or delete`) không lặp lại 3 nút của `WorkspaceHero`.

**Acceptance criteria:**

- [x] `workspace-overview-tab.vue` không còn sử dụng `VxeForm` / `VxeFormItem` chỉ đọc với `span="12"`.
- [x] 6 trường thông tin (`Workspace Name`, `Slug Identifier`, `Tenant ID`, `Created At`, `Service Plan`, `Device Infra`) hiển thị trong lưới `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, nhãn nằm trên giá trị, có nút sao chép `Tenant ID` và nút mở nhanh danh sách thiết bị.
- [x] Thẻ phía dưới chỉ hiển thị khu vực thu hồi/xóa Workspace (`deleteWorkspace`), không lặp lại 3 nút `Set Primary`, `Pair CLI`, `Edit Name & Slug`.

**Verification:**

- [x] Typecheck passes: `pnpm --filter @tuquet/admin-web run typecheck`

**Dependencies:** None

**Files likely touched:**

- `apps/web-admin/src/views/tenants/components/workspace-overview-tab.vue`

**Estimated scope:** Small (1 file)

---

## Task 43: Sửa lỗi tràn ngang thanh 4 Tabs trên Mobile (`detail.vue`) & Đồng bộ Built-in Theme (`workspace-hero.vue`)

**Description:** Cập nhật `apps/web-admin/src/views/tenants/detail.vue` để `<TabsList>` cuộn ngang mượt trên màn hình hẹp và mỗi `<TabsTrigger>` giữ nguyên icon + chữ trên cùng 1 hàng (`shrink-0 whitespace-nowrap`); cập nhật `apps/web-admin/src/views/tenants/components/workspace-hero.vue` để Avatar đồng bộ theo màu `--primary` của Built-in Theme.

**Acceptance criteria:**

- [x] `<TabsList>` trong `detail.vue` có `overflow-x-auto no-scrollbar` và `<TabsTrigger>` có `shrink-0 whitespace-nowrap`.
- [x] `Avatar` trong `workspace-hero.vue` sử dụng `bg-primary/10 text-primary border border-primary/20` thay cho `from-sky-600 to-indigo-600`.

**Verification:**

- [x] Typecheck passes: `pnpm --filter @tuquet/admin-web run typecheck`

**Dependencies:** Task 42

**Files likely touched:**

- `apps/web-admin/src/views/tenants/detail.vue`
- `apps/web-admin/src/views/tenants/components/workspace-hero.vue`

**Estimated scope:** Small (2 files)

---

## Task 44: Chuẩn hóa thang chữ 7-Tier & Đồng bộ các Tab phụ (`usage`, `audit`, `members`) kèm Unit Tests & Build Local

**Description:** Xóa bỏ toàn bộ class kích thước chữ tùy tiện `text-[11px]` trong `workspace-usage-tab.vue` và `workspace-audit-tab.vue` (thay bằng `text-xs` / `text-2xs`), đồng bộ `AvatarFallback` trong `workspace-members-tab.vue` sang `bg-primary/10 text-primary`, bổ sung kiểm thử trong `workspace-detail.test.ts` và chạy `pnpm run build:local`.

**Acceptance criteria:**

- [x] `0` kết quả `text-[11px]` trong toàn bộ `apps/web-admin/src/views/tenants/`.
- [x] `AvatarFallback` trong `workspace-members-tab.vue` sử dụng `bg-primary/10 text-primary`.
- [x] Unit tests trong `workspace-detail.test.ts` pass 100% và `pnpm run build:local` hoàn tất với 0 lỗi.

**Verification:**

- [x] Tests pass: `pnpm exec vitest run apps/web-admin/src/api/core/__tests__/workspace-detail.test.ts`
- [x] Typecheck & Lint pass: `pnpm --filter @tuquet/admin-web run typecheck` && `pnpm run lint`
- [x] Local build succeeds: `pnpm run build:local`

**Dependencies:** Task 43

**Files likely touched:**

- `apps/web-admin/src/views/tenants/components/workspace-usage-tab.vue`
- `apps/web-admin/src/views/tenants/components/workspace-audit-tab.vue`
- `apps/web-admin/src/views/tenants/components/workspace-members-tab.vue`
- `apps/web-admin/src/api/core/__tests__/workspace-detail.test.ts`

**Estimated scope:** Small (4 files)

---

## Nhiệm Vụ Hiện Hành: Module `workflow-mobile-first` (`SPEC-workflow-mobile-first.md`)

## Task 46: Bổ sung khóa từ điển `en-US` / `vi-VN` (`page.json`) và xây dựng hộp thoại `WorkflowDetailModal`

**Description:** Bổ sung các khóa từ điển đối xứng cho chi tiết quy trình trong `apps/web-admin/src/locales/langs/{en-US,vi-VN}/page.json` (`detail_title`, `workflow_id`, `copy_workflow_id`, `copied_workflow_id`, `workspace_id`, `description_label`) và xây dựng `apps/web-admin/src/views/automation/workflows/components/modals/workflow-detail-modal.vue` hiển thị đầy đủ thông số quy trình theo chuẩn Mobile-First Responsive Grid (`grid-cols-1 sm:grid-cols-2`).

**Acceptance criteria:**

- [x] Các khóa mới trong `page.workflows_view.*` được bổ sung đầy đủ vào cả `en-US/page.json` và `vi-VN/page.json` (tuân thủ `Sentence case`).
- [x] `workflow-detail-modal.vue` hiển thị Header tóm tắt (`name`, `version`, `Badge` trạng thái từ `WORKFLOW_STATUS_META`) và lưới thông số (`id` + nút copy, `tenant_id` + nút copy, `created_at`, `updated_at`, `description`) bằng `grid-cols-1 sm:grid-cols-2`, không bị tràn ngang trên màn hình `375px`.

**Verification:**

- [x] i18n check passes: `pnpm run check:i18n`
- [x] Typecheck passes: `pnpm --filter @tuquet/admin-web run typecheck`

**Dependencies:** None

**Files likely touched:**

- `apps/web-admin/src/locales/langs/en-US/page.json`
- `apps/web-admin/src/locales/langs/vi-VN/page.json`
- `apps/web-admin/src/views/automation/workflows/components/modals/workflow-detail-modal.vue`

**Estimated scope:** Small (3 files)

---

## Task 47: Nâng cấp `views/automation/workflows/index.vue` với cột `VxeGrid` thích ứng `isMobile`, thanh lọc thu gọn và tích hợp `WorkflowDetailModal`

**Description:** Tích hợp `usePreferences().isMobile` vào `apps/web-admin/src/views/automation/workflows/index.vue` để tự động ẩn 4 cột phụ (`version`, `status`, `created_at`, `updated_at`) trên màn hình `< 640px`, hiển thị huy hiệu phiên bản/trạng thái/ngày cập nhật ngay trong `#name-cell` trên mobile, ẩn nhãn bộ lọc (`hideLabel`) khi `isMobile === true`, và thêm cột `actions` + sự kiện chạm dòng mở `WorkflowDetailModal`.

**Acceptance criteria:**

- [x] Khi `isMobile === true`, bảng `workflows` chỉ hiển thị cột `name` và cột `actions` gọn nhẹ (`width: 64px`), không sinh thanh cuộn ngang trên màn hình `375px`.
- [x] Trong `#name-cell` trên mobile hiển thị đầy đủ `v{row.version}`, huy hiệu trạng thái (`WORKFLOW_STATUS_META`) và thời gian cập nhật.
- [x] Bộ lọc `VbenForm` tự động ẩn nhãn (`hideLabel`) trên mobile giúp giảm chiều cao vùng lọc.
- [x] Nhấn nút `Chi tiết` hoặc chạm dòng trên mobile mở `WorkflowDetailModal` với đúng dữ liệu quy trình được chọn.

**Verification:**

- [x] i18n check passes: `pnpm run check:i18n`
- [x] Typecheck passes: `pnpm --filter @tuquet/admin-web run typecheck`

**Dependencies:** Task 46

**Files likely touched:**

- `apps/web-admin/src/views/automation/workflows/index.vue`

**Estimated scope:** Small (1 file)

---

## Checkpoint 1: After Tasks 46–47 (Workflows Mobile-First & Detail Modal)

- [x] `pnpm run check:i18n` pass 100% (`0` missing keys).
- [x] `pnpm --filter @tuquet/admin-web run typecheck` pass (`0 errors`).

---

## Task 48: Nâng cấp `views/automation/runs/index.vue` với cột `VxeGrid` thích ứng `isMobile` và thanh lọc thu gọn

**Description:** Tích hợp `usePreferences().isMobile` vào `apps/web-admin/src/views/automation/runs/index.vue` để ẩn 4 cột phụ (`runner`, `progress`, `status`, `created_at`) trên màn hình `< 640px`, gộp huy hiệu trạng thái (`CAMPAIGN_STATUS_META`), tên thiết bị runner và thanh tiến độ mini (`completed_tasks / total_tasks` — `%`) vào `#name-cell` khi ở chế độ mobile, đồng thời thu gọn thanh lọc `VbenForm` (`hideLabel`) và nút thao tác trên mobile.

**Acceptance criteria:**

- [x] Khi `isMobile === true`, bảng `runs` chỉ hiển thị cột `name` và cột `actions` gọn nhẹ (`width: 64px`), vừa khít màn hình `375px` không cuộn ngang.
- [x] Trong `#name-cell` trên mobile hiển thị huy hiệu trạng thái, tên thiết bị runner (hoặc `auto_dispatch`) và thanh tiến độ mini.
- [x] Bộ lọc `VbenForm` ẩn nhãn trên mobile và chạm dòng / nhấn nút `actions` điều hướng chính xác tới `/automation/runs/:id`.

**Verification:**

- [x] Typecheck passes: `pnpm --filter @tuquet/admin-web run typecheck`

**Dependencies:** Task 47

**Files likely touched:**

- `apps/web-admin/src/views/automation/runs/index.vue`

**Estimated scope:** Small (1 file)

---

## Task 49: Nâng cấp `views/automation/runs/detail.vue` sang lưới thông số Mobile-First, tối ưu cửa sổ log terminal & chạy Kiểm định Toàn diện

**Description:** Thay thế `<VxeForm custom-layout readonly>` trong `apps/web-admin/src/views/automation/runs/detail.vue` bằng lưới thông số Mobile-First (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`) với nhãn xếp trên giá trị (tránh ép chữ 1 ký tự/dòng trên điện thoại), thu gọn Header điều hướng và dòng meta của `Terminal Output Window` trên màn hình dọc, sau đó chạy toàn bộ cổng kiểm định chất lượng và `pnpm run build:local`.

**Acceptance criteria:**

- [x] `runs/detail.vue` hiển thị 4 thẻ thông số (`Workflow`, `Runner device`, `Duration`, `Task progress`) bằng lưới `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` rõ ràng trên cả mobile và desktop, kèm khối `error_message` (nếu có).
- [x] Khung `Terminal Output Window` hiển thị gọn trên màn hình dọc điện thoại (`flex-wrap sm:flex-nowrap` cho phần timestamp/level/step).
- [x] `pnpm run check:i18n`, `typecheck`, `lint`, `vitest`, và `pnpm run build:local` hoàn tất với `0 errors`.

**Verification:**

- [x] i18n check passes: `pnpm run check:i18n`
- [x] Unit tests pass: `pnpm exec vitest run apps/web-admin/src/api/core/__tests__/automation.test.ts`
- [x] Typecheck & Lint pass: `pnpm --filter @tuquet/admin-web run typecheck && pnpm run lint`
- [x] Local build succeeds: `pnpm run build:local`

**Dependencies:** Task 48

**Files likely touched:**

- `apps/web-admin/src/views/automation/runs/detail.vue`
- `apps/web-admin/docs/specs/SPEC-workflow-mobile-first.md`
- `tasks/plan.md`
- `tasks/todo.md`

**Estimated scope:** Medium (4 files)

---

## Checkpoint 2: After Tasks 48–49 (Complete Quality Gate & Local Build)

- [x] `pnpm run check:i18n` pass 100%.
- [x] `vitest`, `typecheck`, và `lint` pass 100% (`0 errors`).
- [x] `pnpm run build:local` đóng gói thành công tại `http://100.68.217.61/`.

---

## Nhiệm Vụ Hiện Hành: Module `system-dashboard` (`SPEC-system-dashboard.md`)

## Task 50: Nâng cấp tầng API (`calculateSystemOverviewSummary`, `getSystemOverviewApi`), Định tuyến `/system/overview`, Từ điển `page.json` & Unit Tests

**Description:** Bổ sung kiểu `SystemOverviewSummary`, hàm thuần khiết `calculateSystemOverviewSummary()` và hàm `getSystemOverviewApi()` trong `apps/web-admin/src/api/core/system.ts`; đăng ký route `/system/overview` làm trang đầu tiên và mặc định (`redirect: '/system/overview'`) trong `apps/web-admin/src/router/routes/modules/system.ts`; bổ sung từ điển đối xứng `en-US` / `vi-VN` (`Sentence case`) trong `page.json` và viết unit tests trong `apps/web-admin/src/api/core/__tests__/system-overview.test.ts`.

**Acceptance criteria:**

- [x] `calculateSystemOverviewSummary` tính chính xác số liệu tổng hợp cho `plugins`, `plans`, `users`, `roles`, `subscriptions`, `auditLogs` và trả về tối đa 5 bản ghi mới nhất cho `recentAuditLogs` & `recentSubscriptions`.
- [x] Route `SystemOverview` (`path: 'overview'`) nằm đầu tiên trong `system.ts` và `/system` tự động redirect về `/system/overview`.
- [x] Unit tests trong `system-overview.test.ts` pass 100% và `pnpm run check:i18n` đạt 100% đối xứng.

**Verification:**

- [x] Tests pass: `pnpm exec vitest run apps/web-admin/src/api/core/__tests__/system-overview.test.ts`
- [x] i18n check passes: `pnpm run check:i18n`

**Dependencies:** None

**Files likely touched:**

- `apps/web-admin/src/api/core/system.ts`
- `apps/web-admin/src/api/core/__tests__/system-overview.test.ts`
- `apps/web-admin/src/router/routes/modules/system.ts`
- `apps/web-admin/src/locales/langs/en-US/page.json`
- `apps/web-admin/src/locales/langs/vi-VN/page.json`

**Estimated scope:** Medium (5 files)

---

## Task 51: Xây dựng Trang Tổng Quan Hệ Thống (`views/system/overview/index.vue`)

**Description:** Xây dựng `apps/web-admin/src/views/system/overview/index.vue` hiển thị: (1) 4 thẻ chỉ số cốt lõi (`Monthly Recurring Revenue`, `Platform Users`, `System Plugins`, `Access Control RBAC` — `grid-cols-2 lg:grid-cols-4`), (2) Lưới 6 thẻ điều hướng nhanh tới 6 phân hệ con (`plugins`, `plans`, `users`, `roles`, `subscriptions`, `audit-logs` — `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`), và (3) 2 danh sách hoạt động gần đây (`recentAuditLogs` & `recentSubscriptions`).

**Acceptance criteria:**

- [x] `views/system/overview/index.vue` hiển thị đầy đủ 4 thẻ KPI, 6 thẻ Quick-Jump và 2 bảng hoạt động gần đây, tương thích hoàn hảo trên cả màn hình điện thoại (`375px`) và máy tính.
- [x] Nhấn vào từng thẻ phân hệ điều hướng chính xác tới `/system/{plugins,plans,users,roles,subscriptions,audit-logs}`.

**Verification:**

- [x] i18n check passes: `pnpm run check:i18n`
- [x] Typecheck passes: `pnpm --filter @tuquet/admin-web run typecheck`

**Dependencies:** Task 50

**Files likely touched:**

- `apps/web-admin/src/views/system/overview/index.vue`

**Estimated scope:** Small (1 file)

---

## Checkpoint 1: After Tasks 50–51 (System Overview Foundation & View)

- [x] Unit tests (`system-overview.test.ts`) pass 100%.
- [x] `pnpm run check:i18n` và `pnpm --filter @tuquet/admin-web run typecheck` pass (`0 errors`).

---

## Task 52: Tinh gọn Mobile-First cho 3 màn hình Danh mục & Thuê bao (`plugins/index.vue`, `plans/index.vue`, `subscriptions/index.vue`)

**Description:** Tích hợp `usePreferences().isMobile` vào `getColumns()` và `commonConfig.hideLabel` của `apps/web-admin/src/views/system/plugins/index.vue`, `apps/web-admin/src/views/system/plans/index.vue`, và `apps/web-admin/src/views/system/subscriptions/index.vue` để ẩn cột phụ trên màn hình `< 640px` và gộp thông tin quan trọng vào ô chính.

**Acceptance criteria:**

- [x] Trên màn hình `< 640px` (`isMobile === true`), cả 3 bảng `plugins`, `plans`, `subscriptions` tự động ẩn các cột phụ và gộp thông tin (`version`, `is_core`, `status`, `price_monthly_usd`, `plan_name`) vào ô chính, không gây tràn ngang màn hình `375px`.
- [x] Thanh lọc `VbenForm` tự động ẩn nhãn (`hideLabel`) trên mobile.

**Verification:**

- [x] Typecheck passes: `pnpm --filter @tuquet/admin-web run typecheck`

**Dependencies:** Task 51

**Files likely touched:**

- `apps/web-admin/src/views/system/plugins/index.vue`
- `apps/web-admin/src/views/system/plans/index.vue`
- `apps/web-admin/src/views/system/subscriptions/index.vue`

**Estimated scope:** Medium (3 files)

---

## Task 53: Tinh gọn Mobile-First & Chuẩn hóa Typography 7 bậc chữ cho 3 màn hình IAM & Kiểm toán (`users/index.vue`, `roles/index.vue`, `audit-logs/index.vue`) + Build Local

**Description:** Tích hợp `usePreferences().isMobile` vào `getColumns()` và `commonConfig.hideLabel` của `users/index.vue`, `roles/index.vue`, và `audit-logs/index.vue`; xóa bỏ toàn bộ class kích thước chữ tùy tiện `text-[11px]` trong `users/index.vue`, `roles/index.vue` và `audit-logs/index.vue` (thay bằng `text-2xs`); sau đó chạy toàn bộ cổng kiểm định chất lượng và `pnpm run build:local`.

**Acceptance criteria:**

- [x] Khi `isMobile === true`, cả 3 bảng `users`, `roles` (cả 2 tab Roles & Permissions), và `audit-logs` tự động ẩn cột phụ và gộp thông tin cốt lõi vào ô chính + cột thao tác gọn nhẹ.
- [x] `0` kết quả `text-[11px]` trong toàn bộ `apps/web-admin/src/views/system/`.
- [x] `pnpm run check:i18n`, `vitest`, `typecheck`, `lint`, và `pnpm run build:local` hoàn tất với `0 errors`.

**Verification:**

- [x] i18n check passes: `pnpm run check:i18n`
- [x] Unit tests pass: `pnpm exec vitest run apps/web-admin/src/api/core/__tests__/system-overview.test.ts`
- [x] Typecheck & Lint pass: `pnpm --filter @tuquet/admin-web run typecheck && pnpm run lint`
- [x] Local build succeeds: `pnpm run build:local`

**Dependencies:** Task 52

**Files likely touched:**

- `apps/web-admin/src/views/system/users/index.vue`
- `apps/web-admin/src/views/system/roles/index.vue`
- `apps/web-admin/src/views/system/audit-logs/index.vue`
- `apps/web-admin/docs/specs/SPEC-system-dashboard.md`
- `tasks/plan.md`
- `tasks/todo.md`

**Estimated scope:** Medium (6 files)

---

## Checkpoint 2: After Tasks 52–53 (Complete Quality Gate & Local Build)

- [x] `pnpm run check:i18n` pass 100%.
- [x] `vitest`, `typecheck`, và `lint` pass 100% (`0 errors`).
- [x] `pnpm run build:local` đóng gói thành công tại `http://100.68.217.61/`.

---

## Nhiệm Vụ Hiện Hành: Module `mobile-vxe-detail-sheet` (`SPEC-mobile-vxe-detail-sheet.md` v2.0 — Enterprise Dynamic Schema & RLS)

## Task 54: Xây dựng Tầng Engine Động Supabase Schema & RLS (`src/api/core/supabase-schema-registry.ts`) + Unit Tests

**Description:** Xây dựng sổ đăng ký trung tâm `SUPABASE_TABLE_REGISTRY` trong `apps/web-admin/src/api/core/supabase-schema-registry.ts` ánh xạ toàn bộ **18 bảng dữ liệu trên 5 schema PostgREST** (`public`, `automa`, `runners`, `commerce`, `billing`) phục vụ 19 bảng `useVbenVxeGrid`. Bao gồm: (1) siêu dữ liệu cột (`type`, `editable`, `required`, `enumMeta` liên kết trực tiếp tới `@vben/constants` để sinh options động qua `buildEnumFilterOptions`), (2) bộ đánh giá chính sách Row-Level Security `evaluateRowRlsPolicy(resource, row, effectiveAccess)` khớp với các `CREATE POLICY` trong Supabase SQL migrations (khóa chỉnh sửa tự động nếu `row.is_system === true` trên `roles`, hoặc sổ cái bất biến `audit_logs` / `wallet_transactions`, hoặc thiếu quyền tenant RBAC), (3) bộ suy luận schema động `buildDynamicVxeFormSchema(row, gridColumns, resource)` hợp nhất cột `VxeGrid` + schema DB + các trường thực tế của `row`, và (4) bộ thực thi CRUD `computeDirtyMutablePayload` & `executeDynamicSupabasePatch`. Viết bộ unit tests toàn diện trong `supabase-schema-registry.test.ts`.

**Acceptance criteria:**

- [x] `SUPABASE_TABLE_REGISTRY` định nghĩa đầy đủ 18 bảng dữ liệu trên 5 schemas (`public`, `automa`, `runners`, `commerce`, `billing`) kèm `primaryKey`, `columns`, và `rls`.
- [x] `evaluateRowRlsPolicy` đánh giá chính xác quyền `canUpdate` và `canDelete` theo `EffectiveAccess` và trạng thái dòng (`is_system`, `is_core`, `my_role`, `rls_append_only_ledger`).
- [x] `buildDynamicVxeFormSchema` tự động suy luận đầy đủ 100% trường của dòng (bao gồm các cột bị ẩn trên Mobile `< 640px`) và sinh options `<VxeSelect>` động từ `@vben/constants`.
- [x] `computeDirtyMutablePayload` chỉ lấy các cột `editable: true` có thay đổi thực sự, loại bỏ hoàn toàn các trường ảo/join.
- [x] Unit tests trong `apps/web-admin/src/api/core/__tests__/supabase-schema-registry.test.ts` pass 100%.

**Verification:**

- [x] Tests pass: `pnpm --filter @tuquet/admin-web exec vitest run src/api/core/__tests__/supabase-schema-registry.test.ts`
- [x] Typecheck passes: `pnpm --filter @tuquet/admin-web run typecheck`

**Dependencies:** None

**Files likely touched:**

- `apps/web-admin/src/api/core/supabase-schema-registry.ts`
- `apps/web-admin/src/api/core/index.ts`
- `apps/web-admin/src/api/core/__tests__/supabase-schema-registry.test.ts`

**Estimated scope:** Medium (3 files)

---

## Task 55: Kích hoạt `VxeSwitch`/`VxeTextarea`, Xây dựng `VxeRowDetailSheet.vue` (`Sheet` + `VxeForm` + RLS Badge) & Tích hợp Tự động vào `useVbenVxeGrid` (`src/adapter/vxe-table.ts`)

**Description:** Đăng ký `VxeSwitch`, `VxeTextarea` trong `packages/effects/plugins/src/vxe-table/init.ts`. Xây dựng `apps/web-admin/src/components/vxe-detail-sheet/vxe-row-detail-sheet.vue` kết hợp `@tuquet/vue-ui` `Sheet` (`side="bottom"` trên Mobile, `side="right"` trên Desktop) và `VxeForm` (`#/adapter/vxe-table`), hiển thị huy hiệu chính sách RLS (`RLS Policy Badge`), phân nhóm trường nghiệp vụ cho phép sửa (`Editable Fields`) và trường hệ thống chỉ đọc (`System & Read-Only Metadata` + JSONB Inspector + Copy 1 chạm), đồng thời tự động kế thừa slot Action của dòng (`#actions-cell`, `#action-cell`, `#role-actions-cell`, `#detail-cell`) vào `SheetFooter`. Nâng cấp `useVbenVxeGrid` trong `apps/web-admin/src/adapter/vxe-table.ts` để tự động bọc mọi bảng với `VxeRowDetailSheet`, lắng nghe `cellClick` (qua `isInteractiveCellClick`), và cung cấp `gridApi.openDetailSheet(row)`.

**Acceptance criteria:**

- [x] `init.ts` đăng ký đầy đủ `VxeForm`, `VxeFormItem`, `VxeInput`, `VxeTextarea`, `VxeSelect`, `VxeSwitch`, `VxeNumberInput`.
- [x] `useVbenVxeGrid` trong `src/adapter/vxe-table.ts` tự động mở `VxeRowDetailSheet` khi click vào dòng (`cellClick`), tự động suy luận `resource` từ route/options, và tự động chuyển tiếp slot cột thao tác của dòng vào `SheetFooter`.
- [x] Unit tests trong `apps/web-admin/src/components/vxe-detail-sheet/__tests__/vxe-row-detail-sheet.test.ts` pass 100%.

**Verification:**

- [x] Tests pass: `pnpm --filter @tuquet/admin-web exec vitest run src/components/vxe-detail-sheet/__tests__/vxe-row-detail-sheet.test.ts`
- [x] i18n & Typecheck pass: `pnpm run check:i18n && pnpm --filter @tuquet/admin-web run typecheck`

**Dependencies:** Task 54

**Files likely touched:**

- `packages/effects/plugins/src/vxe-table/init.ts`
- `apps/web-admin/src/adapter/vxe-table.ts`
- `apps/web-admin/src/components/vxe-detail-sheet/types.ts`
- `apps/web-admin/src/components/vxe-detail-sheet/vxe-row-detail-sheet.vue`
- `apps/web-admin/src/components/vxe-detail-sheet/index.ts`
- `apps/web-admin/src/components/vxe-detail-sheet/__tests__/vxe-row-detail-sheet.test.ts`
- `packages/locales/src/langs/en-US/common.json`
- `packages/locales/src/langs/vi-VN/common.json`

**Estimated scope:** Medium (8 files)

---

## Task 56: Rà soát & Chuẩn hóa Mobile-First + Liên kết Schema/Actions cho 12 Bảng thuộc Workspaces, Automation & Commerce (`9 Views`)

**Description:** Rà soát toàn diện 12 bảng `useVbenVxeGrid` thuộc 3 phân hệ Workspaces (`tenants/index.vue`), Automation (`workflows`, `runs`, `devices`, `browsers`, `proxies`), và Commerce (`commerce/orders`, `commerce/wallet`, và 4 bảng `ProductsGrid`, `OrdersGrid`, `IntentsGrid`, `GatewaysGrid` trong `commerce/admin/index.vue`): gắn kết `detailSheetOptions: { resource }` rõ ràng, bổ sung cột/nút thao tác còn thiếu (như trên `browsers`, `proxies`, `wallet`), và đảm bảo thu gọn cột Mobile-First (`isMobile`) đồng nhất.

**Acceptance criteria:**

- [x] Cả 12 bảng thuộc Workspaces, Automation và Commerce đều mở `VxeRowDetailSheet` khi click vào dòng, hiển thị đúng chính sách RLS, đầy đủ trường dữ liệu trên `VxeForm`, lưu `PATCH` thành công và hiển thị đầy đủ Action Buttons ở `SheetFooter`.
- [x] Các bảng `devices`, `browsers`, `proxies`, `commerce/orders`, `commerce/wallet`, `commerce/admin` được tối ưu cột Mobile-First (`isMobile`) không tràn ngang trên màn hình `375px`.

**Verification:**

- [x] Typecheck passes: `pnpm --filter @tuquet/admin-web run typecheck`

**Dependencies:** Task 55

**Files likely touched:**

- `apps/web-admin/src/views/tenants/index.vue`
- `apps/web-admin/src/views/automation/workflows/index.vue`
- `apps/web-admin/src/views/automation/runs/index.vue`
- `apps/web-admin/src/views/automation/devices/index.vue`
- `apps/web-admin/src/views/automation/browsers/index.vue`
- `apps/web-admin/src/views/automation/proxies/index.vue`
- `apps/web-admin/src/views/commerce/orders/index.vue`
- `apps/web-admin/src/views/commerce/wallet/index.vue`
- `apps/web-admin/src/views/commerce/admin/index.vue`

**Estimated scope:** Medium (9 files, 12 grids)

---

## Task 57: Rà soát & Chuẩn hóa Liên kết Schema/Actions cho 7 Bảng thuộc System Governance (`6 Views`) + Kiểm định Toàn diện & `build:local`

**Description:** Rà soát và gắn kết `detailSheetOptions: { resource }` + chuẩn hóa Action Slots cho 7 bảng thuộc `/system/*` (`plugins`, `plans`, `users`, 2 bảng `RolesGrid` & `PermissionsGrid` trong `roles`, `subscriptions`, `audit-logs`). Chạy toàn bộ cổng kiểm định chất lượng (`check:i18n`, `vitest run`, `typecheck`), cập nhật trạng thái `SPEC-mobile-vxe-detail-sheet.md` sang `ACCEPTED & IMPLEMENTED`, và đóng gói `pnpm run build:local`.

**Acceptance criteria:**

- [x] Toàn bộ 7 bảng thuộc `/system/*` mở `VxeRowDetailSheet` nhất quán khi click vào dòng, áp dụng đúng chính sách RLS (`roles` hệ thống và `audit_logs` tự động khóa chỉ đọc với RLS badge; `plans`, `plugins`, `subscriptions`, `custom roles` cho phép sửa + lưu `PATCH` qua `VxeForm`).
- [x] `pnpm run check:i18n`, `vitest run`, `typecheck`, và `pnpm run build:local` hoàn tất với `0 errors`.

**Verification:**

- [x] Full quality gate & local build pass (`0 errors`).

**Dependencies:** Task 56

**Files likely touched:**

- `apps/web-admin/src/views/system/plugins/index.vue`
- `apps/web-admin/src/views/system/plans/index.vue`
- `apps/web-admin/src/views/system/users/index.vue`
- `apps/web-admin/src/views/system/roles/index.vue`
- `apps/web-admin/src/views/system/subscriptions/index.vue`
- `apps/web-admin/src/views/system/audit-logs/index.vue`
- `apps/web-admin/docs/specs/SPEC-mobile-vxe-detail-sheet.md`
- `tasks/plan.md`
- `tasks/todo.md`

**Estimated scope:** Medium (9 files, 7 grids)
