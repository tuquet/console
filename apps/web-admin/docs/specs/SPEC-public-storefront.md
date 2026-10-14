# Spec: Cửa Hàng Sản Phẩm Số Công Khai & Thanh Toán Khách Vãng Lai (Module `public-storefront`)

> **Mã đặc tả:** `SPEC-public-storefront`  
> **Module id:** `public-storefront` (xem [`capability-map.md`](capability-map.md))  
> **Kiến trúc nguồn:** [`SPEC-payment-gateway.md`](SPEC-payment-gateway.md), [`SPEC-digital-commerce.md`](SPEC-digital-commerce.md), [`SPEC-admin-commerce-portal.md`](SPEC-admin-commerce-portal.md), [`skills/rules/TYPOGRAPHY.md`](../../../../skills/rules/TYPOGRAPHY.md)  
> **Trạng thái:** **ĐÃ HOÀN THÀNH (ACCEPTED & IMPLEMENTED)**

---

## 1. Giả Định & Quyết Định Thiết Kế (Resolved Decisions)

1. **Định tuyến Công khai không yêu cầu đăng nhập (`/store` trong `src/router/routes/core.ts`):**
   - Route `/store` (`name: 'PublicStorefront'`) được đăng ký trực tiếp trong `coreRoutes` (`src/router/routes/core.ts`), tự động nằm trong `coreRouteNames` để đi qua `setupAccessGuard` mà không yêu cầu JWT `accessToken`.
   - Mọi truy vấn dữ liệu từ `/store` (`getCommerceCategoriesApi`, `getCommerceProductsApi`, `getActivePaymentGatewaysApi`, `createCheckoutOrderApi`, `getGuestOrderDeliveriesApi`) đều truyền `{ skipAuth: true }`, sử dụng `anon` key hợp lệ với các chính sách RLS công khai (`visibility = 'public'`) và hàm RPC `SECURITY DEFINER`.
2. **Bảo mật Bàn giao Khách vãng lai bằng `claim_token` (`CLM_...`) & Lưu trữ Cục bộ (`localStorage`):**
   - Khi khách vãng lai (Guest) tạo đơn hàng (`_buyer_tenant_id = NULL`), RPC `commerce.create_checkout_order` sinh mã bảo mật `claim_token` (`CLM_` + 32 ký tự hex ngẫu nhiên) và trả về duy nhất 1 lần cho phiên khởi tạo.
   - Giao diện `/store` tự động lưu cặp `(order_code, claim_token, buyer_email, total_credits, created_at)` vào `localStorage` (`TUQUET_GUEST_ORDERS`) của trình duyệt, đồng thời hỗ trợ đường dẫn truy cập nhanh `/store?order=ORD-...&token=CLM_...` để khách hàng không bị mất quyền nhận tài nguyên khi tải lại trang.
   - Khách vãng lai chỉ được phép chọn các sản phẩm có `visibility = 'public'` và `product_type IN ('serial_stock', 'digital_file')` (các gói tài nguyên nội bộ `specter_resource` và `wallet_credit` yêu cầu đăng nhập Tenant Workspace và có nút điều hướng sang `/commerce/store`).
3. **Thanh toán Đa kênh & Tự động Nhận hàng (Realtime Polling 3s):**
   - Hỗ trợ đầy đủ các cổng thanh toán ngoại vi đang hoạt động (`bank_transfer` VietQR 24/7, `e_wallet` MoMo/ZaloPay, `card_intl` Stripe, `crypto` USDT).
   - Sau khi tạo đơn, hộp thoại hiển thị mã QR động (`qr_image_url`), số tiền quy đổi theo tỷ giá cổng (`total_credits * rate_per_credit`), mã nội dung chuyển khoản `TQ...` và tự động gọi `getGuestOrderDeliveriesApi(order_code, claim_token)` mỗi 3 giây. Ngay khi `order.status === 'completed'`, giao diện chuyển thẳng sang màn hình nhận tài khoản/key (`uid|pass|2fa` sao chép 1 chạm & tải tệp `.txt`) hoặc tải tệp số.

---

## 2. Objective (Mục Tiêu & Phạm Vi)

Xây dựng hoàn chỉnh phân hệ **Public Storefront (`/store`)** cho khách vãng lai trong `@tuquet/admin-web`:

### 2.1. Mở rộng API Hỗ trợ `skipAuth` & Lưu trữ Đơn hàng Khách (`billing.ts` & `commerce.ts`)

