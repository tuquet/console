# Implementation Plan: Tuquet Admin Public Repo, CI Quality Gates & CD Desktop Release (`INITIATIVE-CICD-PUBLIC-RELEASE`)

## 1. Overview

Thiết lập toàn bộ hạ tầng tự động hóa CI/CD và chuẩn hóa Public Repository cho **Tuquet Admin Console** (`admin.tuquet.com`) trên nền tảng GitHub Actions:

- **Public Repository Readiness:** Dọn dẹp triệt để mã nguồn thừa từ upstream (`tuquet/admin`), rà soát bảo mật không để lộ secrets, bổ sung `SECURITY.md`, xác nhận `LICENSE` MIT, đính kèm badges CI & Download links trên `README.md`.
- **Continuous Integration (CI):** Pipeline kiểm định chất lượng đa tầng (`.github/workflows/ci.yml`) bắt buộc vượt qua 5 cổng kiểm tra: Lint & Format, Typecheck 38 packages, Vitest Suite (105 files), Headless Chrome Console Gate (22 routes), và Rust Backend `cargo check`.
- **Continuous Deployment (CD Release):** Pipeline phát hành tự động (`.github/workflows/release.yml`) kích hoạt khi push tag `v*.*.*` hoặc `workflow_dispatch`: Chạy trên runner `windows-latest`, đóng gói bộ cài đặt Windows NSIS `.exe` và `.msi`, ký số điện tử Ed25519, upload trực tiếp lên GitHub Releases cùng manifest cập nhật OTA `latest.json`.

---

## 2. Architecture & Design Decisions

1. **Phân tách Runner theo Năng Lực (Compute Optimization):**
   - **CI Pipeline:** Sử dụng `ubuntu-latest` để tận dụng tốc độ khởi động nhanh và chi phí compute minutes tối ưu. Cài đặt `dtolnay/rust-toolchain@stable` chỉ để chạy `cargo check` cho crate `src-tauri`.
   - **CD Desktop Release:** Sử dụng `windows-latest` vì đã cài sẵn WiX Toolset v3, NSIS `makensis` và Windows SDK, đảm bảo xuất xưởng file cài đặt Windows `.exe` và `.msi` 100% native.
2. **Quy ước Tag & Release Triggers:**
   - Kích hoạt phát hành tự động qua Git tag tuân thủ chuẩn SemVer: `v*.*.*` (ví dụ: `v0.1.0`, `v0.1.1`, `v1.0.0`).
   - Hỗ trợ thêm `workflow_dispatch` để có thể kích hoạt build thủ công trực tiếp từ giao diện GitHub Actions UI.
3. **Bảo mật Khóa Ký Số (OTA Signing):**
   - Public Key đã nhúng cố định trong `tauri.conf.json`.
   - Private Key được truyền qua biến môi trường bảo mật của GitHub Secrets: `TAURI_SIGNING_PRIVATE_KEY` và `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.
4. **Action Chuẩn Hóa:** Sử dụng GitHub Action chính thức `tauri-apps/tauri-action@v0` được phát triển bởi đội ngũ Tauri core team để đảm bảo tính tương thích và tự động hóa toàn diện từ bước build, sign đến publish release assets.

---

## 3. Implementation Order & Dependency Graph

```text
Phase 1: Public Repo Sanitization & OSS Compliance
   │ (Xóa ref cũ, tạo SECURITY.md, cập nhật LICENSE, README download links)
   ▼
Phase 2: Multi-Gate CI Pipeline Automation
   │ (Tối ưu ci.yml: 5 Quality Gates + ci-ok merge blocker trên ubuntu-latest)
   ▼
Phase 3: Automated CD Desktop Release on Tag
     (Tạo release.yml trên windows-latest: build NSIS exe, msi, sign & publish GitHub Releases)
```

---

## 4. Risks and Mitigations

| Rủi ro (Risk) | Mức độ | Biện pháp giảm thiểu (Mitigation) |
| --- | --- | --- |
| **Lộ Secrets hoặc Private Key** | Rất cao | Private key `tauri.key` đã được khóa chặt trong `.gitignore`. Tuyệt đối không commit file key; chỉ dùng GitHub Action Secrets. |
| **Thiếu Toolset đóng gói trên Windows Runner** | Thấp | Runner `windows-latest` của GitHub Actions đã tích hợp sẵn NSIS và WiX 3.14. Không cần download ngoài. |
| **Xung đột Permissions khi Publish Release** | Trung bình | Khai báo tường minh `permissions: contents: write` trong `release.yml` để GitHub Action có quyền tạo Release và upload binary. |
| **Thời gian CI quá dài** | Trung bình | Sử dụng pnpm cache (`@pnpm/action-setup`) và Rust sccache/cargo cache để rút ngắn thời gian build. |

---

## 5. Checkpoints & Verification Gates

- **Checkpoint 1 (Public Repo):** Quét toàn bộ repository không còn tham chiếu nào tới upstream cũ. File `SECURITY.md` và `README.md` hiển thị đầy đủ link tải `.exe`.
- **Checkpoint 2 (CI Pipeline):** File `.github/workflows/ci.yml` vượt qua kiểm tra cú pháp actionlint; các câu lệnh trong CI khớp 100% với 5 Quality Gates local.
- **Checkpoint 3 (CD Release):** File `.github/workflows/release.yml` sẵn sàng kích hoạt với tag `v*.*.*`, đầy đủ biến môi trường và bước build Windows desktop.
