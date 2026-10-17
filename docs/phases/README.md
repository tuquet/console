# Tuquet Ecosystem — Phase Documentation Index

> **Thư viện Tài liệu 5 Giai đoạn Chiến lược (Strategic Phase Documents)**  
> Dành cho Ban Lãnh đạo, Nhà Đầu tư, Đối tác Chiến lược và Kỹ sư Trưởng (Stakeholders, Sponsors & Leads).

---

## 🏛️ Tổng Quan Kiến Trúc 5 Giai Đoạn (Phase Map)

Các tài liệu dưới đây phân tích chi tiết mục tiêu kinh doanh, gói sản phẩm bàn giao, tiêu chuẩn kỹ thuật và chỉ số cam kết (Target KPIs / SLAs) cho từng giai đoạn của dự án Tuquet:

```text
┌────────────────────────────────────────────────────────────────────────┐
│  PHASE 01: ENTERPRISE IAM & MULTI-TENANCY                             │
│  📁 docs/phases/phase-01-enterprise-iam-multitenancy/README.md         │
│  • Định danh doanh nghiệp • Enterprise SSO • Cô lập dữ liệu 100%       │
└────────────────────────────────────┬───────────────────────────────────┘
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│  PHASE 02: OMNICHANNEL & CROSS-BORDER PAYMENT GATEWAY                  │
│  📁 docs/phases/phase-02-omnichannel-payment-gateway/README.md         │
│  • 2A: VietQR & USDT tức thời • 2B: Thẻ QT 3D-Secure & Chống gian lận │
└────────────────────────────────────┬───────────────────────────────────┘
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│  PHASE 03: DIGITAL COMMERCE & INSTANT FULFILLMENT                      │
│  📁 docs/phases/phase-03-digital-commerce-fulfillment/README.md        │
│  • Chợ số • Live Health Check kiểm tra trước khi giao • Bàn giao <=1s  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│  PHASE 04: CLOUD AUTOMATION & FLEET COMMAND                            │
│  📁 docs/phases/phase-04-cloud-automation-fleet/README.md              │
│  • SaaS kịch bản trên shop • Đo cước động (Metered Billing) • Zero-Zombie│
└────────────────────────────────────┬───────────────────────────────────┘
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│  PHASE 05: WHITE-LABEL FRANCHISE & OPEN MARKETPLACE                    │
│  📁 docs/phases/phase-05-white-label-marketplace/README.md             │
│  • Nhượng quyền đại lý • Hộp cát kiểm duyệt mã độc • Sàn chia sẻ mở   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📑 Danh Sách Tài Liệu Từng Phase

| Thư mục Phase | Tên Giai Đoạn Trọng Tâm | Thời Gian Dự Kiến | Trọng Tâm Nghiệm Thu |
| :--- | :--- | :---: | :--- |
| [**`Phase 01`**](./phase-01-enterprise-iam-multitenancy/README.md) | **Enterprise IAM & Multi-Tenancy** | 18/10 – 08/11/2026 | Cô lập dữ liệu đa tổ chức 100%, Enterprise SSO (Google/MS), phân quyền vai trò hạt mịn, vá SSRF & Open Redirect. |
| [**`Phase 02`**](./phase-02-omnichannel-payment-gateway/README.md) | **Omnichannel Payment Gateway** | 09/11 – 30/11/2026 | 2 Phân kỳ: (2A) VietQR/VA & USDT tức thời; (2B) Thẻ QT 3D-Secure có chống gian lận & Ví VN; Sổ cái kép. |
| [**`Phase 03`**](./phase-03-digital-commerce-fulfillment/README.md) | **Digital Commerce & Fulfillment** | 01/12 – 22/12/2026 | Chợ tài nguyên số, Pre-delivery Live Health Check loại bỏ hàng die, khóa giữ hàng, xuất hàng tự động $\le 1\text{s}$. |
| [**`Phase 04`**](./phase-04-cloud-automation-fleet/README.md) | **Cloud Automation & Fleet** | 05/01 – 15/02/2027 | Đóng gói workflow/bot bán trên Shop, đo cước tài nguyên động (Metered Billing), kết nối WebSocket native BFF daemon, Zero-Zombie. |
| [**`Phase 05`**](./phase-05-white-label-marketplace/README.md) | **White-Label & Marketplace** | 01/03 – 30/04/2027 | Nhượng quyền đối tác gắn tên miền/logo riêng, hộp cát bảo mật kiểm duyệt kịch bản cộng đồng, Public Developer API. |

---

## 🔗 Liên Kết Quản Trị Hệ Thống
- **Bảng Tiến độ Chiến lược Tổng thể:** [`TIMELINE.md`](../../TIMELINE.md)
- **Chiến lược Sản phẩm Cấp cao:** [`ROADMAP.md`](../../ROADMAP.md)
- **Đặc tả Kỹ thuật Chi tiết:** [`apps/web-admin/docs/specs/`](../../apps/web-admin/docs/specs/)
