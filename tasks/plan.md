# Implementation Plan: Automated Release & Distribution Pipeline for Operon Workstation

Based on the approved specification [SPEC-automated-release-and-distribution.md](../SPEC-automated-release-and-distribution.md) and user decisions:

1. **Access Method:** Deploy Key (Read-only) for `tuquet/operon` stored as `OPERON_DEPLOY_KEY` in `tuquet/console`.
2. **Release Triggers:** Option 1 (Nightly Rolling on `main` + Semantic Releases on `v*` tags + manual `workflow_dispatch`).
3. **In-App Auto-Updater:** Enabled immediately with Minisign signing and `latest.json` published on GitHub Releases.

---

## 1. Dependency Graph & Vertical Slicing

```mermaid
flowchart TD
    subgraph Slice1["Phase 1: Cryptographic Keys & Access Setup"]
        K1["Generate Ed25519 Deploy Key for operon"]
        K2["Register Public Deploy Key on tuquet/operon"]
        K3["Store OPERON_DEPLOY_KEY in tuquet/console secrets"]
        K4["Generate Minisign Key Pair for Tauri Updater"]
        K5["Store TAURI_SIGNING_PRIVATE_KEY in tuquet/console secrets"]
    end

    subgraph Slice2["Phase 2: App & Tauri Configuration"]
        C1["Update tauri.conf.json updater endpoints to tuquet/console"]
        C2["Update tauri.conf.json with new Minisign pubkey"]
        C3["Verify In-App Updater initialization in frontend/lib.rs"]
    end

    subgraph Slice3["Phase 3: CI/CD Release Pipeline Engineering"]
        W1["Create .github/workflows/release.yml"]
        W2["Dual-repo checkout logic with ssh-agent"]
        W3["Rust + pnpm cache optimization"]
        W4["Tauri bundle build & sign execution"]
        W5["Asset packaging: NSIS .exe, MSI, Portable Zip, latest.json"]
        W6["Rolling Nightly & Tagged Release publishing"]
    end

    subgraph Slice4["Phase 4: Verification & End-to-End Release Test"]
        V1["Validate workflow syntax and secrets"]
        V2["Push changes via git spush"]
        V3["Trigger GitHub Actions test build"]
        V4["Verify direct download link and asset integrity"]
    end

    Slice1 --> Slice2
    Slice2 --> Slice3
    Slice3 --> Slice4
```

---

## 2. Implementation Phases & Verification Checkpoints

### Checkpoint 1: Security & Secrets Verification

- `tuquet/operon` has a read-only deploy key configured.
- `tuquet/console` has secrets: `OPERON_DEPLOY_KEY`, `TAURI_SIGNING_PRIVATE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

### Checkpoint 2: Tauri Updater Config Verification

- `apps/workstation/src-tauri/tauri.conf.json` contains:
  - Correct endpoint `https://github.com/tuquet/console/releases/latest/download/latest.json`.
  - Matching Minisign public key.

### Checkpoint 3: CI Pipeline Syntax & Execution

- `.github/workflows/release.yml` passes lint/schema check.
- Runner successfully clones `operon` via SSH and resolves `../../../../operon/crates/cli`.

### Checkpoint 4: Distribution Release Gate

- Rolling pre-release `nightly` is live with downloadable `Operon-Workstation-Setup.exe`.
- In-app updater endpoint `latest.json` is served properly.

---

## 3. Risks & Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Windows runner build timeout (> 30 min) | Slow feedback loop | Use `Swatinem/rust-cache@v2` targeting both `workstation/src-tauri` and `operon` workspaces. |
| Private repo clone failure in CI | Pipeline abort | Use `webfactory/ssh-agent@v0.9.0` with strict known_hosts verification for github.com. |
| Tauri Updater signature mismatch | App fails to install updates | Generate clean Minisign key pair, store private key securely, and test signature generation. |
| NSIS installer elevation prompt | Poor tester UX | Enforce `"installMode": "currentUser"` in `tauri.conf.json`. |
