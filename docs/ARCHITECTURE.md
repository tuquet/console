# Console architecture

Console is a pnpm monorepo. The shell and business applications are compiled and released together. Dynamic imports split bundles; they do not provide independent application deployment.

## Responsibilities

| Directory | Responsibility |
| --- | --- |
| `apps/shell` | Authentication, session lifecycle, layout, top-level routes, access guards and desktop adapters |
| `apps/system`, `apps/tenants`, `apps/automation` | Business screens, local state and child route manifests |
| `packages/kernel` | Typed host contract, injection key, mock implementation and HTTP error type |
| `packages/@core` | Base types, UI primitives and reusable components |
| `packages/effects` | Shared integrations, layouts, hooks and higher-level UI |
| `packages/local-db` | Local database schemas, migrations and synchronization |
| `internal` | Shared build, TypeScript and lint configuration |
| `scripts` | Workspace maintenance and release tooling |

## Dependency rules

- Shell may import business application manifests.
- Business applications consume host services through `useKernel()` and shared packages.
- Business applications must not import shell internals or another business application.
- Shared packages must not import applications.
- Core packages must not depend on higher-level `@operon/*` packages (enforced by ESLint).

`pnpm check:architecture` checks package dependencies and static imports, re-exports, literal dynamic imports, import types and `require()` calls, including relative paths and Vue script blocks. Computed import paths and custom cross-app aliases are not supported; do not use them to reach another application. `pnpm check:circular` rejects runtime import cycles. Type-only references are excluded because they do not create runtime initialization dependencies.

## Adding a screen

1. Add the screen and its state/API consumers inside its owning application.
2. Add its lazy route to that application's `src/manifest.ts`, including a unique route name, title key and screen-level permissions.
3. Use named routes for navigation so the screen works under both shell and standalone prefixes.
4. Shell owns the root prefix, layout and platform/plugin policy. New child screens do not require edits to shell's view imports.
5. Add behavior tests for routing, access or API interactions when changed.

Standalone apps use the same manifest with a mock kernel and a `RouterView` root. Standalone mode is for development; it does not enforce production authorization. System screens currently display sample data. Browser management is a development placeholder, not a working browser control interface.

## Validation

Run `pnpm check:type`, `pnpm check:architecture`, `pnpm check:circular`, `pnpm check:i18n`, `pnpm check:dep` and `pnpm test:unit` before submitting changes. Use `pnpm lint` for Oxlint, formatting, ESLint and Stylelint validation without autofixes. The quality workflow runs without desktop subsystem credentials.

Every workspace package with source must expose a `typecheck` task. `pnpm check:type-coverage` prevents new source packages from being silently skipped.

Kernel public request options reuse the canonical database schema type from `@operon/constants`. Host-private retry state stays in the shell client. HTTP failures use `KernelApiError.status`; authentication failures retain `isAuthError` for existing callers. Transport failures retain their original error.
