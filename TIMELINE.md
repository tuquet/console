# Tuquet Ecosystem — Timeline & Kế Hoạch Triển Khai Thực Tế

> **Mục đích:** Bảng theo dõi tiến độ thực tế (Timeline Execution Plan) của toàn bộ dự án. 
> Mọi Milestone được đồng nhất 1-1 với các Phase của Roadmap tổng. Tuyệt đối không đánh dấu "Hoàn thành" khi chưa kiểm toán tính đúng đắn của nghiệp vụ và cơ sở dữ liệu.

---

## 📅 Tổng Quan Các Mốc Thời Gian (Milestone Schedule)

```text
2026-10 ───► 2026-11 ───► 2026-12 ───► 2027-01 ───► 2027-02 ───► 2027-04
Phase 1       Phase 2       Phase 3       Phase 4       Phase 5
Core IAM      Wallet & QR   Digital Shop  Automation    Marketplace &
& Multi-Tenant              & Inventory   & Fleet       White-Label
```

---

## 🎯 Chi Tiết Từng Milestone & Kế Hoạch Kiểm Toán

### 🟡 MILESTONE 01: Nền Tảng Multi-Tenant, IAM & Scalable RBAC
- **Thời gian dự kiến:** 2026-10-18 đến 2026-11-08 (3 tuần)
- **Tình trạng hiện tại:** Đang rà soát và kiểm toán lại (In Audit & Hardening)
- **Rủi ro cốt lõi cần giải quyết:** 
  - Code hiện tại chưa đảm bảo cô lập dữ liệu 100% nếu có nhiều workspace truy vấn đồng thời.
  - Role member cập nhật bằng `DELETE` rồi `POST` dễ gây mất quyền khi rớt mạng.
  - Lỗ hổng SSRF tại Desktop Bridge và rủi ro Open Redirect.

#### Danh sách công việc cụ thể:
- [ ] **Task 1.1 — Kiểm toán Schema `core_iam` & RLS Policies:**
  - Rà soát từng bảng: `workspaces`, `workspace_members`, `roles`, `permissions`, `member_roles`.
  - Viết bộ kiểm thử kiểm tra cô lập dữ liệu (Tenant Isolation Test): Workspace A tuyệt đối không thể đọc/ghi dữ liệu của Workspace B qua PostgREST.
- [ ] **Task 1.2 — Cập nhật Member Role nguyên tử (Atomic Role Update):**
  - Thay thế logic `DELETE` rồi `POST` trong `apps/web-admin/src/api/core/workspace-detail.ts` bằng PostgREST RPC hoặc transaction upsert nguyên tử.
- [ ] **Task 1.3 — Vá bảo mật Desktop Bridge & Open Redirect:**
  - Whitelist nghiêm ngặt port `1024..65535` và IP loopback `127.0.0.1` trong `apps/web-admin/src/views/_core/authentication/desktop-bridge.vue`.
  - Chặn triệt để URL protocol-relative (`//evil.com`) tại `apps/web-admin/src/store/auth.ts` và `apps/web-admin/src/router/guard.ts`.
- [ ] **Task 1.4 — Xây dựng Ma trận Phân quyền Hạt mịn (Granular RBAC Matrix):**
  - Giao diện cấp phát quyền chi tiết: Quyền xem log, Quyền nạp tiền ví, Quyền mua sản phẩm trên Shop, Quyền quản trị thành viên.

---

### ⚪ MILESTONE 02: Hệ Thống Ví Số (Wallet) & Cổng Nạp Tiền Tự Động
- **Thời gian dự kiến:** 2026-11-09 đến 2026-11-30 (3 tuần)
- **Tình trạng:** Chưa bắt đầu (Pending Phase 1)
- **Rủi ro cốt lõi cần giải quyết:**
  - Hiện tại ví chỉ lưu số dư thô, chưa có sổ cái kép (Double-Entry Ledger), dễ bị sai lệch số dư nếu server crash giữa chừng.
  - Chưa có khóa dòng (Row lock) để ngăn chặn trừ âm ví khi có nhiều request đồng thời.

#### Danh sách công việc cụ thể:
- [ ] **Task 2.1 — Tái cấu trúc Cơ sở Dữ liệu Ví theo Sổ Cái Kép (Double-Entry Ledger):**
  - Tạo bảng `wallet_transactions` ghi nhận: `balance_before`, `amount`, `balance_after`, `reference_id`, `type`.
  - Sử dụng PostgreSQL Trigger hoặc Stored Procedure với `SELECT ... FOR UPDATE` để trừ tiền nguyên tử, tuyệt đối không trừ âm.
- [ ] **Task 2.2 — Cổng Nạp Tiền Ngân Hàng VietQR Webhook Tự Động:**
  - Tạo mã QR động với cú pháp nạp chuẩn hóa (`TQ <Mã_Ví>`).
  - Viết webhook endpoint lắng nghe biến động số dư từ ngân hàng và cộng tiền ví trong 5 giây mà không cần duyệt tay.
