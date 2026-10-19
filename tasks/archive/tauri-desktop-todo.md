# Task List: Tuquet Admin Tauri Desktop Application (`INITIATIVE-TAURI-DESKTOP`)

## Phase 1: Foundation Scaffold & Workspace Integration

### Task 1.1: Khởi tạo Tauri v2 Crate & Cấu hình Cargo trong `apps/web-admin/src-tauri`

**Description:** Tạo thư mục `src-tauri` chuẩn cấu trúc Tauri v2 với file `Cargo.toml`, `build.rs`, `src/main.rs`, và `src/lib.rs`. Khai báo các dependencies chính của Tauri v2 và các plugin cốt lõi. **Acceptance criteria:**

- [x] Cấu trúc thư mục `apps/web-admin/src-tauri` đầy đủ các file theo tiêu chuẩn Tauri v2.
- [x] Lệnh `cargo check` trong `apps/web-admin/src-tauri` biên dịch thành công 0 lỗi. **Verification:**
- [x] Build succeeds: `cd apps/web-admin/src-tauri && cargo check` **Dependencies:** None **Files likely touched:**
- `apps/web-admin/src-tauri/Cargo.toml`
- `apps/web-admin/src-tauri/build.rs`
- `apps/web-admin/src-tauri/src/main.rs`
- `apps/web-admin/src-tauri/src/lib.rs` **Estimated scope:** Medium (4 files)

---

### Task 1.2: Thiết lập `tauri.conf.json` Master Configuration

**Description:** Khởi tạo và tinh chỉnh file `tauri.conf.json` cho Tauri v2: identifier `com.tuquet.admin`, tên sản phẩm `Tuquet Admin`, cấu hình lệnh dev kết nối tới `http://localhost:5320` và build output `../dist`. **Acceptance criteria:**

- [x] File `tauri.conf.json` khớp 100% schema của Tauri v2.
- [x] Cấu hình `beforeDevCommand: "pnpm run dev"`, `devUrl: "http://localhost:5320"`, `beforeBuildCommand: "pnpm run build"`, `frontendDist: "../dist"`. **Verification:**
- [x] Manual check: Kiểm tra cú pháp json và đối chiếu schema `https://schema.tauri.app/config/2`. **Dependencies:** Task 1.1 **Files likely touched:**
- `apps/web-admin/src-tauri/tauri.conf.json` **Estimated scope:** Small (1 file)

---

### Task 1.3: Cấu hình Vite & Monorepo Build Scripts cho chế độ Desktop

**Description:** Cập nhật `apps/web-admin/vite.config.ts` để phát hiện biến `process.env.TAURI_ENV_PLATFORM` (tắt PWA service worker trong desktop, bật `strictPort: true` ở port 5320, mở tiền tố `TAURI_ENV_*`). Cập nhật `package.json` và `turbo.json` thêm các script `tauri:dev` và `tauri:build`. **Acceptance criteria:**

- [x] Chạy `pnpm run build:admin` vẫn thành công cho web (PWA vẫn hoạt động khi không chạy Tauri).
- [x] Lệnh `pnpm run tauri:dev` và `pnpm run tauri:build` sẵn sàng ở cấp độ monorepo. **Verification:**
- [x] Build succeeds: `pnpm run build:admin`
- [x] Tests pass: `pnpm run check:type` **Dependencies:** Task 1.2 **Files likely touched:**
- `apps/web-admin/vite.config.ts`
- `apps/web-admin/package.json`
- `package.json`
- `turbo.json` **Estimated scope:** Medium (4 files)

---

### Checkpoint 1: Foundation & Scaffold Verification

- [x] `cd apps/web-admin/src-tauri && cargo check` thành công không lỗi.
- [x] `pnpm run check:type` đạt 0 lỗi trên toàn monorepo.
- [x] `pnpm run build:admin` hoàn tất bình thường mà không bị ảnh hưởng bởi cấu hình mới.

---

## Phase 2: Security Scopes & ACL Capabilities

### Task 2.1: Khởi tạo Ma trận Quyền hạn Hạt mịn (ACL Capabilities & Window Permissions)

