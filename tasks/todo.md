# Task List: Automated Release & Distribution Pipeline

- [x] Task 1: Generate & configure Deploy Key for `tuquet/operon`
  - Acceptance: Ed25519 deploy key registered on `tuquet/operon` (Read-only); private key stored in `tuquet/console` repository secret `OPERON_DEPLOY_KEY`.
  - Verify: Run `gh repo deploy-key list -R tuquet/operon` and `gh secret list -R tuquet/console`.
  - Files: GitHub Secrets & Deploy Keys configured.

- [x] Task 2: Generate Minisign key pair & configure Tauri In-App Updater
  - Acceptance: Fresh Minisign key pair generated. Public key set in `apps/workstation/src-tauri/tauri.conf.json`, private key stored in `tuquet/console` secret `TAURI_SIGNING_PRIVATE_KEY`. Endpoint updated to `https://github.com/tuquet/console/releases/latest/download/latest.json`.
  - Verify: Check `tauri.conf.json` updater config and `gh secret list -R tuquet/console`.
  - Files: `apps/workstation/src-tauri/tauri.conf.json`, `apps/workstation/src/composables/use-app-updater.ts`.

- [x] Task 3: Create portable packager helper script
  - Acceptance: Script `scripts/package-portable.mjs` created to bundle standalone `Operon.exe` into `Operon-Workstation-Portable.zip` with any required runtime assets.
  - Verify: Execute `node scripts/package-portable.mjs` test run.
  - Files: `scripts/package-portable.mjs`, `package.json`.

- [x] Task 4: Engineer GitHub Actions Release Pipeline (`.github/workflows/release.yml`)
  - Acceptance: Complete GitHub Actions workflow supporting:
    1. Triggers: `push.branches: [main]` (Nightly), `push.tags: ['v*']` (Semantic Release), and `workflow_dispatch`.
    2. Runner: `windows-latest`.
    3. Dual checkout of `tuquet/console` and `tuquet/operon` using `webfactory/ssh-agent`.
    4. Rust cache (`Swatinem/rust-cache@v2`) and pnpm cache.
    5. Build with `pnpm --filter @operon/workstation tauri:build` with Minisign signing environment variables.
    6. Package NSIS `.exe`, `.msi`, Portable `.zip`, and `latest.json`.
    7. Automated GitHub Release publishing via `softprops/action-gh-release@v2` (rolling tag `nightly` or semantic `v*`).
  - Verify: Validate YAML schema and workflow syntax.
  - Files: `.github/workflows/release.yml`.

- [x] Task 5: Add PR Preview Build Workflow (`.github/workflows/preview-build.yml`)
  - Acceptance: Workflow on PR to `main` that validates build and uploads downloadable installer artifact (retention: 7 days) without publishing a public release.
  - Verify: Validate YAML schema and conditions.
  - Files: `.github/workflows/preview-build.yml`.

- [ ] Task 6: Commit, push via Gateway SOCKS5, and trigger live release verification
  - Acceptance: Changes committed with conventional commit message $\le 108$ characters, pushed via `git spush origin main`.
  - Verify: GitHub Actions run triggers on `main`, dual-repo checkout succeeds, build completes, and `nightly` release is live on `https://github.com/tuquet/console/releases/tag/nightly` with downloadable `Operon-Workstation-Setup.exe`.
  - Files: Git commit & push.
