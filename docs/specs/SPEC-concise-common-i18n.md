# Spec: Tiêu Chuẩn i18n Tối Giản & Tái Sử Dụng Từ Vựng Dùng Chung (Concise & Reusable Common i18n)

> **Module ID:** `concise-common-i18n`  
> **Nguyên tắc cốt lõi:** *Nói ít hiểu nhiều (Brevity & Anti-Verbosity)* — Tối giản nhãn nút, loại bỏ lặp từ ngữ cảnh, tối ưu tái sử dụng các từ vựng dùng chung (`$t('common.*')`).

---

## 1. Objective (Mục Tiêu)

1. **Chuẩn hóa nguyên tắc "Nói ít hiểu nhiều" (Anti-Verbosity & High Information Density):**
   - Loại bỏ các nhãn dài dòng, lặp từ không cần thiết khi ngữ cảnh giao diện hoặc biểu tượng đi kèm đã làm rõ hành động.
   - Ví dụ:
     - Nút trên trang Quản trị workspace: Đổi từ `Tạo workspace` / `Create Workspace` sang nhãn ngắn gọn chuẩn xác `Tạo` / `Create` kết hợp biểu tượng `<Plus />`.
     - Nút Làm mới trên các trang: Tái sử dụng `common.refresh` thay vì khai báo text cục bộ hoặc hardcode.
     - Nút Tìm kiếm / Đặt lại trong các form lọc (VXE Grid Form): Thống nhất tái sử dụng `common.search` / `common.reset` thay cho việc gán chuỗi tùy ý rải rác (`Lọc kết quả`, `Tìm kiếm`).
2. **Bộ từ vựng dùng chung (Reusable Framework Common Tier - `@vben/locales`):**
   - Mở rộng và chuẩn hóa toàn bộ các hành động phổ quát trong `common.json`:
     - `create`: `"Tạo"` / `"Create"` (thay thế cho `"Tạo Mới"` và cấm dùng các nhãn thừa như `"Tạo workspace"`, `"Tạo plugin"` khi nút nằm ngay trong trang tương ứng).
     - `add`: `"Thêm"` / `"Add"`.
     - `edit`: `"Sửa"` / `"Edit"` (hoặc `"Chỉnh sửa"`).
     - `delete`: `"Xóa"` / `"Delete"`.
     - `save`: `"Lưu"` / `"Save"`.
     - `search`: `"Tìm kiếm"` / `"Search"`.
     - `filter`: `"Lọc"` / `"Filter"`.
     - `reset`: `"Đặt lại"` / `"Reset"`.
     - `refresh`: `"Làm mới"` / `"Refresh"`.
     - `export`: `"Xuất"` / `"Export"`.
     - `import`: `"Nhập"` / `"Import"`.
     - `connect`: `"Ghép nối"` / `"Connect"`.
     - `detail`: `"Chi tiết"` / `"Detail"`.
     - `status`: `"Trạng thái"` / `"Status"`.
     - `action`: `"Thao tác"` / `"Actions"`.
3. **Tiêu chuẩn Sentence case & Typography cho Tiếng Việt & Tiếng Anh:**
   - Tiếng Việt: Viết hoa chữ cái đầu câu, không viết hoa từng từ (nghiêm cấm Title Case trong tiếng Việt như `"Quay Lại"`, `"Xác Nhận"`, `"Đặt Lại"` -> chuẩn hóa thành `"Quay lại"`, `"Xác nhận"`, `"Đặt lại"`).
   - Loại bỏ hoàn toàn text cứng (hardcoded strings) trong các bảng điều khiển, header view, và form options.

---

## 2. Tech Stack & Dependencies

- **Framework i18n:** `vue-i18n` (v9/v10 Composition API mode).
- **Core Packages:**
  - `@vben/locales`: SSOT từ điển framework (`packages/locales/src/langs/en-US/common.json`, `vi-VN/common.json`).
  - `@tuquet/admin-web`: Views và Components (`apps/web-admin/src/views/`).
  - `@tuquet/vue-ui`: Button, Badge, Dialog, Modal.
  - `@lucide/vue`: Iconography chuẩn (`Plus`, `RefreshCw`, `Search`, etc.).

---

## 3. Commands (Lệnh Thực Thi)

```bash
# Typecheck kiểm tra tính toàn vẹn kiểu dữ liệu
pnpm --filter @tuquet/admin-web run typecheck

# Chạy unit tests cho preferences và locales
pnpm --filter @vben/locales test

# Build kiểm tra đóng gói cục bộ không lỗi (Zero Git Push)
pnpm run build:local
```

---

## 4. Project Structure (Cấu Trúc Tệp Ảnh Hưởng)

```text
admin/
├── packages/
│   └── locales/src/langs/
│       ├── en-US/common.json          # Mở rộng & chuẩn hóa từ vựng dùng chung (Create, Add, Filter, v.v.)
│       └── vi-VN/common.json          # Sentence case chuẩn tiếng Việt (Tạo, Thêm, Lọc, Làm mới, v.v.)
└── apps/web-admin/src/
    ├── locales/langs/
    │   ├── en-US/page.json            # Tinh gọn nhãn đặc thù màn hình (loại bỏ lặp từ, dùng common)
    │   └── vi-VN/page.json            # Tinh gọn nhãn đặc thù màn hình
    └── views/
        ├── tenants/index.vue          # Nút Tạo (Plus + $t('common.create')), nút Làm mới ($t('common.refresh'))
        ├── fleet/devices/index.vue    # Chuẩn hóa nút Connect/Refresh dùng common
        ├── fleet/browsers/index.vue   # Chuẩn hóa nút Refresh/Filter
        ├── fleet/proxies/index.vue    # Chuẩn hóa nút Refresh/Filter
        ├── automation/workflows/      # Chuẩn hóa nút Refresh/Search
        ├── automation/runs/           # Chuẩn hóa nút Refresh/Search
        └── system/                    # users, roles, plugins, plans, subscriptions, audit-logs (Chuẩn hóa nút & filter)
```