**Description:** Thiết lập file `src-tauri/capabilities/default.json` theo chuẩn bảo mật Tauri v2. Khai báo các permissions hạn mức tối thiểu cho các plugin sử dụng (`core:default`, `opener:default`, `window-state:default`, `single-instance:default`, `notification:default`, `dialog:default`, `deep-link:default`, `store:default`, `updater:default`). ĐẶC BIỆT: Khai báo tường minh các quyền điều khiển cửa sổ cho Custom Titlebar (`core:window:allow-minimize`, `core:window:allow-toggle-maximize`, `core:window:allow-close`, `core:window:allow-start-dragging`, `core:window:allow-is-maximized`, `core:window:allow-show`), tránh lỗi từ chối quyền (IPC Permission Denied). **Acceptance criteria:**

- [x] File `capabilities/default.json` cấu hình rõ ràng phạm vi cửa sổ `main`.
- [x] Khai báo đầy đủ các quyền `core:window:allow-*` phục vụ Custom Titlebar.
- [x] Không sử dụng quyền wildcard không an toàn. **Verification:**
- [x] Build succeeds: `cd apps/web-admin/src-tauri && cargo check` **Dependencies:** Task 1.2 **Files likely touched:**
- `apps/web-admin/src-tauri/capabilities/default.json` **Estimated scope:** Small (1 file)

---

### Task 2.2: Cấu hình Content Security Policy (CSP) Tăng Cường

**Description:** Thiết lập CSP trong `tauri.conf.json` khóa chặt tài nguyên, chỉ cho phép kết nối đến Supabase backend, local loopback `127.0.0.1:*`, và các domain Tuquet được định danh. **Acceptance criteria:**

- [x] Chuỗi CSP hợp lệ, chặn thực thi mã script bên ngoài trái phép. **Verification:**
- [x] Manual check: Kiểm tra CSP header trong cấu hình `tauri.conf.json`. **Dependencies:** Task 2.1 **Files likely touched:**
- `apps/web-admin/src-tauri/tauri.conf.json` **Estimated scope:** Small (1 file)

---

### Checkpoint 2: Security Verification

- [x] Toàn bộ cấu hình ACL Capabilities và CSP được xác thực hợp lệ theo chuẩn Tauri v2.

---

## Phase 3: Frameless Window & Shadcn Slate Custom Titlebar

### Task 3.1: Cấu hình Cửa sổ Không Viền & Chống Nhấp Nháy Trắng

**Description:** Thiết lập `decorations: false`, `visible: false`, `shadow: true` trong `tauri.conf.json`. Cấu hình `src-tauri/src/lib.rs` tích hợp `tauri-plugin-window-state`, `tauri-plugin-single-instance`, và gắn sự kiện `tauri://ready` để hiển thị cửa sổ mượt mà sau khi DOM sẵn sàng. **Acceptance criteria:**

- [x] Cửa sổ khởi động ở chế độ ẩn và chỉ xuất hiện khi trang web đã render xong.
- [x] Kích thước và vị trí cửa sổ được tự động lưu và khôi phục khi mở lại.
- [x] Khởi chạy instance thứ hai sẽ tự động focus vào cửa sổ thứ nhất. **Verification:**
- [x] Build succeeds: `cd apps/web-admin/src-tauri && cargo check` **Dependencies:** Task 2.1 **Files likely touched:**
- `apps/web-admin/src-tauri/tauri.conf.json`
- `apps/web-admin/src-tauri/src/lib.rs` **Estimated scope:** Small (2 files)

---

### Task 3.2: Xây dựng Component `<DesktopTitlebar />` Chuẩn Shadcn Slate

**Description:** Xây dựng component thanh tiêu đề tùy biến trong Vue 3. Áp dụng chuẩn Slate CSS tokens (`bg-background/95`, `border-border/60`, `hover:bg-accent`, `hover:bg-destructive`). Gắn thẻ `data-tauri-drag-region` cho vùng kéo thả cửa sổ và tích hợp các nút điều khiển (Minimize, Maximize/Restore, Close) qua `@tauri-apps/api/window`. Chỉ hiển thị khi chạy trong môi trường Desktop (`isTauriEnvironment()`). **Acceptance criteria:**

