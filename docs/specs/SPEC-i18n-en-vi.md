# Spec: Tiêu Chuẩn Đa Ngôn Ngữ i18n (en-US / vi-VN) Mặc Định en-US

## 1. Objective (Mục Tiêu)

Thiết lập tiêu chuẩn quốc tế hóa (i18n) nhất quán, chuẩn hóa và toàn diện cho Tuquet Admin (`@tuquet/admin-web`, `@vben/locales`, `@vben/constants`, `@vben/preferences`):

1. **Chuẩn hóa cặp ngôn ngữ chính**: Hỗ trợ 2 ngôn ngữ chuẩn: **Tiếng Anh (`en-US`)** và **Tiếng Việt (`vi-VN`)**, với ngôn ngữ mặc định toàn hệ thống là **`en-US`**.
2. **Khắc phục tình trạng hardcode text tự do**: Chấm dứt việc gõ trực tiếp chuỗi văn bản cứng vào component Vue; quy định 100% văn bản giao diện người dùng (headers, table columns, action buttons, modals, badges, empty states, toast messages) phải thông qua hàm dịch `$t(...)`.
3. **Phân tầng 2 lớp độc lập (Two-Tier SSOT Architecture)**:
   - **Framework Core Tier (`@vben/locales`)**: Chứa các từ vựng dùng chung của nền tảng (common, auth, preferences, layout, profile, ui).
   - **Business App Tier (`web-admin`)**: Chứa từ vựng nghiệp vụ chuyên biệt của từng màn hình (dashboard, tenants, fleet, automation, system).
4. **Trải nghiệm chuyển ngữ tức thì (Zero-Flicker Instant Toggle)**: Đồng bộ mượt mà giữa nút chuyển ngôn ngữ (`LanguageToggle`), `localStorage` (`preferences-locale`), HTML `lang` attribute, và thư viện định dạng thời gian `dayjs`.

---

## 2. Tech Stack & Dependencies

- **Framework i18n**: `vue-i18n` (v9/v10 Composition API mode, `legacy: false`, `globalInjection: true`).
- **Core Packages**:
  - `@vben-core/typings`: Khai báo kiểu `SupportedLanguages` (`en-US`, `vi-VN`).
  - `@vben/constants`: Định nghĩa danh sách runtime `SUPPORT_LANGUAGES` (`en-US` & `vi-VN`).
  - `@vben/locales`: Quản lý nạp từ điển, `useSimpleLocale`, `$t`, dynamic load regex.
  - `@vben/preferences`: Lưu trữ và đồng bộ hóa cài đặt `locale` trong `localStorage`.
- **Date/Time i18n**: `dayjs` (`dayjs/locale/en`, `dayjs/locale/vi`).

---

## 3. Commands (Lệnh Thực Thi)

```bash
# Typecheck toàn bộ dự án
pnpm --filter @tuquet/admin-web run typecheck

# Chạy unit tests cho preferences và locales
pnpm --filter @vben/preferences test
pnpm --filter @vben/locales test

# Build production web-admin
pnpm --filter @tuquet/admin-web run build

# Chạy môi trường development
pnpm --filter @tuquet/admin-web run dev
```

---

## 4. Project Structure (Cấu Trúc Thư Mục & Phân Tầng)

```
admin/
├── packages/
│   ├── @core/base/typings/src/
│   │   └── languages.ts                 # Khai báo interface SupportedLanguages (en-US, vi-VN)
│   ├── constants/src/
│   │   └── core.ts                      # SUPPORT_LANGUAGES danh sách [ { label: 'English', value: 'en-US' }, { label: 'Tiếng Việt', value: 'vi-VN' } ]
│   ├── locales/src/
│   │   ├── i18n.ts                      # Nạp và gộp messages từ packages/locales và apps
│   │   ├── typing.ts                    # Type definitions
│   │   └── langs/
│   │       ├── en-US/                   # Framework Core English
│   │       │   ├── common.json
│   │       │   ├── authentication.json
│   │       │   ├── preferences.json
│   │       │   ├── profile.json
│   │       │   └── ui.json
│   │       └── vi-VN/                   # Framework Core Tiếng Việt (Tạo mới, đối xứng 100%)
│   │           ├── common.json
│   │           ├── authentication.json
│   │           ├── preferences.json
│   │           ├── profile.json
│   │           └── ui.json
│   └── @core/preferences/src/
│       └── config.ts                    # default: locale: 'en-US'
│
└── apps/web-admin/src/
    ├── locales/
    │   ├── index.ts                     # Setup i18n của app, nạp dayjs locale ('en' / 'vi')
    │   └── langs/
    │       ├── en-US/                   # Business App English
    │       │   ├── page.json            # dashboard, fleet, tenants, automation, system
    │       │   └── demos.json
    │       └── vi-VN/                   # Business App Tiếng Việt (Tạo mới, đối xứng 100%)
    │           ├── page.json
    │           └── demos.json
    └── views/                           # Toàn bộ template Vue gọi $t('...') thay vì hardcode
```

