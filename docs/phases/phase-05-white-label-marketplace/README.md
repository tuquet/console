# Phase 05: White-Label Franchise & Open Marketplace

> **Giai đoạn 05: Nhượng Quyền Thương Hiệu & Thị Trường Mở Toàn Cầu**  
> **Thời gian triển khai:** 01/03/2027 – 30/04/2027 (8 tuần)  
> **Trọng tâm:** Nhân rộng quy mô không giới hạn — Nhượng quyền công nghệ cho các đối tác đại lý (White-Label) và biến Chợ số thành Sàn giao dịch kịch bản mở toàn cầu với cơ chế chia sẻ doanh thu tự động.

---

## 🎯 1. Tầm Nhìn Chiến Lược & Giá Trị Kinh Doanh

Một sản phẩm phần mềm dù tốt đến đâu cũng sẽ bị giới hạn tốc độ tăng trưởng nếu chỉ dựa vào đội ngũ bán hàng nội bộ. 

Phase 05 nâng tầm Tuquet từ một "Sản phẩm Phần mềm" thành một **"Nền Tảng Kinh Doanh Mở (Open Platform Ecosystem)"**:
1. **Mô hình Nhượng quyền Đại lý (White-Label Franchise):** Các doanh nghiệp đối tác có thể mua bản quyền để kinh doanh dịch vụ tự động hóa và proxy dưới thương hiệu, tên miền và bảng giá riêng của họ mà không cần xây dựng lại công nghệ.
2. **Mô hình Kinh tế Sáng tạo (Creator Economy Marketplace):** Mở sàn cho hàng nghìn lập trình viên bên ngoài đăng tải và bán các kịch bản tự động hóa, tạo ra hiệu ứng mạng lưới (Network Effect) tự mở rộng không tốn chi phí R&D.

---

## 📦 2. Gói Sản Phẩm Bàn Giao Cho Sponsor (Executive Deliverables)

1. **Nền Tảng Nhượng Quyền Thương Hiệu (Multi-Tenant White-Labeling Engine):**
   - Cho phép đối tác cấu hình:
     - Tên miền riêng (Custom Domain, ví dụ: `automation.doitac.com` kèm chứng chỉ SSL tự động).
     - Bộ nhận diện thương hiệu: Logo, Favicon, Tiêu đề trang, Bảng màu giao diện (Brand Color Tokens).
     - Cấu hình cổng thanh toán ngân hàng riêng của đại lý.
   - Toàn bộ hạ tầng kỹ thuật máy chủ và bot vẫn vận hành an toàn trên nền tảng Tuquet Cloud.
2. **Sàn Giao Dịch Kịch Bản Tự Động Hóa Mở (Open Workflow Marketplace):**
   - Không gian mua bán kịch bản toàn cầu:
     - Lập trình viên tải kịch bản Automa lên sàn kèm video demo và giá bán (mua đứt hoặc thuê bao tháng).
     - Hệ thống kiểm duyệt mã độc tự động (Automated Malware & Anti-Abuse Scanner) trước khi kịch bản được niêm yết công khai.
     - **Cơ chế Chia Sẻ Doanh Thu Tự Động (Creator Royalty Split):** Ngay khi có khách mua kịch bản, hệ thống tự động trích hoa hồng (ví dụ: $70\%$ cho Tác giả, $30\%$ cho Nền tảng) về ví số dư tức thì.
3. **Cổng Kết Nối API Doanh Nghiệp Quốc Tế (Public Developer Gateway & SDKs):**
   - Bộ API mở chuẩn OpenAPI / Swagger cho phép các tập đoàn lớn tích hợp hệ thống quản lý của họ với Tuquet.
   - Phát hành bộ công cụ lập trình chính thức (Official SDKs) bằng **TypeScript** và **Python**.

---

## 📊 3. Chỉ Số Cam Kết Định Lượng (Target KPIs & SLAs)

| Chỉ số đo lường | Mục tiêu cam kết | Phương pháp kiểm chứng |
| :--- | :---: | :--- |
| **Thời gian khởi tạo đại lý White-Label mới** | $\le 15\text{ phút}$ | Đo lường thời gian từ lúc gán tên miền đến khi đại lý lên sóng hoàn chỉnh |
| **Tăng trưởng doanh thu hệ sinh thái** | $\ge 300\%$ | So sánh tổng GMV giao dịch trước và sau khi kích hoạt mạng lưới đối tác |
| **Số lượng kịch bản đóng góp từ cộng đồng** | $\ge 500$ Workflows | Mục tiêu số lượng kịch bản kiểm duyệt đạt chuẩn trên sàn trong 6 tháng |
| **Tỷ lệ thanh toán hoa hồng tác giả chính xác** | **Tuyệt đối 100%** | Kiểm toán tự động tỷ lệ chia tiền về ví tác giả trên từng giao dịch |

---

## 🛡️ 4. Tiêu Chuẩn Nghiệm Thu Kỹ Thuật (Acceptance Checklist)

- [ ] Cấu hình Custom Domain hỗ trợ tự động cấp phát SSL qua Let's Encrypt / Cloudflare for SaaS.
- [ ] Giao diện Web Admin thay đổi 100% Logo, Tên ứng dụng và CSS Variable màu sắc theo cấu hình của từng Đại lý mà không cần build lại mã nguồn.
- [ ] Bộ SDK TypeScript và Python có tài liệu hướng dẫn (Docs) đầy đủ, mẫu code chạy thử và được phát hành chính thức.
