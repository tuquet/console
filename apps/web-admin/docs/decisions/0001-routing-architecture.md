# ADR-001: Kiến Trúc Định Tuyến & Giao Tiếp Dữ Liệu Đa Schema PostgREST

## Trạng Thái (Status)

**Accepted** (Đã thông qua và triển khai)

## Ngày (Date)

2026-10-13

## Bối Cảnh (Context)

Hệ thống quản trị `admin.tuquet.com` (`apps/web-admin`) kết nối trực tiếp đến **Tuquet Cloud** (`tuquet/cloud/supabase`) và quản trị mô hình Multi-Tenant. Để đảm bảo an toàn dữ liệu, tính toàn vẹn thông tin và trải nghiệm người dùng tối ưu trên mọi kích cỡ màn hình, kiến trúc định tuyến và truy cập dữ liệu cần thỏa mãn các đặc thù kỹ thuật của hạ tầng backend:

1. **Phân rã đa Schema (Multi-Schema PostgREST):** Cơ sở dữ liệu phân tách thành các schema độc lập (`public`, `runners`, `automa`, `billing`, `media`, `events`). PostgREST bắt buộc client phải gửi header `Accept-Profile` (đối với GET/HEAD) hoặc `Content-Profile` (đối với POST/PATCH/DELETE) để định tuyến truy vấn đến đúng schema đích ngoài `public`.
2. **Giới hạn số lượng Permissions trong JWT Claim:** Supabase hook `custom_access_token_hook` bị giới hạn tối đa 25 permissions và chỉ sinh cho primary workspace. Trong khi đó, chủ sở hữu (Owner) có tới 36 quyền trên toàn hệ thống. Việc suy diễn quyền hạn từ JWT claim sẽ gây hiện tượng mất quyền ngẫu nhiên trên giao diện.
3. **Tính chất luồng dữ liệu nhật ký thực thi (Execution Logs):** Bảng `automa.execution_logs` không được đưa vào `supabase_realtime` publication vì lưu lượng bản ghi cực lớn có thể làm quá tải WebSocket connection pool.
4. **Ưu tiên trải nghiệm di động (Mobile-First):** Quản trị viên cần khả năng kiểm tra trạng thái thiết bị và tiến độ tự động hóa trên điện thoại di động mà không gặp hiện tượng tràn vỡ bảng hoặc cuộn ngang.
5. **Triết lý giao diện KISS & YAGNI:** Loại bỏ các thành phần phức tạp không phục vụ trực tiếp cho quản trị (như thanh Tabbar Chrome ảo, lockscreen, preferences drawer lồng ghép).

---

## Quyết Định Kiến Trúc (Decisions)

### D1: Giao Tiếp Đa Schema Qua Profile Headers

- **Quyết định:** Nâng cấp hàm gọi API duy nhất `supabaseRequest<T>()` nhận tùy chọn `{ schema?: string }`. Khi schema khác `public`, client tự động gán header PostgREST `Accept-Profile` hoặc `Content-Profile`.
- Toàn bộ các API `runners.*`, `automa.*`, `billing.*` bắt buộc phải sử dụng tùy chọn này.

### D2: Động Hóa Phân Quyền Từ Cơ Sở Dữ Liệu (Dynamic DB Permissions)

- **Quyết định:** Quyền hạn hiệu lực của người dùng được truy vấn trực tiếp từ cơ sở dữ liệu qua quan hệ: `tenant_members` $\rightarrow$ `member_roles` $\rightarrow$ `roles` $\rightarrow$ `role_permissions`.
- Kết quả được lưu bộ nhớ đệm (single-flight in-memory cache) cho mỗi phiên làm việc để tối ưu số lần gọi mạng.

### D3: Cơ Chế Polling 3s Cho Execution Logs

- **Quyết định:** Console thực hiện cơ chế polling định kỳ 3000ms khi chiến dịch ở trạng thái đang chạy (`pending`, `queued`, `running`) và tự động dừng ngay khi chiến dịch hoàn tất (`completed`, `failed`, `cancelled`).

### D4: Lược Bỏ Tính Năng Khi Chưa Có Backend SSOT

- **Quyết định:** Tạm thời không đưa tab "API Keys" vào giao diện chi tiết Workspace cho đến khi Tuquet Cloud phát hành bảng quản lý API key độc lập; không lưu trữ token giả lập vào `tenants.metadata`.

### D5: Tuân Thủ Triết Lý Giao Diện Tối Giản (KISS & YAGNI)

- **Quyết định:** Tắt Chrome tabbar ảo trong SPA (`preferences.tabbar.enable = false`). Tối giản header chỉ giữ Logo, nút chuyển Theme và Avatar người dùng. Giới hạn sidebar trong tối đa 5 nhóm chức năng chính.

### D6: Tiêu Chuẩn Giao Diện Kép (Mobile-First Dual View)

- **Quyết định:** Mọi màn hình danh sách dữ liệu bắt buộc triển khai Dual View:
  - **Desktop (`hidden md:block`):** Bảng dữ liệu phẳng với sắp xếp và lọc chi tiết.
  - **Mobile (`block md:hidden`):** Thẻ chạm cảm ứng compact (`Touch Cards`), chiều cao touch target tối thiểu 40px, loại bỏ hoàn toàn cuộn ngang.

---

## Các Phương Án Đã Cân Nhắc (Alternatives Considered)

### 1. Giữ nguyên Tabbar Chrome trong SPA

- **Bị từ chối:** Trình duyệt vốn đã có thanh tab. Việc lồng thêm thanh tab ảo làm lãng phí 40px chiều cao màn hình, phức tạp hóa việc đồng bộ URL và làm giảm hiệu năng trên thiết bị di động.

### 2. Đọc Permissions trực tiếp từ JWT Claim

- **Bị từ chối:** Giới hạn 25 permissions của Supabase JWT hook gây cắt xén quyền ngẫu nhiên, dẫn đến việc người dùng bị ẩn menu dù trên thực tế có đủ quyền trong database.

### 3. Sử Dụng Mock Data Fallback

- **Bị từ chối:** Dữ liệu giả lập vi phạm nguyên tắc Single Source of Truth, làm che giấu lỗi kết nối hạ tầng và gây nhầm lẫn nghiêm trọng cho quản trị viên.

---

## Hệ Quả (Consequences)

### Tích cực:

- **100% Real Telemetry:** Toàn bộ số liệu trên console phản ánh chính xác trạng thái thực tế từ Tuquet Cloud.
- **Bảo mật chuẩn:** RLS tại DB là chốt chặn cuối cùng; `meta.authority` trên frontend định hướng hiển thị menu hợp lý.
- **Trải nghiệm đồng nhất:** Console hiển thị mượt mà trên cả điện thoại (iPhone, Android) và màn hình desktop độ phân giải cao.

### Ràng buộc:

- Mọi truy vấn tới các schema `runners`, `automa`, `billing` bắt buộc phải truyền `{ schema: '<tên_schema>' }`.
- Khi bổ sung module mới, phải cập nhật `plugin.json` và đăng ký trong `public.system_plugins` để router plugin gate kích hoạt route tương ứng.
