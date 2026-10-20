# Phase 04: Cloud Automation & Fleet Command

> **Giai đoạn 04: Đám Mây Tự Động Hóa Phân Tán & Điều Phối Máy Chủ**  
> **Thời gian triển khai:** 05/01/2027 – 15/02/2027 (5 tuần)  
> **Trọng tâm:** Thương mại hóa công nghệ cốt lõi — Đóng gói các vũ khí tự động hóa thành gói SaaS bán trên Shop, đo cước tài nguyên động (Metered Billing), giám sát cụm máy chủ thời gian thực và vận hành sạch 100% không tiến trình thừa (Zero-Zombie).

---

## 🎯 1. Tầm Nhìn Chiến Lược & Mô Hình Đo Cước Tài Nguyên (Metered Pricing)

Sau khi Chợ sản phẩm số và hệ thống thanh toán đã vận hành trơn tru (Phase 02 & 03), đây là thời điểm đưa các **Vũ khí Công nghệ Độc quyền của Tuquet** ra thị trường dưới dạng gói dịch vụ thuê bao (SaaS / IaaS).

Để tạo ra dòng doanh thu định kỳ bền vững (MRR / ARR), Phase 04 tích hợp **Động Cơ Đo Cước Động (Metered Billing Engine)** rõ ràng và minh bạch cho nhà đầu tư:

1. **Mô hình Dùng bao nhiêu trả bấy nhiêu (Pay-As-You-Go):** Trừ tiền ví theo block thời gian thực tế máy chủ/bot chạy (ví dụ: $0.05\text{ USD}$ / giờ chạy bot).
2. **Mô hình Gói thuê bao cố định (Monthly Subscriptions):** Thuê node VPS chuyên dụng chạy 24/7 hoặc thuê bao kịch bản VIP theo tháng.
3. **Mô hình Đo cước Băng thông Proxy:** Tự động trừ tiền ví theo số GB proxy xoay vòng tiêu thụ trong quá trình cào dữ liệu.

---

## 📦 2. Gói Sản Phẩm Bàn Giao Cho Sponsor (Executive Deliverables)

1. **Các Gói Dịch Vụ Tự Động Hóa Bán Trực Tiếp Trên Shop (Automation SaaS Packages):**
   - Đóng gói các kịch bản thực tế thành gói thuê bao (theo giờ / theo ngày / theo luồng):
     - Gói Cào Dữ liệu Thương mại Điện tử (Shopee, TikTok Shop, Amazon).
     - Gói Nuôi và Tương tác Mạng Xã hội Tự động (Facebook, X/Twitter, Telegram).
     - Gói Kiểm thử Phần mềm & Giám sát Uptime website tự động.
2. **Động Cơ Đo Cước Tài Nguyên Động (Metered Billing & Telemetry Engine):**
   - Ghi nhận chính xác từng giây hoạt động của bot và từng megabyte proxy tiêu thụ.
   - Cơ chế tự động tạm dừng phiên bot khi số dư ví của Workspace chạm ngưỡng $0$, bảo vệ tuyệt đối không bị thâm hụt chi phí máy chủ.
3. **Trung Tâm Điều Hành Cụm Máy Chủ Toàn Cầu (Global Fleet Command Center):**
   - Bảng điều khiển giám sát sức khỏe toàn bộ các cụm máy chủ VPS phân tán theo bản đồ nhiệt (Heatmap):
     - Tải CPU, RAM, dung lượng ổ đĩa, băng thông mạng thời gian thực.
     - Số lượng phiên bot đang hoạt động trên từng máy chủ.
     - Tự động cảnh báo và cô lập máy chủ khi phát hiện dấu hiệu quá tải hoặc lỗi mạng.
4. **Cầu Nối Trực Tiếp Thời Gian Thực (Native BFF WebSocket / SSE Bridge):**
   - Web Admin kết nối trực tiếp với native Rust Runner daemon (`127.0.0.1:8765`):
     - Xem trực tiếp dòng chảy kịch bản (Visual DAG Execution): Node nào đang chạy, thời gian thực thi, log chi tiết từng bước.
     - Nút dừng khẩn cấp (Emergency Kill) toàn bộ bot trên 1 node chỉ bằng 1 thao tác.
5. **Cam Kết Vận Hành Sạch & Tối Ưu Chi Phí Điện Toán (Zero-Zombie Guarantee):**
   - Cơ chế giám sát tiến trình cấp kernel (Win32 Job Objects / Unix process group):
     - Triệt tiêu 100% tiến trình Chromium mồ côi khi kịch bản kết thúc hoặc crash.
     - Tiết kiệm ít nhất **$40\%$ chi phí hóa đơn máy chủ** hàng tháng so với các giải pháp bot truyền thống trên thị trường.

---

## 📊 3. Chỉ Số Cam Kết Định Lượng (Target KPIs & SLAs)

| Chỉ số đo lường | Mục tiêu cam kết | Phương pháp kiểm chứng |
| :-- | :-: | :-- |
| **Độ sẵn sàng hệ thống (Uptime SLA)** | **99.9%** | Giám sát liên tục trạng thái cụm máy chủ VPS 24/7/365 |
| **Độ chính xác đo cước tài nguyên** | **Tuyệt đối 100%** | Kiểm toán đối soát thời gian chạy thực tế và số tiền trừ ví qua Sổ cái kép |
| **Tỷ lệ triệt tiêu tiến trình mồ côi** | **100% (Zero-Zombie)** | Kiểm toán RAM/CPU của VPS sau 10.000 phiên chạy kịch bản liên tục |
| **Tiết kiệm chi phí hạ tầng máy chủ** | $\ge 40\%$ | So sánh chi phí VPS của kiến trúc Runner với Selenium/Puppeteer thông thường |
| **Khả năng mở rộng quy mô cụm** | $\ge 1.000$ VPS Nodes | Thử nghiệm kết nối và điều phối cụm 1.000 máy chủ phân tán |

---

## 🛡️ 4. Tiêu Chuẩn Nghiệm Thu Kỹ Thuật (Acceptance Checklist)

- [ ] Bộ đo cước tự động gửi heartbeat mỗi 60 giây và trừ tiền ví theo đúng đơn giá gói dịch vụ đã chọn.
- [ ] Khi số dư ví cạn, hệ thống gửi lệnh `Graceful Pause` cho runner đóng phiên an toàn mà không làm hỏng dữ liệu đang cào.
- [ ] Web Admin hiển thị trực quan biểu đồ trạng thái của từng node trong DAG kịch bản đang chạy qua WebSocket.
- [ ] Khi đóng cửa sổ hoặc tắt bot, toàn bộ cây tiến trình Chromium con bị terminate sạch sẽ trong $\le 100\text{ ms}$.
