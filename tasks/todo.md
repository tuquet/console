# Task List: Admin Public Repo, CI Quality Gates & CD Desktop Release (`INITIATIVE-CICD-PUBLIC-RELEASE`)

## Phase 1: Public Repo Sanitization & OSS Compliance

### Task 1.1: Quét & Loại Bỏ Triệt Để Các Tham Chiếu Upstream Cũ (`tuquet/admin`)

**Description:** Rà soát toàn bộ thư mục `.github/` (các workflows, issue templates, dependabot, semantic, release-drafter) và thay thế toàn bộ chuỗi repo cũ `tuquet/admin` thành định danh chính thức `tuquet/admin`.  
**Acceptance criteria:**

- [x] Không còn bất kỳ file nào trong `.github/` chứa chuỗi `tuquet/admin`.
- [x] File `.github/workflows/release-tag.yml`, `dependabot.yml`, `config.yml`, `ISSUE_TEMPLATE/*` đều cập nhật chính xác.  
      **Verification:**
- [x] Command check: `git grep "tuquet/admin" .github/` trả về kết quả rỗng (exit code 1).  
      **Dependencies:** None  
      **Files touched:**
- `.github/CODEOWNERS`
- `.github/config.yml`
- `.github/ISSUE_TEMPLATE/bug-report.yml`
- `.github/ISSUE_TEMPLATE/feature-request.yml`
- `.github/workflows/*.yml` (all 11 workflow files)

---

### Task 1.2: Thiết Lập `SECURITY.md`, Xác Nhận `LICENSE` & Cập Nhật `README.md` với Download Section

**Description:** Tạo file `SECURITY.md` định rõ quy trình tiếp nhận và xử lý báo cáo lỗ hổng an ninh mạng cho Tuquet. Kiểm tra file `LICENSE` (MIT). Cập nhật `README.md` bổ sung badges trạng thái CI, badges phiên bản release và bảng hướng dẫn tải nhanh `Tuquet-Admin-Setup.exe` trực tiếp từ GitHub Releases.  
**Acceptance criteria:**

- [x] File `SECURITY.md` được khởi tạo chuẩn OSS tại thư mục gốc.
- [x] `README.md` hiển thị rõ liên kết tải bộ cài đặt Windows `.exe` mới nhất (`https://github.com/tuquet/admin/releases/latest/download/...`).  
      **Verification:**
- [x] Manual review: Đọc nội dung `SECURITY.md` và `README.md`.  
      **Dependencies:** Task 1.1  
      **Files touched:**
- `SECURITY.md`
- `README.md`
- `LICENSE`

---

### Checkpoint 1: Public Repo Sanitization Verification

- [x] Quét toàn bộ repository xác nhận sạch sẽ, không có secret và không còn thông tin repo cũ.

---

## Phase 2: Multi-Gate CI Pipeline Automation

### Task 2.1: Hiện Đại Hóa CI Workflow (`.github/workflows/ci.yml`)

**Description:** Nâng cấp `.github/workflows/ci.yml` trên nền `ubuntu-latest`. Tích hợp đầy đủ 5 Quality Gates tương ứng với các cổng kiểm thử chuẩn của dự án:

1. `typecheck`: `pnpm run check:type`
2. `lint`: `pnpm run lint`
3. `unit-tests`: `pnpm run test:unit`
4. `console-gate`: `pnpm run check:console` (chạy headless Chromium trên runner)
5. `tauri-check`: Cài đặt Rust toolchain và chạy `pnpm run tauri:check` (`cargo check` trong `src-tauri`)  
   Khóa merge an toàn qua job `ci-ok`.  
   **Acceptance criteria:**

- [x] File `ci.yml` có đầy đủ 5 jobs kiểm tra độc lập và job `ci-ok` tổng hợp.
- [x] Pipeline hỗ trợ caching pnpm dependencies và cargo target để tối ưu thời gian chạy.  
      **Verification:**
- [x] Syntax check: Kiểm tra cú pháp YAML của `.github/workflows/ci.yml`.  
      **Dependencies:** Task 1.2  
      **Files touched:**
- `.github/workflows/ci.yml`

---

### Checkpoint 2: CI Pipeline Verification

- [x] Toàn bộ cú pháp và cấu trúc jobs của CI Workflow hợp lệ và sẵn sàng kiểm soát chất lượng PR.

---

## Phase 3: Automated CD Desktop Release on Tag

### Task 3.1: Xây Dựng Workflow Phát Hành Desktop Tự Động (`.github/workflows/release.yml`)

**Description:** Khởi tạo workflow `.github/workflows/release.yml` kích hoạt khi push tag `v*.*.*` hoặc `workflow_dispatch`. Sử dụng runner `windows-latest` kết hợp action chính thức `tauri-apps/tauri-action@v0`:

- Cài đặt Node 20/22, pnpm 10+, Rust stable MSVC toolchain.
- Build web dist: `pnpm run build:admin`.
- Biên dịch và đóng gói bộ cài Windows NSIS `.exe` và MSI installer.
- Ký số OTA tự động qua `${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}`.
- Tạo GitHub Release tương ứng với tag và tự động đính kèm tất cả installer assets (`.exe`, `.msi`, `latest.json`, `*.sig`).  
  **Acceptance criteria:**
- [x] File `.github/workflows/release.yml` hoàn chỉnh cú pháp, cấu hình đúng runner `windows-latest`.
- [x] Khai báo quyền `permissions: contents: write` để tải artifacts lên GitHub Releases.
- [x] Đính kèm file `latest.json` phục vụ tính năng tự động cập nhật OTA của ứng dụng đang chạy.  
      **Verification:**
- [x] Syntax check: Kiểm tra tính hợp lệ của workflow file `release.yml`.  
      **Dependencies:** Task 2.1  
      **Files touched:**
- `.github/workflows/release.yml`

---

### Task 3.2: Tinh Chỉnh & Đồng Bộ Hóa Cấu Hình Đóng Gói Tauri Bundler

**Description:** Kiểm tra `apps/web-admin/src-tauri/tauri.conf.json` phần `bundle.targets`: đảm bảo hỗ trợ đầy đủ `["nsis", "msi"]` khi build trên Windows runner. Đồng thời chuẩn hóa tên file xuất xưởng `productName: "Admin"` để người dùng tải về file có tên thân thiện: `Tuquet-Admin_<version>_x64-setup.exe`.  
**Acceptance criteria:**

- [x] Cấu hình bundle trong `tauri.conf.json` tương thích hoàn hảo với Windows CI/CD runner.
- [x] Format JSON khớp schema `https://schema.tauri.app/config/2`.  
      **Verification:**
- [x] Test build: `pnpm run tauri:check` thành công không lỗi.  
      **Dependencies:** Task 3.1  
      **Files touched:**
- `apps/web-admin/src-tauri/tauri.conf.json`

---

### Checkpoint 3: Complete & Ready for Public Release

- [x] Quy trình phát hành tự động khi push tag `v*.*.*` sẵn sàng xuất xưởng bản cài đặt Windows `.exe`.
- [x] Tài liệu hướng dẫn cấu hình GitHub Secrets (`TAURI_SIGNING_PRIVATE_KEY`) được ghi nhận chi tiết.
