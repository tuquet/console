# Tuquet Admin — Product Strategy & Executive Roadmap

> **Tài liệu Chiến lược Sản phẩm Dành cho Ban Lãnh đạo & Nhà Tài Trợ**  
> **Sứ mệnh:** Xây dựng Trung tâm Điều hành Doanh nghiệp (Enterprise Command Center) điều phối tập trung toàn bộ Định danh, Hạ tầng Thanh toán Đa kênh Toàn cầu, Thương mại Điện tử và Hạ tầng Tự động hóa của Hệ sinh thái Tuquet.

---

## 🎯 4 Trụ Cột Năng Lực Cốt Lõi (Core Capability Pillars)

1. **Enterprise Identity & Multi-Tenancy:** Cô lập dữ liệu tuyệt đối chuẩn ngân hàng, tích hợp Enterprise SSO (Google/Microsoft), phân quyền vai trò hạt mịn, đáp ứng hàng chục nghìn doanh nghiệp cùng vận hành độc lập.
2. **Omnichannel & Cross-Border Payment Gateway:** Hạ tầng thanh toán đa lĩnh vực 2 bước (2A: VietQR PRO/VA & USDT tức thời; 2B: Thẻ Visa/Mastercard 3D-Secure có chống gian lận & Ví VN), Sổ cái kép đối soát $100\%$.
3. **Digital Commerce & Instant Fulfillment:** Sàn thương mại tài nguyên số tốc độ cao, kiểm tra sức khỏe hàng trước khi giao (Health Check), giữ hàng chống tranh chấp, bàn giao bản quyền/proxy trong $\le 1\text{ giây}$.
4. **Cloud Fleet & Distributed Automation:** Điều khiển cụm máy chủ và bot phân tán thời gian thực, đo cước động (Metered Billing), cam kết Uptime $99.9\%$, tiết kiệm $40\%$ chi phí phần cứng nhờ triệt tiêu tiến trình thừa (Zero-Zombie).

---

## 🗺️ Các Giai Đoạn Phát Triển Chiến Lược (Strategic Milestones)

---

### 🟡 MILESTONE 01: Nền Tảng Định Danh & Cô Lập Đa Doanh Nghiệp (IAM & Multi-Tenancy)
*Thời gian:* 18/10/2026 – 08/11/2026 | *Tình trạng:* **Đang kiểm toán & tối ưu (In Audit)**

* **Giá trị Doanh nghiệp:**  
  Xây móng nhà kiên cố. Đảm bảo dữ liệu của khách hàng doanh nghiệp được bảo vệ đa tầng, tuyệt đối không bị rò rỉ chéo sang doanh nghiệp khác khi mở rộng quy mô lớn.
* **Gói bàn giao nghiệm thu:**
  - Cổng Quản trị Doanh nghiệp (Enterprise Management Console) với giao diện Mobile & Web trực quan.
  - Hỗ trợ **Enterprise SSO (Google Workspace, Microsoft Entra ID / 365 OAuth)** cho khách hàng doanh nghiệp lớn.
  - Ma trận Phân quyền Hạt mịn: Chủ doanh nghiệp, Quản lý tài chính, Kỹ thuật viên và Thành viên.
  - Cơ chế cập nhật quyền hạn nguyên tử qua PostgREST, loại bỏ nguy cơ gián đoạn quyền truy cập khi mất kết nối mạng.
  - Báo cáo kiểm định an toàn thông tin và chống tấn công giả mạo chuyển hướng (SSRF & Open Redirect).
* **Chỉ số Cam kết (Target KPIs):**
  - Độ cô lập dữ liệu tổ chức: **100%**
  - Độ trễ phản hồi xác thực: $\le 50\text{ ms}$
  - Khả năng chịu tải: $\ge 10.000$ Doanh nghiệp đồng thời

---

### ⚪ MILESTONE 02: Cổng Thanh Toán Đa Kênh & Xuyên Biên Giới (Omnichannel & Cross-Border Gateway)
*Thời gian:* 09/11/2026 – 30/11/2026 | *Tình trạng:* **Kế hoạch Sprint tiếp theo (Phân kỳ 2A & 2B)**