---

## 5. Code Style & Naming Conventions

### 5.1. Cấu Trúc Key Dịch (Key Taxonomy)

Áp dụng quy tắc phân cấp bằng dấu chấm (`dot.notation`) theo `snake_case` cho từng phân đoạn:

```
[scope].[domain].[component_or_entity].[element_type]
```

- **Scope chung (Core)**:
  - `common.actions.create` (`Create` / `Tạo mới`)
  - `common.actions.confirm` (`Confirm` / `Xác nhận`)
  - `common.actions.cancel` (`Cancel` / `Hủy`)
  - `common.status.online` (`Online` / `Trực tuyến`)
  - `common.status.offline` (`Offline` / `Ngoại tuyến`)
  - `common.status.active` (`Active` / `Hoạt động`)
  - `ui.table.empty` (`No data available` / `Không có dữ liệu`)

- **Scope màn hình nghiệp vụ (Business Pages - `page.json`)**:
  - `page.workspace.title` (`Workspace Management` / `Quản Trị Workspace`)
  - `page.workspace.total_tenants` (`Total Workspaces` / `Tổng Workspace`)
  - `page.workspace.current_active` (`Selected Workspace` / `Workspace Đang Chọn`)
  - `page.workspace.plan_tier` (`Service Plan` / `Gói Dịch Vụ`)
  - `page.fleet.title` (`Device Fleet` / `Quản Trị Máy Trạm`)
  - `page.fleet.connect_workstation` (`Connect Workstation` / `Ghép Nối Máy Trạm`)
  - `page.automation.runs_title` (`Automation Runs` / `Phiên Chạy Tự Động`)

### 5.2. Mẫu Sử Dụng Trong Component Vue

**Chuẩn cú pháp trong `<template>`:**
```html
<template>
  <div class="flex items-center justify-between">
    <h1 class="text-lg font-semibold">
      {{ $t('page.workspace.title') }}
    </h1>
    <Button @click="openCreateModal">
      <Plus class="size-4" />
      <span>{{ $t('common.actions.create') }}</span>
    </Button>
  </div>
</template>
```

**Chuẩn cú pháp trong `<script setup lang="ts">`:**
```typescript
import { $t } from '#/locales';

function handleNotify() {
  toast.success($t('page.workspace.create_success', { name: payload.name }));
}
```

---

## 6. Testing Strategy

1. **Unit Test Phân Giải Khóa (Key Integrity Tests)**:
   - Viết test tự động quét và đối chiếu toàn bộ key giữa thư mục `en-US` và `vi-VN`.
   - Bắt buộc: Số lượng key và đường dẫn phân cấp trong `vi-VN` phải khớp 100% với `en-US` (không được thiếu key nào ở cả 2 tier).
2. **Preference & Persistence Test**:
   - Kiểm tra `preferences.app.locale`: Khởi tạo mặc định là `'en-US'`.
   - Kiểm tra việc gọi `updatePreferences({ app: { locale: 'vi-VN' } })` ghi đúng vào cache/localStorage và cập nhật thẻ `<html lang="vi-VN">`.
3. **Dayjs Locale Switch Test**:
   - Kiểm tra khi switch sang `vi-VN`, `dayjs` tự động nạp `dayjs/locale/vi` và định dạng ngày tháng sang tiếng Việt; khi switch sang `en-US`, nạp `dayjs/locale/en`.

---

