# Spec: Banner 3D Tương Tác Linh Vật Specter Trên Trang Xác Thực (`specter-3d-ghost-banner`)

> **Mã đặc tả:** `SPEC-specter-3d-ghost-banner`  
> **Module id:** `specter-3d-ghost-banner` (xem [`capability-map.md`](capability-map.md))  
> **Kiến trúc nguồn:** [`docs/architecture/overview.md`](../architecture/overview.md), [`docs/routes/auth.md`](../routes/auth.md)  
> **Trạng thái:** **ĐÃ HOÀN THÀNH (ACCEPTED & IMPLEMENTED)**

---

## 1. Objective (Mục Tiêu & Phạm Vi)

Xây dựng bộ sưu tập 3 banner tương tác kèm tuỳ chọn **`ghost 3d`** (`SpecterGhostBanner`) cho khung giao diện Xác thực (`AuthPageLayout` trong `@tuquet/admin-web`), tái hiện linh vật thương hiệu **Specter Waving Ghost** ([`specter-waving.svg`](../../public/illustrations/specter-waving.svg)) dưới dạng mô hình **3D WebGL / Three.js thời gian thực**:

1. **Tạo Hình 3D Chuẩn Linh Vật Specter Gốc:**
   - Thân ma 3D liền khối dạng vòm thuôn mềm mại với vật liệu **Matte / Frosted Ceramic** (sứ mờ cao cấp phản xạ ánh sáng rim-light dịu mắt ở cả Dark mode `#0a0a0a` và Light mode `#fafafa`).
   - Phần đuôi/tà áo dưới đáy biến dạng sóng 3D mượt mà theo thời gian thực (harmonic cloth-wave vertex displacement).
   - **Ba đặc trưng nhận diện từ `specter-waving.svg`:**
     - Đôi mắt bầu dục đen bóng có **ngôi sao 4 cánh lấp lánh (4-point star catchlight)** + chấm sáng phụ liếc theo con trỏ chuột (eye-tracking).
     - Đôi má bầu dục ửng nhẹ/trung tính cùng khuôn miệng cười duyên.
     - Hai cánh tay 3D tròn trĩnh: tay phải vẫy chào tự nhiên (tăng nhịp vẫy kèm nảy người vui vẻ khi người dùng rê chuột vào gần hoặc click vào con ma).
2. **Tương Tác 3D & Ánh Sáng Đồng Bộ Giữa 4 Chế Độ Banner (`auth.vue`):**
   - Toàn bộ cơ thể và đầu con ma nghiêng/xoay mượt mà theo vị trí chuột trên màn hình (spring-damped cursor tracking) kèm chuyển động bay lơ lửng (levitation bobbing).
   - Tích hợp chùm sáng `<Spotlight />` chéo từ góc trên cùng tông với `SplineRobotBanner` để khi chuyển đổi giữa 4 chế độ `phone` · `robot 3d` · `ghost 3d` · `random` không gian luôn đồng nhất.

---

## 2. Tech Stack

- **Framework:** Vue 3.5 (`<script lang="ts" setup>`) + TypeScript 5.x.
- **3D Engine:** `three` (`Three.js` ESM `0.174.0` tải động theo yêu cầu qua CDN `esm.sh` / `jsdelivr`, giữ kích thước bundle chính của `web-admin` bằng `0 KB` khi chưa kích hoạt).
- **Theme & Persistence:** `@vben/preferences` (`usePreferences().isDark`) + `window.localStorage` (`specter:auth-banner-mode`).

---

## 3. Commands (Lệnh Thực Thi & Kiểm Định)

```bash
# 1. Kiểm tra kiểu dữ liệu TypeScript cho web-admin
pnpm --dir apps/web-admin run typecheck

# 2. Chạy unit test cho 3D Ghost Banner & hàm toán học chuyển động
pnpm exec vitest run apps/web-admin/src/components/common/__tests__/specter-ghost-banner.test.ts

# 3. Đóng gói bản production của web-admin
pnpm run build:admin

# 4. Chạy máy chủ phát triển cục bộ
pnpm run dev:admin
```

---

## 4. Project Structure (Cấu Trúc Tệp Tác Động)

```text
apps/web-admin/
├── docs/specs/
│   └── SPEC-specter-3d-ghost-banner.md                        # Bản đặc tả kỹ thuật này (SSOT)
├── public/illustrations/
│   └── specter-waving.svg                                     # Linh vật 2D gốc làm tham chiếu tạo hình
└── src/
    ├── components/common/
    │   ├── hairline-phone-banner.vue                          # Tuỳ chọn 1: Hairline Isometric Phone
    │   ├── spline-robot-banner.vue                            # Tuỳ chọn 2: Spline 3D Robot
    │   ├── specter-ghost-banner.vue                           # Tuỳ chọn 3: Three.js 3D Specter Ghost
    │   └── __tests__/
    │       └── specter-ghost-banner.test.ts                   # Unit test toán học sóng, giảm chấn & vòng đời WebGL
    └── layouts/
        └── auth.vue                                           # Bộ chuyển đổi 4 chế độ: phone | robot 3d | ghost 3d | random
```

---

## 5. Code Style & Kiến Trúc Chi Tiết

