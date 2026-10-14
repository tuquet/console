# Spec: Layout & Preferences Coherence (Audit & Hardening)

## Objective

Khắc phục triệt để các bất thường và rủi ro use-case trong hệ thống Layout & Preferences của Tuquet Admin (`@tuquet/admin-web`, `@vben/preferences`, `@vben/layouts`, `@vben-core/layout-ui`), đảm bảo:

1. **Không bị Deadlock (Khóa cứng giao diện)**: Người dùng khi thay đổi bất kỳ cài đặt nào trong Preferences Drawer (tắt Header, tắt Sidebar, đổi vị trí nút Settings, v.v.) không bao giờ bị rơi vào tình trạng mất trắng điều hướng hoặc không thể mở lại Preferences/Đăng xuất.
2. **Khắc phục các lỗi hiển thị & Responsive (Mobile/Tablet)**: Sửa triệt để các thuộc tính làm tràn layout (Horizontal Overflow do 1200px fixed width), ẩn khuất tử ngoại (ẩn Breadcrumb trên tablet), hoặc footer trôi dạt/chui dưới Sidebar.
3. **Đồng bộ hóa 100% giữa Preferences Control UI và Runtime Layout**: Mọi option xuất hiện trong Preferences Drawer phải có hiệu lực thực tế và ngược lại (không có cài đặt ma, không có tính năng runtime thiếu công tắc điều khiển như `tabbar.showRefresh`).

---

## 9 Phân Hệ Đã Kiểm Tra & Các Bất Thường Phát Hiện (Audit Findings)

### 1. Phân hệ Header (`header`)

- **Bất thường / Rủi ro nghiêm trọng (Deadlock Lock-out)**:
  - Khi `preferencesButtonPosition` đặt là `'header'`, nếu người dùng gạt tắt `header.enable: false`:
    - Thanh Header biến mất.
    - Nút mở Preferences biến mất (vì `fixed: false`).
    - Khối UserDropdown (chứa nút Đăng xuất) biến mất.
    - **Hệ quả**: Người dùng bị kẹt hoàn toàn trong giao diện cụt, không thể bật lại Header, không thể mở Preferences để khôi phục, không thể đăng xuất nếu không biết cách tự xóa `localStorage` của trình duyệt.
- **Giải pháp khắc phục**:
  - Trong `use-preferences.ts`: Khi `header.enable === false`, tự động fallback `preferencesButtonPosition.value.fixed = true` (hiển thị nút nổi dự phòng ở góc màn hình) và hỗ trợ phím tắt khẩn cấp (`Alt + S` / `Alt + P` để mở Preferences).

### 2. Phân hệ Sidebar (`sidebar`)

- **Bất thường / Rủi ro nghiêm trọng (No-Navigation Trap)**:
  - Trong chế độ layout mặc định `sidebar-nav`, nếu người dùng gạt tắt `sidebar.enable: false`:
    - Sidebar biến mất.
    - Header không có menu (vì `showHeaderNav` chỉ kích hoạt ở chế độ `header-nav` hoặc `mixed-nav`).
    - **Hệ quả**: Ứng dụng không còn bất kỳ menu điều hướng nào trên màn hình.
- **Giải pháp khắc phục (Đã chốt)**:
  - Trong Preferences Drawer (`sidebar.vue` block): Khóa switch "Enable Sidebar" (`:disabled="isSidebarNav"`) kèm tooltip giải thích khi đang ở layout `sidebar-nav`, ngăn ngừa việc tắt toàn bộ điều hướng ứng dụng.

### 3. Phân hệ Content (`content`)

- **Bất thường / Lỗi vỡ giao diện Mobile & Tablet (Horizontal Overflow)**:
  - Trong `packages/@core/ui-kit/layout-ui/src/components/layout-content.vue` (dòng 43):
    ```typescript
    const compactStyle: CSSProperties =
      contentCompact === 'compact'
        ? { margin: '0 auto', width: `${props.contentCompactWidth}px` }
        : {};
    ```
  - `contentCompactWidth` mặc định là `1200px`. Khi chọn `compact`, component gán cứng `width: 1200px` mà **không có `max-width: 100%`**.
  - **Hệ quả**: Trên màn hình điện thoại (375px - 430px) hoặc máy tính bảng (768px - 1024px), trang bị tràn ngang nghiêm trọng (vỡ responsive, xuất hiện thanh cuộn ngang khó chịu).