- [x] Component hiển thị logo Tuquet, tiêu đề app, và các nút điều khiển cửa sổ.
- [x] Nút Maximize tự động đổi icon giữa phóng to và khôi phục kích thước.
- [x] Kéo thả thanh tiêu đề di chuyển cửa sổ mượt mà; nhấp đúp phóng to/thu nhỏ.
- [x] Khi chạy trên Web Browser thông thường, thanh tiêu đề này được ẩn $100\%$ không để lại khoảng trống. **Verification:**
- [x] Tests pass: `pnpm run check:type`
- [x] Tests pass: `pnpm run lint` **Dependencies:** Task 3.1 **Files likely touched:**
- `apps/web-admin/src/layouts/widgets/desktop-titlebar.vue`
- `apps/web-admin/src/layouts/basic.vue`
- `apps/web-admin/src/adapter/desktop/index.ts` **Estimated scope:** Medium (3 files)

---

### Task 3.3: Tích hợp System Tray (Khay Hệ Thống)

**Description:** Cấu hình icon và menu ngữ cảnh cho System Tray trong Rust (`src-tauri/src/tray.rs` hoặc `lib.rs`): "Mở Tuquet Admin", "Kiểm tra Cập nhật", và "Thoát". Hỗ trợ thu nhỏ ứng dụng xuống khay hệ thống khi bấm nút đóng hoặc nút thu nhỏ. **Acceptance criteria:**

- [x] Icon Tuquet xuất hiện ở khay hệ thống Windows.
- [x] Nhấp đúp vào tray icon hoặc chọn "Mở Tuquet Admin" sẽ đưa cửa sổ lên màn hình. **Verification:**
- [x] Build succeeds: `cd apps/web-admin/src-tauri && cargo check` **Dependencies:** Task 3.1 **Files likely touched:**
- `apps/web-admin/src-tauri/src/tray.rs`
- `apps/web-admin/src-tauri/src/lib.rs`
- `apps/web-admin/src-tauri/tauri.conf.json` **Estimated scope:** Medium (3 files)

---

### Checkpoint 3: Window & Titlebar Verification

- [x] Giao diện thanh tiêu đề Shadcn Slate hiển thị đồng bộ, kéo thả cửa sổ chuẩn xác.
- [x] Cửa sổ ghi nhớ kích thước và hỗ trợ tương tác qua khay hệ thống.

---

## Phase 4: Native Services Integration & Deep Linking

### Task 4.1: Xử lý Deep Linking `tuquet://` & Đồng bộ SSO Song Song Single-Instance

**Description:** Cấu hình scheme `tuquet://` trong `tauri.conf.json` và Rust crate `tauri-plugin-deep-link`. Phối hợp với `single-instance`: khi nhấp link lúc app đang mở, callback single-instance trích xuất deep link URL từ `args` và emit sự kiện `deep-link-received` cho frontend. Adapter frontend tự động nạp access token vào Pinia `useAccessStore()` và điều hướng về `/dashboard/analytics`. **Acceptance criteria:**

- [x] Kích hoạt link `tuquet://auth/callback` khi app chưa chạy: mở app và hoàn tất đăng nhập.
- [x] Kích hoạt link `tuquet://auth/callback` khi app đang chạy: không mở app thứ hai, focus app hiện tại và nạp token tự động.
- [x] Khớp hoàn toàn với luồng cấp quyền tại view hiện có [`desktop-bridge.vue`](apps/web-admin/src/views/_core/authentication/desktop-bridge.vue). **Verification:**
- [x] Tests pass: `pnpm run test:unit` **Dependencies:** Task 3.1 **Files likely touched:**
- `apps/web-admin/src-tauri/tauri.conf.json`
- `apps/web-admin/src-tauri/src/lib.rs`
- `apps/web-admin/src/adapter/desktop/deep-link.ts`
- `apps/web-admin/src/adapter/desktop/index.ts` **Estimated scope:** Medium (4 files)

---

### Task 4.2: Bộ Adapters Native (Notification, Dialog, Secure Store) & Unit Tests

