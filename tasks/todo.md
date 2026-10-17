# Todo List: Comprehensive Browser Error Observability

- [x] Task 1.1: Refactor `src/utils/bugsink.ts` (early error buffer, default integrations preservation, PII sanitization, network breadcrumbs)
- [x] Task 1.2: Add unit tests in `src/utils/__tests__/bugsink.test.ts`
- [x] Task 2.1: Instrument `src/main.ts` (early error interceptor, `vite:preloadError` telemetry, boot crash handler)
- [x] Task 2.2: Enrich `src/bootstrap.ts` (PWA, screen size, online/offline tags and breadcrumbs)
- [x] Task 3.1: Add network breadcrumbs and error telemetry to `src/api/core/supabase-client.ts`
- [x] Task 4.1: Run unit tests (`test:unit`)
- [x] Task 4.2: Run `pnpm run build:local`
