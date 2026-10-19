# Tuquet Admin Console & Desktop (`admin.tuquet.com`)

[![CI Quality Gates](https://github.com/tuquet/admin/actions/workflows/ci.yml/badge.svg)](https://github.com/tuquet/admin/actions/workflows/ci.yml) [![Release Desktop](https://github.com/tuquet/admin/actions/workflows/release.yml/badge.svg)](https://github.com/tuquet/admin/actions/workflows/release.yml) [![Latest Release](https://img.shields.io/github/v/release/tuquet/admin?color=0284c7&label=Release)](https://github.com/tuquet/admin/releases/latest) [![Platform: Windows](https://img.shields.io/badge/Platform-Windows%20x64-blue?logo=windows)](https://github.com/tuquet/admin/releases/latest) [![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE) [![Security Policy](https://img.shields.io/badge/Security-Policy-red.svg)](SECURITY.md)

Bảng điều khiển tập trung, quản lý danh tính đa tổ chức (Multi-Tenant IAM), điều phối hạ tầng phân tán (Runners Fleet) và tự động hóa (Automa Engine) cho **[Hệ sinh thái Tuquet](https://tuquet.com)**.

---

## 1. Tải Về Bản Cài Đặt Desktop Windows (Download Desktop App)

Tuquet Admin cung cấp ứng dụng Native Desktop chạy trên Windows x64 với hiệu năng cao, tích hợp System Tray, hỗ trợ Deep-link SSO (`tuquet://`) và cơ chế Tự động cập nhật không gián đoạn (OTA Auto-Updater):

| Phiên Bản / Định Dạng | Tải Về Trực Tiếp | Mô Tả |
| :-- | :-- | :-- |
| **Windows NSIS Installer (`.exe`)** | [**Download Tuquet-Admin-Setup.exe**](https://github.com/tuquet/admin/releases/latest/download/Tuquet-Admin-Setup.exe) | Bộ cài đặt Windows tiêu chuẩn, tự động cập nhật OTA |
| **Windows MSI Package (`.msi`)** | [**Download Tuquet-Admin.msi**](https://github.com/tuquet/admin/releases/latest/download/Tuquet-Admin.msi) | Gói triển khai doanh nghiệp (Enterprise GPO / Intune) |
| **Xem Tất Cả Bản Phát Hành** | [**GitHub Releases**](https://github.com/tuquet/admin/releases) | Toàn bộ changelog, checksums và release assets |

---

## 2. Môi Trường Sản Xuất & Liên Kết (Production)

- **Admin Web Console**: [https://admin.tuquet.com](https://admin.tuquet.com)
- **Official Website**: [https://tuquet.com](https://tuquet.com)
- **Supabase Cloud Backend**: `tuquet/cloud`

---

## 3. Kiến Trúc & Tài Liệu Kỹ Thuật (Architecture)

Hệ thống được thiết kế theo nguyên tắc **KISS**, **YAGNI**, **Mobile-First Dual View** và kết nối trực tiếp với các schema chuyên biệt của Tuquet Cloud (`public`, `runners`, `automa`, `billing`):

- **[Trung Tâm Tài Liệu Toàn Diện (Master Docs Index)](docs/README.md)**: Chỉ mục toàn bộ kiến trúc, quyết định, tuyến đường, giai đoạn và đặc tả module.
- **[Đặc Tả CI/CD & Public Release](docs/specs/SPEC-cicd-public-release.md)**: Bản đặc tả kỹ thuật chi tiết quy trình CI 5-Gate và CD Windows Release.
- **[Tổng Quan Kiến Trúc Hệ Thống (Architecture Overview)](docs/architecture/overview.md)**: Nền tảng IAM đa tổ chức, PostgREST multi-schema, 100% telemetry và phân quyền động DB.
- **[Sổ Tay Đặc Tả 27 Tuyến Đường (Route Reference Manual)](docs/routes/README.md)**: Danh mục toàn diện 27 routes, sơ đồ phân cấp và ranh giới plugin.
- **[Bản Ghi Quyết Định Kiến Trúc (ADRs)](docs/decisions/)**:
  - [`ADR-001: Kiến Trúc Định Tuyến & Đa Schema PostgREST`](docs/decisions/0001-routing-architecture.md)
  - [`ADR-002: Kiến Trúc Phông Chữ Self-Hosted & Typography SSOT`](docs/decisions/0002-typography-and-font-system.md)
  - [`ADR-003: Kiến Trúc Quản Trị Nền Tảng Platform Superadmin & RLS Bypass`](docs/decisions/0003-platform-superadmin.md)
  - [`ADR-004: Chuẩn Hóa useVbenVxeGrid, VxeForm & Từ Điển Thuật Ngữ`](docs/decisions/0004-vxe-grid-form-and-i18n-terminology.md)

---

## 4. Công Nghệ Sử Dụng (Tech Stack)

- **Frontend Core**: [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`) + [TypeScript](https://www.typescriptlang.org/)
- **Desktop Runtime**: [Tauri v2](https://v2.tauri.app/) (Rust 2021, Webview2, Deep-link, System Tray, Window State)
- **Build Engine**: [Vite 6](https://vitejs.dev/) + [Turbo](https://turbo.build/) monorepo + [pnpm 10](https://pnpm.io/)
- **Giao Diện & Thành Phần**: [Shadcn Slate Design Tokens](https://www.shadcn-vue.com/) / [@tuquet/vue-ui](https://github.com/tuquet/lib)
- **Bảng Dữ Liệu**: [@tuquet/vue-table](https://github.com/tuquet/lib) (TanStack Table V8)
- **Biểu Tượng**: [Lucide Icons](https://lucide.dev/) (`@lucide/vue`), nghiêm cấm Emoji
- **Quản Lý Trạng Thái**: [Pinia](https://pinia.vuejs.org/)
- **Tạo Kiểu**: [Tailwind CSS 4](https://tailwindcss.com/)

---

## 5. Bắt Đầu Nhanh (Quick Start)

### Yêu Cầu Môi Trường

- **Node.js**: `>= 22.0.0`
- **pnpm**: `>= 10.0.0`
- **Rust Toolchain**: `>= 1.80.0` (dành cho phát triển bản Desktop)

### Cài Đặt & Khởi Động

```bash
# 1. Cài đặt các gói phụ thuộc
pnpm install

# 2. Khởi chạy Web Console (Local Dev)
pnpm dev

# 3. Khởi chạy Desktop App (Tauri Dev Mode)
pnpm dev:desktop
```

---

## 6. Danh Mục Lệnh Thao Tác (Commands)

| Lệnh Thực Thi | Mô Tả Chức Năng |
| :-- | :-- |
| `pnpm dev` | Khởi chạy Web Console dev server tại `http://localhost:5320` |
| `pnpm dev:desktop` | Khởi chạy Tauri Desktop dev với Hot Reload |
| `pnpm test:unit` | Chạy 100+ file kiểm thử Vitest DOM & Node |
| `pnpm check:type` | Kiểm tra toàn diện kiểu dữ liệu TypeScript monorepo |
| `pnpm run lint` | Chạy kiểm tra định dạng và style lint toàn monorepo |
| `pnpm run format` | Tự động chuẩn hóa định dạng mã nguồn qua `oxfmt` |
| `pnpm run check:console` | Headless Chromium kiểm thử console 22 routes không có warning/error |
| `pnpm run build:admin` | Đóng gói sản phẩm web admin (`dist/`) |
| `pnpm run tauri:check` | Kiểm tra cú pháp Rust backend desktop qua `cargo check` |
| `pnpm run build:desktop:exe` | Đóng gói bộ cài Windows NSIS `.exe` và `.msi` |

---

## 7. Cổng Kiểm Định Chất Lượng (Zero-Waste Quality Gates)

Trước khi mở Pull Request hoặc phát hành bản mới, mọi mã nguồn đều phải vượt qua 5 cổng kiểm định nghiêm ngặt:

1. **Typecheck Gate**: `pnpm run check:type` &rarr; 0 type errors trên toàn bộ 38 packages.
2. **Lint Gate**: `pnpm run lint` &rarr; 0 errors.
3. **Unit Tests Gate**: `pnpm run test:unit` &rarr; 100% tests PASS (106 files, 788 tests).
4. **Console Gate**: `pnpm run check:console` &rarr; 0 console errors trên toàn bộ routes.
5. **Rust Desktop Gate**: `pnpm run tauri:check` &rarr; Cargo check thành công không lỗi.

---

## 8. Giấy Phép & Bảo Mật

- **License**: Phát hành theo [Giấy phép MIT](LICENSE).
- **Bảo Mật**: Xem chính sách và quy trình thông báo lỗ hổng tại [SECURITY.md](SECURITY.md).