- **`src/api/core/billing.ts`**:
  - Cập nhật `getActivePaymentGatewaysApi(options?: { skipAuth?: boolean })` để truyền `skipAuth: options?.skipAuth` xuống `supabaseRequest`.
- **`src/api/core/commerce.ts`**:
  - Bổ sung kiểu `SavedGuestOrderItem` và các hàm tiện ích quản lý lịch sử đơn hàng khách vãng lai trên trình duyệt:
    - `getSavedGuestOrders(): SavedGuestOrderItem[]`
    - `saveGuestOrderLocal(item: SavedGuestOrderItem): SavedGuestOrderItem[]`

### 2.2. Định tuyến `/store` & Từ điển Đa ngôn ngữ (`core.ts` & `page.json`)

- Đăng ký route `/store` (`name: 'PublicStorefront'`, `component: () => import('#/views/commerce/public-store/index.vue')`) trong `src/router/routes/core.ts`.
- Bổ sung nút liên kết mở nhanh `/store` trên thanh công cụ của `/commerce/store` để người dùng hoặc quản trị viên dễ dàng kiểm tra giao diện công khai.
- Bổ sung khóa đa ngôn ngữ `page.commerce.publicStore` và `page.commerce.publicStore_desc` vào `en-US/page.json` và `vi-VN/page.json`.

### 2.3. Giao Diện Cửa Hàng Công Khai (`/store` — `src/views/commerce/public-store/index.vue`)

1. **Header Thương Hiệu & Chuyển Đổi Chế Độ:**
   - Thanh điều hướng độc lập hiển thị thương hiệu **Tuquet Digital Store**, nút chuyển đổi giữa 2 chế độ: **Danh mục sản phẩm (`catalog`)** và **Tra cứu & Nhận hàng (`lookup`)**, kèm nút **Đăng nhập Workspace (`/auth/login` hoặc `/commerce/store`)**.
2. **Chế Độ 1 — Danh Mục Sản Phẩm Số Công Khai (`catalog`):**
   - Bộ lọc Danh mục (`getCommerceCategoriesApi({ skipAuth: true })`), lọc loại sản phẩm (`all`, `serial_stock`, `digital_file`) và ô tìm kiếm tức thì.
   - Lưới thẻ sản phẩm hiển thị các sản phẩm `visibility === 'public'`, chọn biến thể SKU, tồn kho khả dụng, giá niêm yết (`Xu` + quy đổi tham khảo sang `VND`/`USD` theo cổng mặc định).
   - Nếu sản phẩm thuộc loại `specter_resource` hoặc `wallet_credit`, hiển thị nhãn **Yêu cầu Workspace** và nút chuyển sang `/commerce/store`.
3. **Hộp Thoại Guest Checkout Đa Kênh (`GuestCheckoutDialog`):**
   - Nhập số lượng cần mua, địa chỉ Email nhận thông báo (`buyer_email`), và chọn cổng thanh toán (`bank_transfer` VietQR, `e_wallet` MoMo, `card_intl` Stripe, `crypto` USDT).
   - Khi nhấn **Tạo đơn & Lấy mã QR**:
     - Gọi `createCheckoutOrderApi({ buyer_email, items, payment_method, gateway_code }, { skipAuth: true })`.
     - Lưu ngay `(order_code, claim_token)` vào `localStorage` (`saveGuestOrderLocal`) và hiển thị cảnh báo nhắc khách hàng lưu lại `claim_token` (kèm nút sao chép 1 chạm).
     - Hiển thị mã QR VietQR, số tiền cần chuyển, nội dung `transfer_code` (`TQ...`) và tự động kiểm tra trạng thái đơn qua `getGuestOrderDeliveriesApi(order_code, claim_token)` mỗi 3 giây.
4. **Chế Độ 2 — Tra Cứu Đơn Hàng & Nhận Tài Nguyên (`lookup`):**
   - Cho phép nhập `Mã đơn hàng (ORD-...)` và `Mã nhận hàng bảo mật (CLM_...)` (tự động điền từ URL query `?order=...&token=...` hoặc chọn 1 chạm từ danh sách **Đơn hàng gần đây trên trình duyệt này**).
   - Hiển thị trạng thái đơn hàng (`completed`, `pending_payment`, `manual_review`, `failed`) và toàn bộ dữ liệu bàn giao:
     - `serial_stock`: Khung văn bản `font-mono` chứa các dòng `uid|pass|2fa` hoặc license key + nút **Sao chép tất cả** + nút **Tải tệp `.txt`**.
     - `digital_file`: Thông tin phiên bản và liên kết tải tệp.

