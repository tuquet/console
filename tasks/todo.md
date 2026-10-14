# Danh Sách Nhiệm Vụ Triển Khai (Tasks / Todo)

- [x] Task 1: Đồng bộ hạ tầng build cục bộ `build:local` và PWA auto-update
  - Acceptance: `scripts/build-local.sh` tồn tại với quyền thực thi, `package.json` có script `"build:local"`, và `apps/web-admin/vite.config.ts` có cấu hình PWA `autoUpdate`.
  - Verify: Chạy thử `bash ./scripts/build-local.sh` và kiểm tra `curl -s http://127.0.0.1/.build-meta.json`.
  - Files: `package.json`, `apps/web-admin/vite.config.ts`, `scripts/build-local.sh`.

- [x] Task 2: Chuẩn hóa ngôn ngữ tài liệu Pre-Release Clean Slate trong `docs/specs/`
  - Acceptance: Loại bỏ các từ ngữ so sánh "tương thích ngược" hoặc "chữ ký cũ" tại `SPEC-route-foundation.md` và `SPEC-data-access.md`.
  - Verify: `grep -rn "tương thích ngược" docs/` trả về rỗng.
  - Files: `docs/specs/SPEC-route-foundation.md`, `docs/specs/SPEC-data-access.md`.

- [x] Task 3: Nâng cấp cẩm nang kỹ thuật `specter-admin` (8 Trụ Cột)
  - Acceptance: Viết lại `/root/.gemini/config/plugins/specter/skills/specter-admin/SKILL.md` theo chuẩn Ponytail Standard với đầy đủ 8 trụ cột: Monorepo Topology, 22 Routes, Supabase SSOT, Shadcn Slate Tokens, Preferences Engine 5 Invariants, Quality Gate, Local Verification, Troubleshooting Recipes.
  - Verify: Kiểm tra file tồn tại, đúng định dạng YAML frontmatter và kiểm tra các liên kết.
  - Files: `/root/.gemini/config/plugins/specter/skills/specter-admin/SKILL.md`.

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
    1. Bổ sung 2 bất biến bắt buộc vào `/root/.gemini/config/plugins/specter/rules/AGENTS.md` và `/root/tuquet/AGENTS.md`: _Runtime Viewport State Preservation on Reset_ và _Enterprise Typography & Sentence Case Invariant_.
    2. Nâng cấp cẩm nang kỹ thuật `/root/.gemini/config/plugins/specter/skills/specter-admin/SKILL.md`: thêm Mục 4.4 (_Enterprise Typography Standards & 3 Allowed Uppercase Exceptions_) và cập nhật Mục 5 (_Preferences Engine 7 Invariants_).
  - Verify: Kiểm tra cấu trúc file và tính toàn vẹn của Markdown.
  - Files: `rules/AGENTS.md`, `tuquet/AGENTS.md`, `skills/specter-admin/SKILL.md`.

- [x] Task 7: Thực thi quy chuẩn UI Brevity & Anti-Verbosity Invariant
  - Acceptance:
    1. Bổ sung rule bất biến `UI Brevity & Anti-Verbosity Invariant` vào `rules/AGENTS.md`, `tuquet/AGENTS.md`, và `skills/specter-admin/SKILL.md`.
    2. Sửa tiêu đề thẻ dài dòng `Phân Bổ Plugins Cốt Lõi (Kernel vs Module)` và phụ đề `6 đã kích hoạt` thành `Phân bổ plugins` và `6 đang hoạt động` thông qua hệ thống i18n (`page.analytics.plugins_distribution` & `page.analytics.active`).
    3. Typecheck sạch 0 lỗi, local build thành công phục vụ Tailscale preview.
  - Verify: `turbo run typecheck` thành công, `oxfmt --check` đạt chuẩn, `build-local.sh` thành công.
  - Files: `rules/AGENTS.md`, `tuquet/AGENTS.md`, `skills/specter-admin/SKILL.md`, `apps/web-admin/src/views/dashboard/analytics/index.vue`, `apps/web-admin/src/locales/langs/vi-VN/page.json`, `apps/web-admin/src/locales/langs/en-US/page.json`.

