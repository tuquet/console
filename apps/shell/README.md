# @operon/shell — Operon Workstation Host Shell & Orchestrator

> **Mô hình:** Ứng dụng gốc (Host Shell) điều phối toàn bộ hệ thống Operon Workstation — hỗ trợ song song hai nền tảng: **Web SaaS** và **Desktop App (Tauri v2 trên Windows x64)**.

---

## 1. Trách nhiệm Cốt lõi của Host Shell

Host Shell được giữ ở mức tinh gọn, bền vững tối đa để **hạn chế tối đa việc phải build hoặc deploy lại** khi các micro-app thay đổi:

1. **Core Layout & Titlebar Desktop:**
   - Hệ thống thanh điều hướng Sidebar co giãn, Header thích ứng đa thiết bị, Tabbar cache trang.
   - Titlebar không khung viền tùy biến cho Tauri Desktop (`DesktopTitlebar`), hỗ trợ kéo thả cửa sổ và nút điều khiển (Thu nhỏ / Phóng to / Đóng).
2. **Auth Flow & Vòng đời Phiên đăng nhập (Session Lifecycle):**
   - Đầy đủ luồng Đăng nhập, Đăng ký, Quên mật khẩu, Đổi mật khẩu.
   - Quản lý phiên xác thực Supabase Auth, tự động refresh token JWT và cơ chế Desktop Bridge qua Deep-link.
   - Quản lý tổ chức / không gian làm việc đa người thuê (Multi-Tenant Workspaces).
3. **Host Kernel Provider (@operon/kernel):**
   - Đóng gói toàn bộ reactive state (Auth, Theme, Active Tenant) và Event Bus vào `hostKernel`.
   - Cung cấp `provide(KERNEL_INJECTION_KEY, hostKernel)` xuyên suốt cây component để tất cả micro-apps nhúng vào có thể dùng ngay.
4. **Dynamic Micro-App Routing & Guards:**
   - Hệ thống kiểm tra quyền (`platform-gate.ts`, `plugin-gate.ts`) nạp động các Micro-Apps độc lập (`@operon/automation`, `@operon/system`,...).
5. **Động cơ SQLite Cục bộ (Local-First Desktop Storage):**
   - Thư mục `src/db/` tích hợp Drizzle ORM và `@libsql/client` đồng bộ dữ liệu ngầm xuống SQLite (`~/.operon/data/operon.sqlite`) cho chế độ ngoại tuyến.

---

## 2. Cấu trúc Thư mục

```text
apps/shell/
├── src/
│   ├── adapter/         # Cầu nối tích hợp VxeTable, Form & Desktop API
│   ├── api/             # Client kết nối Supabase PostgREST & Token Manager
│   ├── components/      # UI components dùng chung cấp máy trạm
│   ├── composables/     # Reactivity composables (updater, clipboard, date)
│   ├── db/              # Động cơ SQLite cục bộ & logic đồng bộ Cloud
│   ├── kernel/          # Host Kernel Provider triển khai @operon/kernel
│   ├── layouts/         # Layout cơ sở, Auth layout & Titlebar Desktop
│   ├── locales/         # Dữ liệu đa ngôn ngữ i18n
│   ├── router/          # Router động, Access guards & Plugin gates
│   ├── store/           # Pinia Root Store (Auth & Workspace)
│   ├── views/           # Các view lõi không tách rời:
│   │   ├── _core/       # Authentication, Fallback & Profile
│   │   ├── dashboard/   # Trang Analytics KPI
│   │   └── tenants/     # Quản lý Multi-Tenant Workspaces
│   ├── app.vue          # Root Vue Component
│   ├── bootstrap.ts     # Khởi tạo App, Plugins, I18n & Preferences
│   └── main.ts          # Entry point
├── src-tauri/           # Mã nguồn Rust cho nền tảng Desktop (Tauri v2)
├── package.json         # Cấu hình gói @operon/shell
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Cấu hình Vite production & PWA
```

---

## 3. Các Lệnh Thực thi (Scripts)

Chạy từ thư mục gốc monorepo:

```bash
# Khởi chạy Host Shell chế độ Web tại http://localhost:5320
pnpm dev:shell

# Khởi chạy Host Shell chế độ Desktop (Tauri dev)
pnpm tauri:dev

# Kiểm tra lỗi kiểu dữ liệu TypeScript (vue-tsc)
pnpm --filter @operon/shell typecheck

# Đóng gói bản Web Production
pnpm build:shell

# Đóng gói file thực thi Desktop Windows (.exe)
pnpm tauri:build:exe
```