**Description:** Xây dựng các module wrapper trong `src/adapter/desktop/` cho thông báo hệ thống, hộp thoại chọn file native và lưu trữ cục bộ bảo mật. Bổ sung bộ kiểm thử đơn vị (`__tests__/desktop.test.ts`) kiểm tra tính an toàn của các hàm fallback khi chạy ngoài môi trường desktop. **Acceptance criteria:**

- [x] Các hàm `sendDesktopNotification()`, `showSaveDialog()`, `getSecureItem()` hoạt động mượt mà.
- [x] Chạy trên Web browser không phát sinh lỗi unhandled exception.
- [x] 100% unit tests trong `desktop.test.ts` đạt kết quả xanh. **Verification:**
- [x] Tests pass: `pnpm run test:unit` **Dependencies:** Task 4.1 **Files likely touched:**
- `apps/web-admin/src/adapter/desktop/notification.ts`
- `apps/web-admin/src/adapter/desktop/dialog.ts`
- `apps/web-admin/src/adapter/desktop/storage.ts`
- `apps/web-admin/src/adapter/desktop/__tests__/desktop.test.ts` **Estimated scope:** Medium (4 files)

---

### Checkpoint 4: Integration & Unit Test Verification

- [x] `pnpm run test:unit` hoàn tất với toàn bộ test cases mới đạt 100% pass rate.
- [x] Mọi adapter native đều tương thích ngược với web.

---

## Phase 5: GitHub Releases Auto-Updater & Release Packaging

### Task 5.1: Cấu hình Auto-Updater qua GitHub Releases

**Description:** Tích hợp `@tauri-apps/plugin-updater`. Cấu hình endpoint kiểm tra phiên bản mới trỏ tới `https://github.com/tuquet/admin/releases/latest/download/latest.json`. Tạo module kiểm tra cập nhật trên frontend với thông báo trực quan khi có phiên bản mới. **Acceptance criteria:**

- [x] Plugin updater được khởi tạo thành công trong Rust và frontend.
- [x] Endpoint GitHub Releases được định dạng chính xác theo đặc tả của Tauri v2. **Verification:**
- [x] Build succeeds: `cd apps/web-admin/src-tauri && cargo check` **Dependencies:** Task 4.2 **Files likely touched:**
- `apps/web-admin/src-tauri/tauri.conf.json`
- `apps/web-admin/src-tauri/src/lib.rs`
- `apps/web-admin/src/adapter/desktop/updater.ts` **Estimated scope:** Medium (3 files)

---

### Task 5.2: Kiểm toán Pre-Release Build & Đóng gói Cục bộ (Windows NSIS & MSI)

**Description:** Thực hiện kiểm thử toàn diện toàn bộ 4 bước chất lượng (`check:type`, `lint`, `check:console`, `test:unit`). Tiến hành đóng gói ứng dụng desktop bản release bằng `pnpm run tauri:build --debug` để nghiệm thu file cài đặt Windows, đo đạc RAM và thời gian khởi động. **Acceptance criteria:**

- [x] Cả 4 bước kiểm thử Pre-Push Gate đều vượt qua (0 errors, 0 warnings).
- [x] Bản dựng executable `.exe` được xuất xưởng thành công tại `src-tauri/target/x86_64-pc-windows-gnu/debug/tuquet-admin.exe` (sẵn sàng cho GitHub Actions release bundle).
- [x] Thời gian khởi động ứng dụng $\le 800\text{ms}$, dung lượng RAM ban đầu $\le 45\text{MB}$. **Verification:**
- [x] Quality gate: `pnpm run check:type && pnpm run lint && pnpm run test:unit && pnpm run check:console`
- [x] Build succeeds: `pnpm run tauri:build:exe` **Dependencies:** Task 5.1 **Files likely touched:**
- `apps/web-admin/src-tauri/target/` **Estimated scope:** Medium (1 script/build execution)

---

### Checkpoint 5: Complete & Ready for Distribution

- [x] Tất cả tiêu chí nghiệm thu (Success Criteria) đều đạt.
- [x] Bộ file cài đặt sẵn sàng phát hành lên GitHub Releases.
