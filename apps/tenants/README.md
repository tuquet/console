# @operon/tenants — Multi-Tenant Workspaces Micro-App

> **Architecture Role:** Autonomous Domain Micro-App for Workspace Management, Quota Orchestration, and Team Isolation in Operon.

---

## 1. Overview & Operational Model

`@operon/tenants` is an independent Micro-Frontend application decoupled from the Host Shell. It runs in two distinct modes:

1. **Integrated Shell Mode (Production / Desktop):** Dynamically loaded into the Host Shell router (`apps/shell`) via `@operon/tenants` remote entry (`TenantsView`, `TenantDetailView`).
2. **Autonomous Standalone Mode (Local Dev):** Runs on port `5323` (`http://localhost:5323`) using `@operon/kernel`'s `createMockKernel()` for offline development.

---

## 2. Directory Layout

```text
apps/tenants/
├── src/
│   ├── bootstrap.ts      # Standalone bootstrapping with MockKernel
│   ├── main.ts           # Standalone entry point
│   ├── remote-entry.ts   # Micro-frontend contract (exports TenantsView, TenantDetailView)
│   ├── stores/
│   │   └── sample.ts     # Scoped Pinia store (namespace: 'tenants:workspace')
│   └── views/
│       ├── detail.vue    # Workspace details, tier quotas & team overview
│       └── index.vue     # Multi-tenant workspace hub & switcher
├── index.html            # Standalone HTML entry
├── package.json          # @operon/tenants definition
├── tsconfig.json         # TypeScript configuration
├── tsconfig.node.json    # TypeScript node config
└── vite.config.ts        # Standalone Vite dev server (port 5323)
```

---

## 3. Communication Contract with Host Shell

`@operon/tenants` accesses host services exclusively through the `@operon/kernel` bridge:

```ts
import { useKernel } from '@operon/kernel';

const kernel = useKernel();

// Access active session tenant
const tenantId = kernel.auth.tenantId;

// Send UI notifications to Shell
kernel.events.notify('success', 'Active workspace switched');
```

---

## 4. Development Scripts

```bash
# Start standalone dev server on port 5323
pnpm --filter @operon/tenants dev

# Type check with vue-tsc
pnpm --filter @operon/tenants typecheck

# Build bundle
pnpm --filter @operon/tenants build
```
