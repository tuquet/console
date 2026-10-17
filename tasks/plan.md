# Implementation Plan: Phase 02 Dynamic Bank Pool & Resilient Ledger Engine (`PHASE-02-OMNICHANNEL-PAYMENTS`)

## Overview
Implement resilient payment rails and MMO-grade dynamic bank account pooling to prevent single-account freezing, ensure continuous rotation, and guarantee 100% zero-discrepancy double-entry ledger bookkeeping.

---

## Architecture & Modules (Capability Map)
1. **`bank-pool-engine`**: Dynamic receiving account pool (`billing.bank_receiving_accounts`) with quota limits, priority ranking, and automated rotation.
2. **`intent-rotation-router`**: Smart routing in `create_payment_intent` to pick the healthiest bank account from the pool and construct VietQR dynamic QR payloads.
3. **`ledger-reconciliation`**: Double-entry ledger audit guarantee (`billing.credit_tenant_wallet`, `billing.debit_tenant_wallet`), atomic idempotency, and late-transfer `manual_review` buffer.
4. **`admin-pool-ui-and-tests`**: Frontend client APIs and unit test coverage verifying rotation logic, underpaid protection, and account circuit breakers.

---

## Tasks

### Phase 1: Database Migration & Dynamic Account Pool (`cloud`)
- [ ] Task 1.1: Create SQL migration `20261017000001_billing_dynamic_bank_pool.sql` in `tuquet/cloud`:
  - Table `billing.bank_receiving_accounts` (id, bank_bin, bank_name, account_no, account_name, qr_template, daily_limit_vnd, current_daily_total, is_active, status, priority, created_at, updated_at).
  - Function `billing.get_next_receiving_account()`: Selects highest priority active account under daily limit, supporting round-robin rotation.
  - Upgrade `billing.create_payment_intent` to dynamically select receiving account from pool for `bank_transfer` channel.

### Phase 2: Frontend Client SDK & Pool Types (`admin`)
- [ ] Task 2.1: Add TypeScript interfaces and mapping functions in `apps/web-admin/src/api/core/billing.ts` (`BankReceivingAccountItem`, `getBankReceivingAccountsApi`, `upsertBankReceivingAccountApi`, `toggleBankReceivingAccountApi`).
- [ ] Task 2.2: Enhance `billing.ts` with pool rotation awareness and health status indicators.

### Phase 3: Automated Unit & Stress Testing
- [ ] Task 3.1: Expand `apps/web-admin/src/api/core/__tests__/billing.test.ts` to test:
  - Account pool mapping and status normalization.
  - Dynamic QR code generation with account fallback when an account reaches daily limit.
  - Idempotent settlement and underpaid/late transfer protection in `settle_payment_intent`.
- [ ] Task 3.2: Run full unit test suite (`pnpm test:unit`) ensuring 100% pass rate.
- [ ] Task 3.3: Run `pnpm run build:local` and verify local Tailscale deployment.
