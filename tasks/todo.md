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
