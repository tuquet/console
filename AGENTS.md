# AGENTS.md

## Rules

- Respect [architecture boundaries](docs/ARCHITECTURE.md): `micro-app` modules consume `host shell` capabilities only via `useKernel()` and shared packages; never import `apps/shell` or sibling `micro-app` modules.
- External dependencies in workspace `package.json` files must use `"catalog:"` (versions live in `pnpm-workspace.yaml`).
- Scaffold new `micro-app` modules with `pnpm gen:app <name>`.
- Follow Conventional Commits (see umbrella `../CONTRIBUTING.md`).
- Verify before committing (matches `console-quality.yml`):
  `pnpm release:check && pnpm check:architecture && pnpm check:circular && pnpm check:type && pnpm lint && pnpm check:i18n && pnpm test:unit && pnpm check:dep`
