# Technical Implementation Plan: Module `superadmin-routes`

## Overview

Implement 4 platform superadmin routes under the `/system` router module, providing complete system oversight across users, cross-tenant audit trails, platform SaaS subscriptions, and RBAC matrix.

## Phases & Build Order

1. **Phase 1: Data Access & Types (`api/core/system.ts`) + Unit Tests**
   - Implement data interfaces (`PlatformUserItem`, `GlobalAuditLogItem`, `PlatformSubscriptionItem`, `SystemRoleItem`).
   - Implement pure mappers and helpers (`mapRawPlatformUser`, `mapRawGlobalAuditLog`, `mapRawPlatformSubscription`, `mapRawSystemRole`, `groupPermissionsByModule`).
   - Implement PostgREST query functions with correct schema routing (`getPlatformUsersApi`, `getGlobalAuditLogsApi`, `getPlatformSubscriptionsApi`, `getSystemRolesWithPermissionsApi`).
   - Write comprehensive unit tests in `apps/web-admin/src/api/core/__tests__/system.test.ts`.

2. **Phase 2: Router Configuration & Localization**
   - Register routes in `apps/web-admin/src/router/routes/modules/system.ts` with `authority: ['superadmin']`.
   - Update locale keys in `apps/web-admin/src/locales/langs/en-US/page.json`.

3. **Phase 3: Dual View UI Components**
   - Create `apps/web-admin/src/views/system/users/index.vue` (Platform Users directory).
   - Create `apps/web-admin/src/views/system/audit-logs/index.vue` (Global Audit Trail with JSON viewer).
   - Create `apps/web-admin/src/views/system/subscriptions/index.vue` (Cross-tenant SaaS subscriptions).
   - Create `apps/web-admin/src/views/system/roles/index.vue` (RBAC Matrix and permission catalog).

4. **Phase 4: Documentation & Verification Gate**
   - Update `docs/routes/system.md` and `docs/routes/README.md`.
   - Execute the Zero-Waste CI Gate (`vitest`, `vue-tsc`, `oxlint`, `pnpm run lint`, `pnpm run build:admin`).
