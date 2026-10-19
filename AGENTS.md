# Specter — Engineering Standards & Agent Guidelines

Tài liệu này xác lập các tiêu chuẩn kỹ thuật, thiết kế và quy trình phát triển bắt buộc áp dụng cho toàn bộ AI Agents và Kỹ sư phát triển trên kho lưu trữ `tuquet/admin`.

---

## 1. Triết lý Cốt Lõi: KISS & YAGNI

Hệ thống quản trị `admin.tuquet.com` kết nối trực tiếp đến **Tuquet Cloud** (`tuquet/cloud`) và quản lý kiến trúc **Multi-Tenant**. Giao diện và kiến trúc mã nguồn phải tuân thủ nghiêm ngặt hai nguyên tắc:

- **KISS (Keep It Simple, Stupid)**: Giữ mọi thứ đơn giản, trực diện, dễ bảo trì. Loại bỏ các tầng trừu tượng không cần thiết.
- **YAGNI (You Aren't Gonna Need It)**: Chỉ xây dựng những gì thực sự cần cho người quản trị hệ thống. Tuyệt đối không nhồi nhét "Feature Bloat" từ các template ERP cũ.

### Các quy tắc cụ thể:

1. **Không sử dụng Chrome Tabbar ảo trong SPA** (`tabbar: { enable: false }`):
   - Trình duyệt đã có thanh Tab. Không lồng thêm thanh tab kiểu Chrome trong web app làm mất 40px chiều cao màn hình quý giá của người dùng (nhất là trên điện thoại).
2. **Tối giản hóa Header**:
   - Không đưa vào các widget thừa thãi: khóa màn hình (lockScreen), chọn múi giờ thế giới (timezone selector).
   - Header chỉ giữ các thành phần cốt lõi: **Logo Tuquet** + **Chuyển đổi Ngôn ngữ/Theme & Preferences** + **Avatar Quản trị & Đăng xuất**.
3. **Sidebar tinh gọn trong 5 phân hệ nghiệp vụ**:
   - `Dashboard` (`/dashboard`), `Workspaces` (`/tenants`), `Automation` (`/automation`), `Commerce` (`/commerce`), và `System` (`/system`).

---

## 2. Tiêu Chuẩn Giao Diện: Shadcn Slate / Zinc Design System

Toàn bộ console áp dụng phong cách thiết kế hiện đại của **Shadcn** (phong cách Cloud Console như Supabase, Vercel, Linear):

- **Palette**: Tông màu Slate / Zinc trung tính, chiều sâu cao, độ tương phản hoàn hảo ở cả Light và Dark mode.
- **Thư viện UI**: Sử dụng các thành phần từ `@tuquet/vue-ui` và `useVbenVxeGrid` (`@tuquet/plugins/vxe-table`).
- **Borders & Radii**:
  - Viền siêu mỏng, tinh tế: `border border-border/60`.
  - Bo góc tiêu chuẩn: `rounded-xl` (12px) cho Cards/Containers, `rounded-lg` (8px) cho Input/Buttons.
- **Backgrounds**: Dùng `bg-card` kết hợp hiệu ứng kính `backdrop-blur` cho các popover/dialogs.
- **Không lồng ghép đa tầng**: Mỗi cụm thông tin dùng đúng 1 lớp Card phẳng, không lồng Card trong Card gây lãng phí padding.

### 2.1. Quy chuẩn Semantic Design Tokens (@tuquet/vue-ui)

- **Single Source of Truth (CSS Variables):** Cả Vben layout framework và component `@tuquet/vue-ui` đều chia sẻ cùng bộ Design Tokens HSL trong `internal/tailwind-config/src/theme.css` (`--background`, `--foreground`, `--primary`, `--border`, `--radius`).
- **Nghiêm cấm Hardcode mã màu:** Tuyệt đối không dùng mã màu tĩnh (như `bg-[#0f172a]`, `text-black`, `border-[#e2e8f0]`). Bắt buộc dùng semantic classes:
  - Nền & chữ: `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`.
  - Màu nhấn & thương hiệu: `bg-primary`, `text-primary-foreground`, `border-primary`.
  - Đường viền: `border-border` hoặc `border-input`.
  - Bo góc: `rounded-lg` (8px), `rounded-xl` (12px) kế thừa từ `--radius`.
- **Đảm bảo đồng bộ:** Mọi thay đổi trong `preferences.ts` (`theme.mode: 'dark'`, `theme.builtinType: 'neutral'`, `theme.radius: '0.5'`) sẽ tự động tác động đồng bộ lên 100% component giao diện.

---

## 3. Quy Chuẩn Icon: BẮT BUỘC DÙNG LUCIDE ICON

> [!IMPORTANT] **Tuyệt đối không sử dụng Emoji hoặc Icon chất lượng thấp làm biểu tượng giao diện.**

- **Chỉ sử dụng duy nhất Lucide Icons** (`@lucide/vue` hoặc `lucide-vue-next`).
- **Nghiêm cấm dùng Emojis** (như 🏢, 🧩, ⚡, 📡, ✓...) thay thế cho icon chức năng hay trạng thái hệ thống.
- Kích thước icon chuẩn:
  - Header actions / Buttons: `size-3.5` hoặc `size-4`.
  - Metric Card badge: `size-4.5` hoặc `size-5` đặt trong container `size-9 rounded-lg`.
  - Status indicators: `size-3.5` (kèm chữ mô tả rõ ràng).

---

## 4. Ưu Tiên Mobile-First & Chuẩn Hóa `useVbenVxeGrid` / `VxeForm` (`ADR-004`)

Mọi màn hình, bảng dữ liệu và cửa sổ tương tác (Modal/Drawer) đều phải được thiết kế và kiểm thử tối ưu từ màn hình di động nhỏ (`< 640px`):

1. **Grid Thống kê (Metric Cards)**:
   - Mobile: 1 cột (`grid-cols-1`).
   - Tablet: 2 cột (`sm:grid-cols-2`).
   - Desktop: 4 cột (`lg:grid-cols-4`).
2. **Bảng Dữ Liệu (`useVbenVxeGrid`) & Biểu Mẫu (`VxeForm`)**:
   - Toàn bộ các trang danh sách sử dụng `useVbenVxeGrid` từ [`apps/web-admin/src/adapter/vxe-table.ts`](apps/web-admin/src/adapter/vxe-table.ts) kèm bộ lọc `formOptions`, đường kẻ semantic token tinh tế (`--vxe-ui-table-border-color: hsl(var(--border) / 40%)`), cuộn ngang tự nhiên (`overflow-x: auto`) và thanh phân trang căn giữa trên thiết bị di động (`< 640px`).
   - Toàn bộ trang chi tiết và hộp thoại modal sử dụng `VxeForm`. Tuyệt đối không tự viết bảng HTML `<table>` thủ công.
3. **Nút Thao Tác (Action Buttons)**:
   - Trên mobile: Tự động xếp chồng dọc (stack) với độ rộng 100% (`w-full sm:w-auto`) để bấm 1 chạm dễ dàng.
4. **Hộp Thoại (Modals/Dialogs)**:
   - Chiều rộng tự thích ứng: `max-w-[calc(100vw-2rem)] sm:max-w-lg`.

---

## 5. Dữ Liệu Đo Đếm Thực Tế (100% Real Telemetry — Không Mock Data)

- **Tuyệt đối không sử dụng Mock Data, số ảo hoặc văn bản tiếng nước ngoài không liên quan (tiếng Trung)**.
- Mọi chỉ số trên các trang **Workspace**, **Commerce** và **Analytics** phải được truy vấn và tính toán trực tiếp từ **Tuquet Cloud**:
  - `public.tenants`: Số lượng Workspace, phân bổ gói thuê bao (Pro / Free / Enterprise), mốc thời gian tăng trưởng.
  - `public.system_plugins`: Trạng thái và schema của các Core Kernel Plugins (`core-iam`, `runners`, `automa`, `storage`, `subscriptions`, `webhooks`) và Extension Plugins (`commerce`, v.v.).
  - `Specter Fleet Bridge`: Trạng thái lắng nghe cổng SSO Desktop loopback (`127.0.0.1:8765`).
  - Độ trễ mạng thực tế (Latency Ms) giữa trình duyệt và Supabase REST API / Cloudflare Edge.

---

## 6. Quy Trình Kiểm Thử & Tiêu Chuẩn Kỹ Thuật

1. **Local-First Verification (Không Test trên Production)**:
   - Mọi thay đổi về giao diện và chức năng bắt buộc phải được build và kiểm thử cục bộ (Local) trước bằng Playwright headless browser ở cả hai chế độ:
     - **Desktop Viewport**: `1280 x 800`.
     - **Mobile Viewport**: `375 x 667` (hoặc `375 x 812`).
   - Lưu ảnh chụp màn hình vào thư mục `scratch/` để nghiệm thu trực quan trước khi commit.
   - Tuyệt đối không cố gắng chạy các kịch bản kiểm thử tự động trực tiếp trên môi trường live/production.
2. **Đảm bảo Chất lượng Mã Nguồn (Zero Errors)**:
   - Kiểu dữ liệu TypeScript: `pnpm --filter @tuquet/admin-web run typecheck` (`vue-tsc --noEmit --skipLibCheck`) phải kết thúc với **0 lỗi**.
   - Linting: `npx oxlint apps/web-admin/src/` phải kết thúc với **0 warnings, 0 errors**.
   - Định dạng: Tự động chạy `oxfmt` qua pre-commit hook của Lefthook.
3. **Quy Chuẩn Commit (Conventional Commits)**:
   - Tiêu đề commit phải tuân thủ định dạng Lefthook commitlint:
     - `feat(@tuquet/admin-web): <mô tả ngắn gọn>`
     - `fix(@tuquet/admin-web): <mô tả ngắn gọn>`
     - `refactor(@tuquet/admin-web): <mô tả ngắn gọn>`
   - Độ dài tiêu đề commit không được vượt quá **108 ký tự**.

---

## 7. Quy Tắc Bảo Vệ Quota CI & Quy Trình Đẩy Code Lên GitHub (Zero-Waste CI Gate)

> [!CAUTION] **TIẾT KIỆM TỐI ĐA PHÚT BUILD MIỄN PHÍ GITHUB ACTIONS — TUYỆT ĐỐI KHÔNG PUSH CODE THỬ VẬN MAY.** Mỗi lần GitHub Actions chạy tốn tài nguyên và thời gian runner. Lặp lại lỗi CI là vi phạm nghiêm trọng quy chuẩn kỹ thuật.

### 7.1. Cổng Kiểm Định Cục Bộ (Local Pre-Push Quality Gate)

Trước khi thực hiện `git push` lên bất kỳ nhánh nào (đặc biệt là `main`), Agent và Kỹ sư **BẮT BUỘC** phải chạy thành công 3 bước kiểm tra tại môi trường cục bộ:

1. **Kiểm tra Type TypeScript**:
   ```bash
   pnpm check:type
   ```
   _Kết quả yêu cầu:_ `vue-tsc` trả về **0 lỗi** trên toàn bộ packages.
2. **Kiểm tra Lint & Định dạng Mã Nguồn**:
   ```bash
   pnpm run lint
   ```
   _Kết quả yêu cầu:_ `oxfmt` + `eslint` + `stylelint` trả về **0 errors**. Nếu phát hiện lệch format, chạy `pnpm run format` để tự động chuẩn hóa.
3. **Kiểm tra Build Ứng Dụng Web**:
   ```bash
   pnpm run build:admin
   ```
   _Kết quả yêu cầu:_ Vite đóng gói thành công toàn bộ bundle `apps/web-admin/dist` không phát sinh lỗi module.

### 7.2. Quy Chuẩn Quản Lý Dependency & Catalog PNPM

- Mọi dependency dùng chung hoặc thư viện bên ngoài phải được khai báo phiên bản tập trung tại file [`pnpm-workspace.yaml`](pnpm-workspace.yaml) trong khối `catalog:`.
- Trong file `package.json` của từng ứng dụng/gói (ví dụ [`apps/web-admin/package.json`](apps/web-admin/package.json)): **BẮT BUỘC** dùng `"catalog:"`. Tuyệt đối không ghi phiên bản số trực tiếp (như `"0.2.1"`).
- Tuyệt đối không để lại các catalog item không được sử dụng (`pnpm/yaml-no-unused-catalog-item`).

### 7.3. Chiến Lược Tiết Kiệm Phút Build CI (CI Minutes Conservation)

1. **Bắt buộc gắn cờ `[skip ci]` cho commit tài liệu / phi mã nguồn**:
   - Khi commit chỉ thay đổi tài liệu (`*.md`), kế hoạch phân tích, ảnh chụp màn hình trong `scratch/`, ghi chú hoặc cấu hình IDE: **BẮT BUỘC** chèn `[skip ci]` hoặc `[ci skip]` vào tiêu đề commit.
   - Ví dụ: `docs: update zero-waste ci rules in agents guide [skip ci]`
2. **Gom Commit Thành Khối Hoàn Chỉnh (Atomic Batching — Cấm Micro-Push)**:
   - Nghiêm cấm push lắt nhắt từng commit sửa một vài ký tự.
   - Hãy gom các commit liên quan lại và chỉ push **duy nhất 1 lần** khi toàn bộ tính năng/bản vá đã hoàn chỉnh và đã vượt qua Cổng Kiểm Định Cục Bộ (7.1).
3. **Quản Lý & Dọn Dẹp CI Bằng GitHub CLI (`gh`)**:
   - Sau khi push, kiểm tra trạng thái CI: `gh run list -L 5`.
   - Xem log lỗi ngay khi có sự cố: `gh run view <run-id> --log-failed`.
   - **Hủy ngay lập tức các run thừa/treo**: Nếu phát hiện run CI bị lặp lại hoặc commit mới đã thay thế commit cũ, dùng lệnh `gh run cancel <run-id>` để lập tức giải phóng runner, bảo toàn phút build miễn phí.

---

## 8. Kiến Trúc Client API & Nguyên Tắc DRY

- **Single Source of Truth cho Supabase HTTP:**
  - Toàn bộ các yêu cầu HTTP tới Supabase (Auth, REST, RPC) trong `apps/web-admin` **BẮT BUỘC** phải sử dụng hàm dùng chung `supabaseRequest<T>()` từ [`apps/web-admin/src/api/core/supabase-client.ts`](apps/web-admin/src/api/core/supabase-client.ts).
  - Tuyệt đối không khai báo lặp lại hàm `getSupabaseConfig()` hoặc hardcode biến môi trường `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` tại các file `auth.ts`, `tenant.ts`, `user.ts`, `automation.ts`, `billing.ts`, `commerce.ts`.

---

## 9. Chuẩn Giao Tiếp Mạng Cục Bộ (Private Network Access - PNA)

- Khi web admin (`https://admin.tuquet.com`) thực hiện thăm dò hoặc gọi lệnh xuống daemon máy trạm (`http://127.0.0.1:8765`), trình duyệt Chromium 120+ sẽ hiển thị hộp thoại cấp quyền PNA (_"admin.tuquet.com muốn truy nhập các ứng dụng và dịch vụ khác trên thiết bị này"_).
- **Yêu cầu kỹ thuật:**
  1. Phía Daemon Rust (`cli`/`runner`): Bắt buộc bật `.allow_private_network(true)` trong cấu hình CORS Layer và kiểm duyệt nghiêm ngặt origin `*.tuquet.com`, `localhost`, `127.0.0.1`.
  2. Phía Web Admin (`automation.ts`): Lệnh probe qua `fetch` phải có `mode: 'no-cors'`, gắn `AbortController` timeout ngắn ($\le 1200\text{ms}$) và xử lý lỗi không chặn giao diện (non-blocking) để trang web vẫn hoạt động trơn tru nếu người dùng bấm "Chặn".

---

## 10. Tiêu Chuẩn Soạn Thảo Tài Liệu & Cấu Trúc Thư Mục (Documentation Standards)

### 10.1. Nguyên Tắc Tài Liệu Tiền Phát Hành (Pre-Release Clean Slate)

- Đối với ứng dụng và tính năng chưa phát hành chính thức (pre-release), toàn bộ tài liệu kiến trúc, đặc tả tuyến đường và bản ghi quyết định phải được viết trực diện, chuẩn mực và định tính (Definitive Architecture).
- **Tuyệt đối không sử dụng ngôn từ so sánh chuyển đổi phiên bản** (như "V1 vs V2", "phiên bản tiền nhiệm", "nợ kỹ thuật cũ", "sửa đổi so với bản trước", "tương thích ngược").
- Mọi thành phần kiến trúc hiện hữu được coi là thiết kế tiêu chuẩn ban đầu của hệ thống.

### 10.2. Phân Cấp Thư Mục Tài Liệu Chuẩn (`docs/`)

Toàn bộ tài liệu kỹ thuật trong kho lưu trữ `tuquet/admin` (`docs/`) bắt buộc phải được sắp xếp vào đúng 5 thư mục chuyên biệt:

1. `docs/architecture/`: Tài liệu kiến trúc hệ thống tổng thể (`overview.md`) và quy chuẩn thiết kế giao diện (`styling-guide.md`).
2. `docs/decisions/`: Chuỗi bản ghi quyết định kiến trúc (ADR) tuân thủ quy tắc:
   - Đánh số tuần tự 4 chữ số: `0001-...`, `0002-...`, `0003-...`, `0004-...` (không trùng số hiệu).
   - Đặt tên file theo định dạng `kebab-case`, tuyệt đối không gắn hậu tố version (như `-v2`).
3. `docs/routes/`: Sổ tay đặc tả kỹ thuật 27 routes, sơ đồ phân cấp và ranh giới plugin (`README.md`, `auth.md`, `dashboard.md`, `tenants.md`, `automation.md`, `commerce.md`, `system.md`).
4. `docs/phases/`: Hồ sơ 5 giai đoạn chiến lược phát triển hệ thống (`phase-01` đến `phase-05`).
5. `docs/specs/`: Bản đồ năng lực (`capability-map.md`) và các bản đặc tả module chuẩn hóa (`SPEC-*.md`).

### 10.3. Tính Khả Chuyển Của Đường Dẫn Trong Tài Liệu Git

- Trong các tệp tin markdown (`*.md`) được commit vào kho lưu trữ, **BẮT BUỘC sử dụng đường dẫn tương đối** (ví dụ: `[access.ts](apps/web-admin/src/api/core/access.ts)`).
- **Nghiêm cấm tuyệt đối** hardcode đường dẫn tuyệt đối của máy trạm cá nhân (như `file:///C:/Users/...` hoặc `file:///home/...`) vào tài liệu dự án để đảm bảo tài liệu luôn đọc và liên kết chính xác trên GitHub, GitLab và mọi môi trường hệ điều hành.