* **Giá trị Doanh nghiệp:**  
  Phá vỡ mọi rào cản thanh toán địa lý. Tối ưu hóa dòng tiền bằng chiến lược triển khai 2 pha: Kích hoạt dòng tiền tức thời không cần chờ duyệt giấy tờ (2A) và thiết lập cổng thẻ quốc tế có phòng vệ gian lận (2B).
* **Gói bàn giao nghiệm thu:**
  - **Phân kỳ 2A — Dòng tiền Tức thời:**
    - Cổng VietQR PRO tự động cộng tiền trong 3 giây; Tài khoản Định danh Chuyên dụng (Virtual Account MBBank/VPBank) cho từng Workspace.
    - Cổng nạp USDT / USDC (mạng TRC20, TON, Polygon, Solana) phí rẻ, đối soát tự động on-chain 24/7.
  - **Phân kỳ 2B — Cổng Thẻ Quốc Tế & Ví Nội Địa:**
    - Cổng thanh toán thẻ Visa/Mastercard/JCB chuẩn 3D-Secure 2.0 kèm hệ thống phát hiện gian lận thẻ (Anti-Fraud & Chargeback Protection $\le 0.1\%$).
    - Ví điện tử Việt Nam: MoMo, ZaloPay, VNPay, Viettel Money.
  - **Sổ Cái Tài Chính Kép (Double-Entry Ledger):** Bảng đối soát số dư bất biến, xuất báo cáo tài chính cho cổ đông 1-click.
  - **Trợ Lý Tài Chính Bot Telegram:** Báo cáo doanh thu từng giờ và cảnh báo rủi ro biến động số dư lớn.
* **Chỉ số Cam kết (Target KPIs):**
  - Tốc độ cộng tiền tự động: $\le 3\text{ giây}$ (VietQR/Ví VN), $\le 15\text{ giây}$ (Thẻ/Crypto)
  - Tỷ lệ sai lệch vốn: **0.00%**
  - Tỷ lệ Chargeback gian lận thẻ: $\le 0.1\%$
  - Tỷ lệ thành công cổng thanh toán: $\ge 99.2\%$

---

### ⚪ MILESTONE 03: Sàn Thương Mại Số & Cung Ứng Tức Thì (Digital Shop & Instant Delivery)
*Thời gian:* 01/12/2026 – 22/12/2026 | *Tình trạng:* **Kế hoạch Tháng 12/2026**

* **Giá trị Doanh nghiệp:**  
  Khai phóng nguồn doanh thu trực tiếp từ việc bán buôn và bán lẻ tài nguyên số (Proxy, Bản quyền phần mềm, Tài khoản, Công cụ) với tỷ lệ chuyển đổi tối đa và tỷ lệ hoàn tiền do lỗi hàng $\le 0.5\%$.
* **Gói bàn giao nghiệm thu:**
  - Cửa hàng Thương mại Số Doanh nghiệp (Digital Storefront) mượt mà trên mọi thiết bị.
  - Kho Hàng Số Tự Động: Tự động khóa giữ hàng khi thanh toán, tuyệt đối không bán trùng tài nguyên.
  - **Kiểm Tra Sức Khỏe Hàng Trước Khi Bàn Giao (Pre-delivery Live Health Check):** Tự động ping test proxy / kiểm tra key hợp lệ trước khi xuất cho khách.
  - Trung tâm Nhận Hàng Tức Thì (Instant Fulfillment Center): Bấm thanh toán là có ngay mã bản quyền và danh sách proxy sử dụng ngay trong $\le 1\text{ giây}$.
  - Chính sách đổi trả và hoàn tiền tự động vào ví số dư khi tài nguyên gặp sự cố.
* **Chỉ số Cam kết (Target KPIs):**
  - Thời gian xuất kho đơn hàng: $\le 1\text{ giây}$
  - Tỷ lệ tranh chấp kho hàng: **0.00%**
  - Tỷ lệ hoàn tiền do lỗi hàng: $\le 0.5\%$
  - Tỷ lệ thanh toán thành công: $\ge 98.5\%$

