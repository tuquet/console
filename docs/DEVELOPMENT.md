# Development

## Web

Use the Node version in `.node-version` and the pnpm version pinned by `packageManager` in the root `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev:web
```

Web development does not require Rust or the private desktop subsystem. Configure the shell's `.env` settings for cloud integration. Never commit local credentials.

Individual applications can run with a mock host:

```sh
pnpm dev:system
pnpm dev:tenants
pnpm dev:automation
```

## Desktop on Windows

Install the Rust MSVC toolchain, Microsoft C++ build tools and WebView2 runtime. Desktop uses a sibling checkout of the private Operon subsystem because Cargo resolves `apps/shell/src-tauri/Cargo.toml` to `../operon/crates/cli`.

From the console repository root, bootstrap the subsystem with PowerShell:

```powershell
$subsystem = Get-Content subsystem.json -Raw | ConvertFrom-Json
git clone "git@github.com:$($subsystem.repository).git" $subsystem.path
git -C $subsystem.path checkout --detach $subsystem.revision
pnpm desktop:check
pnpm dev:desktop
```

If the checkout already exists, fetch and inspect local changes before switching revisions. The prerequisite checker never changes another repository.

`subsystem.json` pins the exact subsystem commit used by preview and release CI. To upgrade it, test a clean checkout at the proposed revision and commit the manifest change with the console changes that require it. Run `pnpm desktop:check` before a local release build. This validates Rust tools, the checkout revision and its clean working tree; installer-specific requirements are checked by Tauri.

The CI quality workflow checks frontend code without private credentials. Desktop preview and release workflows additionally require subsystem checkout access and the existing build/signing configuration.
