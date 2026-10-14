# Bản Đồ Năng Lực Hệ Thống (Admin Capability Map)

> Trạng thái: **ĐÃ HOÀN THÀNH** (100% 14/14 Modules) | Kiến trúc nguồn: [`docs/architecture/overview.md`](../architecture/overview.md)

| Module id | Trách nhiệm | Phụ thuộc |
| :-- | :-- | :-- |
| `platform-foundation` | Kiến trúc monorepo, hạ tầng build cục bộ `build:local`, vòng đời PWA auto-update, và cổng kiểm định chất lượng | — |
| `data-access` | `supabaseRequest({ schema })` (`Accept-Profile` / `Content-Profile`); quyền hiệu lực từ DB (superadmin + user thường); danh sách plugin `installed` | `platform-foundation` |
| `route-foundation` | Phân rã module định tuyến theo ranh giới Plugin; `meta.authority` + bộ lọc `filterRoutesByPlugins()`; chuẩn hóa trang chủ `/dashboard/analytics` | `data-access` |
| `tenants-truth` | `/tenants/:id` gồm 4 tabs `overview / members / usage / audit` với dữ liệu thật; mời thành viên (`role_id`, `token_hash`, `invited_by`) và gán role qua `member_roles`; gói cước từ `billing.subscriptions` | `route-foundation` |
| `fleet-inventory` | Quản trị máy trạm `runners.devices`, hồ sơ trình duyệt `runners.browsers`, và bể proxy `runners.proxies` — 100% dữ liệu thật từ schema `runners` | `route-foundation` |
| `automation-engine` | Quản trị quy trình `automa.workflows`, phiên chạy `automa.campaign_runs`, và chi tiết nhật ký thực thi `automa.execution_logs` (polling 3s) | `route-foundation` |
| `system-catalog` | Quản trị `/system/plugins` (`public.system_plugins`) và `/system/plans` (`billing.plans`) | `route-foundation` |
| `superadmin-routes` | `/system/users`, `/system/audit-logs`, `/system/subscriptions`, `/system/roles` — đặc quyền giám sát xuyên tenant cho Platform Superadmin | `route-foundation`, `system-catalog` |
| `layout-preferences-coherence` | Kiểm toán chống khóa giao diện (Anti-Lockout), bảo vệ điều hướng Sidebar, đồng bộ hóa 100% Preferences Drawer và Layout | `platform-foundation` |
| `i18n-en-vi` | Kiến trúc đa ngôn ngữ `en-US` / `vi-VN` mặc định `en-US`, đồng bộ `dayjs` và chuyển ngữ tức thì | `platform-foundation` |
| `concise-common-i18n` | Tối giản nhãn nút (Brevity & Anti-Verbosity), từ điển thuật ngữ chuẩn `term.json`, tái sử dụng `$t('common.*')`, chuẩn hóa Sentence case tiếng Việt | `i18n-en-vi` |
| `route-consolidation-automation-fleet` | Hợp nhất phân hệ Fleet và Automation vào một menu cấp 1 duy nhất `/automation` (gồm `workflows`, `runs`, `devices`, `browsers`, `proxies`) | `fleet-inventory`, `automation-engine` |
| `docs-and-admin-coherence` | Dời `src/views/fleet/*` sang `src/views/automation/*`, xóa legacy redirects, khôi phục `meta.plugin` trong `automation.ts`, ban hành `ADR-004` + `docs/README.md`, và làm sạch dữ liệu hạ tầng | `route-consolidation-automation-fleet`, `concise-common-i18n` |
| `automation-api-and-i18n-unification` | Hợp nhất `src/api/core/fleet.ts` vào `src/api/core/automation.ts`, `fleet.test.ts` vào `automation.test.ts`, và `page.fleet.*` vào `page.automation.*` trên nền kiến trúc 2 schema DB (`automa` + `runners`) | `docs-and-admin-coherence` |
| `system-iam-vxe-grid` | Chuẩn hóa giao diện bảng `useVbenVxeGrid` (`vxe-table`) cho `/system/users` và `/system/roles`: tìm kiếm đa trường (tên, email, UUID, workspace, mã quyền), lọc theo vai trò/module, thanh thống kê và hộp thoại chi tiết | `superadmin-routes`, `concise-common-i18n` |
| `payment-gateway` | Cổng thanh toán đa nền tảng mở rộng theo chuẩn Provider Adapter (`bank_transfer` VietQR/IBFT, `e_wallet` MoMo/ZaloPay, `card_intl` Stripe, `crypto` USDT, `internal_wallet` trừ Xu tức thì), Ví trả trước của Tenant (`billing.wallets` đơn vị `Xu` `BIGINT`), sổ cái `billing.wallet_transactions`, `billing.payment_intents` (có trạng thái `manual_review` khi quá hạn/thiếu tiền) và Edge Function `payment-webhook` | `data-access`, `system-catalog` |
| `digital-commerce` | Plugin cửa hàng sản phẩm số (`commerce`): Danh mục & biến thể sản phẩm số (Tài khoản/Key `serial_stock`, Tài nguyên Specter `specter_resource`, File tải về `digital_file`, Nạp Xu `wallet_credit`), Kho hàng chống bán trùng (`FOR UPDATE SKIP LOCKED`), máy trạng thái đơn hàng (`commerce.orders`) và bộ điều phối giao hàng tự động (Auto-Fulfillment) | `payment-gateway` |
| `admin-commerce-portal` | Giao diện Web kép trong `apps/web-admin`: (1) Platform Admin quản trị sản phẩm, nạp kho hàng loạt (bulk stock), cấu hình cổng thanh toán & duyệt lệnh `manual_review`; (2) Tenant Portal nạp Ví Xu, mua sản phẩm số và nhận tài nguyên ngay trong dashboard | `payment-gateway`, `digital-commerce`, `system-iam-vxe-grid` |
| `public-storefront` | Giao diện Web Storefront công khai (`/store`) cho khách vãng lai (Guest Checkout): xem danh mục công khai, thanh toán tức thì qua Chuyển khoản NH / MoMo / Stripe / Crypto (Realtime Polling) và nhận sản phẩm ngay qua `claim_token` bảo mật | `payment-gateway`, `digital-commerce` |
| `specter-3d-ghost-banner` | Bộ sưu tập 3 banner tương tác trên trang xác thực (`AuthPageLayout`): `HairlinePhoneBanner` (`phone`), `SplineRobotBanner` (`robot 3d`), và `SpecterGhostBanner` (`ghost 3d` — Three.js WebGL 60fps với tà áo lượn sóng, mắt ngôi sao 4 cánh liếc theo chuột, tay vẫy chào) kèm thanh chọn 4 chế độ lưu `localStorage` | `platform-foundation` |

