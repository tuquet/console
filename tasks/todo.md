# Todo List: Phase 02 Dynamic Bank Pool & Resilient Ledger Engine

- [x] Task 1.1: Create SQL migration `20261017000001_billing_dynamic_bank_pool.sql` in `tuquet/cloud` with `billing.bank_receiving_accounts` and rotation router
- [x] Task 2.1: Add `BankReceivingAccountItem` types and CRUD APIs in `apps/web-admin/src/api/core/billing.ts`
- [x] Task 3.1: Expand `apps/web-admin/src/api/core/__tests__/billing.test.ts` for account pool normalization, dynamic rotation fallback, and settlement
- [x] Task 3.2: Run full unit test suite (`pnpm test:unit`) ensuring 100% pass rate (121/121 tests passed)
- [x] Task 3.3: Run `pnpm run build:local` and verify Nginx deployment on Tailscale (Deployed to http://100.68.217.61/)