- [x] Task 8: Chuẩn hóa thuật ngữ Cross-Platform & Tinh giản giao diện Fleet Metrics
  - Acceptance:
    1. Rà soát và loại bỏ hoàn toàn các thuật ngữ đặc thù Windows đơn nền tảng như `Tiến trình Win32 Job Object` khỏi giao diện người dùng cuối.
    2. Thay thế bằng thuật ngữ đa nền tảng trung lập, trực quan: `Tác vụ đang chạy` / `Phiên tự động hóa nền tảng` (`Automated workflow sessions`).
    3. Di chuyển toàn bộ các chuỗi giao diện trong `fleet-metrics.vue` sang i18n chuẩn (`$t('page.fleet_view.*')`), tuân thủ triệt để Sentence case và UI Brevity.
  - Verify: `turbo run typecheck` 0 lỗi, `oxfmt --check` đạt chuẩn, `build-local.sh` thành công.
  - Files: `apps/web-admin/src/views/fleet/devices/components/fleet-metrics.vue`, `apps/web-admin/src/locales/langs/vi-VN/page.json`, `apps/web-admin/src/locales/langs/en-US/page.json`.

- [x] Task 9: Tích hợp Vben VXE Table (`useVbenVxeGrid`) cho các danh sách dữ liệu hệ thống
  - Acceptance:
    1. Thay thế bảng HTML table thô bằng `useVbenVxeGrid` từ bộ core adapter `#/adapter/vxe-table`.
    2. Áp dụng cho 5 view danh sách cốt lõi:
       - `system/users`: Quản lý người dùng nền tảng (Avatar, UUID, Workspaces, Ngày tham gia).
       - `system/plans`: Gói cước & định mức tài nguyên dịch vụ (Tên gói, Giá cước, User limit, Storage, Runs, Trạng thái).
       - `system/subscriptions`: Thuê bao nền tảng (Workspace, Gói cước, Đơn giá, Trạng thái, Kỳ gia hạn, Tự động gia hạn).
       - `system/plugins`: Plugins hệ thống (Plugin name/id, Phân loại core/extension, Schema version, Trạng thái).
       - `automation/workflows`: Quy trình tự động hóa (Tên quy trình, Phiên bản, Trạng thái, Thời gian).
- [x] Task 10: Xử lý triệt để hiệu ứng chuyển trang (Transition Effect) & Giữ nguyên vị trí cuộn (Scroll Preservation) khi thay đổi Query String
  - Acceptance:
    1. Chuẩn hóa `rawKey` trong `tabbar.ts`: mặc định dùng `path` cho router-view key, ngăn Virtual DOM unmount/remount khi thay đổi query params trên cùng một trang.
    2. Triệt tiêu hiệu ứng chuyển cảnh (`fade-slide`) trên cùng route path trong `useLayoutHook` (`getTransitionName` trả về `undefined` và `<Transition :css="Boolean(getTransitionName(route))">`).
    3. Giữ nguyên vị trí cuộn trên Mobile và Desktop khi chuyển tab query (`use-layout-scroll.ts` và Vue Router `scrollBehavior` không scroll về top 0 khi `to.path === from.path`).
    4. Cập nhật unit tests cho `tabbar.test.ts`, `use-layout.test.ts`, và `use-layout-scroll.test.ts` (100% passed).
    5. Lưu giữ quy chuẩn bất biến _Intra-Page Navigation & Scroll Preservation Invariant_ và kiến trúc _VxeTable & Component Adapter_ vào Rules và Skills qua `/learn`.
  - Verify: 52 unit tests passed, `turbo run typecheck` 0 lỗi, `build-local.sh` triển khai thành công tại `http://100.68.217.61/`.