- **Giải pháp khắc phục**:
  - Đổi thành:
    ```typescript
    width: `min(100%, ${props.contentCompactWidth}px)`,
    maxWidth: '100%',
    ```

### 4. Phân hệ Tabbar (`tabbar`)

- **Bất thường 1 (Thiếu công tắc UI - Missing Control)**:
  - Trong `packages/@core/preferences/src/config.ts`, thuộc tính `tabbar.showRefresh` tồn tại và `LayoutTabbar` có component `<TabsToolRefresh v-if="preferences.tabbar.showRefresh">`.
  - Tuy nhiên, trong `packages/effects/layouts/src/widgets/preferences/blocks/layout/tabbar.vue`, **hoàn toàn không có SwitchItem cho `tabbarShowRefresh`**! Người dùng không thể tắt/bật nút Refresh này trên giao diện cài đặt.
- **Bất thường 2 (Lãng phí bộ nhớ khi tắt Tabbar)**:
  - Khi `tabbar.enable: false`, store `useTabbarStore()` vẫn tiếp tục lắng nghe router và ghi nhận danh sách tab vào `localStorage` (`preferences-tabbar`), gây dư thừa dữ liệu không cần thiết.
- **Giải pháp khắc phục**:
  - Bổ sung `SwitchItem v-model="tabbarShowRefresh"` vào `tabbar.vue` block.
  - Khi `tabbar.enable === false`, dừng auto-persist các tab mới.

### 5. Phân hệ Breadcrumb (`breadcrumb`)

- **Bất thường (Cứng nhắc breakpoint - Hidden on Tablets)**:
  - Trong `packages/effects/layouts/src/basic/header/header.vue` (dòng 295):
    ```vue
    <div class="flex-center hidden lg:block">
      <slot name="breadcrumb"></slot>
    </div>
    ```
  - Class `hidden lg:block` ẩn Breadcrumb trên toàn bộ màn hình dưới 1024px (bao gồm cả iPad/máy tính bảng `md: 768px`).
  - Khi bật `header-nav` hoặc `mixed-nav`, Breadcrumb bị ẩn do `v-if="!showHeaderNav && preferences.breadcrumb.enable"` mà không hề có tooltip giải thích trong Preferences Drawer.
- **Giải pháp khắc phục (Đã chốt)**:
  - Giữ nguyên Breadcrumb ở breakpoint Desktop-only (`lg:block`, $\ge 1024\text{px}$) theo quyết định của người dùng để giữ Header thanh thoát trên Tablet.
  - Bổ sung tooltip giải thích trong Preferences Drawer khi bật các layout có `showHeaderNav`: _"Breadcrumb chỉ hiển thị trên màn hình Desktop (≥1024px) khi Header không chứa menu chính"_.

### 6. Phân hệ Navigation & Menu (`navigation` & `menu`)

- **Bất thường (Công tắc vô hiệu nhưng vẫn cho phép bấm)**:
  - Trong `packages/effects/layouts/src/widgets/preferences/blocks/layout/navigation.vue`, tính năng `navigationSplit` ("Phân tách menu") chỉ có tác dụng trong layout `mixed-nav` và `header-mixed-nav`.
  - Trong layout `sidebar-nav`, người dùng vẫn bấm bật/tắt được `navigationSplit` nhưng giao diện không hề thay đổi, gây hiểu nhầm là lỗi phần mềm.
- **Giải pháp khắc phục**:
  - Truyền prop `:disabled="!isMixedNav"` vào `SwitchItem` của `navigationSplit` để vô hiệu hóa một cách trực quan khi không ở chế độ Menu hỗn hợp.

### 7. Phân hệ Widget & Controls (`widget`)

- **Bất thường / Nguy cơ mất nút Preferences**:
  - Trong `widget.vue` (Preferences Drawer), danh sách chọn vị trí (`preferencesPositionItems`) cho phép chọn giá trị `none` ("Không hiển thị").
  - Nếu người dùng chọn `none` cho Preferences Button và không bật phím tắt: nút cài đặt biến mất vĩnh viễn khỏi Header, Floating button và UserDropdown.
- **Giải pháp khắc phục**:
  - Loại bỏ option `none` khỏi `preferencesPositionItems` hoặc luôn hiển thị mục Cài đặt trong `UserDropdown` làm fallback phòng hộ cuối cùng.

