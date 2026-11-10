# @operon/system

System administration preview screens for users, roles, audit logs and plugins. The screens currently display sample data.

This application is compiled and released with the shell. Standalone development uses a mock kernel; it does not provide independent production deployment.

- `src/manifest.ts` owns child routes and screen-level permissions.
- `src/remote-entry.ts` exports `systemManifest` for the shell.
- `src/bootstrap.ts` mounts a router view with the same routes for standalone development.
- Host session, HTTP clients and notifications are consumed through `useKernel()`.
- Local stores use the `system:*` namespace and share the shell's Pinia instance when embedded.

Run `pnpm dev:system` from the repository root (port 5322). Use named routes for navigation so screens work under standalone and shell route prefixes.

See [architecture](../../docs/ARCHITECTURE.md) and [development setup](../../docs/DEVELOPMENT.md).