- [x] Task 11: Chuẩn hóa VxeTable toàn diện, loại bỏ CSS can thiệp thô bạo và tối ưu giao diện Mobile
  - Acceptance:
    1. Loại bỏ hoàn toàn các đoạn CSS hardcode thô bạo (`border-right: none !important`, `:deep(.vxe-table) { display: none !important }`) và khôi phục hệ thống đường kẻ phân tách dạng token tinh tế (`--vxe-ui-table-resizable-line-color: hsl(var(--border) / 50%)`, `--vxe-ui-table-border-color: hsl(var(--border) / 40%)`).
    2. Di chuyển toàn bộ các màn hình danh sách còn lại sang `useVbenVxeGrid`:
       - `fleet/devices`: Thiết bị & máy chủ phân tán (Trạng thái, Tên/Hostname, IP, OS, RAM/CPU, Thao tác).
       - `fleet/proxies`: Cổng proxy định tuyến (Địa chỉ/Cổng, Loại mạng, Độ trễ, Tỷ lệ lỗi, Trạng thái).
       - `fleet/browsers`: Phiên trình duyệt cách ly (Hồ sơ, Kích thước lưu trữ, Trạng thái khóa, Định tuyến proxy, Trình duyệt).
       - `automation/runs`: Nhật ký thực thi quy trình (Quy trình, Trạng thái, Tiến độ, Máy chủ thực thi, Thời lượng, Thời gian bắt đầu).
       - `tenants`: Quản trị workspace / tổ chức khách hàng (Tên tổ chức, Slug, Gói cước, Số thành viên, Trạng thái).
       - `system/audit-logs`: Nhật ký kiểm toán an ninh & truy vết (Hành động, Tác nhân, IP, Thời gian).
    3. Tích hợp bộ lọc tìm kiếm đầy đủ (`formOptions` với `Select` adapter, search keyword, layout vertical chuẩn, nút `Lọc kết quả` / `Đặt lại`).
    4. Tối ưu giao diện mobile tự nhiên: cuộn ngang linh hoạt (`overflow-x: auto`), phân trang căn giữa, không nhân bản thẻ card thô sơ, tuân thủ nghiêm ngặt Enterprise Typography & Sentence case.
  - Verify: 52 unit tests passed, `turbo run typecheck` 0 lỗi trên toàn bộ monorepo, `build-local.sh` triển khai thành công tại `http://100.68.217.61/` với ZERO GIT PUSH.
  - Files: `packages/effects/plugins/src/vxe-table/style.css`, `apps/web-admin/src/views/automation/runs/index.vue`, `apps/web-admin/src/views/fleet/devices/index.vue`, `apps/web-admin/src/views/fleet/proxies/index.vue`, `apps/web-admin/src/views/fleet/browsers/index.vue`, `apps/web-admin/src/views/tenants/index.vue`, `apps/web-admin/src/views/system/plans/index.vue`, `apps/web-admin/src/views/system/subscriptions/index.vue`, `apps/web-admin/src/views/system/users/index.vue`, `apps/web-admin/src/views/system/plugins/index.vue`, `apps/web-admin/src/views/system/audit-logs/index.vue`.

- [x] Task 13: Tinh giản i18n & Tái sử dụng Common Actions (Nói ít hiểu nhiều)
  - Acceptance:
    1. Cài đặt công cụ CLI `vue-i18n-extract` và thiết lập lệnh `pnpm run check:i18n` vào root `package.json`.
    2. Mở rộng bộ từ vựng hành động dùng chung trong `packages/locales/src/langs/*/common.json`: `create` ("Tạo" / "Create"), `add` ("Thêm"), `save` ("Lưu"), `filter` ("Lọc"), `connect` ("Ghép nối"), `export`, `import`.
    3. Chuẩn hóa toàn bộ `vi-VN/common.json` về Sentence case (không viết hoa từng từ).
    4. Tinh gọn nhãn nút trên trang Workspace từ "Tạo workspace" -> **`Tạo`** / **`Create`** (kết hợp icon `<Plus />`), rút gọn `empty_prompt`.
    5. Rà soát và thay thế toàn bộ các chuỗi hardcode và nhãn nút lặp lại trên 8 view dữ liệu (`tenants`, `fleet/devices`, `fleet/browsers`, `fleet/proxies`, `automation/workflows`, `automation/runs`, `system/*`) sang sử dụng `$t('common.refresh')`, `$t('common.filter')`, `$t('common.reset')`, `$t('common.create')`.
  - Verify: `pnpm run check:i18n` phát hiện chính xác, `pnpm run build:local` thành công 11/11 tasks (Code 0), Tailscale preview tại `http://100.68.217.61/`.
  - Files: `package.json`, `packages/locales/src/langs/*/common.json`, `apps/web-admin/src/locales/langs/*/page.json`, `apps/web-admin/src/views/tenants/index.vue`, `apps/web-admin/src/views/tenants/components/*.vue`, `apps/web-admin/src/views/system/*/index.vue`, `apps/web-admin/src/views/fleet/*/index.vue`, `apps/web-admin/src/views/automation/*/index.vue`, `docs/specs/SPEC-concise-common-i18n.md`, `docs/specs/capability-map.md`.