---

## 3. Tech Stack

- **Frontend Application:** `@tuquet/admin-web` (Vue 3 `<script setup lang="ts">`, TypeScript, Vue Router 4, `vue-i18n`).
- **UI Components & Icons:** `@tuquet/vue-ui` (`Badge`, `Button`, `Dialog`, `DialogContent`, `DialogDescription`, `DialogHeader`, `DialogTitle`, `toast`), `@lucide/vue`.
- **Public Data Access Layer:** `src/api/core/billing.ts` (`skipAuth: true`) & `src/api/core/commerce.ts` (`skipAuth: true`).

---

## 4. Commands (Lệnh Thực Thi & Kiểm Định)

```bash
# 1. Chạy unit tests cho API Core và Router
pnpm exec vitest run apps/web-admin/src/api/core apps/web-admin/src/router

# 2. Kiểm tra kiểu dữ liệu TypeScript (Zero errors)
pnpm --filter @tuquet/admin-web run typecheck

# 3. Quét tĩnh mã nguồn oxlint
npx oxlint apps/web-admin/src/
```

---

## 5. Project Structure (Cấu Trúc Tệp Tác Động)

```text
admin/apps/web-admin/
├── docs/
│   └── specs/
│       ├── capability-map.md                        # Cập nhật trạng thái hoàn thành 18/18 modules
│       └── SPEC-public-storefront.md                # Bản đặc tả hiện tại
└── src/
    ├── api/core/
    │   ├── billing.ts                               # Bổ sung options?: { skipAuth?: boolean } cho getActivePaymentGatewaysApi
    │   ├── commerce.ts                              # Bổ sung getSavedGuestOrders & saveGuestOrderLocal
    │   └── __tests__/
    │       ├── billing.test.ts                      # Unit test cho getActivePaymentGatewaysApi({ skipAuth: true })
    │       └── commerce.test.ts                     # Unit test cho getSavedGuestOrders & saveGuestOrderLocal
    ├── locales/langs/
    │   ├── en-US/page.json                          # Bổ sung page.commerce.publicStore
    │   └── vi-VN/page.json                          # Bổ sung page.commerce.publicStore
    ├── router/routes/
    │   └── core.ts                                  # Đăng ký route công khai /store (PublicStorefront)
    └── views/commerce/
        ├── store/
        │   └── index.vue                            # Bổ sung nút mở nhanh Storefront công khai (/store)
        └── public-store/
            └── index.vue                            # Giao diện Storefront công khai, Guest Checkout & Tra cứu claim_token
```

---

## 6. Acceptance Criteria (Tiêu Chí Nghiệm Thu)

- [x] **AC1 — Truy cập Công khai Không Cần Đăng Nhập (`/store`):**
  - Route `/store` nằm trong `coreRoutes` (`coreRouteNames`), truy cập trực tiếp mà không bị chuyển hướng về `/auth/login`.
  - Toàn bộ lời gọi API trên `/store` truyền `skipAuth: true`.
- [x] **AC2 — Guest Checkout Đa Kênh & Bảo Toàn `claim_token`:**
  - Khách vãng lai có thể chọn SKU `public`, nhập email, chọn cổng thanh toán (VietQR / MoMo / Stripe / USDT), nhận mã QR + `transfer_code` (`TQ...`) và mã `claim_token` (`CLM_...`).
  - Mã `(order_code, claim_token)` được tự động lưu vào `localStorage` để tra cứu lại dễ dàng.
- [x] **AC3 — Tự Động Bàn Giao & Tra Cứu Đơn Hàng (`getGuestOrderDeliveriesApi`):**
  - Hệ thống tự động kiểm tra trạng thái đơn mỗi 3 giây và mở ngay dữ liệu bàn giao (`uid|pass|2fa` sao chép / tải `.txt`, hoặc link tải tệp) khi thanh toán hoàn tất.
  - Tab **Tra cứu & Nhận hàng** cho phép nhập `order_code` + `claim_token` hoặc chọn từ danh sách đơn đã lưu trên trình duyệt.
- [x] **AC4 — Chất Lượng Mã Nguồn:**
  - Vượt qua 100% `vitest`, `vue-tsc` (`0 errors`) và `oxlint` (`0 warnings/errors`).
