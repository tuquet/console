# Implementation Plan: Comprehensive Browser Error Observability (`SPEC-browser-error-observability`)

## Overview
Harden the browser telemetry pipeline in `@tuquet/admin-web` via `@sentry/vue` (Bugsink endpoint) to eliminate all error-tracking blind spots: early boot crashes, unhandled rejections, Vite preload chunk failures, resource 404s, and uninstrumented API network crashes.

## Architecture Decisions
1. **Early Error Buffer Queue (`src/utils/bugsink.ts`)**: Maintain an in-memory queue for any errors occurring before `Sentry.init()` completes. Once `initBugsink` finishes, the queue drains and dispatches all buffered events safely.
2. **Preserve Default Sentry Integrations**: Do not replace the default integrations array; instead provide a function or merge `browserTracingIntegration` with default browser integrations (`globalHandlersIntegration`, `breadcrumbsIntegration`, `linkedErrorsIntegration`, `dedupeIntegration`).
3. **Capture Preload Chunk Errors (`src/main.ts`)**: In `vite:preloadError`, capture a telemetry event with the target chunk URL and timestamp before calling `window.location.reload()`.
4. **Network & Sub-resource Breadcrumbs**: Instrument `supabaseFetch` with sanitized URL and status breadcrumbs. Capture DOM resource errors (img/script/css 404s) as lightweight breadcrumbs in the capture phase.
5. **Runtime Hardware Context**: Automatically tag events with PWA standalone mode, viewport dimensions, online/offline status, and active workspace ID.

---

## Tasks

### Phase 1: Core Bugsink / Sentry Engine Hardening
- [ ] Task 1.1: Refactor `src/utils/bugsink.ts` with early error buffer queue, default integrations preservation, URL/PII sanitization, and network breadcrumbs helper.
- [ ] Task 1.2: Add unit tests in `src/utils/__tests__/bugsink.test.ts` for deduplication, PII sanitization, and buffer draining.

### Phase 2: Application Entrypoint & Lifecycle Hookup
- [ ] Task 2.1: Instrument `src/main.ts` with early error interception, telemetry-backed `vite:preloadError` handler, and bootstrap error dispatch.
- [ ] Task 2.2: Enrich `src/bootstrap.ts` with device environment tags (PWA, screen, network status) and offline/online breadcrumbs.

### Phase 3: Supabase & Network Telemetry
- [ ] Task 3.1: Add network breadcrumbs and 5xx failure telemetry to `src/api/core/supabase-client.ts`.

### Phase 4: Full Verification & Local Build
- [ ] Task 4.1: Run unit tests (`pnpm --filter @tuquet/admin-web test:unit`).
- [ ] Task 4.2: Run `pnpm run build:local` and verify Nginx deployment on Tailscale (`http://100.68.217.61/`).
