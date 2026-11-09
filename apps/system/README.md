# @operon/system — System, IAM & Extensions Control Center Micro-App

> **Mô hình:** Micro-Frontend độc lập phụ trách quản trị định danh người dùng (IAM), ma trận phân quyền theo vai trò (RBAC), nhật ký kiểm toán hệ thống (Audit Logs) và quản lý tiện ích mở rộng (Plugins).

---

## 1. Tính năng & Kiến trúc Micro-Frontend

Ứng dụng được bóc tách hoàn toàn khỏi Host Shell, mang lại tính độc lập cao:

| Chế độ chạy | Cổng / Entry | Mô tả |
| :-- | :-- | :-- |
| **Standalone Dev** | `http://localhost:5322` (`src/main.ts`) | Khởi chạy độc lập trên cổng 5322, tự tạo Mock Kernel qua `createMockKernel()` của `@operon/kernel` để lập trình viên phát triển IAM UI offline. |
| **Embedded Remote** | `src/remote-entry.ts` | Xuất `SystemView`, `SystemOverviewView`, `SystemUsersView`, `SystemRolesView`, `SystemAuditLogsView`, `SystemPluginsView` và `systemRoutes` để Shell nạp. |

---

## 2. Nguyên tắc Quản lý State & Pinia Store

1. **Store ID Namespacing:** Mọi Pinia store bên trong micro-app bắt buộc phải có tiền tố `system:*` (ví dụ: `useSystemSampleStore = defineStore('system:sample', ...)`).
2. **Single Pinia Tree:**
   - Ở chế độ **Standalone**, `src/bootstrap.ts` khởi tạo `createPinia()`.
   - Ở chế độ **Embedded**, micro-app tự động tái sử dụng Root Pinia của Shell (`getActivePinia()`), tuyệt đối không tạo instance Pinia mới.
3. **Ranh giới Dữ liệu (State Boundary):**
   - Đọc thông tin Session, User, Tenant ID và danh sách quyền từ `useKernel().auth`.
   - Gửi Toast / Thông báo tới Shell qua `useKernel().events.notify(type, message)`.

---

## 3. Cấu trúc Thư mục

```text
apps/system/
├── src/
│   ├── stores/          # Pinia stores cục bộ (namespaced system:*)
│   ├── views/           # Views quản trị IAM, Roles, Audit & Plugins
│   │   └── index.vue    # Starter View chuẩn Shadcn UI + Tailwind v4
│   ├── bootstrap.ts     # Standalone bootstrap với MockKernel
│   ├── main.ts          # Entry point Standalone (dev port 5322)
│   └── remote-entry.ts  # Điểm xuất module công khai cho Host Shell
├── index.html           # HTML template cho chế độ Standalone
├── package.json         # Cấu hình gói @operon/system
├── tsconfig.json        # Cấu hình TypeScript web-app
├── tsconfig.node.json   # Cấu hình TypeScript cho Vite config
└── vite.config.ts       # Cấu hình Vite cổng 5322
```

---

## 4. Các Lệnh Thực thi (Scripts)

Chạy từ thư mục gốc monorepo hoặc trực tiếp trong `apps/system`:

```bash
# Chạy standalone dev server tại http://localhost:5322
pnpm --filter @operon/system dev

# Kiểm tra lỗi kiểu dữ liệu TypeScript (vue-tsc)
pnpm --filter @operon/system typecheck

# Đóng gói bundle production
pnpm --filter @operon/system build
```
