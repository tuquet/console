# ADR-002: Kiến Trúc Phông Chữ Không Chân Self-Hosted & Chuẩn Hóa Typography SSOT

## Trạng Thái (Status)

**Accepted** (Đã thông qua và hoàn thành triển khai ngày 2026-10-13)

## Ngày (Date)

2026-10-13

## Bối Cảnh (Context)

Hệ thống quản trị Web Admin (`apps/web-admin`) cần đảm bảo tối ưu hiệu năng hiển thị và tính nhất quán kiểu chữ trên toàn bộ giao diện:

1. **Độc lập kết nối mạng bên ngoài (Zero Google CDN Dependency):** Việc tải font qua kết nối bên ngoài (`fonts.googleapis.com` / `fonts.gstatic.com`) trong môi trường máy trạm hoặc mạng doanh nghiệp có firewall gây nghẽn render-blocking, xuất hiện hiện tượng FOUT/FOIT (chữ giật/mất lúc đầu), và tăng thời gian tải trang ban đầu.
2. **Tiêu chuẩn Typography nhất quán:** Cần thiết lập tài liệu chuẩn (SSOT) về typography để các màn hình, bảng dữ liệu, card chỉ số và form nhập liệu tuân thủ thang đo kích thước và độ đậm nhất quán.

---

## Quyết Định Kiến Trúc (Decisions)

### D1: Tự Host Phông Chữ Không Chân (Self-Hosted Fonts)

- **Quyết định:** Loại bỏ hoàn toàn các thẻ `<link rel="preconnect">` và stylesheet Google Fonts khỏi `apps/web-admin/index.html`.
- Hai font không chân chuẩn Google Fonts (`Inter`, `Roboto`) được đóng gói tự host qua `@fontsource/*` trong `@core/base/design/src/css/fonts.css` với định dạng WOFF2 nén hiện đại (hỗ trợ đầy đủ bộ ký tự `latin` và `vietnamese`) và kích hoạt thuộc tính `font-display: swap`.
- Ứng dụng hoạt động 100% offline với độ trễ tải phông bằng 0ms từ bộ nhớ cục bộ.

### D2: Tích Hợp Chuyển Đổi Phông Chữ Qua Preferences Extension

- **Quyết định:** Tận dụng hệ thống `PreferencesExtension` của `@vben/preferences` để mở rộng trường cài đặt kiểu chữ (`fontFamily`) trong Preferences Drawer, ưu tiên **`Inter`** làm mặc định (`defaultValue: 'inter'`).
- Hỗ trợ 3 tùy chọn:
  1. `inter`: Inter (Mặc định / Khuyến nghị — Chuẩn quốc tế & bảng dữ liệu mật độ cao)
  2. `roboto`: Roboto (Google Classic)
  3. `system-ui`: Phông mặc định của hệ điều hành
- Lắng nghe cập nhật và gán trực tiếp biến CSS `--font-family` lên `document.documentElement.style`, cho phép người dùng thay đổi phông chữ giao diện tức thì (hot-switch) không cần tải lại trang, đồng thời tự động lưu vào `localStorage`.

### D3: Thiết Lập Chuẩn Typography SSOT Tại `skills/rules/TYPOGRAPHY.md`

- **Quyết định:** Soạn thảo `skills/rules/TYPOGRAPHY.md` làm tiêu chuẩn tham chiếu duy nhất cho toàn bộ hệ sinh thái (Web Admin, Tauri Desktop, Extension).
- Quy định các điều khoản bắt buộc:
  - Thang đo font-size 7 cấp (`text-2xs` đến `text-2xl`).
  - Ma trận kiểu chữ cho từng component: Table Headers (`text-xs font-semibold uppercase tracking-wider`), Table Cells (`text-sm font-normal`), KPI Values (`text-2xl font-bold tracking-tight`), Badges/IDs (`text-xs`).
  - Nghiêm cấm các class kích thước pixel tùy ý (`text-[13px]`, `text-[15px]`) và cấm dùng `italic` trên các thành phần điều hướng UI.

### D4: Đồng Bộ Tailwind CSS v4 `@theme`

- **Quyết định:** Cập nhật `admin/internal/tailwind-config/src/theme.css` bổ sung token mở rộng `--text-2xs` (10px) và `--font-mono` (`JetBrains Mono`, `Fira Code`, system mono).
- Đồng bộ hóa các class trong các component bảng (`TableHead.vue`, `TableCell.vue`) và các màn hình chính (`fleet/browsers`, `fleet/devices`, `dashboard/analytics`).

---

## Hệ Quả (Consequences)

### Tích cực:

- Loại bỏ hoàn toàn 100% request ra bên ngoài Google CDN; loại bỏ triệt để hiện tượng FOUT/FOIT.
- Người dùng có thể tùy biến phông chữ giao diện yêu thích ngay trong Preferences Drawer.
- AI Agent và kỹ sư phát triển có hợp đồng kiểm thử typography rõ ràng tại `skills/rules/TYPOGRAPHY.md`.

### Rủi ro & Biện pháp giảm thiểu:

- Dung lượng bundle tăng ~250KB do chứa file WOFF2: Giảm thiểu bằng cách chỉ đóng gói các weights thiết yếu (400, 500, 600, 700) và tận dụng cơ chế chia nhỏ unicode-range (Latin & Vietnamese).
