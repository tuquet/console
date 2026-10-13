# Kế Hoạch Triển Khai: Chuẩn Hóa Cấu Trúc Tree Thư Mục & Tinh Gọn Tài Liệu (Pre-Release Clean Slate)

## 1. Tổng Quan (Overview)

Ứng dụng `admin.tuquet.com` hiện đang trong giai đoạn tiền phát hành (pre-release), chưa từng phát hành phiên bản V1 ra người dùng cuối. Do đó, toàn bộ tài liệu kỹ thuật không cần và không nên chứa các nội dung so sánh chuyển đổi phiên bản ("V1 vs V2", "phiên bản tiền nhiệm", "nợ kỹ thuật cũ", "thay đổi so với V1", "tương thích ngược").

Mục tiêu của đợt tinh gọn này:
1. **Dọn dẹp và chuẩn hóa cấu trúc cây thư mục `docs/`:** Tách bạch tài liệu kiến trúc nền tảng (`docs/architecture/`), quyết định thiết kế (`docs/decisions/`), đặc tả từng route (`docs/routes/`) và đặc tả module (`docs/specs/`).
2. **Đặt lại tên file chuẩn mực (Naming Conventions):** Sử dụng kebab-case đồng nhất, loại bỏ snake_case (`styling_guide.md` &rarr; `styling-guide.md`), loại bỏ hậu tố version (`-v2.md`), đánh số ADR tuần tự không trùng lặp (`0001`, `0002`, `0003`).
3. **Viết lại tài liệu theo phong cách Kiến trúc Tuyệt đối (Definitive Architecture):** Trình bày trực diện giải pháp kỹ thuật, lý do thiết kế, chuẩn bảo mật và dòng dữ liệu mà không viện dẫn đến các template cũ.

---

## 2. Cấu Trúc Cây Thư Mục Mục Tiêu (Target Directory Tree)

```text
docs/
├── architecture/
│   ├── overview.md                       # Kiến trúc nền tảng (Thay thế routing_architecture.md, bỏ mọi so sánh V1/V2)
│   └── styling-guide.md                  # Hướng dẫn Design Tokens, CSS HSL Variables & Typography (Đổi từ styling_guide.md)
├── decisions/                            # Danh mục ADRs tuần tự không trùng lặp
│   ├── 0001-routing-architecture.md      # ADR-001: Định tuyến & PostgREST Multi-Schema (Đổi từ 0001-admin-routing-v2.md)
│   ├── 0002-typography-and-font-system.md# ADR-002: Tự host phông chữ WOFF2 & Typography SSOT
│   └── 0003-platform-superadmin.md      # ADR-003: Quản trị nền tảng & RLS Bypass (Đổi từ 0002-superadmin-platform-governance.md)
├── routes/                               # Sổ tay đặc tả chi tiết 22 routes
│   ├── README.md                         # Danh mục tổng thể 22 routes, plugin gate & dynamic authority
│   ├── auth.md                           # Cụm xác thực /auth/* và Desktop SSO loopback (Đổi từ auth-and-core.md)
│   ├── automation.md                     # /automation/* (workflows, runs, log console polling)
│   ├── dashboard.md                      # /dashboard/* (telemetry analytics & shortcuts)
│   ├── fleet.md                          # /fleet/* (devices, browsers, proxies)
│   ├── system.md                         # /system/* (plugins, plans, users, audit-logs, subscriptions, roles)
│   └── tenants.md                        # /tenants/* (danh sách & chi tiết workspace 4 tabs)
└── specs/                                # Bản đồ năng lực và đặc tả từng module
    ├── capability-map.md
    └── SPEC-*.md
```

---

## 3. Các Giai Đoạn Thực Hiện (Phases & Task Breakdown)

### Phase 1: Tạo Thư Mục Mới & Tinh Gọn Tài Liệu Kiến Trúc (`docs/architecture/`)
- **Task 1.1:** Tạo `docs/architecture/overview.md` từ `docs/routing_architecture.md`: Viết lại hoàn toàn nội dung theo phong cách kiến trúc chuẩn hóa (Multi-Tenant Isolation, Platform Superadmin, Multi-Schema PostgREST, Dynamic DB RBAC, 100% Real Telemetry, KISS/YAGNI, Mobile-First Dual View). Xóa bỏ toàn bộ phần "Vì sao cần V2", "Khác với V1", "Nợ kỹ thuật cũ".
- **Task 1.2:** Di chuyển `docs/styling_guide.md` &rarr; `docs/architecture/styling-guide.md`, chuẩn hóa tên file kebab-case.
- **Task 1.3:** Xóa file cũ `docs/routing_architecture.md` và `docs/styling_guide.md`.

### Phase 2: Chuẩn Hóa Chuỗi Bản Ghi Quyết Định Kiến Trúc (`docs/decisions/`)
- **Task 2.1:** Đổi tên và refactor `0001-admin-routing-v2.md` &rarr; `0001-routing-architecture.md`. Viết lại bối cảnh tập trung vào yêu cầu thực tế của Tuquet Cloud, loại bỏ cụm từ "phiên bản tiền nhiệm V1".
- **Task 2.2:** Chuẩn hóa tên `0002-typography-and-font-optimization.md` &rarr; `0002-typography-and-font-system.md`.
- **Task 2.3:** Đổi tên `0002-superadmin-platform-governance.md` &rarr; `0003-platform-superadmin.md` (giải quyết xung đột trùng số hiệu `0002`). Cập nhật mã ADR thành `ADR-003`.

### Phase 3: Tinh Gọn Danh Mục Tuyến Đường (`docs/routes/`)
- **Task 3.1:** Đổi tên `docs/routes/auth-and-core.md` &rarr; `docs/routes/auth.md`.
- **Task 3.2:** Refactor `docs/routes/dashboard.md`: Chuyển mục "Các tuyến tương thích ngược" thành "Tuyến chuyển hướng tiện ích (Navigation Shortcuts)".
- **Task 3.3:** Refactor `docs/routes/README.md`: Loại bỏ mã tài liệu V2, cập nhật các liên kết đến `auth.md`, `ADR-001`, `ADR-003` và `docs/architecture/overview.md`.

### Phase 4: Đồng Bộ Bản Đồ Năng Lực & File Gốc (`docs/specs/` & `README.md`)
- **Task 4.1:** Cập nhật `docs/specs/capability-map.md`: Loại bỏ chữ "V2" trên tiêu đề, cập nhật link tham chiếu tới `docs/architecture/overview.md`.
- **Task 4.2:** Cập nhật các file `docs/specs/SPEC-*.md` thay thế các đường dẫn cũ sang `docs/architecture/overview.md`.
- **Task 4.3:** Cập nhật `README.md` tại thư mục gốc với các đường dẫn mới và tiêu đề chuẩn hóa.

### Phase 5: Cổng Kiểm Định Toàn Diện (Zero-Waste Verification Gate)
- **Task 5.1:** Chạy `pnpm run lint` (`oxfmt` + `eslint` + `stylelint`) để đảm bảo format và lint đạt 0 lỗi.
- **Task 5.2:** Chạy `pnpm --filter @tuquet/admin-web run typecheck` xác nhận 0 lỗi TypeScript.
- **Task 5.3:** Chạy `pnpm exec vitest run` kiểm định toàn bộ unit tests.
- **Task 5.4:** Chạy `pnpm run build:admin` đóng gói bản build thành công.
