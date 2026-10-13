# Specter Console (`admin.tuquet.com`)

Console quản trị tập trung, quản lý danh tính đa tổ chức (Multi-Tenant IAM), điều phối hạ tầng thiết bị phân tán (Runners Fleet) và giám sát động cơ kịch bản tự động hóa (Automa Engine) cho **[Hệ sinh thái Tuquet](https://tuquet.com)**.

---

## 1. Môi Trường Sản Xuất (Production Domain)

- **Admin Console**: [https://admin.tuquet.com](https://admin.tuquet.com)
- **Official Website**: [https://tuquet.com](https://tuquet.com)
- **Supabase Cloud Backend**: `tuquet/cloud`

---

## 2. Kiến Trúc & Tài Liệu Kỹ Thuật (Architecture & Decisions)

Hệ thống được thiết kế theo nguyên tắc **KISS**, **YAGNI**, **Mobile-First Dual View** và kết nối trực tiếp với các schema chuyên biệt của Tuquet Cloud (`public`, `runners`, `automa`, `billing`):

- **[Bản Ghi Quyết Định Kiến Trúc (ADRs)](docs/decisions/)**:
  - [`ADR-001: Kiến Trúc Định Tuyến Admin V2 & Tích Hợp Telemetry Supabase`](docs/decisions/0001-admin-routing-v2.md)
  - [`ADR-002: Kiến Trúc Quản Trị Nền Tảng Platform Superadmin & Giám Sát Xuyên Tenant`](docs/decisions/0002-superadmin-platform-governance.md)
- **[Sổ Tay Đặc Tả Chi Tiết Từng Route (Route Reference Manual)](docs/routes/README.md)**: Danh mục toàn diện 18 routes, sơ đồ phân cấp và ranh giới plugin.
- **[Tài Liệu Thiết Kế Định Tuyến Tổng Thể (RFC V2)](docs/routing_architecture.md)**
- **[Bản Đồ Năng Lực (Capability Map)](docs/specs/capability-map.md)**

---

## 3. Công Nghệ Sử Dụng (Tech Stack)

- **Framework**: [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/) + [Turbo](https://turbo.build/) monorepo
- **Giao Diện & Thành Phần**: [Shadcn Slate Design Tokens](https://www.shadcn-vue.com/) / [@tuquet/vue-ui](https://github.com/tuquet/lib)
- **Bảng Dữ Liệu**: [@tuquet/vue-table](https://github.com/tuquet/lib) (TanStack Table V8)
- **Biểu Tượng**: Duy nhất [Lucide Icons](https://lucide.dev/) (`@lucide/vue`), nghiêm cấm Emoji
- **Quản Lý Trạng Thái**: [Pinia](https://pinia.vuejs.org/)
- **Định Tuyến**: [Vue Router 4](https://router.vuejs.org/) với bộ lọc động `plugin-gate.ts`
- **Tạo Kiểu**: [Tailwind CSS 4](https://tailwindcss.com/)

---

## 4. Bắt Đầu Nhanh (Quick Start)

### Yêu Cầu Môi Trường

- **Node.js**: `>= 22.0.0` (Ưu tiên cài đặt và quản lý qua Scoop trên Windows)
- **pnpm**: `>= 10.0.0`

### Cài Đặt & Khởi Động

```bash
# 1. Cài đặt các gói phụ thuộc
pnpm install

# 2. Khởi chạy máy chủ phát triển cục bộ
pnpm dev
```

Truy cập [http://localhost:5173](http://localhost:5173) trên trình duyệt.

---

## 5. Danh Mục Lệnh Thao Tác (Commands)

| Lệnh Thực Thi | Mô Tả Chức Năng |
| :-- | :-- |
| `pnpm dev` | Khởi chạy dev server với HMR |
| `pnpm exec vitest run apps/web-admin/src/api/core apps/web-admin/src/router` | Chạy 98 unit tests kiểm định router & API |
| `pnpm --filter @tuquet/admin-web run typecheck` | Kiểm tra toàn diện kiểu dữ liệu TypeScript (`vue-tsc`) |
| `npx oxlint apps/web-admin/src/` | Quét tĩnh mã nguồn siêu tốc với oxlint |
| `pnpm run lint` | Chạy kiểm tra định dạng và style lint toàn monorepo |
| `pnpm run format` | Tự động chuẩn hóa định dạng mã nguồn và markdown qua `oxfmt` |
| `pnpm run build:admin` | Đóng gói sản phẩm web admin (`dist/` và `dist.zip`) |

---

## 6. Cổng Kiểm Định Cục Bộ (Zero-Waste Pre-Push Quality Gate)

Tuân thủ nghiêm ngặt quy tắc tiết kiệm quota CI GitHub Actions tại `AGENTS.md §7`. Trước khi thực hiện `git push`, **bắt buộc** phải đảm bảo đạt 100% các tiêu chí:

1. `pnpm exec vitest run` &rarr; Toàn bộ 98 unit tests PASS.
2. `pnpm check:type` (`vue-tsc --noEmit --skipLibCheck`) &rarr; **0 lỗi**.
3. `pnpm run lint` (`oxlint` + `oxfmt`) &rarr; **0 errors**.
4. `pnpm run build:admin` &rarr; Vite build đóng gói thành công.

---

## 7. Giấy Phép (License)

Bản quyền thuộc về © [Tuquet Ecosystem](https://tuquet.com). Mọi quyền được bảo lưu.
