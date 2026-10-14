# Spec: `route-foundation`

> Module id: `route-foundation` (xem [capability-map.md](capability-map.md)) — **ĐÃ HOÀN THÀNH** | Kiến trúc nguồn: [`docs/architecture/overview.md`](../architecture/overview.md)

---

## 1. Objective & Scope

Module này tái cấu trúc toàn bộ hệ thống định tuyến (router) của `apps/web-admin` từ cấu trúc nguyên khối `dashboard.ts` ban đầu thành 5 module độc lập theo ranh giới Plugin và Tenant của Tuquet Cloud, đồng thời thiết lập cơ chế bảo vệ quyền (`meta.authority`) và lọc động theo trạng thái cài đặt plugin (`meta.plugin`).

### Trong phạm vi:

1. **Tách module định tuyến:**
   - Phân rã `modules/dashboard.ts` thành 5 file module trong `src/router/routes/modules/`:
     - `dashboard.ts`: Chỉ chứa `/dashboard/analytics`, cấu hình redirect mặc định và các tuyến chuyển hướng tiện ích (`/dashboard/workspace` → `/tenants`, `/dashboard/fleet` → `/fleet/devices`).
     - `tenants.ts`: Khai báo `/tenants` (danh sách Workspace) và `/tenants/:id` (chi tiết Workspace).
     - `fleet.ts`: Khai báo `/fleet/devices`, `/fleet/browsers`, `/fleet/proxies`.
     - `automation.ts`: Khai báo `/automation/workflows`, `/automation/runs`, `/automation/runs/:id`.
     - `system.ts`: Khai báo `/system/plugins`, `/system/plans`.
2. **Di chuyển và cấu trúc lại views:**
   - Chuyển `views/dashboard/workspace/` → `views/tenants/`.
   - Chuyển `views/dashboard/fleet/` → `views/fleet/devices/`.
   - Tạo placeholder views không mock data cho các route mới:
     - `views/fleet/browsers/index.vue`
     - `views/fleet/proxies/index.vue`
     - `views/automation/workflows/index.vue`
     - `views/automation/runs/index.vue`
     - `views/automation/runs/detail.vue`
     - `views/system/plugins/index.vue`
     - `views/system/plans/index.vue`
3. **Cơ chế lọc động theo Plugin (`Plugin Gating`):**
   - Bổ sung trường `meta.plugin` vào định nghĩa route.
   - Thêm hàm thuần `filterRoutesByPlugins(routes, installedPlugins)` lọc bỏ các route thuộc plugin chưa `installed`.
   - Tích hợp vào `generateAccess` trong `src/router/access.ts` sử dụng `getInstalledPluginsApi()` từ `data-access`.
4. **Cơ chế phân quyền giao diện (`Authority Gating`):**
   - Thiết lập `meta.authority` trên từng route con theo ma trận RFC §4 (ví dụ: `['superadmin', 'runners:devices:read']`).
   - Tương thích 100% với hàm `hasAuthority()` của `@vben/access`.
5. **Đồng bộ hóa điều hướng và i18n:**
   - Đổi `defaultHomePath` trong `preferences.ts` và `homePath` trong `user.ts` từ `/dashboard/workspace` → `/dashboard/analytics`.
   - Cập nhật các lời gọi `router.push('/dashboard/workspace...')` trong `views/tenants/` và `views/_core/profile/index.vue` sang `/tenants`.
   - Bổ sung nhãn i18n cho các trang mới trong `locales/langs/en-US/page.json`.

### Ngoài phạm vi:

- Không viết logic truy vấn Supabase thật cho các tab Workspace Detail (để lại cho Module `tenants-truth`).
- Không viết logic telemetry thật cho Fleet (để lại cho Module `fleet-inventory`).
- Không kết nối Polling 3s cho Automa (để lại cho Module `automation-engine`).
- Không sửa schema/RLS của Tuquet Cloud (đã hoàn thiện ở Module `data-access`).

