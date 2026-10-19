# Phase 02: Omnichannel & Cross-Border Payment Gateway

> **Giai đoạn 02: Cổng Thanh Toán Đa Kênh & Xuyên Biên Giới**  
> **Thời gian triển khai:** 09/11/2026 – 30/11/2026 (Phân kỳ 2A & 2B)  
> **Trọng tâm:** Xây dựng dòng tiền tệ tự trị — Kích hoạt thanh toán tức thời (2A) song song thẩm định cổng thẻ quốc tế có phòng vệ gian lận (2B) với sổ cái kép bất biến.

---

## 🎯 1. Tầm Nhìn Chiến Lược & Chiến Lược Triển Khai 2 Pha Thực Tế

Một nền tảng phần mềm chỉ thực sự cất cánh khi khách hàng có thể nạp tiền và thanh toán dễ dàng trong vòng vài giây bằng bất kỳ phương thức nào họ đang sở hữu.

Tuy nhiên, rủi ro lớn nhất của khâu thanh toán là **thời gian chờ thẩm định hồ sơ pháp lý đối tác (KYC/KYB của Stripe, MoMo, ZaloPay)** và **rủi ro gian lận thẻ tín dụng (Chargeback Fraud)**. Do đó, Phase 02 áp dụng chiến lược **Triển khai 2 Phân kỳ Thực tế**:

- **Phân kỳ 2A (Vận hành ngay trong 2 tuần đầu):** Kích hoạt các kênh tiền về tài khoản tức thời, không phụ thuộc xét duyệt giấy phép bên thứ 3: **VietQR PRO động, Tài khoản ảo Virtual Account và Tiền mã hóa USDT on-chain**.
- **Phân kỳ 2B (Hoàn tất thẩm định song song):** Tích hợp cổng thẻ tín dụng quốc tế Visa/Mastercard có tích hợp AI chống gian lận và các ví điện tử Việt Nam.

---

## 📦 2. Gói Sản Phẩm Bàn Giao Cho Sponsor (Executive Deliverables)

1. **Phân kỳ 2A — Dòng Tiền Tức Thời (Instant Liquidity Rails):**
   - **Mã QR Động VietQR PRO:** Quét mã từ bất kỳ ứng dụng ngân hàng nào tại Việt Nam, tiền vào ví ngay trong $3\text{ giây}$.
   - **Tài Khoản Định Danh Chuyên Dụng (Virtual Account - MBBank/VPBank):** Mỗi doanh nghiệp khách hàng được cấp một số tài khoản chuyên dụng riêng; chỉ cần chuyển khoản theo số tài khoản này là tiền tự động vào ví mà không cần nhớ cú pháp nạp tiền.
   - **Hạ Tầng Tiền Mã Hóa & Web3 (USDT / USDC on-chain):** Thanh toán tức thời trên các mạng lưới phí rẻ: **TRC20, TON, Polygon, Solana** với cơ chế tự động quét blockchain đối soát nạp ví 24/7.
2. **Phân kỳ 2B — Cổng Thẻ Quốc Tế & Ví Nội Địa (Card Rails & Anti-Fraud):**
   - Chấp nhận thẻ tín dụng/ghi nợ quốc tế: **Visa, MasterCard, JCB, American Express** với chuẩn bảo mật **3D-Secure 2.0**.
   - **Hệ Thống Phòng Vệ Gian Lận Thẻ (Anti-Fraud & Chargeback Prevention):** Tự động phát hiện và chặn các thẻ trộm, thẻ đánh cắp, giới hạn tần suất quẹt thẻ (Velocity checks) để giữ tỷ lệ Chargeback $\le 0.1\%$.
   - Tích hợp thanh toán 1-chạm hoặc quét mã liên kết trực tiếp qua **MoMo, ZaloPay, VNPay-QR, Viettel Money**.
   - Hỗ trợ ví toàn cầu **PayPal, Apple Pay, Google Pay** cho khách hàng quốc tế.
3. **Động Cơ Sổ Cái Kép Bất Biến (Double-Entry Ledger Engine):**
   - Toàn bộ giao dịch nạp, rút, trừ tiền mua hàng đều được hạch toán theo nguyên tắc kế toán kép chuẩn quốc tế:
     - Ghi nhận rõ ràng: `Số dư ban đầu` $\rightarrow$ `Số tiền biến động` $\rightarrow$ `Số dư kết thúc` kèm mã tham chiếu duy nhất.
     - Khóa giao dịch cấp cơ sở dữ liệu (`SELECT ... FOR UPDATE`), tuyệt đối ngăn chặn hiện tượng số dư bị âm.
4. **Trung Tâm Giám Sát Dòng Tiền & Báo Cáo Cổ Đông:**
   - Bảng điều khiển tài chính thời gian thực cho Ban Giám đốc: Doanh thu theo ngày/tháng, tổng nạp, tổng tiêu dùng, số dư ký quỹ.
   - Trợ lý Telegram Bot gửi tin nhắn thông báo doanh thu mỗi giờ và cảnh báo tức thì khi phát hiện biến động bất thường.

---

## 📊 3. Chỉ Số Cam Kết Định Lượng (Target KPIs & SLAs)

| Chỉ số đo lường | Mục tiêu cam kết | Phương pháp kiểm chứng |
| :-- | :-: | :-- |
| **Tốc độ ghi nhận nạp tiền nội địa** | $\le 3\text{ giây}$ | Đo lường thời gian từ lúc nhận webhook VietQR/Ví VN đến khi ví nhảy số |
| **Tốc độ ghi nhận nạp tiền quốc tế/crypto** | $\le 15\text{ giây}$ | Đo lường thời gian từ lúc giao dịch thẻ hoàn tất hoặc 1 block confirmation |
| **Tỷ lệ thất thoát / sai lệch số dư** | **Tuyệt đối 0.00%** | Kiểm toán tự động tổng số dư ví so với tổng nhật ký giao dịch sổ cái kép |
| **Tỷ lệ tranh chấp gian lận thẻ (Chargeback)** | $\le 0.1\%$ | Báo cáo tỷ lệ tranh chấp thẻ qua cổng thanh toán quốc tế |
| **Tỷ lệ thành công của cổng thanh toán** | $\ge 99.2\%$ | Tỷ lệ giao dịch thanh toán hoàn tất thành công không gặp lỗi kỹ thuật |

---

## 🛡️ 4. Tiêu Chuẩn Nghiệm Thu Kỹ Thuật (Acceptance Checklist)

- [ ] Webhook ngân hàng VietQR và Virtual Account xử lý bất đồng bộ, có cơ chế xác thực chữ ký số HMAC chống giả mạo request.
- [ ] Bảng `wallet_transactions` ghi nhận đầy đủ 100% biến động với khóa ngoại trỏ về `workspace_id`.
- [ ] Không có bất kỳ API nào được phép cập nhật trực tiếp cột `balance` mà không thông qua Stored Procedure kế toán kép.
- [ ] Hệ thống chống gian lận thẻ tự động từ chối giao dịch có điểm rủi ro cao trước khi gửi sang tổ chức phát hành thẻ.