- [x] Task 14: Hợp nhất router tree phân hệ Fleet và Automation vào một menu
  - Acceptance:
    1. Chuyển toàn bộ 3 tuyến đường thiết bị runner, browser profiles và proxy pool vào module router automation.
    2. Cấu trúc menu gốc Tự động hóa gồm 5 mục con theo thứ tự: Quy trình, Lịch sử chạy, Thiết bị, Browser profiles, Proxy pool.
    3. Cấu hình module router fleet thành các tuyến đường redirect ẩn chuyển tiếp tự động sang automation để bảo toàn liên kết cũ.
    4. Cập nhật thứ tự hiển thị menu hệ thống thành 30 và chuyển hướng fleet trong dashboard.
    5. Đạt 100% kiểm thử 89 files và 667 unit tests pass, typecheck 0 lỗi.
  - Verify: 89 test files pass, vue-tsc 0 lỗi, build-local.sh thành công và phục vụ tại http://100.68.217.61/ với tiêu chuẩn zero git push.
  - Files: `apps/web-admin/src/router/routes/modules/automation.ts`, `apps/web-admin/src/router/routes/modules/fleet.ts`, `apps/web-admin/src/router/routes/modules/dashboard.ts`, `apps/web-admin/src/router/routes/modules/system.ts`, `apps/web-admin/src/views/tenants/components/workspace-overview-tab.vue`, `docs/specs/SPEC-route-consolidation-automation-fleet.md`.

- [x] Task 15: Chuẩn hóa toàn bộ các trang chi tiết và modal sang VXE UI Form
  - Acceptance:
    1. Đăng ký và tích hợp VxeForm, VxeFormItem, VxeFormGroup, VxeFormGather vào hệ thống core plugin và adapter `#/adapter/vxe-table`.
    2. Định kiểu CSS variables theme tối và sáng đồng nhất cùng thiết kế đáp ứng trên thiết bị di động trong style.css.
    3. Chuyển đổi toàn bộ các trang chi tiết sang VxeForm: Chi tiết phiên chạy automation runs detail, Tab tổng quan tổ chức workspace overview tab, Hồ sơ cá nhân profile, Đổi mật khẩu security.
    4. Chuyển đổi toàn bộ các hộp thoại modal sang VxeForm: Chi tiết thiết bị node detail modal, Tạo workspace, Cập nhật workspace, Mời thành viên, Phân quyền thành viên.
    5. Đảm bảo toàn bộ nhãn và chuỗi giao diện tuân thủ Sentence case và không chứa dấu ngoặc đơn.
    6. Kiểm định chất lượng: vue-tsc đạt 0 lỗi, 89 test files và 667 unit tests pass 100%, build-local.sh triển khai thành công lên Nginx cục bộ và Tailscale mesh.
  - Verify: `pnpm --filter @tuquet/admin-web run typecheck` đạt 0 lỗi, `pnpm test:unit` pass 667/667, `bash ./scripts/build-local.sh` thành công.
  - Files: `packages/effects/plugins/src/vxe-table/init.ts`, `packages/effects/plugins/src/vxe-table/index.ts`, `packages/effects/plugins/src/vxe-table/style.css`, `apps/web-admin/src/adapter/vxe-table.ts`, `apps/web-admin/src/views/automation/runs/detail.vue`, `apps/web-admin/src/views/fleet/devices/components/modals/node-detail-modal.vue`, `apps/web-admin/src/views/tenants/components/workspace-overview-tab.vue`, `apps/web-admin/src/views/_core/profile/index.vue`, `apps/web-admin/src/views/tenants/components/modals/*.vue`.

