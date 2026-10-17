# Todo List: Phase 01 Hardening & Acceptance Readiness

- [x] Task 1.1: Harden `desktop-bridge.vue` with port validation (`1024..65535`) and loopback constraint
- [x] Task 1.2: Harden `auth.ts`, `guard.ts`, and `callback.vue` with safe local redirect validation
- [x] Task 2.1: Refactor `updateWorkspaceMemberRoleApi` in `workspace-detail.ts` for atomic role update
- [x] Task 3.1: Add unit tests in `iam-security-hardening.test.ts`
- [x] Task 3.2: Run full unit test suite (`test:unit`) (119/119 tests passed)
- [x] Task 3.3: Run `pnpm run build:local` and verify Nginx (Deployed to http://100.68.217.61/)