Tuân thủ chuẩn Vue 3 Composition API (`<script lang="ts" setup>`), tách biệt các hàm toán học thuần khiết (`stepGhostPointer`, `computeSkirtWaveDisplacement`) để kiểm thử đơn vị và dọn dẹp triệt để tài nguyên GPU (`renderer.dispose()`, `geometry.dispose()`, `material.dispose()`, `cancelAnimationFrame`) trong `onBeforeUnmount`:

```ts
export interface GhostPointerState {
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  waveBoost: number;
}

export function stepGhostPointer(state: GhostPointerState, dt: number) {
  const k = 1 - Math.exp(-8 * dt);
  state.currentX += (state.targetX - state.currentX) * k;
  state.currentY += (state.targetY - state.currentY) * k;
  state.waveBoost = Math.max(0, state.waveBoost - dt * 1.8);
}
```

---

## 6. Testing Strategy (Chiến Lược Kiểm Thử)

- **Framework:** `vitest` + `@vue/test-utils` (`happy-dom`).
- **Unit Tests ([`specter-ghost-banner.test.ts`](../../src/components/common/__tests__/specter-ghost-banner.test.ts)):**
  1. Kiểm tra hàm giảm chấn con trỏ `stepGhostPointer` và hàm biến dạng sóng hài tà áo `computeSkirtWaveDisplacement`.
  2. Kiểm tra component `SpecterGhostBanner` render đầy đủ khung `<canvas>`, hiệu ứng `<Spotlight />`, và trạng thái fallback an toàn khi môi trường không có WebGL.
  3. Kiểm tra `onBeforeUnmount` giải phóng `requestAnimationFrame` và WebGL context mà không rò rỉ bộ nhớ.
- **Type & Build Verification:** `pnpm --dir apps/web-admin run typecheck` và `pnpm run build:admin` đạt `0` lỗi.

---

## 7. Boundaries (Ranh Giới Kỹ Thuật)

- **Always:**
  - Giải phóng toàn bộ `WebGLRenderer`, `BufferGeometry`, `Material` và listener `pointermove` / `resize` khi hủy component (`onBeforeUnmount`).
  - Tự động điều chỉnh ánh sáng cảnh 3D và màu nền trong suốt (`alpha: true`) khi người dùng chuyển đổi giữa Dark mode (`#0a0a0a`) và Light mode (`#fafafa`).
  - Chạy `typecheck` và `vitest` trước khi hoàn tất.
- **Ask first:**
  - Thêm dependency 3D mới vào `package.json` (mặc định dùng dynamic ESM import để giữ `package.json` gọn nhẹ và bundle size bằng `0` khi không dùng).
  - Thay đổi cấu trúc layout `authentication.vue` trong `@vben/layouts`.
- **Never:**
  - Để rò rỉ vòng lặp `requestAnimationFrame` khi chuyển sang tab banner khác (`phone` hoặc `robot 3d`).
  - Sử dụng nền màu loang lổ làm lệch tông monochrome của trang đăng nhập.

---

## 8. Success Criteria (Tiêu Chí Nghiệm Thu)

- [x] **SC1 — Tạo hình linh vật Specter 3D chuẩn xác:** Con ma 3D có thân vòm sứ mờ mượt mà, tà áo lượn sóng 3D, mắt đen bầu dục đính ngôi sao 4 cánh trắng lấp lánh, má ửng dịu, miệng cười và cánh tay vẫy chào sống động.
- [x] **SC2 — Phản hồi chuột mượt 60fps:** Khi di chuyển chuột trên vùng banner, đầu/thân và tròng mắt (kèm ngôi sao 4 cánh) liếc theo hướng chuột; khi click vào con ma, con ma nảy nhẹ và vẫy tay nhanh chào người dùng.
- [x] **SC3 — Bộ chọn 4 chế độ trên Banner ([`auth.vue`](../../src/layouts/auth.vue)):** Thanh chọn ở góc dưới bên trái hiển thị `phone` · `robot 3d` · `ghost 3d` · `random`; chế độ `random` xoay vòng ngẫu nhiên giữa cả 3 mô hình (`phone`, `robot`, `ghost`).
- [x] **SC4 — Tương thích Light & Dark Mode:** Nổi bật với ánh sáng rim-light bạc trên nền `#0a0a0a` (Dark mode) và bóng đổ studio thanh lịch trên nền `#fafafa` (Light mode).
- [x] **SC5 — Kiểm chứng tự động:** Pass 100% unit test, `pnpm --dir apps/web-admin run typecheck` và `pnpm run build:admin`.

---

## 9. Resolved Decisions (Các Quyết Định Đã Chốt)

1. **Chế độ mặc định khi truy cập lần đầu (`random`):** Khi người dùng mở trang đăng nhập lần đầu tiên (chưa có khóa `specter:auth-banner-mode` trong `localStorage`), hệ thống mặc định chọn chế độ `random` để xoay vòng ngẫu nhiên giữa cả 3 mô hình (`phone`, `robot`, `ghost`), mang lại trải nghiệm thị giác tươi mới ở mỗi phiên truy cập.
2. **Nạp động Three.js qua ESM CDN:** Tải `three@0.174.0` bất đồng bộ khi kích hoạt cảnh `ghost 3d` (có CDN dự phòng), giúp tốc độ tải trang đăng nhập tức thì và không làm tăng kích thước gói JS chính.
