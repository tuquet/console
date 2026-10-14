# Spec: Interactive 3D Specter Ghost Banner (`specter-ghost-banner`)

> **Module id:** `specter-3d-ghost-banner` — **ĐÃ HOÀN THÀNH (ACCEPTED & IMPLEMENTED)**

## Objective

Xây dựng tuỳ chọn banner tương tác thứ 3 mang tên **`ghost 3d`** (`SpecterGhost3DBanner`) cho trang Xác thực / Đăng nhập (`AuthPageLayout` trong `@tuquet/admin-web`), tái hiện linh vật thương hiệu **Specter Waving Ghost** ([`specter-waving.svg`](../../public/illustrations/specter-waving.svg)) dưới dạng mô hình **3D WebGL / Three.js thời gian thực**:

1. **Tạo hình 3D chuẩn linh vật Specter gốc:**
   - Thân ma 3D liền khối dạng vòm thuôn mềm mại với vật liệu **Matte / Frosted Ceramic** (sứ mờ cao cấp phản xạ ánh sáng rim-light dịu mắt ở cả Dark mode `#0a0a0a` và Light mode `#fafafa`).
   - Phần đuôi/tà áo dưới đáy biến dạng sóng 3D mượt mà theo thời gian thực (harmonic cloth-wave vertex displacement).
   - **3 đặc trưng nhận diện từ `specter-waving.svg`:**
     - Đôi mắt bầu dục đen bóng có **ngôi sao 4 cánh lấp lánh (4-point star catchlight)** + chấm sáng phụ liếc theo con trỏ chuột (eye-tracking).
     - Đôi má bầu dục ửng nhẹ/trung tính cùng khuôn miệng cười duyên.
     - Hai cánh tay 3D tròn trĩnh: tay phải vẫy chào tự nhiên (tăng nhịp vẫy kèm nảy người vui vẻ khi người dùng rê chuột vào gần hoặc click vào con ma).
2. **Tương tác 3D & Ánh sáng đồng bộ với `SplineRobotBanner`:**
   - Toàn bộ cơ thể và đầu con ma nghiêng/xoay mượt mà theo vị trí chuột trên màn hình (spring-damped cursor tracking) kèm chuyển động bay lơ lửng (levitation bobbing).
   - Tích hợp chùm sáng `<Spotlight />` chéo từ góc trên cùng tông với `SplineRobotBanner` để khi chuyển đổi giữa `phone` · `robot 3d` · `ghost 3d` · `random` không gian luôn đồng nhất.

---

## Tech Stack

- **Framework:** Vue 3.5 (`<script lang="ts" setup>`) + TypeScript 5.x
- **3D Engine:** `three` (`Three.js` ESM `0.174.0` tải động theo yêu cầu qua CDN `esm.sh` / `jsdelivr`, không làm phình bundle chính của `web-admin` khi chưa kích hoạt)
- **Theme / State:** `@vben/preferences` (`usePreferences().isDark`) + `window.localStorage` (`specter:auth-banner-mode`)

---

## Commands

```bash
# Kiểm tra kiểu dữ liệu TypeScript cho web-admin
pnpm --dir apps/web-admin run typecheck

# Chạy unit test cho banner & auth layout
pnpm test:unit apps/web-admin/src/components/common/__tests__/specter-ghost-banner.test.ts

# Đóng gói bản production của web-admin
pnpm run build:admin

# Chạy máy chủ phát triển cục bộ
pnpm run dev:admin
```

---

## Project Structure

```text
apps/web-admin/
├── docs/specs/
│   └── SPEC-specter-3d-ghost-banner.md                        → Bản đặc tả kỹ thuật này (SSOT)
├── public/illustrations/
│   └── specter-waving.svg                                     → Linh vật 2D gốc làm tham chiếu tạo hình
└── src/
    ├── components/common/
    │   ├── hairline-phone-banner.vue                          → Tuỳ chọn 1: Hairline Isometric Phone
    │   ├── spline-robot-banner.vue                            → Tuỳ chọn 2: Spline 3D Robot
    │   ├── specter-ghost-banner.vue                           → [NEW] Tuỳ chọn 3: Three.js 3D Specter Ghost
    │   └── __tests__/
    │       └── specter-ghost-banner.test.ts                   → [NEW] Unit test vòng đời & chuyển đổi chế độ
    └── layouts/
        └── auth.vue                                           → [MODIFY] Bộ chuyển đổi phone | robot 3d | ghost 3d | random
```

---

## Code Style

