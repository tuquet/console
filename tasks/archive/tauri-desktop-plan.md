# Implementation Plan: Admin Tauri Desktop Application (`INITIATIVE-TAURI-DESKTOP`)

## 1. Overview

Xây dựng phiên bản Native Desktop Application hoàn chỉnh cho **Admin Console** (`admin.tuquet.com`) trên nền tảng **Tauri v2 (Stable 2.x)**:

- **Kiến trúc:** 1 Codebase duy nhất (`apps/web-admin/src-tauri`), dùng chung $100\%$ 22 routes, layout và stores.
- **Giao diện:** Thanh tiêu đề tùy biến không viền (Frameless Custom Titlebar) chuẩn Shadcn Slate tokens, vùng kéo cửa sổ mượt mà (`data-tauri-drag-region`).
- **Bảo mật & Native:** Phân quyền hạt mịn Tauri v2 ACL Capabilities, CSP nghiêm ngặt, chống chạy trùng lặp (`single-instance`), ghi nhớ kích thước (`window-state`), khay hệ thống (System Tray), nhận diện Deep Link `tuquet://` cho Enterprise SSO.
- **Phát hành:** Tự động cập nhật OTA qua **GitHub Releases** với chữ ký điện tử Ed25519.

---

## 2. Architecture Decisions

1. **Co-located Monorepo Target (`apps/web-admin/src-tauri`):**
   - Đặt crate Rust ngay trong `apps/web-admin`.
   - Phân nhánh build qua biến `TAURI_ENV_PLATFORM`: Tắt PWA Service Worker trong chế độ desktop để chống stale cache/xung đột IPC, đồng thời cố định cổng `5320` (`strictPort: true`).
   - Giữ nguyên $100\%$ độ toàn vẹn của Web Console (`admin.tuquet.com`).
2. **Shadcn Slate Frameless Titlebar:**
   - Ẩn khung viền mặc định của OS (`decorations: false`).
   - Xây dựng component `<DesktopTitlebar />` tích hợp vào layout, sử dụng design tokens HSL (`bg-background/95`, `border-border/60`, `hover:bg-accent`, `hover:bg-destructive`).
   - Icon chuẩn `@lucide/vue` (`Minus`, `Square` / `Copy`, `X`).
3. **Tauri v2 ACL Capabilities System:**
   - Cấu hình quyền tường minh qua `src-tauri/capabilities/default.json` (thay vì allowlist cũ của v1).
   - Chỉ mở quyền cho các plugin thiết yếu: `core`, `opener`, `window-state`, `single-instance`, `notification`, `dialog`, `deep-link`, `store`, `updater`.
4. **GitHub Releases Auto-Updater:**
   - Cấu hình `@tauri-apps/plugin-updater` trỏ về endpoint GitHub Releases `latest.json`.
   - Mã hóa xác thực bản cập nhật bằng cặp khóa Ed25519.

---

## 3. Implementation Order & Dependency Graph

```text
Phase 1: Foundation Scaffold (Cargo crate, Vite config, scripts)
   │
   ▼
Phase 2: Security & ACL Capabilities (Capabilities JSON, CSP)
   │
   ▼
Phase 3: Frameless Window & Custom Titlebar (decorations: false, Slate Titlebar, Tray)
   │
   ▼
Phase 4: Native Services & Deep Linking (tuquet://, Notification, Dialog, Store)
   │
   ▼
Phase 5: Auto-Updater & Release Packaging (GitHub Releases, NSIS/MSI bundle)
```

---

## 4. Risks and Mitigations

| Rủi ro (Risk) | Mức độ | Biện pháp giảm thiểu (Mitigation) |
| --- | --- | --- |
| **Stale Cache / Service Worker trên Desktop** | Cao | Vô hiệu hóa `pwa: false` trong `vite.config.ts` khi phát hiện `process.env.TAURI_ENV_PLATFORM`. |
| **Xung đột Cổng Dev Server** | Trung bình | Thiết lập `server.strictPort: true` và `port: 5320` trong Vite để devUrl luôn kết nối chính xác. |
| **Nhấp nháy trắng khi khởi động (White-Flash)** | Trung bình | Thiết lập `visible: false` trong `tauri.conf.json`, chỉ gọi `window.show()` khi nhận sự kiện `tauri://ready` từ DOM. |
| **Đụng độ quyền truy cập API trên Web** | Cao | Toàn bộ các lệnh gọi native được bọc trong guard `isTauriEnvironment()`, tự động fallback sang Web API nếu chạy trên trình duyệt. |
| **Bảo mật Khóa Ký Số OTA** | Cao | Chỉ lưu Public Key trong `tauri.conf.json`. Private Signing Key chỉ cấu hình trên GitHub Actions Secrets. |

---

## 5. Checkpoints & Verification Gates

- **Checkpoint 1 (Scaffold):** `cargo check` thành công trong `src-tauri`; `pnpm run build:admin` vẫn vượt qua $100\%$ không bị ảnh hưởng.
- **Checkpoint 2 (Security):** File capabilities JSON được biên dịch và kiểm toán cú pháp không có lỗi permission wildcard.
- **Checkpoint 3 (Window & Titlebar):** Chạy `pnpm run tauri:dev`: Cửa sổ không viền hiển thị thanh tiêu đề Shadcn Slate, kéo thả mượt mà, các nút Thu nhỏ / Phóng to / Đóng hoạt động chính xác.
- **Checkpoint 4 (Integration):** Giao thức `tuquet://` kích hoạt thành công callback đăng nhập; thông báo native xuất hiện trên Action Center Windows.
- **Checkpoint 5 (Packaging & Release):** Chạy `pnpm run tauri:build`: File cài đặt Windows (`.exe` / `.msi`) được xuất xưởng thành công tại `src-tauri/target/release/bundle/`. Toàn bộ 4 bước kiểm thử chất lượng `check:type`, `lint`, `check:console`, `test:unit` đều đạt $100\%$.
