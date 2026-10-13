# Hướng Dẫn Thiết Kế Giao Diện & Design Tokens (UI Styling Guide)

> **Mã tài liệu:** `ARCH-STYLING-GUIDE`  
> **Áp dụng cho:** `tuquet/admin` (`apps/web-admin`)  
> **Tài liệu kiến trúc tổng thể:** [`docs/architecture/overview.md`](overview.md)  
> **Quy chuẩn Typography:** [`docs/decisions/0002-typography-and-font-system.md`](../decisions/0002-typography-and-font-system.md)

Tài liệu này là **Quy chuẩn Thiết kế Giao diện (SSOT)** áp dụng cho toàn bộ các màn hình, components và views trong hệ thống **Tuquet Admin**.

Mục tiêu cốt lõi: Đảm bảo mọi màn hình khi lập trình viên hoặc AI Agent xây dựng đều **tự động tương thích 100%** với:
1. Cả 2 chế độ **Light Mode** & **Dark Mode**.
2. Toàn bộ **14 Chế độ Màu sắc Built-in** (Blue, Violet, Pink, Green, Zinc, Rose, Orange, Deep-blue...) và màu Custom tùy biến.
3. Độ tương phản hoàn hảo (không bao giờ xảy ra lỗi chữ đen trên nền đen hoặc chữ trắng trên nền trắng).

---

## 1. Cơ Chế Hoạt Động Của Chế Độ Màu Sắc Built-in

Hệ thống màu của Tuquet Admin sử dụng kiến trúc CSS Variables (HSL) động được quản lý bởi `@vben/preferences` và `@vben-core/shared/color`:

1. **Preset Nguồn:** Được định nghĩa tại `packages/@core/preferences/src/constants.ts` với 14 bộ màu cơ bản (`default`, `violet`, `pink`, `yellow`, `sky-blue`, `green`, `zinc`, `deep-green`, `deep-blue`, `orange`, `rose`, `neutral`, `slate`, `gray`).
2. **Bộ sinh màu động (Color Generator):** Khi người dùng chọn một Preset hoặc nhập mã Hex tùy chọn, hàm `generatorColorVariables` (`packages/@core/base/shared/src/color/generator.ts`) phân tích màu qua thư viện `theme-colors` để sinh ra toàn bộ dải sắc thái:
   - `--primary-50`, `--primary-100`, ..., `--primary-500` (Main), ..., `--primary-950`
   - Ghi đè trực tiếp các biến `--primary`, `--primary-hover`, `--primary-active` vào thẻ `:root` (hoặc `html[data-theme="..."]`).
3. **Cơ chế Dark/Light Mode:** Khi đổi Dark Mode, class `.dark` được thêm vào thẻ `<html>`, kích hoạt bộ tokens từ `packages/@core/base/design/src/design-tokens/dark.css`.

---

## 2. Bảng Tra Cứu Classes Chuẩn (Semantic Tokens Cheat Sheet)

> [!IMPORTANT] **Quy tắc Bất Biến (Golden Invariant):** **TUYỆT ĐỐI KHÔNG** sử dụng các class gán cứng màu sắc của Tailwind như:
>
> - ❌ `bg-white`, `bg-black`, `bg-gray-100`, `bg-gray-50`
> - ❌ `text-gray-900`, `text-black`, `text-gray-500`
> - ❌ `border-gray-200`, `border-gray-300`
> - ❌ `bg-blue-600`, `bg-blue-500` (làm mất tác dụng của Built-in theme khi người dùng chọn màu khác)
>
> **LUÔN DÙNG** các Semantic Design Tokens dưới đây:

### 2.1. Nền (Backgrounds)

| Mục đích sử dụng | Class Chuẩn | Hiển thị Light Mode | Hiển thị Dark Mode |
| :-- | :-- | :-- | :-- |
| **Nền trang chính** | `bg-background` | Trắng tinh (`#ffffff`) | Đen tối (`hsl(0 0% 3.9%)`) |
| **Nền phụ / Vùng chìm** | `bg-background-deep` | Xám rất nhạt (`hsl(216 20% 95%)`) | Đen tối tương đồng |
| **Thẻ Card / Container / Modal** | `bg-card` | Nền trắng của Card | Đen Card cao cấp |
| **Hộp Popover / Dropdown Menu** | `bg-popover` | Trắng tinh | Đen tối |
| **Nền phụ nhạt / Pill / Skeleton** | `bg-muted` | Xám nhạt (`hsl(240 4.8% 95.9%)`) | Xám đen mờ (`hsl(240 3.7% 15.9%)`) |
| **Nền vùng tương tác Hover** | `hover:bg-accent` hoặc `hover:bg-muted` | Nhấn nhẹ màu xám sáng | Nhấn nhẹ màu xám tối |

### 2.2. Chữ (Typography / Foregrounds)

