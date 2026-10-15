# Implementation Plan: Enterprise UI Information Deduplication (`SPEC-ui-information-deduplication`)

## Overview
Refactor `@tuquet/admin-web` dashboards, overview pages, workspace detail components, and multi-tab headers to enforce the **"One Fact, One Place per Viewport"** enterprise standard, eliminating all intra-card number duplication (`3 3`), KPI-to-Chart/Module-Card duplication, and Hero-to-Tab metadata duplication.

## Architecture Decisions
- **2-Row Executive KPI Cards (`views/dashboard/analytics/index.vue`)**: Each KPI card renders one headline metric (`font-mono text-xl sm:text-2xl font-bold`) and one right-aligned semantic status indicator. Sub-breakdowns (`Pro vs. Free`, `Core vs. Extension`) are owned exclusively by the `PlansChart` and `PluginsChart` donut components below.
- **Unified Actionable KPI Module Grid (`views/system/overview/index.vue` & `views/automation/overview/index.vue`)**: Merge the redundant 4-card static KPI row and 5/6-card Module row into a single unified grid of clickable KPI Module cards, surfacing the Loopback Daemon status as a compact header pill in `AutomationOverview`.
- **Hero vs. Tab Separation (`views/tenants/detail.vue`)**: `WorkspaceHero` owns identity metadata (`name`, `slug`, `status`, `created_at`, and distinct `Selected Workspace` indicator); `WorkspaceOverviewTab` owns operational details (`Tenant UUID` copy, `Service Plan & Rate`, `Device Infrastructure`, and `DangerZoneCard` with distinct description/action copy); `WorkspaceUsageTab` owns resource quota bars.
- **Multi-Tab Header Deduplication (`views/commerce/admin/index.vue` & `views/system/roles/index.vue`)**: Remove top `<h1>` count badges when mode tabs directly below already render per-tab counters.

## Task List

### Phase 1: Dashboards & Overview Pages
- [x] Task 1: Refactor `views/dashboard/analytics/index.vue` to 2-row Executive KPI Cards and deduplicated Infrastructure list
- [x] Task 2: Consolidate `views/system/overview/index.vue` and `views/automation/overview/index.vue` into single unified Actionable KPI Grids

### Checkpoint: Dashboards & Overviews
- [x] Typecheck and lint pass on dashboard/overview views

### Phase 2: Workspace Detail & Multi-Tab Headers
- [x] Task 3: Deduplicate `WorkspaceHero`, `WorkspaceOverviewTab`, `WorkspaceUsageTab`, and `WorkspaceMembersTab`
- [x] Task 4: Remove redundant `<h1>` count badges on multi-tab views (`commerce/admin/index.vue`, `system/roles/index.vue`)

### Checkpoint: Complete
- [x] Task 5: Add unit tests (`analytics-dedup.test.ts`) and run full verification (`test:unit`, `check:i18n`, `oxlint`, `typecheck`)

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Unused or mismatched i18n keys across `en-US` and `vi-VN` | Low | Reuse existing canonical keys in `page.json` / `common.json` and verify with `pnpm check:i18n` |
| Responsive layout shift on mobile `< 640px` | Medium | Use `grid-cols-2` on mobile with `truncate` and `shrink-0` status pills |
