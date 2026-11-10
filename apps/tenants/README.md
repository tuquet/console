# @operon/tenants

Workspace list and detail preview screens backed by a local sample store.

This application is compiled and released with the shell. Standalone development uses a mock kernel; it does not provide independent production deployment.

- `src/manifest.ts` owns child routes and screen-level permissions.
- `src/remote-entry.ts` exports `tenantsManifest` for the shell.
- `src/bootstrap.ts` mounts a router view with the same routes for standalone development.
- Host session, HTTP clients and notifications are consumed through `useKernel()`.
- Local stores use the `tenants:*` namespace and share the shell's Pinia instance when embedded.

Run `pnpm dev:tenants` from the repository root (port 5323). Use named routes for navigation so screens work under standalone and shell route prefixes.

See [architecture](../../docs/ARCHITECTURE.md) and [development setup](../../docs/DEVELOPMENT.md).
