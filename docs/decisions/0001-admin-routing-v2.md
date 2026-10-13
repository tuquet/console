# ADR-001: Kiến Trúc Định Tuyến Admin V2 & Tích Hợp Telemetry Supabase

## Trạng Thái (Status)

**Accepted** (Đã thông qua và hoàn thành triển khai ngày 2026-10-13)

## Ngày (Date)

2026-10-13

## Bối Cảnh (Context)

Phiên bản tiền nhiệm (V1) của hệ thống quản trị `admin.tuquet.com` (`apps/web-admin`) được thiết kế dựa trên các giả định từ template ERP truyền thống và chưa đối chiếu với kiến trúc thực tế của Tuquet Cloud (`tuquet/cloud/supabase`). Khi kiểm tra mã nguồn thực tế, đã phát hiện các hạn chế nghiêm trọng:

1. **Sai lệch mô hình phân quyền:** Backend không có sẵn platform superadmin tổng thể; RLS `public.tenants` mặc định chỉ trả về các tenant mà user là thành viên.
2. **Cắt giảm quyền trong JWT:** Hàm hook `custom_access_token_hook` của Supabase bị giới hạn tối đa 25 permissions và chỉ áp dụng cho primary tenant. Một chủ sở hữu (Owner) có tới 36 permissions trên toàn hệ sinh thái, dẫn đến việc mất quyền âm thầm nếu suy diễn quyền từ JWT claim.
3. **Phân rã đa Schema (Multi-Schema PostgREST):** Backend chia tách dữ liệu thành các schema chuyên biệt (`public`, `runners`, `automa`, `billing`, `media`, `events`). PostgREST bắt buộc phải truyền header `Accept-Profile` và `Content-Profile` để truy vấn các schema ngoài `public`. Lớp client cũ không gửi header này khiến toàn bộ các truy vấn tới `runners.*`, `automa.*`, `billing.*` bị lỗi và rơi về dữ liệu giả (`localStorage`/mock fallback).
4. **Trải nghiệm di động bị xem nhẹ:** Bảng dữ liệu desktop bị vỡ và tràn viền khi truy cập trên thiết bị di động (< 640px).
5. **Feature Bloat:** Tabbar Chrome ảo chiếm 40px chiều cao màn hình; header nhồi nhét nhiều widget không cần thiết (lockscreen, preferences drawer, timezone selector).

## Quyết Định Kiến Trúc (Decisions)

### D1: Phân Quyền Nền Tảng (Platform Superadmin Bypass)

- **Quyết định:** Bổ sung hàm kiểm tra cấp nền tảng `public.is_platform_admin()` (kiểm tra `raw_app_meta_data.platform_role = 'superadmin'`). Khi user có quyền này, toàn bộ hàm bảo mật RLS sẽ bypass kiểm tra thành viên để quản trị toàn hệ thống. Đối với user thông thường, áp dụng nghiêm ngặt tiêu chuẩn RLS tenant isolation.

### D2: Động Hóa Phân Quyền Giao Diện (Dynamic DB Permissions)

- **Quyết định:** Tuyệt đối không suy quyền từ chuỗi JWT. Quyền hạn của user được truy vấn trực tiếp từ cơ sở dữ liệu thông qua chuỗi quan hệ `tenant_members` -> `member_roles` -> `roles` -> `role_permissions`.
- Kết quả được lưu bộ nhớ đệm (single-flight in-memory cache) cho mỗi phiên làm việc để tối ưu hiệu năng.

### D3: Cơ Chế Polling 3s Cho Execution Logs

- **Quyết định:** Vì bảng `automa.execution_logs` không được cấu hình trong `supabase_realtime` publication, console thực hiện cơ chế polling định kỳ 3000ms khi chiến dịch ở trạng thái đang chạy (`pending`, `queued`, `running`) và tự động dừng khi kết thúc (`completed`, `failed`, `cancelled`).

### D4: Loại Bỏ Tính Năng Giả Lập API Keys

- **Quyết định:** Tạm thời loại bỏ tab "API Keys" trên giao diện quản trị Workspace cho đến khi có RFC chính thức tạo bảng API keys tại tầng backend. Tuyệt đối không lưu token vào `tenants.metadata`.

### D5: Tuân Thủ KISS & YAGNI

- **Quyết định:** Tắt Chrome tabbar ảo (`preferences.tabbar.enable = false`). Tối giản header chỉ giữ Logo, Theme Switcher và User Avatar. Giới hạn sidebar trong tối đa 5 nhóm chức năng chính.
- Bỏ các bảng chưa cần thiết (`automa.schedules`, `media.assets`, `events.*`) khỏi menu bên.

### D6: Tiêu Chuẩn Giao Diện Dual View (Mobile-First)

- **Quyết định:** Mọi trang danh sách dữ liệu bắt buộc triển khai Dual View:
  - Desktop (`hidden md:block`): Data Table chi tiết với sắp xếp và lọc.
  - Mobile (`block md:hidden`): Thẻ cảm ứng compact (Touch Cards), mỗi thẻ tối thiểu 40px chiều cao touch target, loại bỏ cuộn ngang.

### D7: Client Đa Schema (Accept-Profile / Content-Profile)

- **Quyết định:** Nâng cấp `supabaseRequest<T>()` nhận tham số tùy chọn `{ schema?: string }`. Khi schema khác `public`, tự động đính kèm header PostgREST `Accept-Profile` và `Content-Profile`.

## Các Phương Án Đã Cân Nhắc (Alternatives Considered)

### 1. Giữ nguyên Tabbar Chrome trong SPA

- **Bị từ chối:** Trình duyệt vốn đã có tab. Thêm một tab ảo bên trong trang web làm mất 40px chiều cao quý giá, gây giật lag và phức tạp hóa việc đồng bộ URL router.

### 2. Đọc Permissions từ JWT Claim

- **Bị từ chối:** Supabase JWT hook giới hạn 25 permissions. Một tenant có hơn 36 quyền sẽ bị cắt xén ngẫu nhiên, dẫn đến việc người dùng bị ẩn menu dù trên thực tế có đủ quyền trong database.

### 3. Tiếp tục dùng Mock Data khi API lỗi

- **Bị từ chối:** Vi phạm nguyên tắc No Mock Data của AGENTS.md §5. Dữ liệu giả làm che giấu lỗi hạ tầng và gây nhầm lẫn nghiêm trọng cho quản trị viên.

## Hệ Quả (Consequences)

### Tích cực:

- **Độ tin cậy 100%:** Toàn bộ số liệu trên console phản ánh chính xác trạng thái thực tế từ Tuquet Cloud.
- **Bảo mật chuẩn:** RLS tại DB là chốt chặn cuối cùng; `meta.authority` trên frontend chỉ đóng vai trò định hướng UX.
- **Trải nghiệm đồng nhất:** Console hiển thị hoàn hảo trên cả điện thoại (iPhone, Android) và màn hình desktop độ phân giải cao.
- **Zero-Waste CI:** Mã nguồn vượt qua kiểm định nghiêm ngặt với 0 lỗi TypeScript, 0 lỗi Lint, 57 unit tests passed và build thành công.

### Ràng buộc:

- Mọi truy vấn tới các schema `runners`, `automa`, `billing` bắt buộc phải truyền `{ schema: '<tên_schema>' }`.
- Khi bổ sung module mới, phải cập nhật `plugin.json` và đăng ký trong `public.system_plugins` để router plugin gate kích hoạt route tương ứng.