- [ ] **Task 2.3 — Cổng Thanh Toán Quốc Tế / Crypto (USDT Webhook):**
  - Tích hợp nạp tiền qua mạng lưới blockchain (TRC20 / TON), tự động đối soát giao dịch on-chain.
- [ ] **Task 2.4 — Giao diện Lịch sử Giao dịch & Cảnh báo Biến động Số dư:**
  - Bảng tra cứu đối soát số dư trên Web Admin.
  - Tích hợp Telegram bot gửi cảnh báo khi nạp thành công hoặc khi số dư ví xuống dưới ngưỡng an toàn.

---

### ⚪ MILESTONE 03: Chợ Sản Phẩm Số & Thanh Toán (Digital Market Shop)
- **Thời gian dự kiến:** 2026-12-01 đến 2026-12-22 (3 tuần)
- **Tình trạng:** Chưa bắt đầu (Pending Phase 2)
- **Rủi ro cốt lõi cần giải quyết:**
  - Mua hàng số chưa có cơ chế giữ hàng (Inventory Lock), dễ bán trùng 1 serial/proxy cho 2 khách hàng.
  - Chưa có `idempotency_key` dẫn đến nguy cơ trừ ví 2 lần khi mạng lag bấm nút mua 2 lần.

#### Danh sách công việc cụ thể:
- [ ] **Task 3.1 — Cơ chế Chống Trừ Tiền 2 Lần (Idempotency Key):**
  - Bắt buộc tham số `idempotency_key` (UUID v4) trong API `createCheckoutOrderApi` cho cả Store nội bộ và Public Store.
- [ ] **Task 3.2 — Kho Quản Lý Tài Nguyên Số & Khóa Giữ Hàng (Digital Inventory Pool):**
  - Bảng lưu trữ sản phẩm số: Key bản quyền, Danh sách Proxy (IP:Port:User:Pass), Tài khoản nuôi sẵn.
  - Cơ chế khóa hàng tạm thời (5 phút) trong quá trình thanh toán để tránh tranh chấp mua hàng.
- [ ] **Task 3.3 — Giao diện Xuất Hàng Số Tức Thì (Instant Digital Fulfillment UI):**
  - Sau khi trừ ví thành công, hiển thị tức thời danh sách key/proxy kèm nút Copy 1-click và nút "Tải file txt".
- [ ] **Task 3.4 — Quản lý Đơn Hàng & Chính Sách Hoàn Tiền Tự Động:**
  - Bảng quản trị đơn hàng, nút báo cáo sản phẩm số lỗi và tự động hoàn tiền vào ví nếu sản phẩm chưa qua sử dụng.

---

### ⚪ MILESTONE 04: Ứng Dụng Tự Động Hóa & Đưa Lên Chợ Số Bán
- **Thời gian dự kiến:** 2027-01-05 đến 2027-02-15 (5 tuần)
- **Tình trạng:** Chưa bắt đầu (Pending Phase 3)
- **Mục tiêu:**
  - Đóng gói kịch bản Automa, gói Proxy xoay vòng, và cụm VPS Node thành các mặt hàng thương mại trên Shop để khách hàng nạp ví mua và chạy.
  - Kết nối trực tiếp giữa Web Admin và Rust Runner qua WebSocket/SSE (`127.0.0.1:8765`) để theo dõi bot chạy thời gian thực.
  - Giám sát cụm VPS, cam kết triệt tiêu 100% tiến trình Chromium mồ côi (Zero-Zombie).

---

### ⚪ MILESTONE 05: Đại Lý White-Label & Sàn Kịch Bản Cộng Đồng
- **Thời gian dự kiến:** 2027-03-01 đến 2027-04-30 (8 tuần)
- **Tình trạng:** Định hướng tương lai
- **Mục tiêu:**
  - Hỗ trợ đối tác gắn tên miền riêng (`bot.doitac.com`), logo riêng, màu sắc nhận diện riêng trên nền tảng Tuquet.
  - Mở sàn giao dịch kịch bản cho cộng đồng lập trình viên, tự động trích hoa hồng về ví tác giả khi có lượt mua.
  - Công bố bộ SDK chính thức (TypeScript, Python) cho phép điều khiển dàn bot qua API bên ngoài.

---

## 📌 Nguyên Tắc Kiểm Soát Tiến Độ (Governance Rules)
1. **Không nhảy cóc:** Tuyệt đối không làm Phase sau khi Phase trước chưa đạt tiêu chí nghiệm thu kiểm toán.
2. **Không tự nhận Done:** Mọi task chỉ được đánh dấu `[x]` khi có bài test kiểm chứng và mã code đã được audit.
3. **Cập nhật thực tế:** Khi có phát sinh hoặc thay đổi kế hoạch, cập nhật ngay file này để làm cơ sở đối thoại trên GitHub.
