# Tuquet Admin — Product Roadmap

## 🎯 North Star
Xây dựng bảng điều khiển quản trị tập trung (Command Center) đạt chuẩn Enterprise cho toàn bộ hệ sinh thái Tuquet theo chuỗi giá trị thương mại:
**Nền tảng Multi-Tenant RBAC $\rightarrow$ Hệ thống Ví Tiền Tệ $\rightarrow$ Chợ Sản Phẩm Số & Thanh Toán $\rightarrow$ Ứng Dụng Tự Động Hóa Đưa Lên Shop $\rightarrow$ Đại Lý White-Label**.

---

## 🗺️ Các Cột mốc Phát triển (Milestones)

---

### 🟢 Milestone v1.0: Nền tảng Giao diện, Trải nghiệm Mobile & Giám sát Lỗi (Đã hoàn thành)
- [x] **Supabase Client & Auth State SSOT:** Xác thực GoTrue, làm mới token đơn chuyến (single-flight refresh), quản lý phiên tập trung.
- [x] **Mobile Workspace Layout & Responsive:** Dàn lưới responsive 1 cột trên mobile (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`), cuộn ngang tự nhiên cho Tabs và bảng dữ liệu VXE Table.
- [x] **Phân tầng Z-index 5 Lớp:** Ngăn chặn triệt để hiện tượng detail sheet che lấp hoặc đè header của trang (`z-50` Header $\rightarrow$ `z-[60]` Sheet $\rightarrow$ `z-[70]` Dialog $\rightarrow$ `z-[80]` Toast).
- [x] **Enterprise Typography & i18n Brevity:** Chuẩn hóa Sentence case toàn hệ thống, rút gọn các từ dài trong bảng dữ liệu (`Operating system` $\rightarrow$ `OS`, `Mã định danh` $\rightarrow$ `ID`).
- [x] **Full Browser Error Observability (Bugsink/Sentry):** Triển khai hàng đợi đệm lỗi sớm (Early Error Buffer), bảo toàn default integrations, khử trùng PII trong URL, bắt sự kiện `vite:preloadError` và lỗi tài nguyên DOM capture phase.

---

### 🟡 Milestone v1.1: Hạt nhân Multi-Tenant & RBAC Đáp ứng Scale Lớn (Sprint Tiếp theo)
*Mục tiêu: Đảm bảo nền móng dữ liệu tổ chức và kiểm soát phân quyền vững chắc, loại bỏ rủi ro rò rỉ dữ liệu hoặc lỗ hổng chiếm quyền.*

- [ ] **Bảo mật Cầu nối Desktop (`desktop-bridge.vue`):**
  - Khắc phục nguy cơ SSRF & Token Exfiltration: Kiểm tra nghiêm ngặt `port` thuộc dải số nguyên hợp lệ `1024..65535` và chỉ cho phép loopback `127.0.0.1`.
- [ ] **Ngăn ngừa Open Redirect (`auth.ts` & `guard.ts`):**
  - Chặn các URL protocol-relative (`//evil.com`) khi giải mã tham số `redirect`.
  - Đồng bộ `callback.vue` để chuyển hướng chính xác theo `redirect` hoặc `userInfo.homePath`.
- [ ] **Cập nhật Member Role nguyên tử (Atomic Role Update):**
  - Thay thế quy trình `DELETE` rồi `POST` riêng biệt bằng câu lệnh cập nhật/upsert nguyên tử PostgREST trong [`workspace-detail.ts`](file:///root/tuquet/admin/apps/web-admin/src/api/core/workspace-detail.ts), tránh nguy cơ thành viên bị mất toàn bộ role nếu request thứ hai thất bại giữa chừng.
- [ ] **Granular RBAC Permission Matrix UI:**
  - Xây dựng giao diện ma trận phân quyền chi tiết cho từng vai trò trong Workspace: quyền xem log, quyền mua hàng trên shop, quyền quản trị ví, quyền thêm bớt thành viên.
- [ ] **Tối ưu hóa Phân trang & Caching PostgREST:**
  - Lọc bỏ các ký tự đặc biệt của PostgREST (`[,]()*%`) trong ô tìm kiếm log hệ thống.
  - Phân trang chuẩn xác và loại bỏ việc fetch toàn bộ dữ liệu bảng không giới hạn trên màn hình tổng quan.

---

### 🟡 Milestone v1.2: Hệ thống Ví (Wallet) & Cổng Nạp Tiền Tự Động
*Mục tiêu: Vận hành dòng tiền tệ — Cho phép người dùng tự nạp tiền vào ví số dư tự động 24/7.*

- [ ] **Giao diện Nạp Tiền Tự Động qua VietQR (VietQR Dynamic Webhook):**
  - Tạo mã QR động với nội dung nạp tiền chuẩn hóa (`TQ <Mã_Ví>`), tự động hiển thị trạng thái "Đang chờ thanh toán" và tự động chuyển sang "Thành công" khi có webhook.
- [ ] **Cổng Thanh toán Quốc tế / Crypto (USDT Webhook):**
  - Tích hợp giao diện tạo địa chỉ ví nạp tiền tạm thời và kiểm tra đối soát on-chain tự động.
- [ ] **Sổ Cái Biến Động Số Dư (Double-Entry Ledger UI):**
  - Hiển thị bảng đối soát giao dịch minh bạch: số dư trước giao dịch, số tiền biến động, số dư sau giao dịch, mã tham chiếu đơn hàng.
- [ ] **Cảnh báo Số dư & Giới hạn Tiêu dùng (Wallet Quota & Alerts):**
  - Cho phép chủ Workspace thiết lập hạn mức chi tiêu hàng ngày cho từng thành viên; gửi cảnh báo khi số dư ví xuống dưới ngưỡng an toàn.

---

### 🟡 Milestone v1.3: Chợ Sản Phẩm Số & Thanh Toán Tích Hợp (Digital Market Shop)
*Mục tiêu: Xây dựng Chợ số hoàn chỉnh — Nơi bày bán, đặt hàng và xuất kho các sản phẩm số qua trừ ví tự động.*

- [ ] **Cơ chế Chống Trừ Tiền 2 Lần (Idempotency Key):**
  - Bổ sung `idempotency_key` (UUID v4) cho API `createCheckoutOrderApi` trong cả cửa hàng nội bộ và Public Store, ngăn chặn việc tạo đơn và trừ ví 2 lần khi người dùng bấm liên tục hoặc mạng lag.
- [ ] **Quản Lý Kho Sản Phẩm Số (Digital Inventory Pool UI):**
  - Bảng quản trị kho số cho admin: thêm danh sách key/serial hàng loạt, import danh sách proxy (IP:Port), theo dõi tình trạng kho (còn hàng, đã bán, lỗi).
- [ ] **Giao diện Xuất Serial & Tài nguyên Số Tức Thì (Instant Fulfillment UI):**
  - Ngay sau khi thanh toán đơn hàng thành công, hiển thị tức thời danh sách mã bản quyền, proxy hoặc tài khoản với nút Copy 1-click và nút "Tải file txt".
- [ ] **Quản Lý Vòng Đời Đơn Hàng (Order Lifecycle & Invoicing):**
  - Lịch sử đơn hàng, xem lại các key/proxy đã mua, cơ chế bảo hành/hoàn tiền tự động vào ví số dư nếu sản phẩm số bị lỗi xác thực.

---

### ⚪ Milestone v1.4: Ứng Dụng Tự Động Hóa (Automation) & Điều Phối Fleet Đưa Lên Shop
*Mục tiêu: Đưa các sản phẩm tự động hóa (Kịch bản cào dữ liệu, Bot, Proxy, Node VPS) lên bán trên Chợ và giám sát thời gian thực.*

- [ ] **Đưa Gói Kịch Bản Automa & Proxy lên Bán:**
  - Kết nối bảng giá dịch vụ chạy kịch bản (theo giờ / theo lượt chạy) với luồng thanh toán qua ví.
- [ ] **Kết nối Native BFF Axum Bridge (`127.0.0.1:8765`):**
  - Tích hợp Server-Sent Events (SSE) và WebSocket nhận luồng log thực thi kịch bản Automa trực tiếp từ kernel daemon.
- [ ] **Visual DAG Execution Inspector:**
  - Trình chiếu trạng thái thực thi trực quan trên luồng graph (node nào đang chạy, thời gian chạy, dữ liệu đầu ra).
- [ ] **Fleet Topology & Hardware Metrics:**
  - Bảng điều khiển tài nguyên cụm VPS: CPU, RAM, dung lượng đĩa, trạng thái SOCKS5/HTTP tunnel của từng node theo thời gian thực.
- [ ] **Chống Race Condition Polling (`automation/runs/detail.vue`):**
  - Bổ sung cờ guard chống trùng lặp request khi API log mất hơn 3 giây để phản hồi.

---

### ⚪ Milestone v2.0: Multi-Tenant White-Labeling & Marketplace
*Mục tiêu: Mở rộng khả năng thương mại hóa cho các tổ chức đối tác.*

- [ ] **Tùy biến Thương hiệu Đa tổ chức (Tenant White-Labeling):**
  - Cho phép từng Workspace tự cấu hình Custom Domain, Logo, Favicon và Bảng màu Theme riêng biệt.
- [ ] **Tuquet Plugin & Workflow Marketplace cho Cộng đồng:**
  - Cổng mua sắm kịch bản tự động hóa do cộng đồng đăng tải, cơ chế chia sẻ hoa hồng tác giả tự động về ví.

---

## 🔗 Liên kết Quy trình Kỹ thuật (Engineering Traceability)
- **Đặc tả Kỹ thuật chi tiết:** [`apps/web-admin/docs/specs/`](file:///root/tuquet/admin/apps/web-admin/docs/specs/)
- **Kế hoạch Thực thi Sprint:** [`tasks/plan.md`](file:///root/tuquet/admin/tasks/plan.md)
- **Danh sách Checkbox Task hàng ngày:** [`tasks/todo.md`](file:///root/tuquet/admin/tasks/todo.md)