Tuân thủ chuẩn Vue 3 Composition API (`<script lang="ts" setup>`), dọn dẹp triệt để tài nguyên GPU (`renderer.dispose()`, `geometry.dispose()`, `material.dispose()`, `cancelAnimationFrame`) trong `onBeforeUnmount`:

```ts
// Ví dụ chuẩn quản lý vòng đời WebGL & tương tác chuột có giảm chấn (spring damping)
interface GhostPointerState {
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  waveBoost: number;
}

function stepPointerDamping(state: GhostPointerState, dt: number) {
  const k = 1 - Math.exp(-8 * dt);
  state.currentX += (state.targetX - state.currentX) * k;
  state.currentY += (state.targetY - state.currentY) * k;
  state.waveBoost = Math.max(0, state.waveBoost - dt * 1.8);
}
```

---

## Testing Strategy

- **Framework:** `vitest` + `@vue/test-utils` (`happy-dom`).
- **Unit Tests (`apps/web-admin/src/components/common/__tests__/specter-ghost-banner.test.ts`):**
  1. Kiểm tra component `SpecterGhostBanner` render đầy đủ khung `<canvas>`, hiệu ứng `<Spotlight />`, và trạng thái loading/fallback khi môi trường không có WebGL.
  2. Kiểm tra bộ chuyển đổi trong `auth.vue` hỗ trợ đủ 4 chế độ (`phone`, `robot`, `ghost`, `random`) và lưu đúng giá trị vào `localStorage` (`specter:auth-banner-mode`).
  3. Kiểm tra `onBeforeUnmount` giải phóng `requestAnimationFrame` và WebGL renderer mà không rò rỉ bộ nhớ.
- **Type & Build Verification:** `pnpm --dir apps/web-admin run typecheck` và `pnpm run build:admin` đạt `0` lỗi.

---

## Boundaries

- **Always do:**
  - Giải phóng toàn bộ `WebGLRenderer`, `BufferGeometry`, `Material` và listener `pointermove` / `resize` khi hủy component (`onBeforeUnmount`).
  - Tự động điều chỉnh ánh sáng cảnh 3D và màu nền trong suốt (`alpha: true`) khi người dùng chuyển đổi giữa Dark mode (`#0a0a0a`) và Light mode (`#fafafa`).
  - Chạy `typecheck` và `vitest` trước khi hoàn tất.
- **Ask first:**
  - Thêm dependency mới vào `package.json` (mặc định dùng dynamic ESM import như `SplineRobotBanner` để giữ `package.json` sạch và bundle size bằng `0` khi không dùng).
  - Thay đổi cấu trúc layout `authentication.vue` trong `@vben/layouts`.
- **Never do:**
  - Để rò rỉ vòng lặp `requestAnimationFrame` khi chuyển sang tab banner khác (`phone` hoặc `robot 3d`).
  - Sử dụng nền màu loang lổ làm lệch tông monochrome của trang đăng nhập.

---

## Success Criteria

1. **Đúng tạo hình linh vật Specter 3D:** Con ma 3D có thân vòm mượt, tà áo lượn sóng 3D, mắt đen bầu dục đính ngôi sao 4 cánh trắng lấp lánh, má ửng dịu, miệng cười và cánh tay vẫy chào sống động.
2. **Phản hồi chuột mượt 60fps:** Khi di chuyển chuột trên vùng banner, đầu/thân và tròng mắt (kèm ngôi sao 4 cánh) liếc theo hướng chuột; khi click vào con ma, con ma nảy nhẹ và vẫy tay nhanh chào người dùng.
3. **Bộ chọn 4 chế độ trên Banner (`auth.vue`):** Thanh chọn ở góc dưới bên trái hiển thị `phone` · `robot 3d` · `ghost 3d` · `random`; chế độ `random` xoay vòng ngẫu nhiên giữa cả 3 mô hình (`phone`, `robot`, `ghost`).
4. **Tương thích hoàn hảo Light & Dark Mode:** Nổi bật với ánh sáng rim-light bạc trên nền `#0a0a0a` (Dark mode) và bóng đổ studio thanh lịch trên nền `#fafafa` (Light mode).
5. **Kiểm chứng tự động:** Pass 100% unit test, `pnpm --dir apps/web-admin run typecheck` và `pnpm run build:admin`.

---

## Open Questions

- Mặc định khi người dùng mới vào trang đăng nhập lần đầu tiên (chưa có `localStorage`), bạn muốn để mặc định là `phone`, `ghost 3d`, hay `random` (tự động xoay vòng cả 3)?
