# Spec: Cổng Thương Mại Điện Tử Nội Bộ, Ví Xu & Quản Trị Cổng Thanh Toán (Module `admin-commerce-portal`)

> **Mã đặc tả:** `SPEC-admin-commerce-portal`  
> **Module id:** `admin-commerce-portal` (xem [`capability-map.md`](capability-map.md))  
> **Kiến trúc nguồn:** [`SPEC-payment-gateway.md`](SPEC-payment-gateway.md), [`SPEC-digital-commerce.md`](SPEC-digital-commerce.md), [`ADR-004`](../decisions/0004-vxe-grid-form-and-i18n-terminology.md), [`skills/rules/TYPOGRAPHY.md`](../../../../skills/rules/TYPOGRAPHY.md)  
> **Trạng thái:** **ĐÃ HOÀN THÀNH (ACCEPTED & IMPLEMENTED)**

---

## 1. Giả Định & Quyết Định Thiết Kế (Resolved Decisions)

1. **Hợp nhất điều hướng dưới phân hệ `/commerce` (`src/router/routes/modules/commerce.ts`):**
   - Tương tự nguyên lý hợp nhất `/automation` trong `ADR-004`, toàn bộ trải nghiệm Mua sắm sản phẩm số, Quản lý đơn hàng, Ví Xu trả trước và Quản trị cửa hàng/cổng thanh toán được gom vào một menu cấp 1 duy nhất `/commerce` (`icon: 'lucide:shopping-bag'`, `order: 25`):
     - `/commerce/store` (`CommerceStore`, `authority: ['superadmin', 'commerce:read']`, `plugin: 'commerce'`): Cửa hàng tài nguyên số (mua tài khoản/key `serial_stock`, tài nguyên `specter_resource`, tệp `digital_file`, gói nạp `wallet_credit`).
     - `/commerce/orders` (`CommerceOrders`, `authority: ['superadmin', 'commerce:read']`, `plugin: 'commerce'`): Lịch sử đơn hàng của Tenant & Hộp thoại nhận bàn giao tài nguyên (`uid|pass|2fa`, proxy, workflow, link tải).
     - `/commerce/wallet` (`CommerceWallet`, `authority: ['superadmin', 'subscriptions:read', 'commerce:read']`, `plugin: 'subscriptions'`): Ví trả trước đơn vị `Xu` (`BIGINT`), nạp Xu đa kênh (VietQR, MoMo, Stripe, Crypto USDT) và sổ cái biến động số dư (`wallet_transactions`).
     - `/commerce/admin` (`CommerceAdmin`, `authority: ['superadmin', 'commerce:manage']`, `plugin: 'commerce'`): Trung tâm quản trị dành riêng cho Platform Superadmin gồm 4 phân khu: (1) Sản phẩm & SKU + Nạp kho hàng loạt (`import_stock_batch`), (2) Đơn hàng toàn hệ thống & Giao hàng lại (`fulfill_order`), (3) Duyệt lệnh thanh toán `manual_review` (`settle_payment_intent` với `_force_approve = true`), và (4) Cấu hình cổng thanh toán (`payment_gateways`).
2. **Đơn vị tiền tệ chuẩn (`Xu` — Integer Credits) & Đa kênh thanh toán:**
   - Mọi giá bán SKU, số dư ví và tổng đơn hàng hiển thị theo đơn vị **`Xu`** (số nguyên `BIGINT` định dạng `.toLocaleString('en-US')`).
   - Khi thanh toán bằng **Ví Xu (`internal_wallet`)**, hệ thống trừ Xu và kích hoạt Auto-Fulfillment tức thì trong cùng 1 giao dịch RPC (`create_checkout_order`), mở ngay hộp thoại bàn giao tài nguyên cho người mua.
   - Khi thanh toán hoặc nạp Xu qua kênh ngoại vi (`bank_transfer` VietQR/IBFT, `e_wallet` MoMo/ZaloPay, `card_intl` Stripe, `crypto` USDT), hệ thống mở hộp thoại **Multi-Channel Payment Intent** hiển thị mã QR động (`qr_image_url`), nội dung chuyển khoản bắt buộc (`transfer_code` dạng `TQ...`) kèm bộ輪询 (polling 3 giây) tự động cập nhật trạng thái khi Webhook khớp lệnh.
3. **Tuân thủ tuyệt đối `ADR-004` (`useVbenVxeGrid`) & `TYPOGRAPHY.md`:**
   - Tất cả bảng dữ liệu (`Orders`, `Wallet Transactions`, `Admin Products`, `Admin All Orders`, `Admin Manual Review`, `Admin Payment Gateways`) đều sử dụng `useVbenVxeGrid` từ `#/adapter/vxe-table` kèm `formOptions` lọc tức thì và thanh chỉ số KPI (`Stats Bar`).
   - Không dùng các lớp pixel tùy biến (`text-[13px]`, `text-[15px]`); chỉ dùng thang chữ 7 bậc chuẩn (`text-2xs` đến `text-2xl`) và Sentence case tiếng Việt.