---

## 2. Tech Stack & Dependencies

- **Framework:** Vue 3, Vue Router 4, `@vben/access` (chế độ `'frontend'`), `@vben/preferences`.
- **UI & Icons:** Lucide Icons (`@lucide/vue` / `@iconify/vue`), `@tuquet/vue-ui`.
- **Phụ thuộc nội bộ:**
  - `apps/web-admin/src/api/core/access.ts` (`getInstalledPluginsApi`).
  - `apps/web-admin/src/api/core/user.ts` (cung cấp roles bao gồm `'superadmin'` và các permission IDs).

---

## 3. Project Structure Changes

```
apps/web-admin/src/
├── locales/langs/en-US/
│   └── page.json                         # Bổ sung i18n keys cho tenants, fleet, automation, system
├── preferences.ts                        # defaultHomePath: '/dashboard/analytics'
├── api/core/
│   └── user.ts                           # homePath: '/dashboard/analytics'
├── router/
│   ├── access.ts                         # Tích hợp filterRoutesByPlugins() với getInstalledPluginsApi()
│   ├── plugin-gate.ts                    # MỚI: hàm thuần filterRoutesByPlugins()
│   ├── __tests__/
│   │   └── plugin-gate.test.ts           # MỚI: Vitest kiểm thử logic filterRoutesByPlugins
│   └── routes/
│       └── modules/
│           ├── dashboard.ts              # Chỉ giữ /dashboard/analytics + alias redirects
│           ├── tenants.ts                # MỚI: /tenants, /tenants/:id
│           ├── fleet.ts                  # MỚI: /fleet/devices, /fleet/browsers, /fleet/proxies
│           ├── automation.ts             # MỚI: /automation/workflows, /automation/runs, /automation/runs/:id
│           └── system.ts                 # MỚI: /system/plugins, /system/plans
└── views/
    ├── tenants/                          # DI CHUYỂN từ views/dashboard/workspace/
    │   ├── index.vue
    │   ├── detail.vue
    │   └── components/
    ├── fleet/
    │   ├── devices/                      # DI CHUYỂN từ views/dashboard/fleet/
    │   │   ├── index.vue
    │   │   └── components/
    │   ├── browsers/
    │   │   └── index.vue                 # MỚI (clean placeholder)
    │   └── proxies/
    │       └── index.vue                 # MỚI (clean placeholder)
    ├── automation/
    │   ├── workflows/
    │   │   └── index.vue                 # MỚI (clean placeholder)
    │   └── runs/
    │       ├── index.vue                 # MỚI (clean placeholder)
    │       └── detail.vue                # MỚI (clean placeholder)
    └── system/
        ├── plugins/
        │   └── index.vue                 # MỚI (clean placeholder)
        └── plans/
            └── index.vue                 # MỚI (clean placeholder)
```

---

## 4. Chi Tiết Thiết Kế

### 4.1. Ma Trận Module, Tuyến Đường và Quyền Hạn

| Module | Route Path | Route Name | Plugin Gate | Authority (`meta.authority`) | Icon |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `dashboard.ts` | `/dashboard/analytics` | `Analytics` | `core-iam` | _(authenticated)_ | `lucide:area-chart` |
| `tenants.ts` | `/tenants` | `Tenants` | `core-iam` | `['superadmin', 'tenants:read']` | `lucide:building-2` |
| `tenants.ts` | `/tenants/:id` | `TenantDetail` | `core-iam` | `['superadmin', 'tenants:read']` | `lucide:building-2` |
| `fleet.ts` | `/fleet/devices` | `FleetDevices` | `runners` | `['superadmin', 'runners:devices:read']` | `lucide:laptop` |
| `fleet.ts` | `/fleet/browsers` | `FleetBrowsers` | `runners` | `['superadmin', 'runners:browsers:read']` | `lucide:globe` |
| `fleet.ts` | `/fleet/proxies` | `FleetProxies` | `runners` | `['superadmin', 'runners:proxies:read']` | `lucide:network` |
| `automation.ts` | `/automation/workflows` | `AutomationWorkflows` | `automa` | `['superadmin', 'automa:workflows:read']` | `lucide:git-branch` |
| `automation.ts` | `/automation/runs` | `AutomationRuns` | `automa` | `['superadmin', 'automa:campaigns:read']` | `lucide:play-circle` |
| `automation.ts` | `/automation/runs/:id` | `AutomationRunDetail` | `automa` | `['superadmin', 'automa:logs:read']` | `lucide:file-text` |
| `system.ts` | `/system/plugins` | `SystemPlugins` | `core-iam` | `['superadmin', 'plugins:read']` | `lucide:puzzle` |
| `system.ts` | `/system/plans` | `SystemPlans` | `subscriptions` | `['superadmin', 'subscriptions:read']` | `lucide:credit-card` |

