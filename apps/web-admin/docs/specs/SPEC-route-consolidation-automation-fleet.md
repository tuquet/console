# Spec: Hợp Nhất Menu Fleet và Automation

> **Mã đặc tả:** `SPEC-route-consolidation-automation-fleet`  
> **Module id:** `route-consolidation-automation-fleet` (xem [`capability-map.md`](capability-map.md))  
> **Trạng thái:** **ĐÃ HOÀN THÀNH (ACCEPTED & IMPLEMENTED)**

---

## 1. Giả Định Ban Đầu

1. Hệ thống gộp 2 nhóm route Fleet và Automation thành 1 menu gốc duy nhất mang tên Tự động hóa - Automation trên thanh điều hướng bên trái.
2. Thứ tự hiển thị menu con sắp xếp khoa học từ cấp độ kịch bản đến hạ tầng thực thi: Quy trình, Lịch sử chạy, Thiết bị, Hồ sơ trình duyệt, Proxy pool.
3. Giữ nguyên toàn bộ logic phân quyền `authority` và ranh giới `plugin` (`automa` và `runners`) của từng màn hình.
4. Dời toàn bộ thư mục view sang `src/views/automation/` và xóa bỏ các đường dẫn `/fleet` cũ theo nguyên tắc _Pre-Release Clean Slate_.

---

## 2. Mục Tiêu

Hợp nhất phân hệ Quản trị thiết bị - Fleet và Tự động hóa - Automation thành một khối điều hướng thống nhất.

Lợi ích:

- Giảm tải số lượng menu cấp 1 trên sidebar từ 5 xuống 4 mục: Bảng điều khiển, Quản trị workspace, Tự động hóa, Hệ thống.
- Gom toàn bộ quy trình tự động hóa và hạ tầng thực thi gồm máy trạm runner, hồ sơ trình duyệt, cổng proxy vào cùng một không gian làm việc.

---

## 3. Cấu Trúc Router Tree Mới

Tuyến đường gốc:

- Tên: `Automation`
- Đường dẫn: `/automation`
- Điều hướng mặc định: `/automation/workflows`
- Biểu tượng: `lucide:workflow`
- Thứ tự: `20`

Danh sách menu con:

1. Quy trình: `/automation/workflows` — icon `lucide:git-branch` — plugin `automa` — quyền `automa:workflows:read`
2. Lịch sử chạy: `/automation/runs` — icon `lucide:play-circle` — plugin `automa` — quyền `automa:campaigns:read`
3. Thiết bị: `/automation/devices` — icon `lucide:laptop` — plugin `runners` — quyền `runners:devices:read`
4. Hồ sơ trình duyệt: `/automation/browsers` — icon `lucide:globe` — plugin `runners` — quyền `runners:browsers:read`
5. Proxy pool: `/automation/proxies` — icon `lucide:network` — plugin `runners` — quyền `runners:proxies:read`

Tuyến đường ẩn:

- Chi tiết phiên chạy: `/automation/runs/:id` — icon `lucide:file-text` — plugin `automa` — quyền `automa:logs:read`

---

## 4. Các Lệnh Thực Thi và Kiểm Tra

```bash
# 1. Kiểm tra kiểu dữ liệu TypeScript
pnpm --filter @tuquet/admin-web run typecheck

# 2. Chạy bộ kiểm thử đơn vị
pnpm test:unit

# 3. Đóng gói và triển khai cục bộ
bash ./scripts/build-local.sh
```

---

## 5. Ranh Giới Kỹ Thuật

- Luôn luôn:
  - Dời đồng bộ các component view về `src/views/automation/`.
  - Bảo đảm kiểm tra kiểu dữ liệu đạt 0 lỗi trước khi hoàn tất.
  - Sử dụng câu chữ ngắn gọn không dùng dấu ngoặc đơn.
- Hỏi trước:
  - Thay đổi quyền hạn `authority` trong metadata route.
- Tuyệt đối không:
  - Không thực hiện lệnh `git push` lên máy chủ từ xa khi chưa có yêu cầu.

---

## 6. Tiêu Chí Nghiệm Thu

1. [x] Sidebar hiển thị duy nhất menu Tự động hóa chứa đầy đủ 5 mục con theo thứ tự quy định.
2. [x] Ranh giới `meta.plugin` (`automa` và `runners`) lọc độc lập từng nhánh con.
3. [x] Typecheck đạt 0 lỗi trên toàn bộ dự án.
4. [x] Build cục bộ thành công và hiển thị tốt trên `http://127.0.0.1/`.