---

## 2. Objective (Mục Tiêu & Phạm Vi)

Xây dựng hoàn chỉnh phân hệ giao diện Web **`admin-commerce-portal`** trong `@tuquet/admin-web` kết nối trực tiếp với tầng API `src/api/core/billing.ts` và `src/api/core/commerce.ts`:

### 2.1. Mở rộng API Quản trị Cổng Thanh Toán (`src/api/core/billing.ts`)

- Bổ sung hàm `upsertPaymentGatewayAdminApi(payload)` cho phép Platform Admin cập nhật cấu hình cổng thanh toán (`is_active`, `rate_per_credit`, `public_config`, `sort_order`, `name`) qua PostgREST `POST /rest/v1/payment_gateways?on_conflict=id` (`schema: 'billing'`).
- Bổ sung hàm lọc thuần khiết (pure filter helpers) phục vụ `useVbenVxeGrid` và kiểm thử đơn vị:
  - `filterWalletTransactions(items, filters)` trong `billing.ts`.
  - `filterCommerceProducts(items, filters)` và `filterCommerceOrders(items, filters)` trong `commerce.ts`.

### 2.2. Cửa Hàng Tài Nguyên Số (`/commerce/store` — `src/views/commerce/store/index.vue`)

- **Thanh chọn Workspace & Số dư Ví Xu:** Cho phép chọn Workspace đang thao tác (`getTenantsApi`, đồng bộ `getActiveTenantId` / `setActiveTenantId`), hiển thị số dư `Xu` thời gian thực (`getTenantWalletApi`) và nút chuyển nhanh sang nạp Xu.
- **Bộ lọc Danh mục & Loại sản phẩm:** Lọc theo danh mục (`getCommerceCategoriesApi`), phân loại (`serial_stock`, `specter_resource`, `digital_file`, `wallet_credit`) và từ khóa tìm kiếm.
- **Thẻ Sản Phẩm & Chọn Biến Thể (SKU):** Hiển thị tên sản phẩm, mô tả ngắn, nhãn loại sản phẩm, danh sách biến thể SKU (`variants`), tồn kho khả dụng (`available_stock` hoặc `Unlimited`), đơn giá `Xu` (`price_credits` + `compare_at_credits`).
- **Hộp Thoại Thanh Toán Đa Kênh (`CheckoutDialog`):**
  - Chọn biến thể SKU, số lượng (`min_qty`..`max_qty`), và phương thức thanh toán (`internal_wallet` trừ Ví Xu tức thì hoặc chọn cổng ngoại vi từ `getActivePaymentGatewaysApi()`).
  - Nếu chọn `internal_wallet`: Gọi `createCheckoutOrderApi`, hiển thị ngay kết quả giao hàng (`DeliveriesDialog`).
  - Nếu chọn cổng ngoại vi (`bank_transfer`, `e_wallet`, `card_intl`, `crypto`): Hiển thị mã QR VietQR, thông tin ngân hàng/ví, mã `transfer_code` (`TQ...`) kèm nút sao chép 1 chạm và tự động kiểm tra trạng thái mỗi 3 giây (`getPaymentIntentStatusApi`).

### 2.3. Lịch Sử Đơn Hàng & Nhận Tài Nguyên (`/commerce/orders` — `src/views/commerce/orders/index.vue`)

- **Thanh thống kê KPI:** Tổng đơn hàng, Đơn hoàn tất (`completed`), Tổng Xu đã thanh toán.
- **Bảng `useVbenVxeGrid<CommerceOrderRecord>`:** Lọc theo trạng thái đơn hàng (`all`, `completed`, `pending_payment`, `manual_review`, `failed`) và tìm kiếm theo mã đơn (`order_code`), phương thức thanh toán.
- **Hộp Thoại Bàn Giao Tài Nguyên (`OrderDeliveriesDialog`):**
  - Truy vấn `getOrderDeliveriesApi(order.id)`.
  - Hiển thị dữ liệu bàn giao theo từng `delivery_type`:
    - `serial_stock`: Hộp văn bản `font-mono` chứa danh sách tài khoản/key (`secret_line`), nút **Sao chép tất cả** và **Tải tệp `.txt`**.
    - `specter_resource`: Hiển thị chi tiết tài nguyên đã cấp phát tự động vào hệ thống (`proxy_pool` host:port, `automa_workflow` ID, hoặc `plan_upgrade` gói cước).
    - `digital_file`: Hiển thị tên tệp, dung lượng/phiên bản, số lượt tải (`download_count / max_downloads`) và nút tải xuống.
    - `wallet_credit`: Hiển thị số Xu và Bonus Xu đã cộng vào Ví Tenant.

