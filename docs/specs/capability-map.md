# Bản Đồ Năng Lực Hệ Thống (Admin Capability Map)

> Trạng thái: **ĐÃ HOÀN THÀNH** (100% 7/7 Modules) | Kiến trúc nguồn: [`docs/architecture/overview.md`](../architecture/overview.md)

| Module id | Trách nhiệm | Phụ thuộc |
| :-- | :-- | :-- |
| `data-access` | `supabaseRequest({ schema })` (Accept/Content-Profile); quyền hiệu lực từ DB (superadmin + user thường) thay cho hardcode; danh sách plugin `installed` | — |
| `route-foundation` | Tách `dashboard.ts` → `dashboard.ts` / `tenants.ts` / `fleet.ts` / `automation.ts` / `system.ts`; `meta.authority` + gate theo plugin; redirect alias; cập nhật home path và `router.push` | `data-access` |
| `tenants-truth` | `/tenants/:id` tabs `overview / members / usage / audit` với dữ liệu thật; sửa invite (`role_id`, `token_hash`, `invited_by`) và gán role qua `member_roles`; plan từ `billing.subscriptions`; ẩn tab API Keys (D4) | `route-foundation` |
| `fleet-inventory` | `/fleet/devices` (đọc `runners.devices` thật, gỡ fallback `localStorage` / `getInitialFallbackNodes`), `/fleet/browsers`, `/fleet/proxies` — Dual View, read-only | `route-foundation` |
| `automation-engine` | `/automation/workflows`, `/automation/runs`, `/automation/runs/:id` (polling log 3s) | `route-foundation` |
| `system-catalog` | `/system/plugins`, `/system/plans` | `route-foundation` |
| `superadmin-routes` | `/system/users`, `/system/audit-logs`, `/system/subscriptions`, `/system/roles` — đặc quyền riêng cho Platform Superadmin | `route-foundation`, `system-catalog` |

**Phụ thuộc ngoài (repo `cloud`):** `cloud:platform-superadmin` — `public.is_platform_admin()` + policy SELECT bổ sung (RFC §7.1). Đã hoàn tất tích hợp tại local migration `tuquet/cloud`.

Build order: `data-access` → `route-foundation` → (`tenants-truth`, `fleet-inventory`, `automation-engine`, `system-catalog` — song song được) → `superadmin-routes`

Spec module: [`SPEC-data-access.md`](SPEC-data-access.md) (đã hoàn thành), [`SPEC-route-foundation.md`](SPEC-route-foundation.md) (đã hoàn thành), [`SPEC-tenants-truth.md`](SPEC-tenants-truth.md) (đã hoàn thành), [`SPEC-fleet-inventory.md`](SPEC-fleet-inventory.md) (đã hoàn thành), [`SPEC-automation-engine.md`](SPEC-automation-engine.md) (đã hoàn thành), [`SPEC-system-catalog.md`](SPEC-system-catalog.md) (đã hoàn thành), [`SPEC-superadmin-routes.md`](SPEC-superadmin-routes.md) (đã hoàn thành).