### 8. Phân hệ Footer & Copyright (`footer` & `copyright`)

- **Bất thường (Đã phát hiện & cần hoàn thiện quy chuẩn)**:
  - Khi bật `footer.enable = true` mà `copyright.enable = false`, Footer bị rỗng hoàn toàn 0px.
  - Khi bật `footerFixed = true`, nếu không có `right: 0`, thanh footer cố định bị lệch và thụt vào trong Sidebar.
- **Giải pháp khắc phục**:
  - Đã áp dụng `right-0 border-t border-border bg-card/90 backdrop-blur-sm` và fallback text `Copyright © 2026 Tuquet`. Cần bổ sung test case tự động để bảo vệ vĩnh viễn.

### 9. Phân hệ Layout Presets (`layout`)

- **Bất thường khi chuyển sang `full-content`**:
  - Khi chọn chế độ `full-content`, toàn bộ Header, Sidebar, Tabbar, Footer đều bị unmount. Nút Preferences nổi (`fixed`) tự động xuất hiện ở mép phải nhưng có thể đè lên các nút thao tác góc phải màn hình của các trang chức năng (như fullscreen modal, table action buttons).
- **Giải pháp khắc phục**:
  - Đảm bảo nút Preferences ở mode `fixed` có vị trí neo chuẩn (`bottom-6 right-6` hoặc `top-1/2 -translate-y-1/2 right-0`) và có thể gạt sang mép không che khuất các phần tử tương tác quan trọng.

---

## Tech Stack

- **Framework**: Vue 3 (`<script setup lang="ts">`), Vue Router 4, Pinia.
- **Design System**: Shadcn Vue (`@vben-core/shadcn-ui`), Tailwind CSS v4, Lucide Icons (`@vben/icons`).
- **State & Configuration**: `@vben/preferences` (PreferencesManager, reactive state).

---

## Commands

```bash
# Typecheck TypeScript toàn workspace (yêu cầu 0 lỗi)
pnpm check:type

# Lint & Format code
pnpm run lint
pnpm run format

# Kiểm tra Unit Tests Vitest
pnpm test:unit

# Build production bundle
pnpm run build:admin

# Chạy Dev Server
pnpm run dev:admin
```

---

## Project Structure

```
packages/
├── @core/
│   ├── preferences/src/
│   │   ├── config.ts              → Cấu hình mặc định preferences
│   │   ├── use-preferences.ts     → Logic tính toán reactive & fallback an toàn
│   │   └── types.ts               → Kiểu dữ liệu preferences
│   └── ui-kit/
│       └── layout-ui/src/
│           ├── components/
│           │   ├── layout-content.vue → Responsive compact width fix
│           │   └── layout-footer.vue  → Pinned fixed position & styling
│           └── vben-layout.vue        → Shell bố cục tổng thể
└── effects/
    └── layouts/src/
        ├── basic/
        │   ├── header/header.vue      → Responsive breadcrumb & preferences
        │   ├── layout.vue             → Kết nối slots & fallback an toàn
        │   └── tabbar/tabbar.vue      → Tabbar controls & sync
        └── widgets/preferences/
            ├── preferences-drawer.vue → Giao diện ngăn kéo cài đặt
            └── blocks/layout/
                ├── breadcrumb.vue     → Điều kiện hiển thị & tooltip
                ├── content.vue        → Chọn wide/compact
                ├── navigation.vue     → Khóa switch không tương thích
                ├── tabbar.vue         → Bổ sung switch showRefresh
                └── widget.vue         → Bảo vệ vị trí Preferences không bị mất
```

---

## Code Style & Quy Chuẩn

### 1. Nguyên tắc An toàn Chống Deadlock (Anti-Lockout Invariant)

```typescript
// use-preferences.ts: Luôn đảm bảo người dùng có ít nhất một cách mở Preferences
const preferencesButtonPosition = computed(() => {
  const { enablePreferences, preferencesButtonPosition } = preferences.app;
  if (!enablePreferences) {
    return { fixed: false, header: false, userDropdown: false };
  }
  const isHeaderPosition = preferencesButtonPosition === 'header';
  const isHeaderDisabled = !preferences.header.enable;

  // Nếu chọn hiển thị ở Header nhưng Header bị tắt -> Tự động chuyển sang Fixed để không bị kẹt
  if (isHeaderPosition && isHeaderDisabled) {
    return { fixed: true, header: false, userDropdown: false };
  }
  ...
});
```