### 4.2. Tuyến Chuyển Hướng Tiện Ích (Navigation Shortcuts & Redirects)

Trong `modules/dashboard.ts`, các đường dẫn phụ trợ được khai báo dưới dạng redirect với cờ `meta.hideInMenu: true`:

- `/dashboard` → redirect `/dashboard/analytics`
- `/dashboard/workspace` → redirect `/tenants`
- `/dashboard/workspace/:id` → redirect `/tenants/:id`
- `/dashboard/fleet` → redirect `/fleet/devices`

### 4.3. Plugin Gating (`filterRoutesByPlugins`)

Khai báo tại `src/router/plugin-gate.ts`:

```ts
import type { RouteRecordRaw } from 'vue-router';

/**
 * Filter route tree by checking meta.plugin against installed system plugins.
 * If a route requires a plugin that is not installed, it is omitted.
 * If all children of a parent route are omitted, the parent route is omitted.
 */
export function filterRoutesByPlugins(
  routes: RouteRecordRaw[],
  installedPlugins: string[],
): RouteRecordRaw[] {
  const result: RouteRecordRaw[] = [];

  for (const route of routes) {
    const requiredPlugin = (route.meta as { plugin?: string } | undefined)
      ?.plugin;
    if (requiredPlugin && !installedPlugins.includes(requiredPlugin)) {
      continue;
    }

    const cloned = { ...route };
    if (cloned.children && cloned.children.length > 0) {
      cloned.children = filterRoutesByPlugins(
        cloned.children,
        installedPlugins,
      );
      if (cloned.children.length === 0 && !cloned.component) {
        // Layout parent with all children filtered out -> prune
        continue;
      }
    }
    result.push(cloned);
  }

  return result;
}
```

Tích hợp tại `src/router/access.ts`:

```ts
async function generateAccess(options: GenerateMenuAndRoutesOptions) {
  let installedPlugins: string[] = ['core-iam'];
  try {
    installedPlugins = await getInstalledPluginsApi();
  } catch (error) {
    console.warn(
      'Failed to load installed plugins, defaulting to core-iam:',
      error,
    );
  }

  const filteredRoutes = filterRoutesByPlugins(
    options.routes,
    installedPlugins,
  );

  return await generateAccessible(preferences.app.accessMode, {
    ...options,
    routes: filteredRoutes,
    // ...
  });
}
```

### 4.4. Quy Chuẩn Placeholder Views (No Mock Data)

Các placeholder view mới (`browsers`, `proxies`, `workflows`, `runs`, `plugins`, `plans`) tuân thủ nghiêm ngặt:

- Sử dụng Design Token Semantic Shadcn: `bg-card`, `border-border/60`, `rounded-xl`.
- Icon Lucide trung tâm: kích thước `size-8 text-muted-foreground`.
- Tiêu đề màn hình và badge trạng thái rõ ràng (ví dụ: "Ready for telemetry integration").
- **Tuyệt đối 0 mock data**, 0 bảng số ảo, 0 văn bản tiếng Trung (AGENTS.md §5).

---

