# Tuquet Admin — Engineering Standards & Agent Guidelines

Tài liệu này xác lập các tiêu chuẩn kỹ thuật, thiết kế và quy trình phát triển bắt buộc áp dụng cho toàn bộ AI Agents và Kỹ sư phát triển trên kho lưu trữ `tuquet/admin`.

---

## 1. Triết lý Cốt Lõi: KISS & YAGNI

Hệ thống quản trị `admin.tuquet.com` kết nối trực tiếp đến **Tuquet Cloud** (`tuquet/cloud`) và quản lý kiến trúc **Multi-Tenant**. Giao diện và kiến trúc mã nguồn phải tuân thủ nghiêm ngặt hai nguyên tắc:

- **KISS (Keep It Simple, Stupid)**: Giữ mọi thứ đơn giản, trực diện, dễ bảo trì. Loại bỏ các tầng trừu tượng không cần thiết.
- **YAGNI (You Aren't Gonna Need It)**: Chỉ xây dựng những gì thực sự cần cho người quản trị hệ thống. Tuyệt đối không nhồi nhét "Feature Bloat" từ các template ERP cũ.

### Các quy tắc cụ thể:
1. **Không sử dụng Chrome Tabbar ảo trong SPA** (`tabbar: { enable: false }`):
   - Trình duyệt đã có thanh Tab. Không lồng thêm thanh tab kiểu Chrome trong web app làm mất 40px chiều cao màn hình quý giá của người dùng (nhất là trên điện thoại).
2. **Tối giản hóa Header**:
   - Không đưa vào các widget thừa thãi: khóa màn hình (lockScreen), chọn múi giờ thế giới (timezone selector), nút toàn màn hình (fullscreen), ngăn kéo cấu hình màu sắc (preferences drawer).
   - Header chỉ giữ 3 thành phần cốt lõi: **Logo Tuquet** + **Gạt Theme Dark/Light Slate** + **Avatar Quản trị & Đăng xuất**.
3. **Không dùng Breadcrumbs lặp lại**:
   - Khi hệ thống có ít hơn 5 module chính, không lặp lại tên trang bằng Breadcrumb gây chiếm dụng không gian.

---

## 2. Tiêu Chuẩn Giao Diện: Shadcn Slate / Zinc Design System

Toàn bộ console áp dụng phong cách thiết kế hiện đại của **Shadcn** (phong cách Cloud Console như Supabase, Vercel, Linear):

- **Palette**: Tông màu Slate / Zinc trung tính, chiều sâu cao, độ tương phản hoàn hảo ở cả Light và Dark mode.
- **Thư viện UI**: Sử dụng các thành phần từ `@tuquet/vue-ui` và `@tuquet/vue-table` đã publish trên NPM registry.
- **Borders & Radii**:
  - Viền siêu mỏng, tinh tế: `border border-border/60`.
  - Bo góc tiêu chuẩn: `rounded-xl` (12px) cho Cards/Containers, `rounded-lg` (8px) cho Input/Buttons.
- **Backgrounds**: Dùng `bg-card` kết hợp hiệu ứng kính `backdrop-blur` cho các popover/dialogs.
- **Không lồng ghép đa tầng**: Mỗi cụm thông tin dùng đúng 1 lớp Card phẳng, không lồng Card trong Card gây lãng phí padding.

---

## 3. Quy Chuẩn Icon: BẮT BUỘC DÙNG LUCIDE ICON

> [!IMPORTANT]
> **Tuyệt đối không sử dụng Emoji hoặc Icon chất lượng thấp làm biểu tượng giao diện.**

- **Chỉ sử dụng duy nhất Lucide Icons** (`@lucide/vue` hoặc `lucide-vue-next`).
- **Nghiêm cấm dùng Emojis** (như 🏢, 🧩, ⚡, 📡, ✓...) thay thế cho icon chức năng hay trạng thái hệ thống.
- Kích thước icon chuẩn:
  - Header actions / Buttons: `size-3.5` hoặc `size-4`.
  - Metric Card badge: `size-4.5` hoặc `size-5` đặt trong container `size-9 rounded-lg`.
  - Status indicators: `size-3.5` (kèm chữ mô tả rõ ràng).

---

## 4. Ưu Tiên Mobile-First (Bắt Buộc)

Mọi màn hình, bảng dữ liệu và cửa sổ tương tác (Modal/Drawer) đều phải được thiết kế và kiểm thử tối ưu từ màn hình di động nhỏ (`< 640px`):

1. **Grid Thống kê (Metric Cards)**:
   - Mobile: 1 cột (`grid-cols-1`).
   - Tablet: 2 cột (`sm:grid-cols-2`).
   - Desktop: 4 cột (`lg:grid-cols-4`).
2. **Bảng Dữ Liệu (Data Tables) — Thiết kế Kép (Dual View)**:
   - Trên **Desktop** (`hidden md:block`): Hiển thị bảng Data Table đầy đủ với sắp xếp, phân trang và các cột chi tiết.
   - Trên **Mobile** (`block md:hidden`): Tự động chuyển đổi sang **Card View** cảm ứng. Mỗi bản ghi là 1 thẻ compact hiển thị đầy đủ thông tin nhận diện, trạng thái, ngày tháng và các nút hành động kích thước tối thiểu 40px (touch targets).
   - Tuyệt đối không để xảy ra hiện tượng tràn vỡ layout hoặc bắt người dùng điện thoại phải cuộn ngang bảng dữ liệu.
3. **Nút Thao Tác (Action Buttons)**:
   - Trên mobile: Tự động xếp chồng dọc (stack) với độ rộng 100% (`w-full sm:w-auto`) để bấm 1 chạm dễ dàng.
4. **Hộp Thoại (Modals/Dialogs)**:
   - Chiều rộng tự thích ứng: `max-w-[calc(100vw-2rem)] sm:max-w-lg`.

---

## 5. Dữ Liệu Đo Đếm Thực Tế (100% Real Telemetry — Không Mock Data)

- **Tuyệt đối không sử dụng Mock Data, số ảo hoặc văn bản tiếng nước ngoài không liên quan (tiếng Trung)**.
- Mọi chỉ số trên các trang **Workspace** và **Analytics** phải được truy vấn và tính toán trực tiếp từ **Tuquet Cloud**:
  - `public.tenants`: Số lượng Workspace, phân bổ gói thuê bao (Pro / Free / Enterprise), mốc thời gian tăng trưởng.
  - `public.system_plugins`: Trạng thái và schema của 6 core plugins (`core-iam`, `runners`, `automa`, `storage`, `subscriptions`, `webhooks`).
  - `Specter Fleet Bridge`: Trạng thái lắng nghe cổng SSO Desktop loopback (`127.0.0.1:8765`).
  - Độ trễ mạng thực tế (Latency Ms) giữa trình duyệt và Supabase REST API / Cloudflare Edge.

---

## 6. Quy Trình Kiểm Thử & Tiêu Chuẩn Kỹ Thuật

1. **Local-First Verification (Không Test trên Production)**:
   - Mọi thay đổi về giao diện và chức năng bắt buộc phải được build và kiểm thử cục bộ (Local) trước bằng Playwright headless browser ở cả hai chế độ:
     - **Desktop Viewport**: `1280 x 800`.
     - **Mobile Viewport**: `375 x 667` (hoặc `375 x 812`).
   - Lưu ảnh chụp màn hình vào thư mục `scratch/` để nghiệm thu trực quan trước khi commit.
   - Tuyệt đối không cố gắng chạy các kịch bản kiểm thử tự động trực tiếp trên môi trường live/production.
2. **Đảm bảo Chất lượng Mã Nguồn (Zero Errors)**:
   - Kiểu dữ liệu TypeScript: `pnpm --filter @vben/web-antd run typecheck` (`vue-tsc --noEmit --skipLibCheck`) phải kết thúc với **0 lỗi**.
   - Linting: `npx oxlint apps/web-antd/src/` phải kết thúc với **0 warnings, 0 errors**.
   - Định dạng: Tự động chạy `oxfmt` qua pre-commit hook của Lefthook.
3. **Quy Chuẩn Commit (Conventional Commits)**:
   - Tiêu đề commit phải tuân thủ định dạng Lefthook commitlint:
     - `feat(@vben/web-antd): <mô tả ngắn gọn>`
     - `fix(@vben/web-antd): <mô tả ngắn gọn>`
   - Độ dài tiêu đề commit không được vượt quá **108 ký tự**.