### 2.4. Ví Xu & Sổ Cái Giao Dịch (`/commerce/wallet` — `src/views/commerce/wallet/index.vue`)

- **3 Thẻ KPI Ví Xu:** Số dư khả dụng (`balance_credits` Xu), Tổng Xu đã nạp (`total_topped_up_credits` Xu), Tổng Xu đã chi tiêu (`total_spent_credits` Xu).
- **Hộp Thoại Nạp Xu Đa Kênh (`TopupWalletDialog`):**
  - Cho phép chọn mốc Xu nạp nhanh (`50,000 Xu`, `100,000 Xu`, `500,000 Xu`, `1,000,000 Xu` hoặc nhập số Xu tùy chỉnh) và chọn cổng thanh toán đang hoạt động (`getActivePaymentGatewaysApi`).
  - Tự động quy đổi số tiền thanh toán dự kiến theo tỷ giá `rate_per_credit` của cổng đã chọn.
  - Gọi `createPaymentIntentApi({ target_type: 'wallet_topup' })`, hiển thị mã VietQR / thông tin chuyển khoản kèm mã `transfer_code` và tự động làm mới số dư Ví khi lệnh chuyển sang `succeeded`.
- **Bảng Sổ Cái Biến Động Số Dư (`useVbenVxeGrid<WalletTransactionItem>`):**
  - Truy vấn `getWalletTransactionsApi(tenantId)`, lọc theo loại giao dịch (`topup`, `purchase`, `bonus`, `refund`, `admin_adjustment`) và tìm kiếm mô tả/mã tham chiếu.

### 2.5. Quản Trị Cửa Hàng & Cổng Thanh Toán (`/commerce/admin` — `src/views/commerce/admin/index.vue`)

Dành riêng cho `superadmin` / `commerce:manage`, gồm 4 chế độ (Mode Tabs) dùng `useVbenVxeGrid`:

1. **Tab 1 — Sản phẩm & Kho hàng (`products`):**
   - Bảng `useVbenVxeGrid<CommerceProductItem>` hiển thị sản phẩm, loại sản phẩm, chế độ hiển thị (`public`, `tenant_only`, `hidden`), số lượng SKU và tổng tồn kho.
   - Hộp thoại **Thêm/Sửa Sản phẩm & Biến thể SKU** (`upsertCommerceProductAdminApi`, `upsertProductVariantAdminApi`).
   - Hộp thoại **Nạp kho hàng loạt (`Bulk Stock Import`)**: Chọn biến thể SKU (`serialized`), nhập mã lô (`batch_code`) và dán danh sách nhiều dòng (`uid|pass|2fa`, license key, hoặc `host:port:user:pass`), gọi `importStockBatchAdminApi` chống trùng lặp `SHA-256`.
2. **Tab 2 — Đơn hàng toàn hệ thống (`orders`):**
   - Bảng `useVbenVxeGrid<CommerceOrderRecord>` (`getAllOrdersAdminApi`) giám sát toàn bộ đơn hàng của mọi Tenant và khách vãng lai, hỗ trợ xem chi tiết bàn giao và nút **Giao hàng lại (`Retry Fulfillment`)** qua `fulfillOrderAdminApi(order.id)`.
3. **Tab 3 — Duyệt thanh toán thủ công (`manual_review`):**
   - Bảng `useVbenVxeGrid<PaymentIntentItem>` (`getManualReviewIntentsAdminApi`) hiển thị các lệnh nạp/mua hàng bị giữ lại do chuyển khoản quá hạn (> 30 phút) hoặc lệch số tiền, kèm nút **Duyệt lệnh (`Force Approve`)** gọi `approveManualPaymentIntentAdminApi(intent.id, note)`.
4. **Tab 4 — Cấu hình cổng thanh toán (`gateways`):**
   - Bảng `useVbenVxeGrid<PaymentGatewayItem>` (`getAllPaymentGatewaysAdminApi`) cho phép bật/tắt cổng (`is_active`), chỉnh sửa tỷ giá `rate_per_credit` và cấu hình công khai (`public_config`: ngân hàng, số tài khoản, chủ tài khoản, địa chỉ ví USDT) qua `upsertPaymentGatewayAdminApi`.

---

## 3. Tech Stack

