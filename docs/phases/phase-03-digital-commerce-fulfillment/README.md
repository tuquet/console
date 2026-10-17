# Phase 03: Digital Commerce & Instant Fulfillment

> **Giai đoạn 03: Sàn Thương Mại Tài Nguyên Số & Cung Ứng Tức Thời**  
> **Thời gian triển khai:** 01/12/2026 – 22/12/2026 (3 tuần)  
> **Trọng tâm:** Khai phóng doanh thu — Xây dựng chợ sản phẩm số bán buôn & bán lẻ, cơ chế giữ hàng chống tranh chấp và bàn giao tài nguyên trong $\le 1\text{ giây}$.

---

## 🎯 1. Tầm Nhìn Chiến Lược & Giá Trị Kinh Doanh

Sau khi khách hàng đã có tài khoản (Phase 01) và tiền đã sẵn sàng trong ví số (Phase 02), nền tảng cần một **Chợ Thương Mại Điện Tử Chuyên Nghiệp** để người dùng tiêu dùng số dư.

Phase 03 biến Tuquet thành một cỗ máy bán hàng tự động 24/7. Các sản phẩm số thiết yếu (Proxy dân cư, Proxy IPv4/IPv6, Key kích hoạt phần mềm, Tài khoản trả trước, Gói hạn ngạch máy chủ) được bày bán minh bạch, trừ tiền ví tức thì và xuất kho bàn giao hàng số ngay trên màn hình chỉ trong $1\text{ giây}$.

---

## 📦 2. Gói Sản Phẩm Bàn Giao Cho Sponsor (Executive Deliverables)

1. **Cửa Hàng Thương Mại Số Doanh Nghiệp (Enterprise Digital Storefront):**
   - Giao diện mua sắm hiện đại, chia danh mục rõ ràng (Proxy Pool, Tài nguyên số, License Key, Gói tự động hóa).
   - Bộ lọc thông minh theo quốc gia, giao thức (HTTP/SOCKS5), thời hạn thuê và dung lượng.
   - Hỗ trợ cả **Cửa hàng nội bộ (In-app Store)** cho thành viên đã đăng nhập và **Cửa hàng công khai (Public Store)** cho khách hàng vãng lai.
2. **Kho Hàng Số & Cơ Chế Khóa Giữ Hàng (Digital Inventory Pool & Reservation Lock):**
   - Hệ thống quản lý kho số thông minh:
     - Nhập kho hàng loạt (Bulk Import): Hàng nghìn proxy hoặc key kích hoạt bằng file text hoặc Excel.
     - Kiểm soát vòng đời tài nguyên: `Có sẵn (Available)` $\rightarrow$ `Đang giữ hàng (Reserved)` $\rightarrow$ `Đã bán (Sold)` $\rightarrow$ `Lỗi/Bảo hành (Defective)`.
     - **Cơ chế khóa giữ hàng (Reservation Lock 5 phút):** Khi khách hàng tiến hành thanh toán, tài nguyên được tạm khóa riêng cho khách hàng đó, tuyệt đối không bao giờ xảy ra tình trạng bán trùng 1 con proxy hoặc 1 key cho 2 người khác nhau.
3. **Cơ Chế Thanh Toán Chống Trừ Tiền Kép (Idempotent Checkout Engine):**
   - Tích hợp bắt buộc mã định danh giao dịch duy nhất `idempotency_key` (UUID v4).
   - Ngăn chặn hoàn toàn hiện tượng khách hàng bấm nút mua nhiều lần khi mạng chậm dẫn đến bị trừ ví và tạo nhiều đơn hàng trùng lặp.
4. **Trung Tâm Nhận Hàng Tức Thì (Instant Fulfillment Center):**
   - Bấm thanh toán thành công $\rightarrow$ Màn hình nhận hàng xuất hiện tức thì trong $\le 1\text{ giây}$.
   - Tích hợp nút **Copy 1-Click** toàn bộ danh sách định dạng chuẩn (`IP:Port:User:Pass` hoặc `License Key`), nút **Tải file .txt**, và gửi biên lai xác nhận về Email và Telegram.
5. **Quản Lý Vòng Đời Đơn Hàng & Bảo Hành Tự Động:**
   - Tra cứu lịch sử đơn hàng, xem lại các key/proxy đã mua bất cứ lúc nào.
   - Cơ chế bảo hành tự động: Nếu proxy hoặc key bị lỗi trong thời hạn cam kết, khách hàng bấm báo lỗi $\rightarrow$ hệ thống tự động kiểm tra và hoàn tiền về ví số dư trong $30\text{ giây}$.

---

## 📊 3. Chỉ Số Cam Kết Định Lượng (Target KPIs & SLAs)

| Chỉ số đo lường | Mục tiêu cam kết | Phương pháp kiểm chứng |
| :--- | :---: | :--- |
| **Thời gian xuất hàng số (Fulfillment SLA)** | $\le 1\text{ giây}$ | Đo lường từ lúc trừ ví thành công đến khi tài nguyên hiển thị trên màn hình |
| **Tỷ lệ tranh chấp kho / bán trùng hàng** | **Tuyệt đối 0.00%** | Kiểm toán lịch sử gán `serial_id` và `proxy_id` trên toàn bộ đơn hàng |
| **Tỷ lệ lỗi thanh toán trùng lặp (Double-charge)** | **Tuyệt đối 0.00%** | Kiểm thử spam click liên tục nút "Thanh toán" trong điều kiện mạng lag |
| **Tỷ lệ thanh toán hoàn tất thành công (Conversion)** | $\ge 98.5\%$ | Tỷ lệ đơn hàng từ giỏ hàng sang hoàn tất thanh toán |

---

## 🛡️ 4. Tiêu Chuẩn Nghiệm Thu Kỹ Thuật (Acceptance Checklist)

- [ ] API `createCheckoutOrderApi` từ chối tất cả request không có `idempotency_key` hợp lệ.
- [ ] Giao dịch mua hàng thực thi theo khối nguyên tử: `Trừ ví` + `Gán trạng thái kho thành Sold` + `Tạo đơn hàng` trong cùng 1 transaction.
- [ ] Màn hình bàn giao tài nguyên số hiển thị đầy đủ thông tin nhạy cảm được ẩn/hiện an toàn và có nút tải file txt.
- [ ] Bảng quản trị kho số cho Admin có bộ đếm chính xác số lượng tồn kho theo thời gian thực.