---

### ⚪ MILESTONE 04: Đám Mây Tự Động Hóa & Đưa Lên Chợ Bán (Cloud Automation & Fleet)
*Thời gian:* 05/01/2027 – 15/02/2027 | *Tình trạng:* **Kế hoạch Q1/2027**

* **Giá trị Doanh nghiệp:**  
  Thương mại hóa chính các công nghệ tự động hóa cốt lõi của Tuquet thành dịch vụ thuê bao đám mây (SaaS), mang lại dòng doanh thu định kỳ bền vững với mô hình đo cước tài nguyên động (Metered Billing).
* **Gói bàn giao nghiệm thu:**
  - Các gói dịch vụ tự động hóa mua trực tiếp trên Shop (Tool cào dữ liệu, Bot kiểm thử, Dịch vụ nuôi tài khoản).
  - **Động cơ Đo Cước Tài Nguyên Động (Metered Billing Engine):** Tính cước linh hoạt theo block giờ chạy bot, dung lượng proxy tiêu thụ hoặc thuê bao tháng.
  - Trung tâm Điều hành Cụm Máy Chủ Phân Tán (Global Fleet Command Center) giám sát toàn bộ máy chủ VPS theo thời gian thực.
  - Cơ chế dọn dẹp sạch tiến trình mồ côi (Zero-Zombie), tiết kiệm 40% chi phí hóa đơn máy chủ.
* **Chỉ số Cam kết (Target KPIs):**
  - Độ sẵn sàng hệ thống (Uptime SLA): **99.9%**
  - Tỷ lệ lãng phí tài nguyên: Giảm $\ge 95\%$
  - Độ chính xác đo cước: **100%**
  - Khả năng mở rộng: Mở rộng cụm $\ge 1.000$ VPS

---

### ⚪ MILESTONE 05: Nhượng Quyền Thương Hiệu (White-Label) & Thị Trường Mở Toàn Cầu
*Thời gian:* 01/03/2027 – 30/04/2027 | *Tình trạng:* **Kế hoạch Q2/2027**

* **Giá trị Doanh nghiệp:**  
  Nhân rộng quy mô kinh doanh theo cấp số nhân thông qua mạng lưới đại lý nhượng quyền và sàn giao dịch mở cho cộng đồng nhà phát triển, có hộp cát bảo mật kiểm duyệt mã độc.
* **Gói bàn giao nghiệm thu:**
  - Nền tảng nhượng quyền White-Label: Đại lý tự gắn tên miền, logo và thương hiệu riêng.
  - **Hộp Cát Kiểm Duyệt Mã Độc Tự Động (Automated Security Sandbox):** Kiểm duyệt kịch bản cộng đồng và gắn chữ ký số an toàn.
  - Sàn giao dịch kịch bản cộng đồng: Cho phép lập trình viên toàn cầu bán sản phẩm và tự động nhận hoa hồng.
  - Cổng API Doanh nghiệp mở rộng (Public Developer Gateway & SDKs) chuẩn quốc tế.
* **Chỉ số Cam kết (Target KPIs):**
  - Thời gian khởi tạo đại lý mới: $\le 15\text{ phút}$
  - Tỷ lệ kịch bản độc hại lọt kiểm duyệt: **0.00%**
  - Tăng trưởng doanh thu hệ sinh thái: $\ge 300\%$

---

## 🔗 Liên Kết Quản Trị Dự Án
- **Bảng Kế hoạch Bàn giao Chi tiết:** [`TIMELINE.md`](file:///root/tuquet/admin/TIMELINE.md)
- **Thư Viện Tài Liệu 5 Phase:** [`docs/phases/`](file:///root/tuquet/admin/docs/phases/)
- **Kế hoạch Sprint Hàng ngày:** [`tasks/plan.md`](file:///root/tuquet/admin/tasks/plan.md)
