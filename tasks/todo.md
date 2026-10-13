# Task List: Layout & Preferences Coherence Hardening

- [x] Task 1: Anti-Lockout Core Fallback in Preferences Store
  - Acceptance: When `preferences.header.enable === false` and `preferencesButtonPosition === 'header'`, `preferencesButtonPosition.value.fixed` evaluates to `true` (fallback to floating button) so settings are never lost.
  - Verify: Unit test in `packages/@core/preferences/__tests__/use-preferences.test.ts` passes (3/3 tests passed).
  - Files: `packages/@core/preferences/src/use-preferences.ts`, `packages/@core/preferences/__tests__/use-preferences.test.ts`

- [x] Task 2: Responsive Content Compact Width Fix
  - Acceptance: When `contentCompact === 'compact'`, style is `width: min(100%, ${props.contentCompactWidth}px)` with `maxWidth: '100%'`, preventing horizontal overflow on viewport < 1200px.
  - Verify: Component inspect check and typecheck pass.
  - Files: `packages/@core/ui-kit/layout-ui/src/components/layout-content.vue`

- [x] Task 3: Preferences Controls Alignment & Parity
  - Acceptance:
    1. `sidebar.vue`: Switch "Enable Sidebar" is disabled (`:disabled="isSidebarEnableDisabled"`) with explanatory tooltip in `sidebar-nav` mode.
    2. `tabbar.vue`: Switch for `tabbarShowRefresh` (`tabbar.showRefresh`) is added.
    3. `navigation.vue`: Switch `navigationSplit` is disabled when not in mixed nav mode (`:disabled="!isMixedNav"`).
    4. `widget.vue`: Option `none` is removed from `preferencesPositionItems` so settings entry point is never permanently lost.
    5. `breadcrumb.vue`: Clarifying tooltip added explaining Desktop-only (>=1024px) visibility when Header does not carry primary nav.
  - Verify: Preferences drawer opens with all controls reactive and properly constrained.
  - Files:
    - `packages/effects/layouts/src/widgets/preferences/blocks/layout/sidebar.vue`
    - `packages/effects/layouts/src/widgets/preferences/blocks/layout/tabbar.vue`
    - `packages/effects/layouts/src/widgets/preferences/blocks/layout/navigation.vue`
    - `packages/effects/layouts/src/widgets/preferences/blocks/layout/widget.vue`
    - `packages/effects/layouts/src/widgets/preferences/blocks/layout/breadcrumb.vue`

- [x] Task 4: Full Workspace Quality Gate & Verification
  - Acceptance: Full workspace passes typecheck, linting, unit tests, and production build without errors.
  - Verify: Run `pnpm check:type`, `pnpm run lint`, `pnpm test:unit`, and `pnpm run build:admin`.
  - Files: None (workspace verification)
