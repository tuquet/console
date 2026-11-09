# @operon/automation — Automation Mesh & Browser Sandbox Micro-App

> **Mô hình:** Micro-Frontend độc lập phụ trách điều khiển luồng tự động hóa, quản trị proxy mạng và hồ sơ trình duyệt Chromium chống phát hiện (stealth sandbox).

---

## 1. Tính năng & Kiến trúc Micro-Frontend

Ứng dụng được thiết kế theo chuẩn **Micro-Frontend decoupled 100%**:

| Chế độ chạy | Cổng / Entry | Mô tả |
| :-- | :-- | :-- |
| **Standalone Dev** | `http://localhost:5321` (`src/main.ts`) | Khởi chạy độc lập, tự tạo Mock Kernel qua `createMockKernel()` của `@operon/kernel` để phát triển và test UI mà không cần chạy Host Shell. |
| **Embedded Remote** | `src/remote-entry.ts` | Xuất `AutomationView`, `BrowsersView` và `automationRoutes` để Host Shell (`@operon/shell`) nạp động qua URL/CDN hoặc workspace module. |

---

## 2. Nguyên tắc Quản lý State & Pinia Store

1. **Store ID Namespacing:** Mọi Pinia store bên trong micro-app bắt buộc phải có tiền tố `automation:*` (ví dụ: `useAutomationSampleStore = defineStore('automation:sample', ...)`).
2. **Single Pinia Tree:**
   - Ở chế độ **Standalone**, `src/bootstrap.ts` khởi tạo `createPinia()`.
   - Ở chế độ **Embedded**, micro-app tự động tái sử dụng instance Pinia toàn cục của Shell (`getActivePinia()`), tuyệt đối không tạo thêm Pinia instance mới để tránh phá vỡ reactivity.
3. **Ranh giới Dữ liệu (State Boundary):**
   - Micro-app chỉ đọc Auth/Session/Tenant thông qua `useKernel().auth`.
   - Gửi thông báo/sự kiện lên Shell qua `useKernel().events.notify(type, message)`.

---

## 3. Cấu trúc Thư mục

```text
apps/automation/
├── src/
│   ├── stores/          # Pinia stores cục bộ (namespaced automation:*)
│   ├── views/           # UI components & views chuẩn Shadcn UI + Tailwind v4
│   │   └── index.vue    # Starter View demo Kernel Auth, Toast & Reactive State
│   ├── bootstrap.ts     # Standalone bootstrap với MockKernel
│   ├── main.ts          # Entry point Standalone
│   └── remote-entry.ts  # Điểm xuất module công khai cho Host Shell
├── index.html           # HTML template cho chế độ Standalone
├── package.json         # Cấu hình gói @operon/automation
├── tsconfig.json        # Cấu hình TypeScript web-app
├── tsconfig.node.json   # Cấu hình TypeScript cho Vite config
└── vite.config.ts       # Cấu hình Vite cổng 5321
```

---

## 4. Các Lệnh Thực thi (Scripts)

Chạy từ thư mục gốc monorepo hoặc trực tiếp trong `apps/automation`:

```bash
# Chạy standalone dev server tại http://localhost:5321
pnpm --filter @operon/automation dev

# Kiểm tra lỗi kiểu dữ liệu TypeScript (vue-tsc)
pnpm --filter @operon/automation typecheck

# Đóng gói bundle production
pnpm --filter @operon/automation build
```
