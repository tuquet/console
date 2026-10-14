# Spec: `data-access`

> Module id: `data-access` (xem [capability-map.md](capability-map.md)) — **ĐÃ HOÀN THÀNH** | Kiến trúc nguồn: [`docs/architecture/overview.md`](../architecture/overview.md)

## Objective

Admin hiện không đọc được bảng ngoài schema `public`, và đang hardcode quyền (`roles: ['super','admin']`, access codes `['super','admin','user']`). Module này sửa tầng truy cập dữ liệu để các module sau dựa vào được:

1. `supabaseRequest()` đọc/ghi được mọi schema đã expose (`runners`, `automa`, `billing`, `media`, `events`).
2. Quyền giao diện tính từ DB thật, theo hai chế độ (D1):
   - **Superadmin** (`app_metadata.platform_role = 'superadmin'` trong JWT): có toàn bộ `public.permissions`.
   - **User thường**: hợp các `permission_id` từ các role của user trong mọi tenant đang `active`.
3. Danh sách plugin `installed` từ `public.system_plugins`.

**Người dùng:** người vận hành đăng nhập admin. **Thành công:** sau đăng nhập, `userInfo.roles` và `accessCodes` chứa permission id thật; không còn chuỗi `'super'`, `'admin'`, `'user'` hardcode.

**Ngoài phạm vi:** đổi route/menu (`route-foundation`), sửa `fleet.ts` / `workspace-detail.ts` (các module sau), migration ở `cloud`.

## Tech Stack

Vue 3 + Vben (`@vben/stores`, `@vben/access` chế độ `frontend`), fetch API, Supabase PostgREST + GoTrue. Không thêm dependency.

## Commands

```bash
pnpm --filter @tuquet/admin-web run typecheck
pnpm exec vitest run apps/web-admin/src/api/core
npx oxlint apps/web-admin/src/
pnpm run lint
pnpm run build:admin
```

## Project Structure

```
apps/web-admin/src/api/core/
  supabase-client.ts      # + option `schema`
  access.ts               # MỚI: getEffectiveAccessApi(), getInstalledPluginsApi(), helpers thuần
  auth.ts                 # getAccessCodesApi() -> dùng access.ts
  user.ts                 # getUserInfoApi().roles -> dùng access.ts
  __tests__/access.test.ts
```

## Thiết kế

### 1. `supabaseRequest` + schema

```ts
export interface SupabaseRequestOptions extends RequestInit {
  preferRepresentation?: boolean;
  schema?: SupabaseSchema; // default 'public' -> không gửi header
}
export type SupabaseSchema =
  'automa' | 'billing' | 'events' | 'media' | 'public' | 'runners';

// method GET/HEAD -> 'Accept-Profile'; còn lại -> 'Content-Profile'
```

### 2. `access.ts`

```ts
export interface EffectiveAccess {
  isSuperadmin: boolean;
  permissions: string[]; // đã unique + sort
  tenantPermissions: Record<string, string[]>; // tenant_id -> permissions (rỗng với superadmin)
}

export function readPlatformRole(accessToken: string): null | string; // decode payload JWT (base64url), không verify
export function flattenMemberships(
  rows: MembershipRow[],
): Pick<EffectiveAccess, 'permissions' | 'tenantPermissions'>;
export async function getEffectiveAccessApi(): Promise<EffectiveAccess>;
export async function getInstalledPluginsApi(): Promise<string[]>;
```

Request dùng:

| Mục đích | Request |
| :-- | :-- |
| Superadmin | `GET /rest/v1/permissions?select=id` |
| User thường | `GET /rest/v1/tenant_members?user_id=eq.<uid>&status=eq.active&select=tenant_id,member_roles(roles(role_permissions(permission_id)))` |
| Plugin | `GET /rest/v1/system_plugins?status=eq.installed&select=id` |

`uid` lấy từ claim `sub` của access token (tránh gọi thêm `/auth/v1/user`).

