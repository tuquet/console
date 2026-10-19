# Phase 01: Enterprise IAM & Multi-Tenancy

> **Giai đoạn 01: Nền Tảng Định Danh Doanh Nghiệp & Bảo Mật Đa Tổ Chức**  
> **Thời gian triển khai:** 18/10/2026 – 08/11/2026 (3 tuần)  
> **Trọng tâm:** Xây móng nhà kiên cố — Cô lập dữ liệu tuyệt đối (Zero Data Bleed), Enterprise SSO (Google/Microsoft), phân quyền vai trò hạt mịn và bảo mật xác thực cấp ngân hàng.

---

## 🎯 1. Tầm Nhìn Chiến Lược & Giá Trị Kinh Doanh

Một nền tảng doanh nghiệp muốn phục vụ hàng nghìn tổ chức (khách hàng SME, đại lý, doanh nghiệp lớn) bắt buộc phải giải quyết triệt để rủi ro lớn nhất: **Rò rỉ dữ liệu chéo giữa các tổ chức (Cross-Tenant Data Bleed)** và **Quy trình Onboarding doanh nghiệp phức tạp**.

Phase 01 thiết lập chuẩn mực bảo mật cấp cơ sở dữ liệu (PostgreSQL Row-Level Security), đảm bảo mỗi doanh nghiệp là một "hộp kín" bất khả xâm phạm. Đồng thời tích hợp chuẩn **Enterprise Single Sign-On (Google Workspace, Microsoft Entra ID / 365 OAuth)** giúp các tập đoàn lớn triển khai hàng loạt cho toàn bộ nhân viên chỉ bằng 1 cú nhấp chuột.

---

## 📦 2. Gói Sản Phẩm Bàn Giao Cho Sponsor (Executive Deliverables)

1. **Cổng Đăng Nhập Doanh Nghiệp & Enterprise SSO:**
   - Hỗ trợ đăng nhập chuẩn SSO một chạm qua **Google Workspace** và **Microsoft Entra ID / Office 365**.
   - Tự động gán người dùng vào đúng Workspace công ty dựa trên domain email doanh nghiệp.
2. **Cổng Quản Trị Tổ Chức (Enterprise Workspace Console):**
   - Bảng điều khiển quản lý danh sách Workspace, thông tin định danh công ty, trạng thái thuê bao và hạn ngạch tài nguyên.
   - Giao diện trực quan, tối ưu hoàn hảo trên cả máy tính để bàn và điện thoại di động.
3. **Ma Trận Phân Quyền Hạt Mịn (Granular RBAC Permission Matrix):**
   - Phân cấp rõ 4 nhóm vai trò chuẩn doanh nghiệp:
     - `Owner (Chủ doanh nghiệp)`: Toàn quyền cấu hình, thanh toán, chuyển nhượng hoặc xóa Workspace.
     - `Finance / Billing (Quản lý tài chính)`: Quyền quản trị ví, nạp tiền, mua hàng trên Shop, xem hóa đơn; không có quyền can thiệp vào máy chủ kỹ thuật.
     - `Operator / Engineer (Kỹ thuật viên)`: Quyền chạy bot, cấu hình kịch bản tự động hóa, quản trị proxy; không có quyền rút tiền ví hoặc đổi quyền thành viên.
     - `Member (Thành viên)`: Quyền xem tài nguyên và kịch bản được phân công.
4. **Cơ Chế Cập Nhật Quyền Nguyên Tử (Atomic Member Role Update):**
   - Cơ chế cập nhật quyền hạn nguyên tử qua PostgREST, loại bỏ hoàn toàn rủi ro thành viên bị mất toàn bộ quyền truy cập khi gặp sự cố đứt kết nối mạng giữa chừng.
5. **Khung Phòng Vệ Chống Tấn Công Chuyển Hướng (Security Hardening):**
   - Vá triệt để lỗ hổng SSRF và nguy cơ rò rỉ token tại cầu nối Desktop (`desktop-bridge.vue`) với cơ chế lọc nghiêm ngặt port `1024..65535` và chỉ cho phép loopback `127.0.0.1`.
   - Ngăn chặn hoàn toàn các cuộc tấn công Open Redirect qua URL protocol-relative (`//evil.com`).
6. **Báo Cáo Kiểm Định An Toàn & Cô Lập Dữ Liệu (Security & Isolation Audit Report):**
   - Bộ hồ sơ kiểm thử độc lập chứng minh không thể có bất kỳ truy vấn API nào có thể đọc trộm dữ liệu của tổ chức khác.

---

## 📊 3. Chỉ Số Cam Kết Định Lượng (Target KPIs & SLAs)

| Chỉ số đo lường | Mục tiêu cam kết | Phương pháp kiểm chứng |
| :-- | :-: | :-- |
| **Độ cô lập dữ liệu tổ chức** | **100%** | Kiểm thử tấn công giả lập truy cập chéo tenant qua PostgREST API (0 vi phạm) |
| **Độ trễ xác thực trung bình** | $\le 50\text{ ms}$ | Benchmark đo lường thời gian phản hồi GoTrue token verification |
| **Tỷ lệ đăng nhập SSO thành công** | $\ge 99.8\%$ | Kiểm thử luồng xác thực Google Workspace và Microsoft Entra ID |
| **Quy mô đáp ứng đồng thời** | $\ge 10.000$ Tenants | Kiểm thử tải (Load test) với 10.000 workspace ảo truy vấn đồng thời |
| **Tỷ lệ gián đoạn phân quyền** | **0.00%** | Kiểm thử mô phỏng mất kết nối mạng giữa giao dịch cập nhật vai trò |

---

## 🛡️ 4. Tiêu Chuẩn Nghiệm Thu Kỹ Thuật (Acceptance Checklist)

- [ ] Toàn bộ 100% bảng dữ liệu trong schema `core_iam` đều có chính sách RLS kích hoạt và kiểm soát theo `workspace_id`.
- [ ] Luồng SSO hỗ trợ nhận diện domain email công ty và điều hướng về đúng Workspace tương ứng.
- [ ] Endpoint `desktop-bridge.vue` từ chối tất cả port nằm ngoài dải `1024..65535` hoặc host không phải `127.0.0.1`.
- [ ] Module xác thực từ chối các URL chuyển hướng bắt đầu bằng `//` hoặc chứa domain ngoài allowlist.
- [ ] Hàm cập nhật vai trò thành viên thực thi trong 1 giao dịch đơn nhất, không chia tách thành DELETE rồi POST.
- [ ] 100% unit tests và contract tests của module IAM pass không có cảnh báo (`761/761` tests).