## 5. Acceptance Criteria (Tiêu Chí Nghiệm Thu)

- [ ] **AC1:** Truy cập `/dashboard` hoặc `/dashboard/analytics` chuyển thẳng vào trang Analytics thật.
- [ ] **AC2:** Truy cập `/dashboard/workspace` tự động chuyển hướng đến `/tenants`.
- [ ] **AC3:** Truy cập `/dashboard/workspace/:id` tự động chuyển hướng đến `/tenants/:id`.
- [ ] **AC4:** Truy cập `/dashboard/fleet` tự động chuyển hướng đến `/fleet/devices`.
- [ ] **AC5:** Sidebar menu hiển thị tối đa 5 nhóm chính:
  1. **Dashboard** (`/dashboard/analytics`)
  2. **Workspaces** (`/tenants`)
  3. **Fleet** (`/fleet/devices`, `/fleet/browsers`, `/fleet/proxies`)
  4. **Automation** (`/automation/workflows`, `/automation/runs`)
  5. **System** (`/system/plugins`, `/system/plans`)
- [ ] **AC6:** Toàn bộ biểu tượng trên thanh menu và màn hình đều là Lucide Icons (`building-2`, `cpu`, `workflow`, `shield-check`, v.v.), không có Emoji.
- [ ] **AC7:** Khi mock `getInstalledPluginsApi()` không trả về `'automa'`, nhóm menu `/automation` và toàn bộ route con bị ẩn hoàn toàn khỏi menu và không thể truy cập.
- [ ] **AC8:** Khi mock `getInstalledPluginsApi()` không trả về `'subscriptions'`, route con `/system/plans` bị loại bỏ trong khi `/system/plugins` vẫn hoạt động bình thường.
- [ ] **AC9:** User thường không có quyền `runners:devices:read` sẽ không thấy `/fleet/devices` trên menu và bị chặn 403 nếu truy cập trực tiếp.
- [ ] **AC10:** Superadmin (`roles` có `'superadmin'`) truy cập được toàn bộ các module đã cài đặt plugin.
- [ ] **AC11:** Unit tests cho `filterRoutesByPlugins` đạt 100% pass với đầy đủ các ca biên.
- [ ] **AC12:** Tất cả lệnh kiểm định chất lượng:
  ```bash
  pnpm exec vitest run apps/web-admin/src/router
  pnpm --filter @tuquet/admin-web run typecheck
  npx oxlint apps/web-admin/src/
  pnpm run lint
  pnpm run build:admin
  ```
  đều kết thúc thành công với **0 errors, 0 warnings**.

---

## 6. Edge Cases & Error Handling

1. **Lỗi mạng khi tải danh sách plugin (`getInstalledPluginsApi` fail):**
   - Không làm sập ứng dụng hay chặn đăng nhập; rơi về `['core-iam']` để người dùng vẫn truy cập được các tính năng cốt lõi (Workspaces, Analytics).
2. **Parent route không có component và mọi children bị lọc:**
   - Hàm `filterRoutesByPlugins` tự động cắt tỉa (prune) nhánh cha rỗng, tránh tạo ra menu cha vô hình hoặc bị kẹt khi click.
3. **Người dùng gõ URL cũ có query string hoặc hash:**
   - Các redirect route bảo toàn query parameters và params khi chuyển hướng sang URL mới.
4. **Mobile Viewport (<640px):**
   - Menu hiển thị trong Drawer của Vben; các link mới bấm chạm tối thiểu 40px không tràn layout.

---

## 7. Status & Sign-off Request

Spec này được xây dựng dựa trên kiến trúc hệ thống và Capability Map đã duyệt.

> [!IMPORTANT] **Theo quy trình Spec-Driven Development, Agent dừng turn tại đây để User xem xét và phê duyệt `SPEC-route-foundation.md` trước khi tiến hành lập kế hoạch chi tiết (Phase 2: Plan & Tasks) và triển khai mã nguồn.**