**Phụ thuộc ngoài (repo `cloud`):**

- `cloud:platform-superadmin` — `public.is_platform_admin()` + policy SELECT bổ sung. Đã hoàn tất tích hợp tại local migration `tuquet/cloud`.
- `cloud:payment-gateway` (`schema: billing` mở rộng + `supabase/functions/payment-webhook`) & `cloud:digital-commerce` (`supabase/plugins/commerce`, `schema: commerce`).

Build order: `platform-foundation` → (`data-access`, `layout-preferences-coherence`, `i18n-en-vi`, `specter-3d-ghost-banner`) → `route-foundation` → (`tenants-truth`, `fleet-inventory`, `automation-engine`, `system-catalog`) → (`superadmin-routes`, `concise-common-i18n`, `route-consolidation-automation-fleet`) → `docs-and-admin-coherence` → (`automation-api-and-i18n-unification`, `system-iam-vxe-grid`) → `payment-gateway` → `digital-commerce` → (`admin-commerce-portal`, `public-storefront`)

Danh sách Spec module:

- [`SPEC-platform-foundation.md`](SPEC-platform-foundation.md)
- [`SPEC-data-access.md`](SPEC-data-access.md)
- [`SPEC-route-foundation.md`](SPEC-route-foundation.md)
- [`SPEC-tenants-truth.md`](SPEC-tenants-truth.md)
- [`SPEC-fleet-inventory.md`](SPEC-fleet-inventory.md)
- [`SPEC-automation-engine.md`](SPEC-automation-engine.md)
- [`SPEC-system-catalog.md`](SPEC-system-catalog.md)
- [`SPEC-superadmin-routes.md`](SPEC-superadmin-routes.md)
- [`SPEC-layout-preferences-coherence.md`](SPEC-layout-preferences-coherence.md)
- [`SPEC-i18n-en-vi.md`](SPEC-i18n-en-vi.md)
- [`SPEC-concise-common-i18n.md`](SPEC-concise-common-i18n.md)
- [`SPEC-route-consolidation-automation-fleet.md`](SPEC-route-consolidation-automation-fleet.md)
- [`SPEC-docs-and-admin-coherence.md`](SPEC-docs-and-admin-coherence.md)
- [`SPEC-automation-api-and-i18n-unification.md`](SPEC-automation-api-and-i18n-unification.md)
- [`SPEC-system-iam-vxe-grid.md`](SPEC-system-iam-vxe-grid.md)
- [`SPEC-payment-gateway.md`](SPEC-payment-gateway.md)
- [`SPEC-digital-commerce.md`](SPEC-digital-commerce.md)
- [`SPEC-admin-commerce-portal.md`](SPEC-admin-commerce-portal.md)
- [`SPEC-specter-3d-ghost-banner.md`](SPEC-specter-3d-ghost-banner.md)
- `SPEC-public-storefront.md` _(Planned)_
