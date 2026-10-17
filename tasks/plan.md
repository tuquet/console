# Implementation Plan: Phase 01 Hardening & Enterprise Acceptance (`PHASE-01-IAM-MULTITENANCY`)

## Overview
Address the 3 critical audit gaps in Phase 01 (Enterprise IAM & Multi-Tenancy) across `@tuquet/admin-web` and `cloud` schema contracts to achieve 100% acceptance readiness:
1. **Desktop Bridge SSRF & Token Exfiltration Hardening**: Enforce strict port validation (`1024..65535`) and loopback constraint (`127.0.0.1`).
2. **Open Redirect Mitigation**: Reject protocol-relative (`//evil.com`) and external schemes in `auth.ts`, `guard.ts`, and `callback.vue`.
3. **Atomic Member Role Assignment & Guard Integration**: Eliminate destructive `DELETE-then-POST` pattern; ensure failure resilience and handle `enforce_rbac_owner_guards` cleanly.
4. **Automated Verification Suite**: Add penetration/regression tests for SSRF, Open Redirect, and cross-tenant invariant protections.

---

## Tasks

### Phase 1: Security & Auth Hardening
- [ ] Task 1.1: Harden `desktop-bridge.vue` with strict port validation (`1024..65535`) and sanitized error states.
- [ ] Task 1.2: Harden `auth.ts`, `guard.ts`, and `callback.vue` with safe local relative URL validation (preventing `//evil.com` and javascript: URLs).

### Phase 2: Atomic Role Update & Error Handling
- [ ] Task 2.1: Refactor `updateWorkspaceMemberRoleApi` in `workspace-detail.ts` to assign new role atomically before revoking old role, preventing orphaned members and honoring last-owner guards.

### Phase 3: Comprehensive Test Suite & Local Build
- [ ] Task 3.1: Add unit tests in `src/api/core/__tests__/iam-security-hardening.test.ts` verifying port validation, safe redirects, and atomic role transitions.
- [ ] Task 3.2: Run full unit test suite (`pnpm test:unit`) ensuring 100% pass rate.
- [ ] Task 3.3: Execute `pnpm run build:local` and verify Nginx deployment.
