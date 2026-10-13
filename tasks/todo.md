# Task List: Chuẩn Hóa Cấu Trúc Tree Thư Mục & Tinh Gọn Tài Liệu

- [x] Task 1: Kiến trúc nền tảng `docs/architecture/`
  - Acceptance:
    1. Tạo `docs/architecture/overview.md` từ `docs/routing_architecture.md`, lược bỏ 100% nội dung so sánh V1/V2, trình bày trực diện kiến trúc hệ thống.
    2. Chuyển `docs/styling_guide.md` &rarr; `docs/architecture/styling-guide.md` (kebab-case).
    3. Xóa các file cũ `docs/routing_architecture.md` và `docs/styling_guide.md`.
  - Verify: Các file mới tồn tại, không còn file cũ ở thư mục gốc `docs/`.
  - Files: `docs/architecture/overview.md`, `docs/architecture/styling-guide.md`, `docs/routing_architecture.md`, `docs/styling_guide.md`

- [x] Task 2: Chuẩn hóa chuỗi ADRs tuần tự `docs/decisions/`
  - Acceptance:
    1. Đổi tên `0001-admin-routing-v2.md` &rarr; `0001-routing-architecture.md`, loại bỏ ngôn từ so sánh version.
    2. Đổi tên `0002-typography-and-font-optimization.md` &rarr; `0002-typography-and-font-system.md`.
    3. Đổi tên `0002-superadmin-platform-governance.md` &rarr; `0003-platform-superadmin.md`, cập nhật mã ADR-003, loại bỏ ngôn từ so sánh ERP cũ.
  - Verify: Thư mục `docs/decisions/` có đúng 3 file tuần tự: `0001`, `0002`, `0003`, không còn file trùng số hiệu hoặc chứa hậu tố `-v2`.
  - Files: `docs/decisions/0001-routing-architecture.md`, `docs/decisions/0002-typography-and-font-system.md`, `docs/decisions/0003-platform-superadmin.md`

- [x] Task 3: Tinh gọn danh mục routes `docs/routes/`
  - Acceptance:
    1. Đổi tên `docs/routes/auth-and-core.md` &rarr; `docs/routes/auth.md`.
    2. Sửa `docs/routes/dashboard.md`: Thay "Các tuyến tương thích ngược" thành "Tuyến chuyển hướng tiện ích (Navigation Shortcuts)".
    3. Sửa `docs/routes/README.md`: Loại bỏ các mã V2, cập nhật links tới `auth.md`, `ADR-001`, `ADR-003`, `docs/architecture/overview.md`.
  - Verify: Không còn chữ "V2" hay "tương thích ngược" trong `docs/routes/`, link trỏ tới đúng file tồn tại.
  - Files: `docs/routes/auth.md`, `docs/routes/dashboard.md`, `docs/routes/README.md`

- [x] Task 4: Đồng bộ `docs/specs/` và `README.md`
  - Acceptance:
    1. Sửa `docs/specs/capability-map.md`: Bỏ "Routing V2", cập nhật liên kết tới `docs/architecture/overview.md`.
    2. Cập nhật các file `docs/specs/SPEC-*.md` trỏ về `docs/architecture/overview.md` và `docs/decisions/0001-routing-architecture.md`.
    3. Cập nhật `README.md` với cây thư mục tài liệu mới.
  - Verify: Không còn liên kết hỏng hay tham chiếu cũ trong code hoặc tài liệu.
  - Files: `docs/specs/capability-map.md`, `docs/specs/SPEC-*.md`, `README.md`

- [ ] Task 5: Cổng kiểm định chất lượng toàn workspace (Quality Gate)
  - Acceptance: Toàn bộ linting, typecheck, unit tests và build đều pass 100% không phát sinh lỗi.
  - Verify:
    1. `pnpm run lint` &rarr; 0 errors
    2. `pnpm --filter @tuquet/admin-web run typecheck` &rarr; 0 errors
    3. `pnpm exec vitest run` &rarr; 657/657 tests pass
    4. `pnpm run build:admin` &rarr; Vite build thành công
  - Files: Toàn workspace