---

## 5. Code Style & Concise Design Pattern

### Ví dụ Thực Tế: Nút Tạo Workspace & Các Nút Thao Tác Header

#### Trước (Dài dòng, thừa thãi, hardcode):
```vue
<!-- Lặp từ "workspace", nút dài chiếm diện tích, text "Làm mới" hardcode tiếng Việt -->
<Button variant="outline" size="sm" class="gap-1.5" @click="() => gridApi.reload()">
  <RefreshCw class="size-3.5" />
  <span>Làm mới</span>
</Button>
<Button size="sm" class="gap-1.5 text-xs font-medium" @click="openCreateModal">
  <Plus class="size-3.5" />
  <span>{{ $t('page.workspace.create_btn') }}</span> <!-- "Tạo workspace" / "Create Workspace" -->
</Button>
```

#### Sau (Tối giản, chuẩn "nói ít hiểu nhiều", tái sử dụng `common`):
```vue
<!-- Ngắn gọn, súc tích, ngữ cảnh trang đã là Workspace, icon Plus bổ trợ hoàn hảo -->
<Button
  variant="outline"
  size="sm"
  class="gap-1.5"
  :title="$t('common.refresh')"
  @click="() => gridApi.reload()"
>
  <RefreshCw class="size-3.5" />
  <span>{{ $t('common.refresh') }}</span>
</Button>
<Button size="sm" class="gap-1.5 text-xs font-medium" @click="openCreateModal">
  <Plus class="size-3.5" />
  <span>{{ $t('common.create') }}</span>
</Button>
```

### Quy Tắc Rà Soát (The Brevity Rules):
1. **Quy tắc ngữ cảnh đơn vị (Context Scoping):** Nếu trang đang mang tiêu đề "Workspace" hoặc "Người dùng", các nút thêm mới trên trang đó chỉ cần mang nhãn `Tạo` (`Create`) hoặc `Thêm` (`Add`), không nối đuôi danh từ của trang.
2. **Quy tắc ưu tiên `common` (Common-First Resolution):** Bất kỳ nhãn nào có tần suất xuất hiện $\ge 2$ màn hình (`Làm mới`, `Đặt lại`, `Tìm kiếm`, `Lọc`, `Tạo`, `Chi tiết`, `Xóa`, `Sửa`) BẮT BUỘC phải nằm ở `$t('common.<action>')`.
3. **Quy tắc Sentence Case tiếng Việt:**
   - ĐÚNG: `Quay lại`, `Về trang chủ`, `Xác nhận`, `Đặt lại`, `Không có dữ liệu`, `Làm mới`, `Tạo`, `Chỉnh sửa`.
   - SAI: `Quay Lại`, `Về Trang Chủ`, `Xác Nhận`, `Đặt Lại`, `Tạo Mới`.

---

## 6. Testing Strategy

1. **TypeScript Compilation:** Chạy `pnpm --filter @tuquet/admin-web run typecheck` để đảm bảo không gãy interface hay missing keys.
2. **Key Consistency Verification:** Đảm bảo cả hai file `en-US/common.json` và `vi-VN/common.json` đồng bộ 100% về danh sách keys.
3. **UI Appearance & Local Verification:** Kiểm tra trực quan qua Tailscale local build (`http://100.68.217.61/`) đảm bảo độ gọn gàng của nút bấm trên cả mobile lẫn desktop.

---

## 7. Boundaries (Ranh Giới Thực Thi)

- **Always:**
  - Sử dụng `$t('common.*')` cho mọi hành động dùng chung lặp lại.
  - Áp dụng Sentence case cho tiếng Việt trong toàn bộ file locales.
  - Giữ icon trực quan (`Plus`, `RefreshCw`, `Search`) đi kèm nhãn ngắn gọn.
- **Ask first:**
  - Thay đổi cấu trúc schema i18n lớn ảnh hưởng đến module ngoài `admin`.
- **Never:**
  - Gõ text tĩnh hardcode (như `"Làm mới"`, `"Đặt lại"`, `"Tìm kiếm"`) trực tiếp vào file `.vue`.
  - Dùng Title Case trong tiếng Việt (viết hoa mọi chữ cái đầu từ).
  - Sử dụng `git push` hoặc trigger CI từ xa (tuân thủ nghiêm ngặt Zero Git Push).

---

## 8. Success Criteria (Tiêu Chí Nghiệm Thu)

- [ ] Toàn bộ các nút hành động (Tạo, Làm mới, Lọc, Đặt lại) trên trang `tenants`, `fleet`, `automation`, `system` chuyển sang sử dụng `$t('common.*')` với nhãn súc tích.
- [ ] Nút tạo trên trang Quản trị workspace hiển thị ngắn gọn là `Tạo` (vi-VN) / `Create` (en-US).
- [ ] Toàn bộ từ vựng trong `vi-VN/common.json` được chuẩn hóa về Sentence case (không viết hoa từng từ).
- [ ] Chạy `typecheck` đạt code 0.
- [ ] Build local (`pnpm run build:local`) thành công 100%.

---

## 9. Open Questions

1. Đối với các nút tạo tài nguyên có nhiều loại (ví dụ: "Thêm thành viên" vs "Tạo workspace" trong cùng 1 modal con), có áp dụng rút gọn nhãn thành "Thêm" khi ngữ cảnh modal đã ghi rõ tiêu đề không?  
   *(Khuyến nghị: Trong modal có tiêu đề "Mời thành viên mới", nút submit chỉ cần là "Mời" hoặc "Thêm").*
