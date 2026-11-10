# Product release lifecycle

GitHub Releases is the download hub. Every published release has a unique version tag and immutable assets. The `release-state` branch contains the release registry, channel feeds and the audit history in Git. It contains metadata, not binaries. No application database or additional hosting service is required.

## Sources of truth

- `release/version.json`: product version. Run `pnpm release:version 5.8.1` to synchronize the root package, shell package, Tauri configuration, Cargo manifest and the workstation entry in Cargo.lock. Internal libraries keep their own versions.
- `subsystem.json`: exact embedded Operon subsystem commit.
- `release/config.json`: repository, supported platforms, Rust toolchain and retention.
- `release-state/registry.json`: published release IDs, asset IDs, hashes, provenance, active/revoked/archived status, channel pointers and change history.

## Release paths

| Trigger | Result |
| --- | --- |
| Pull request | Frontend quality checks; trusted in-repository PRs also get an unsigned portable preview with no production signing secret |
| Push to main | Signed `MAJOR.MINOR.PATCH-nightly.RUN.ATTEMPT` release |
| Tag matching committed stable version | Signed stable release, requiring approval in the `release-stable` environment |
| Tag matching committed `-beta.N` version | Signed beta release |

The Release workflow requires the reusable quality workflow to pass before building. The build uses locked pnpm and Cargo dependencies and the pinned subsystem/toolchain. PR preview artifacts expire after 7 days; signed CI staging artifacts after 14 days.

## Preparing a stable or beta release

1. Run the **Prepare product release** workflow with a new version, such as `5.8.1` or `5.9.0-beta.1`. It creates a version PR and explicitly dispatches quality checks because events created using GITHUB_TOKEN do not automatically start other workflows.
2. Review and merge the version PR after checks pass.
3. Tag the merged main commit, then push the tag:

```sh
git fetch origin main
git tag v5.8.1 origin/main
git push origin v5.8.1
```

4. Approve the stable deployment in GitHub Actions when requested. A beta release uses the prerelease environment and does not become GitHub's Latest stable release.

Alternatively, synchronize versions locally, commit them through a normal PR and follow the same tag process. Tags must exactly match the committed product version. Never re-tag an existing version; publish a higher patch version for a fix.

## Artifact contract and publication

A release must contain all of:

- `Operon-VERSION-windows-x86_64-setup.exe` and its `.sig` file.
- `Operon-VERSION-windows-x86_64-portable.zip`.
- `release-manifest.json`: source commits, build timestamp/run, toolchain and artifact metadata.
- `latest.json`: Tauri updater version, publication information, platform URL and inline signature.
- `checksums.sha256`: SHA-256 checksums of every other release file.

Packaging requires a fresh output directory and exactly one installer/binary. It verifies file hashes and both Ed25519 Minisign signatures against the configured Tauri public key and requires the signed version to match the manifest. Publication creates a draft, uploads and checks every GitHub asset digest, then publishes and advances the channel. Assets are never overwritten. Tauri updater signatures do not replace Windows Authenticode certificates; this pipeline uses the existing updater signing key and does not claim publisher signing.

Published manifests use version-specific GitHub download URLs. Channel feeds are:

```text
https://raw.githubusercontent.com/tuquet/console/release-state/updates/stable/latest.json
https://raw.githubusercontent.com/tuquet/console/release-state/updates/beta/latest.json
https://raw.githubusercontent.com/tuquet/console/release-state/updates/nightly/latest.json
```

Each binary is built with its channel endpoint. Older installed clients that use GitHub's Latest-release endpoint can still consume `latest.json` on stable releases. GitHub serves the feeds with its cache policy; channel changes are not guaranteed instantaneous at every client.

## Promotion, withdrawal and recovery

Use **Manage releases** on main:

- **promote**: select an existing published tag and eligible channel. Prereleases cannot enter stable; moving a channel to a lower version is blocked.
- **revoke**: provide a tag and reason. Every channel referencing it is cleared; the release is marked revoked, removed from GitHub Latest eligibility and its description is annotated. GitHub assets remain immutable for investigation. Existing installations are not removed.
- **reconcile**: after a published release failed to update its registry, download and verify its assets, then register it. This avoids rebuilding an existing version.
- **prune**: preview retention by default for manual runs; set apply to delete. The weekly schedule applies the configured policy to managed nightlies only.

Revoking the active release removes its updater feed until a safe release is promoted or published. Update clients treat the missing feed as a check failure. For an installed bad release, publish a higher fixed version; static Tauri feeds do not force downgrades, mandatory updates or staged tenant rollout.

The retention policy keeps at least 14 managed nightlies and 30 days of builds; active channel targets and stable/beta releases are never pruned. Historical tags, registry entries and checksums remain after nightly release assets are archived. The legacy rolling `nightly` release is not managed or deleted by this policy.

## Repository configuration

An administrator runs once (and can rerun idempotently):

```sh
node scripts/release/configure-github.mjs --apply
```

This enables immutable releases, protects main with the `Frontend quality` check, prevents version-tag deletion/rewrites, enables Actions-created release PRs, creates release deployment environments and initializes the metadata branch. `release-stable` requires the configuring administrator's review. Main requires a PR and green checks; it does not require a second approver in this single-owner repo.

Existing repository secrets are required: `OPERON_DEPLOY_KEY`, `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Private signing keys never enter manifests, release assets or logs. Key rotation requires a deliberate client migration.

The registry can later be synchronized to a database for fleet-specific policy. A database is only necessary when introducing tenant rollout, mandatory version policies or per-device update state; those features are not simulated by static JSON.
