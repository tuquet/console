# Spec: Hợp Nhất Menu Fleet và Automation

> **Mã đặc tả:** SPEC-route-consolidation-automation-fleet  
> **Sáng kiến:** Tinh Gọn Cấu Trúc Menu và Router Tree  
> **Trạng thái:** DRAFT - Chờ phê duyệt  

---

## 1. Giả Định Ban Đầu

1. Hệ thống gộp 2 nhóm route Fleet và Automation thành 1 menu gốc duy nhất mang tên Tự động hóa - Automation trên thanh điều hướng bên trái.
2. Thứ tự hiển thị menu con sắp xếp khoa học từ cấp độ kịch bản đến hạ tầng thực thi: Quy trình, Lịch sử chạy, Thiết bị, Browser profiles, Proxy pool.
3. Giữ nguyên toàn bộ logic phân quyền authority và giao diện hiện tại của từng màn hình.
4. Thiết lập redirect tự động từ các đường dẫn cũ dạng fleet sang automation để tránh đứt gãy liên kết đã lưu.

---

## 2. Mục Tiêu

Hợp nhất phân hệ Quản trị thiết bị - Fleet và Tự động hóa - Automation thành một khối điều hướng thống nhất.

Lợi ích:
- Giảm tải số lượng menu cấp 1 trên sidebar từ 5 xuống 4 mục: Bảng điều khiển, Quản trị workspace, Tự động hóa, Hệ thống.
- Gom toàn bộ quy trình tự động hóa và hạ tầng thực thi gồm máy trạm runner, profile trình duyệt, cổng proxy vào cùng một không gian làm việc.

---

## 3. Cấu Trúc Router Tree Mới

Tuyến đường gốc:
- Tên: Automation
- Đường dẫn: `/automation`
- Điều hướng mặc định: `/automation/workflows`
- Biểu tượng: `lucide:workflow`
- Thứ tự: 20

Danh sách menu con:
1. Quy trình: `/automation/workflows` - icon `lucide:git-branch` - quyền `automa:workflows:read`
2. Lịch sử chạy: `/automation/runs` - icon `lucide:play-circle` - quyền `automa:campaigns:read`
3. Thiết bị: `/automation/devices` - icon `lucide:laptop` - quyền `runners:devices:read`
4. Browser profiles: `/automation/browsers` - icon `lucide:globe` - quyền `runners:browsers:read`
5. Proxy pool: `/automation/proxies` - icon `lucide:network` - quyền `runners:proxies:read`

Tuyến đường ẩn:
- Chi tiết phiên chạy: `/automation/runs/:id` - icon `lucide:file-text` - quyền `automa:logs:read`

Tuyến đường chuyển tiếp giữ liên kết cũ:
- `/fleet` chuyển tiếp về `/automation/devices`
- `/fleet/devices` chuyển tiếp về `/automation/devices`
- `/fleet/browsers` chuyển tiếp về `/automation/browsers`
- `/fleet/proxies` chuyển tiếp về `/automation/proxies`

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
  - Giữ nguyên các component view hiện có trong thư mục views.
  - Bảo đảm kiểm tra kiểu dữ liệu đạt 0 lỗi trước khi hoàn tất.
  - Sử dụng câu chữ ngắn gọn không dùng dấu ngoặc đơn.
- Hỏi trước:
  - Thay đổi quyền hạn authority trong metadata route.
- Tuyệt đối không:
  - Không thực hiện lệnh git push lên máy chủ từ xa.
  - Không xóa bỏ các view component khi chưa có yêu cầu.

---

## 6. Tiêu Chí Nghiệm Thu

1. Sidebar hiển thị duy nhất menu Tự động hóa chứa đầy đủ 5 mục con theo thứ tự quy định.
2. Truy cập các đường dẫn cũ dạng fleet tự động chuyển hướng đúng màn hình tương ứng.
3. Typecheck đạt 0 lỗi trên toàn bộ dự án.
4. Build cục bộ thành công và hiển thị tốt trên Tailscale IP 100.68.217.61.

---

## 7. Câu Hỏi Mở Cần Xác Nhận

1. Bạn có muốn giữ đường dẫn URL `/automation/devices` hay giữ nguyên URL `/fleet/devices` nhưng chỉ gom hiển thị chung dưới menu Tự động hóa trên thanh bên?
2. Biểu tượng cấp 1 bạn muốn dùng `lucide:workflow` hay biểu tượng khác?