| Mục đích sử dụng | Class Chuẩn | Hiển thị Light Mode | Hiển thị Dark Mode |
| :-- | :-- | :-- | :-- |
| **Chữ chính (Tiêu đề, body text)** | `text-foreground` | Xám đen đậm (`hsl(210 6% 21%)`) | Trắng xám (`hsl(0 0% 98%)`) |
| **Chữ trong thẻ Card** | `text-card-foreground` | Xám đen | Trắng sáng |
| **Chữ phụ / Chú thích / Metadata** | `text-muted-foreground` | Xám trung tính (`#71717a`) | Xám bạc nhạt (`hsl(240 5% 64.9%)`) |
| **Placeholder trong Input** | Tự động qua component hoặc `placeholder:text-muted-foreground` | Xám nhạt | Xám tối |

### 2.3. Đường Viền & Phân Cách (Borders & Dividers)

| Mục đích sử dụng | Class Chuẩn | Ghi chú |
| :-- | :-- | :-- |
| **Viền mặc định** | `border border-border` | Chuẩn cho Card, Table, Input, Divider |
| **Viền thanh mảnh, tinh tế** | `border border-border/60` | Khuyên dùng cho viền Card/Table phong cách Shadcn |
| **Đường kẻ ngang phân cách** | `divide-y divide-border` | Dùng trong danh sách `<ul>` hoặc bảng dữ liệu |

### 2.4. Điểm Nhấn & Nút Bấm (Primary & Built-in Colors)

| Mục đích sử dụng | Class Chuẩn | Cơ chế hoạt động |
| :-- | :-- | :-- |
| **Nút bấm chính (Button)** | `bg-primary text-primary-foreground` | Tự động nhận màu Built-in người dùng đang chọn |
| **Hover nút chính** | `hover:bg-primary/90` | Làm đậm/sáng nhẹ màu primary khi rê chuột |
| **Text màu chủ đạo** | `text-primary hover:text-primary/80` | Link, biểu tượng hoặc text cần nhấn mạnh |
| **Badge viền màu chủ đạo** | `bg-primary/10 text-primary border border-primary/20` | Tạo Badge đẹp mắt theo đúng theme hiện tại |

### 2.5. Trạng Thái Hệ Thống (Semantic Status Colors)

| Trạng thái | Class Icon / Text | Class Badge / Nền |
| :-- | :-- | :-- |
| **Thành công (Active / Online)** | `text-success` | `bg-success/10 text-success border-success/20` |
| **Cảnh báo (Pending / Warning)** | `text-warning` | `bg-warning/10 text-warning border-warning/20` |
| **Lỗi / Xóa (Destructive / Offline)** | `text-destructive` | `bg-destructive text-destructive-foreground` hoặc `bg-destructive/10 text-destructive` |
| **Thông tin (Info)** | `text-info` | `bg-info/10 text-info` |

---

## 3. Khuôn Mẫu Thực Hành Chuẩn (Component Boilerplate)

Khi tạo một trang mới hoặc component mới, hãy áp dụng cấu trúc chuẩn sau:

```vue
<template>
  <div class="space-y-6 p-4 md:p-6">
    <!-- Header của trang -->
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-foreground">
          Tên Màn Hình
        </h1>
        <p class="text-sm text-muted-foreground">
          Mô tả ngắn gọn chức năng của trang tại đây.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Nút phụ -->
        <button
          class="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Xuất dữ liệu
        </button>

        <!-- Nút chính (Tự động thích ứng theme) -->
        <button
          class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
        >
          Thêm mới
        </button>
      </div>
    </div>

    <!-- Khối nội dung chính (Card) -->
    <div class="rounded-xl border border-border/60 bg-card text-card-foreground shadow-xs">
      <div class="border-b border-border/60 p-6">
        <h3 class="text-lg font-semibold text-foreground">
          Thông tin tổng hợp
        </h3>
      </div>

      <div class="p-6">
        <span
          class="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success border border-success/20"
        >
          Đang hoạt động
        </span>
      </div>
    </div>
  </div>
</template>
```

---

## 4. Danh Sách Tự Kiểm Tra (Self-Checklist)

- [ ] **Test Dark Mode:** Chuyển giao diện sang Dark Mode $\rightarrow$ Không có khối nào bị nền trắng toát hoặc chữ bị chìm vào nền.
- [ ] **Test Built-in Color:** Mở Preferences Drawer $\rightarrow$ Đổi Built-in sang `Green`, `Rose`, `Zinc` $\rightarrow$ Toàn bộ các nút bấm và điểm nhấn chính đổi màu đồng bộ theo theme.
- [ ] **Clean Code:** Không có bất kỳ class màu cố định nào (`text-gray-*`, `bg-white`, `bg-blue-*`) tồn tại trong template.
