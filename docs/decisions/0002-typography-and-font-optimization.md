# ADR-002: Kiến Trúc Phông Chữ Không Chân Self-Hosted & Chuẩn Hóa Typography SSOT

## Trạng Thái (Status)

**Accepted** (Đã thông qua và hoàn thành triển khai ngày 2026-10-13)

## Ngày (Date)

2026-10-13

## Bối Cảnh (Context)

Hệ thống quản trị Web Admin (`apps/web-admin`) trước đây gặp phải 2 hạn chế lớn về hiển thị và vận hành:

1. **Độ trễ tải font-family từ Google CDN:** Tệp `index.html` tải 3 bộ font qua kết nối bên ngoài (`fonts.googleapis.com` / `fonts.gstatic.com`) với hơn 15 biến thể (weights và italics) của `Be Vietnam Pro`, `Inter`, và `Roboto`. Trong môi trường máy trạm hoặc doanh nghiệp có firewall chặn outbound, việc này gây nghẽn render-blocking, xuất hiện hiện tượng FOUT/FOIT (chữ giật/mất lúc đầu), và tăng thời gian tải trang ban đầu thêm từ 800ms - 2500ms.
2. **Thiếu tiêu chuẩn Typography nhất quán:** Hệ thống không có tài liệu chuẩn (SSOT) về typography tại `skills/`. Các lập trình viên và AI Agent khi xây dựng giao diện thường sử dụng class Tailwind tự do (`text-3xl font-extrabold`, `text-xs font-semibold`, `text-[13px]`), làm mất đi sự đồng nhất giữa các bảng dữ liệu, card chỉ số và form nhập liệu.

## Quyết Định Kiến Trúc (Decisions)

### D1: Tự Host Bộ Ba Phông Chữ Không Chân (Zero Google CDN Dependency)

- **Quyết định:** Loại bỏ hoàn toàn các thẻ `<link rel="preconnect">` và stylesheet Google Fonts khỏi `apps/web-admin/index.html`.
- Toàn bộ 3 font không chân (`Be Vietnam Pro`, `Inter`, `Roboto`) được đóng gói tự host qua `@fontsource/*` trong `@core/base/design/src/css/fonts.css` với định dạng WOFF2 nén hiện đại và kích hoạt thuộc tính `font-display: swap`.
- Ứng dụng hoạt động 100% offline với độ trễ tải phông bằng 0ms từ bộ nhớ cục bộ.

### D2: Tích Hợp Chuyển Đổi Phông Chữ Qua Preferences Extension

- **Quyết định:** Tận dụng hệ thống `PreferencesExtension` của `@vben/preferences` để mở rộng trường cài đặt kiểu chữ (`fontFamily`) trong Preferences Drawer.
- Hỗ trợ 4 tùy chọn:
  1. `be-vietnam-pro`: Be Vietnam Pro (Khuyên dùng cho tiếng Việt)
  2. `inter`: Inter (Hiện đại / Chuẩn quốc tế)
  3. `roboto`: Roboto (Google Classic)
  4. `system-ui`: Phông mặc định của hệ điều hành
- Lắng nghe cập nhật và gán trực tiếp biến CSS `--font-family` lên `document.documentElement.style`, cho phép người dùng thay đổi phông chữ giao diện tức thì (hot-switch) không cần tải lại trang, đồng thời tự động lưu vào `localStorage`.

### D3: Thiết Lập Chuẩn Typography SSOT Tại `skills/rules/TYPOGRAPHY.md`

- **Quyết định:** Soạn thảo `skills/rules/TYPOGRAPHY.md` làm tiêu chuẩn tham chiếu duy nhất cho toàn bộ hệ sinh thái Tuquet (Web Admin, Tauri Desktop, Extension).
- Ràng buộc vào `skills/rules/AGENTS.md` và workspace `AGENTS.md` thành điều khoản bắt buộc:
  - Thang đo font-size 7 cấp (`text-2xs` đến `text-2xl`).
  - Ma trận kiểu chữ cho từng component: Table Headers (`text-xs font-semibold uppercase tracking-wider`), Table Cells (`text-sm font-normal`), KPI Values (`text-2xl font-bold tracking-tight`), Badges/IDs (`font-mono text-xs`).
  - Nghiêm cấm các class kích thước pixel tùy ý (`text-[13px]`, `text-[15px]`) và cấm dùng `italic` trên các thành phần điều hướng UI.

### D4: Đồng Bộ Tailwind CSS v4 `@theme`

- **Quyết định:** Cập nhật `admin/internal/tailwind-config/src/theme.css` bổ sung token mở rộng `--text-2xs` (10px) và `--font-mono` (`JetBrains Mono`, `Fira Code`, system mono).
- Đồng bộ hóa các class trong các component bảng (`TableHead.vue`, `TableCell.vue`) và các màn hình chính (`fleet/browsers`, `fleet/devices`, `dashboard/analytics`).

## Hệ Quả (Consequences)

- **Tích cực:**
  - Loại bỏ hoàn toàn 100% request ra bên ngoài Google CDN; loại bỏ triệt để hiện tượng FOUT/FOIT.
  - Người dùng có thể tùy biến phông chữ giao diện yêu thích ngay trong Preferences Drawer.
  - AI Agent và kỹ sư phát triển có hợp đồng kiểm thử typography rõ ràng tại `skills/rules/TYPOGRAPHY.md`.
- **Rủi ro & Biện pháp giảm thiểu:**
  - Dung lượng bundle tăng ~250KB do chứa file WOFF2: Giảm thiểu bằng cách chỉ đóng gói các weights thiết yếu (400, 500, 600, 700) và tận dụng cơ chế chia nhỏ unicode-range (Latin & Vietnamese).
