# Phase 02: Omnichannel & Cross-Border Payment Gateway

> **Giai đoạn 02: Cổng Thanh Toán Đa Kênh & Xuyên Biên Giới**  
> **Thời gian triển khai:** 09/11/2026 – 30/11/2026 (3 tuần)  
> **Trọng tâm:** Xây dựng dòng tiền tệ tự trị — Thanh toán 24/7/365 qua Ngân hàng, Ví điện tử Việt Nam, Thẻ quốc tế và Tiền mã hóa với sổ cái kép bất biến.

---

## 🎯 1. Tầm Nhìn Chiến Lược & Giá Trị Kinh Doanh

Một nền tảng phần mềm chỉ thực sự cất cánh khi khách hàng có thể nạp tiền và thanh toán dễ dàng trong vòng vài giây bằng bất kỳ phương thức nào họ đang sở hữu.

Phase 02 trang bị cho hệ sinh thái Tuquet một **Hạ Tầng Cổng Thanh Toán Đa Kênh Toàn Diện (Omnichannel Payment Rails)**. Xóa bỏ hoàn toàn quy trình duyệt nạp tiền thủ công của nhân viên kế toán. Tiền nạp từ tài khoản ngân hàng, ví điện tử hay ví tiền mã hóa đều được tự động cộng vào ví số dư của khách hàng ngay lập tức để mua tài nguyên số và kích hoạt dịch vụ.

---

## 📦 2. Gói Sản Phẩm Bàn Giao Cho Sponsor (Executive Deliverables)

1. **Phân Hệ Ngân Hàng Việt Nam (Domestic Banking Rails):**
   - **Mã QR Động VietQR PRO:** Quét mã từ bất kỳ ứng dụng ngân hàng nào tại Việt Nam, tiền vào ví trong $3\text{ giây}$.
   - **Tài Khoản Định Danh Chuyên Dụng (Virtual Account - MBBank/VPBank):** Mỗi doanh nghiệp khách hàng được cấp một số tài khoản chuyên dụng riêng; chỉ cần chuyển khoản theo số tài khoản này là tiền tự động vào ví mà không cần nhớ cú pháp nạp tiền.
2. **Tổ Hợp Ví Điện Tử Việt Nam (E-Wallets Ecosystem):**
   - Thanh toán 1-chạm hoặc quét mã liên kết trực tiếp qua **MoMo, ZaloPay, VNPay-QR, Viettel Money, ShopeePay**.
3. **Cổng Thẻ Tín Dụng & Ví Quốc Tế (Global Payments):**
   - Chấp nhận thẻ tín dụng/ghi nợ quốc tế: **Visa, MasterCard, JCB, American Express** với chuẩn bảo mật **3D-Secure 2.0** chống gian lận thẻ.
   - Thanh toán qua ví toàn cầu **PayPal, Apple Pay, Google Pay** phục vụ khách hàng tại Bắc Mỹ, Châu Âu và Châu Á.
4. **Hạ Tầng Tiền Mã Hóa & Web3 (Digital Asset Rails):**
   - Thanh toán tức thời qua stablecoin **USDT / USDC** trên các mạng lưới có tốc độ cao và phí giao dịch siêu rẻ: **TRC20, TON, Polygon, Arbitrum, Solana**.
   - Cơ chế tự động quét sổ cái blockchain để đối soát và cộng tiền ví tự động.
5. **Động Cơ Sổ Cái Kép Bất Biến (Double-Entry Ledger Engine):**
   - Toàn bộ giao dịch nạp, rút, trừ tiền mua hàng đều được hạch toán theo nguyên tắc kế toán kép chuẩn quốc tế:
     - Ghi nhận rõ ràng: `Số dư ban đầu` $\rightarrow$ `Số tiền biến động` $\rightarrow$ `Số dư kết thúc` kèm mã tham chiếu duy nhất.
     - Khóa giao dịch cấp cơ sở dữ liệu (`SELECT ... FOR UPDATE`), tuyệt đối ngăn chặn hiện tượng số dư bị âm.
6. **Trung Tâm Giám Sát Dòng Tiền & Báo Cáo Cổ Đông:**
   - Bảng điều khiển tài chính thời gian thực cho Ban Giám đốc: Doanh thu theo ngày/tháng, tổng nạp, tổng tiêu dùng, số dư ký quỹ.
   - Trợ lý Telegram Bot gửi tin nhắn thông báo doanh thu mỗi giờ và cảnh báo tức thì khi phát hiện biến động bất thường.

---

## 📊 3. Chỉ Số Cam Kết Định Lượng (Target KPIs & SLAs)

| Chỉ số đo lường | Mục tiêu cam kết | Phương pháp kiểm chứng |
| :--- | :---: | :--- |
| **Tốc độ ghi nhận nạp tiền nội địa** | $\le 3\text{ giây}$ | Đo lường thời gian từ lúc nhận webhook VietQR/Ví VN đến khi ví nhảy số |
| **Tốc độ ghi nhận nạp tiền quốc tế/crypto** | $\le 15\text{ giây}$ | Đo lường thời gian từ lúc giao dịch thẻ hoàn tất hoặc 1 block confirmation |
| **Tỷ lệ thất thoát / sai lệch số dư** | **Tuyệt đối 0.00%** | Kiểm toán tự động tổng số dư ví so với tổng nhật ký giao dịch sổ cái kép |
| **Tỷ lệ thành công của cổng thanh toán** | $\ge 99.2\%$ | Tỷ lệ giao dịch thanh toán hoàn tất thành công không gặp lỗi kỹ thuật |
| **Độ sẵn sàng dịch vụ thanh toán (Uptime)** | **99.95%** | Giám sát SLA cổng thanh toán 24/7/365 |

---

## 🛡️ 4. Tiêu Chuẩn Nghiệm Thu Kỹ Thuật (Acceptance Checklist)

- [ ] Webhook ngân hàng VietQR và Virtual Account xử lý bất đồng bộ, có cơ chế xác thực chữ ký số HMAC chống giả mạo request.
- [ ] Bảng `wallet_transactions` ghi nhận đầy đủ 100% biến động với khóa ngoại trỏ về `workspace_id`.
- [ ] Không có bất kỳ API nào được phép cập nhật trực tiếp cột `balance` mà không thông qua Stored Procedure kế toán kép.
- [ ] Bot Telegram gửi thông báo chi tiết khi nạp tiền thành công (Số tiền, Mã ví, Phương thức, Số dư mới).
