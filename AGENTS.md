# Admin — Agent Notes (context-lean)

> **Repo-specific directives moved to [`AGENT-DIRECTIVES.md`](AGENT-DIRECTIVES.md)** to keep the auto-loaded context small. Read that file before working in this repo.
>
> **Shared ecosystem invariants:** [`../AGENTS.md`](../AGENTS.md) + [`../CONSTRAINTS.md`](../CONSTRAINTS.md).

## Key areas (full detail in AGENT-DIRECTIVES.md)

1. **KISS & YAGNI** — core design philosophy.
2. **Shadcn Slate / Zinc design system** — semantic design tokens (`@tuquet/vue-ui`).
3. **Icons: Lucide only** (mandatory).
4. **Mobile-first** + standardized `useVbenVxeGrid` / `VxeForm` (ADR-004).
5. **100% real telemetry — no mock data.**
6. **Testing & technical standards.**
7. **Zero-waste CI gate** — local pre-push quality gate, pnpm catalog/dependency rules, CI-minutes conservation.
8. **Client API architecture & DRY.**
9. **Private Network Access (PNA) local comms.**
10. **Documentation standards** — pre-release clean slate, `docs/` hierarchy, portable git paths.

⚠️ **Never `git push`** without explicit request. `pnpm run build:local` for Tailscale review.