### 2. Nguyên tắc Mobile-First & No Horizontal Scroll

```typescript
// layout-content.vue: Không bao giờ gán cứng width vượt quá chiều rộng viewport
const compactStyle: CSSProperties =
  contentCompact === 'compact'
    ? {
        margin: '0 auto',
        width: `min(100%, ${props.contentCompactWidth}px)`,
        maxWidth: '100%',
      }
    : {};
```

---

## Testing Strategy

1. **Unit Tests (Vitest)**:
   - Thêm test trong `packages/@core/preferences/__tests__/use-preferences.test.ts` kiểm tra:
     - Khi `header.enable: false` và `preferencesButtonPosition: 'header'`, `preferencesButtonPosition.value.fixed` phải là `true`.
     - Khi `tabbar.enable: false`, các tab thừa không tiếp tục được append.
   - Thêm test trong `packages/@core/ui-kit/layout-ui/src/__tests__/layout-content.test.ts` kiểm tra style khi `contentCompact === 'compact'`.
2. **Typecheck (`vue-tsc`)**: Chạy `pnpm check:type` đạt 0 lỗi trên toàn bộ 38 packages.
3. **Format & Lint (`oxlint` + `oxfmt`)**: Chạy `pnpm run lint` đạt 0 warnings, 0 errors.

---

## Boundaries

- **Always**:
  - Giữ nguyên vẹn mọi semantic CSS tokens (`border-border`, `bg-card`, `bg-background`).
  - Đảm bảo mọi trạng thái thay đổi trong Preferences Drawer đều có hiệu ứng tức thì (Live reactive) không cần F5.
  - Bảo đảm tính an toàn: người dùng không bao giờ bị khóa ngoài hệ thống.
- **Ask first**:
  - Loại bỏ hoàn toàn một chế độ layout trong 7 layout presets.
- **Never**:
  - Cho phép trạng thái `header.enable: false` làm mất quyền truy cập Preferences hoặc Đăng xuất.
  - Dùng mã pixel cứng cho layout width mà không có `maxWidth: 100%`.

---

## Success Criteria

- [ ] 1. **Anti-Lockout**: Tắt Header trong Preferences Drawer → nút bánh răng Cài đặt tự động xuất hiện ở chế độ Fixed nổi góc màn hình; Menu UserDropdown/Logout vẫn truy cập được.
- [ ] 2. **Anti-Navigation-Trap**: Ở chế độ `sidebar-nav`, khóa switch Enable Sidebar (`:disabled="isSidebarNav"`) kèm thông báo để không bị mất toàn bộ menu điều hướng.
- [ ] 3. **Responsive Compact Content**: Chuyển content sang `compact` trên mobile và tablet → không phát sinh thanh cuộn ngang (0 horizontal overflow).
- [ ] 4. **Tabbar Controls**: Nút `showRefresh` xuất hiện trong cấu hình Preferences Tabbar và đồng bộ bật/tắt nút refresh trên thanh tab.
- [ ] 5. **Breadcrumb Desktop-only Coherence**: Giữ nguyên `lg:block` và bổ sung chú thích rõ ràng khi Header chứa menu chính.
- [ ] 6. **Navigation Split Guard**: Switch `navigationSplit` bị disabled có tooltip khi không ở mode Menu hỗn hợp.
- [ ] 7. **Footer & Copyright**: Bật Footer và Fixed at bottom hiển thị thanh chân trang có border-t, căn chuẩn lề phải không bị chui vào Sidebar, hiển thị bản quyền ngay cả khi copyright switch tắt.
- [ ] 8. **Zero Regression**: Toàn bộ unit tests (587+ tests), linting và build Vite kết thúc với mã thoát 0.

---

## Decided Policy & Decisions

1. **Khóa switch Enable Sidebar trong `sidebar-nav`**: Khi đang ở layout `sidebar-nav`, `sidebar.enable` switch bị `:disabled="true"` để người dùng không vô tình khóa cụt menu điều hướng. Nếu người dùng muốn ẩn thanh bên, họ có thể dùng nút Collapse (thu gọn).
2. **Breakpoint Breadcrumb**: Giữ nguyên `lg:block` ($\ge 1024\text{px}$) trên Desktop để đảm bảo tính tối giản, không gây chật chội Header trên màn hình Tablet. Bổ sung tooltip giải thích rõ ràng.