## 7. Boundaries (Ranh Giới Thực Hiện)

- **Luôn Luôn Làm (Always)**:
  - Giữ `en-US` làm chuẩn gốc (SSOT). Mỗi khi thêm mới một nhãn vào `en-US`, lập tức bổ sung khóa tương ứng vào `vi-VN`.
  - Luôn fallback về `en-US` nếu một ngôn ngữ bất kỳ bị thiếu message ở runtime.
  - Sử dụng tham số biến nội suy chuẩn `{name}`, `{count}` thay vì nối chuỗi thủ công trong mã nguồn.
- **Hỏi Trước (Ask First)**:
  - Thay đổi cấu trúc file locale lớn (ví dụ tách `page.json` thành 5 file nhỏ cho từng route module).
  - Bổ sung thêm ngôn ngữ thứ 3 ngoài `en-US` và `vi-VN`.
- **Tuyệt Đối Không Làm (Never)**:
  - Không hardcode chuỗi text trực tiếp trong code Vue template hoặc logic thông báo toast.
  - Không xóa bỏ hoặc sửa lệch cấu trúc key giữa `en-US` và `vi-VN`.
  - Không tải file font CDN bên ngoài để phục vụ ký tự tiếng Việt (đã có `@fontsource` tự host Be Vietnam Pro, Inter, Roboto).

---

## 8. Success Criteria (Tiêu Chí Hoàn Thành Nghiệm Thu)

1. [ ] **Registry Song Ngữ**: `@vben-core/typings` và `@vben/constants` khai báo đầy đủ 2 ngôn ngữ: `en-US` (English) và `vi-VN` (Tiếng Việt).
2. [ ] **Bộ Từ Điển Đối Xứng 100%**:
   - `packages/locales/src/langs/vi-VN/` đầy đủ 5 file (`common`, `authentication`, `preferences`, `profile`, `ui`) dịch chuẩn xác, đối xứng với `en-US`.
   - `apps/web-admin/src/locales/langs/vi-VN/` đầy đủ `page.json` và `demos.json`, dịch trọn vẹn toàn bộ các trang Admin.
3. [ ] **Mặc Định Chuẩn `en-US`**:
   - Trình duyệt truy cập lần đầu tiên khi chưa có `localStorage` sẽ hiển thị toàn bộ giao diện bằng Tiếng Anh (`en-US`).
4. [ ] **Nút Đổi Ngôn Ngữ Hoạt Động Mượt Mà**:
   - Dropdown tại Header hiển thị 2 lựa chọn: `English` và `Tiếng Việt`.
   - Click chọn chuyển tức thì toàn bộ text trên menu, breadcrumb, header, bảng, nút bấm mà không cần reload trang (F5).
   - Định dạng ngày tháng `formatDate` chuyển đổi tương ứng theo locale được chọn.
5. [ ] **Typecheck & Test Pass**: `pnpm --filter @vben/preferences test` và `pnpm --filter @vben/locales test` chạy thành công.

---

## 9. Open Questions (Câu Hỏi Mở Chờ Xác Nhận)

1. **Cấu trúc lưu trữ của `page.json` trong `web-admin`**:
   - *Phương án A (Khuyến nghị - KISS)*: Dùng 1 file `page.json` duy nhất cho `web-admin` (gồm các block `page.workspace`, `page.fleet`, `page.automation`, `page.analytics`, `page.system`), gọn nhẹ và dễ bảo trì.
   - *Phương án B*: Tách nhỏ thành từng file theo route module (`workspace.json`, `fleet.json`, `automation.json`, `system.json`).
2. **Quy tắc hiển thị tên thương hiệu & thuật ngữ kỹ thuật**:
   - Các thuật ngữ như `Multi-Tenant`, `SSO`, `Loopback Daemon`, `Runner`, `Bridge`, `Proxy` có giữ nguyên tiếng Anh trong bản `vi-VN` không (ví dụ: `Cổng SSO Loopback`, `Máy trạm Runner`), hay chuyển ngữ hoàn toàn sang thuần Việt? *(Khuyến nghị: Giữ nguyên thuật ngữ kỹ thuật chuẩn quốc tế để người vận hành hệ thống dễ hiểu)*.