- **Frontend Application:** `@tuquet/admin-web` (Vue 3 `<script setup lang="ts">`, TypeScript, Vue Router 4, `vue-i18n`).
- **Table & Form Engine:** `useVbenVxeGrid` từ `#/adapter/vxe-table` (`vxe-table`).
- **UI Components & Icons:** `@tuquet/vue-ui` (`Badge`, `Button`, `Dialog`, `DialogContent`, `DialogDescription`, `DialogHeader`, `DialogTitle`, `toast`), `@lucide/vue`.
- **Data Access Layer:** `src/api/core/billing.ts`, `src/api/core/commerce.ts`, `src/api/core/tenant.ts`.

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
│       ├── capability-map.md                        # Cập nhật trạng thái SPEC-admin-commerce-portal.md
│       └── SPEC-admin-commerce-portal.md            # Bản đặc tả hiện tại
└── src/
    ├── api/core/
    │   ├── billing.ts                               # Bổ sung upsertPaymentGatewayAdminApi & filterWalletTransactions
    │   ├── commerce.ts                              # Bổ sung filterCommerceProducts & filterCommerceOrders
    │   └── __tests__/
    │       ├── billing.test.ts                      # Unit tests cho upsertPaymentGatewayAdminApi & filterWalletTransactions
    │       └── commerce.test.ts                     # Unit tests cho filterCommerceProducts & filterCommerceOrders
    ├── locales/langs/
    │   ├── en-US/page.json                          # Từ điển page.commerce.* (en-US)
    │   └── vi-VN/page.json                          # Từ điển page.commerce.* (vi-VN)
    ├── router/
    │   ├── routes/modules/
    │   │   └── commerce.ts                          # Định tuyến /commerce (store, orders, wallet, admin)
    │   └── __tests__/
    │       └── plugin-gate.test.ts                  # Kiểm thử phân tách plugin commerce & subscriptions
    └── views/commerce/
        ├── store/
        │   └── index.vue                            # Cửa hàng tài nguyên số & Hộp thoại thanh toán đa kênh
        ├── orders/
        │   └── index.vue                            # Lịch sử đơn hàng & Hộp thoại nhận tài nguyên (Copy / Export .txt)
        ├── wallet/
        │   └── index.vue                            # Ví Xu Tenant, Nạp Xu VietQR/MoMo/Stripe/USDT & Sổ cái giao dịch
        └── admin/
            └── index.vue                            # Quản trị sản phẩm, Nạp kho hàng loạt, Duyệt manual_review & Cổng thanh toán
```

---

## 6. Acceptance Criteria (Tiêu Chí Nghiệm Thu)

- [x] **AC1 — Định tuyến & Phân quyền theo Plugin (`commerce.ts`):**
  - Menu `/commerce` gồm 4 route con: `/commerce/store`, `/commerce/orders`, `/commerce/wallet`, và `/commerce/admin`.
  - `filterRoutesByPlugins` lọc chính xác các route thuộc plugin `commerce` và `subscriptions`.
- [x] **AC2 — Trải nghiệm Mua Sắm & Bàn Giao Tài Nguyên (`/commerce/store` & `/commerce/orders`):**
  - Người dùng Tenant có thể duyệt danh mục sản phẩm số, chọn biến thể SKU, mua tức thì bằng Ví Xu (`internal_wallet`) hoặc tạo lệnh thanh toán qua cổng ngoại vi (VietQR / MoMo / Stripe / Crypto) kèm polling trạng thái tự động.
  - Đơn hàng hoàn tất cho phép mở hộp thoại xem danh sách tài nguyên đã giao (`serial_stock` sao chép 1 chạm / tải file `.txt`, `specter_resource`, `digital_file`, `wallet_credit`).
- [x] **AC3 — Ví Xu & Sổ Cái Giao Dịch (`/commerce/wallet`):**
  - Hiển thị chính xác số dư `Xu`, tổng nạp, tổng chi tiêu của Workspace đang chọn; hỗ trợ tạo lệnh nạp Xu qua cổng thanh toán và tra cứu lịch sử biến động số dư bằng `useVbenVxeGrid`.
- [x] **AC4 — Quản Trị Cửa Hàng, Kho Hàng Loạt & Duyệt Lệnh (`/commerce/admin`):**
  - Platform Superadmin có thể tạo/sửa sản phẩm & SKU, nạp kho hàng loạt (`importStockBatchAdminApi`) với báo cáo số dòng thêm mới / trùng lặp, kích hoạt giao hàng lại (`fulfillOrderAdminApi`), duyệt lệnh `manual_review` (`approveManualPaymentIntentAdminApi`) và cập nhật cấu hình cổng thanh toán (`upsertPaymentGatewayAdminApi`).
- [x] **AC5 — Chất Lượng Mã Nguồn & Đa Ngôn Ngữ:**
  - Từ điển `en-US/page.json` và `vi-VN/page.json` đối xứng 100%, tuân thủ `TYPOGRAPHY.md` và vượt qua `vitest`, `vue-tsc`, `oxlint` với 0 lỗi.