### 3. Nối vào luồng hiện có

- `getAccessCodesApi()` → `(await getEffectiveAccessApi()).permissions`.
- `getUserInfoApi().roles` → cùng danh sách, cộng thêm `'superadmin'` nếu là superadmin (để `meta.authority` ở module sau dùng được).
- Gọi `getEffectiveAccessApi()` **một lần** cho mỗi lần đăng nhập. Hiện `store/auth.ts` gọi `fetchUserInfo()` và `getAccessCodesApi()` song song → cache promise trong `access.ts`, xóa cache khi logout.
- Lỗi mạng/RLS → ném lỗi (guard hiện có sẽ logout). **Cấm** fallback về danh sách hardcode.

## Code Style

Theo code hiện có: hàm `xxxApi` async, export interface, dùng chung `supabaseRequest`, comment tiếng Anh, `encodeURIComponent` cho tham số URL.

```ts
export async function getInstalledPluginsApi(): Promise<string[]> {
  const rows = await supabaseRequest<{ id: string }[]>(
    '/rest/v1/system_plugins?status=eq.installed&select=id',
  );
  return rows.map((r) => r.id);
}
```

## Testing Strategy

- **Unit (Vitest)** cho hàm thuần: `readPlatformRole` (token hợp lệ / thiếu claim / sai định dạng), `flattenMemberships` (nhiều tenant, role trùng quyền, `member_roles` rỗng), chọn header theo method/schema.
- **Local integration** với Supabase local (`cloud`): đăng nhập `admin@tuquet.com` → `accessCodes` chứa `tenants:read`, `runners:devices:read`, …, không chứa `'super'`. Kiểm `GET /rest/v1/devices` với `schema: 'runners'` trả 200.
- Typecheck, oxlint, lint, build đều 0 lỗi (AGENTS §6–7).

## Boundaries

- **Always:** đi qua `supabaseRequest`; duy trì thiết kế chuẩn (`schema` là tùy chọn, mặc định `public`); chạy đủ quality gate trước commit.
- **Ask first:** sửa repo `cloud`; đổi `accessMode` của Vben; thêm store Pinia mới.
- **Never:** tin `user_metadata` để xác định superadmin (user tự sửa được); dùng `permissions` trong JWT (bị cắt ở 25); fallback dữ liệu/quyền giả; push khi chưa qua gate.

## Success Criteria

1. `supabaseRequest('/rest/v1/devices?select=id', { schema: 'runners' })` gửi `Accept-Profile: runners`; POST/PATCH/DELETE gửi `Content-Profile`.
2. Không còn chuỗi `'super'`, `'user'` hardcode trong `auth.ts` / `user.ts`.
3. User thường: `accessCodes` = đúng hợp quyền từ DB (đối chiếu bằng SQL trên DB local).
4. JWT có `platform_role = 'superadmin'`: `accessCodes` = toàn bộ `public.permissions`, `roles` có `'superadmin'`.
5. Mỗi lần đăng nhập chỉ có 1 request tính quyền.
6. Unit test pass; typecheck / oxlint / lint / build 0 lỗi.
7. Các trang hiện có (Analytics, Workspace, Fleet) vẫn mở được như trước — module này không đổi route.

## Resolved Decisions (2026-10-13)

1. **Cloud Migration:** Đã được cập nhật trực tiếp tại `tuquet/cloud/supabase/migrations/20261011000001_core_iam.sql`, `seed_admin_tuquet.sql`, `seed.sql`, và `plugins/subscriptions/install.sql`.
2. **Superadmin Scope:** Superadmin có đầy đủ quyền **xem và sửa** trên toàn bộ hệ thống (`is_platform_admin()` short-circuit tất cả RLS và guards).
3. **Status:** **APPROVED** — sẵn sàng chuyển sang Phase 2 (Plan) và Phase 3 (Tasks).
