# Kiến Trúc Hệ Thống Tuquet Admin (Tuquet Admin Architecture)

> **Mã tài liệu:** `ARCH-ADMIN-OVERVIEW`  
> **Áp dụng cho:** `tuquet/admin` (`apps/web-admin`)  
> **Backend gắn kết (SSOT):** `tuquet/cloud/supabase`  
> **Trạng thái:** **ACTIVE & ACCEPTED**  
> **Tài liệu đặc tả từng route:** [`docs/routes/README.md`](../routes/README.md)  
> **Chuẩn thiết kế giao diện:** [`docs/architecture/styling-guide.md`](styling-guide.md)

---

## 1. Tổng Quan Hệ Thống (System Overview)

`admin.tuquet.com` là bảng điều khiển quản trị tập trung (Admin Console) của **Hệ sinh thái Tuquet**, đảm nhiệm 3 nhiệm vụ cốt lõi:
1. **Multi-Tenant IAM:** Quản lý danh tính, phân quyền thành viên và tổ chức không gian làm việc (Workspaces / Tenants).
2. **Runners Fleet Control:** Điều phối và giám sát hạ tầng máy trạm phân tán (Specter Desk, Headless Runners, Chromium automation profiles, Proxy pool).
3. **Automa Engine Telemetry:** Giám sát kịch bản quy trình tự động hóa (Workflows), tiến độ các đợt chạy (Campaign Runs) và nhật ký thực thi (Execution Logs).

Hệ thống kết nối trực tiếp đến **Tuquet Cloud** (`tuquet/cloud/supabase`), tương tác với các schema chuyên biệt qua chuẩn PostgREST và tuân thủ nghiêm ngặt bảo mật Row Level Security (RLS).

---

## 2. Các Nguyên Tắc Thiết Kế Cốt Lõi (Core Principles)

1. **KISS & YAGNI (Keep It Simple, Stupid & You Aren't Gonna Need It):**
   - Loại bỏ thanh Tabbar Chrome ảo trong SPA (`preferences.tabbar.enable = false`) để tiết kiệm không gian màn hình.
   - Header tối giản với đúng 3 thành phần: Logo Tuquet, nút chuyển Dark/Light Slate, Avatar & Menu người dùng.
   - Sidebar giới hạn trong tối đa 5 nhóm chức năng chính.
2. **Dữ Liệu Đo Đếm Thực Tế (100% Real Telemetry — Zero Mock Data):**
   - Tuyệt đối không dùng Mock Data hay số liệu giả lập. Toàn bộ số liệu trên console phản ánh chính xác trạng thái thực tế từ cơ sở dữ liệu và telemetry máy trạm.
   - Khi bảng dữ liệu rỗng, hiển thị Empty State chuẩn mực kèm biểu tượng Lucide và hướng dẫn kết nối.
3. **Ưu Tiên Thiết Kế Di Động (Mobile-First Dual View):**
   - **Desktop (`hidden md:block`):** Data Table phẳng, viền `border-border/60`, hỗ trợ lọc, sắp xếp và phân trang.
   - **Mobile (`block md:hidden`):** Touch Cards cảm ứng, touch target tối thiểu 40px, loại bỏ hoàn toàn tràn vỡ layout hoặc cuộn ngang.
4. **Quy Chuẩn Semantic Design Tokens & Iconography:**
   - Chia sẻ bộ Design Tokens HSL trong `internal/tailwind-config/src/theme.css` (`--background`, `--foreground`, `--primary`, `--border`, `--radius`).
   - Duy nhất sử dụng [Lucide Icons](https://lucide.dev/) (`@lucide/vue`), nghiêm cấm sử dụng Emoji làm biểu tượng hệ thống.

---

## 3. Kiến Trúc Đa Schema PostgREST (Multi-Schema Protocol)

Tuquet Cloud phân tách dữ liệu thành các schema chuyên biệt nhằm đảm bảo tính toàn vẹn và cô lập dữ liệu:

| Tên Schema | Phạm Vi Chức Năng | Bảng Dữ Liệu Tiêu Biểu | Header PostgREST Bắt Buộc |
| :-- | :-- | :-- | :-- |
| `public` | Quản lý danh tính, Workspace, RBAC, Plugins | `tenants`, `profiles`, `system_plugins`, `roles`, `permissions`, `audit_logs` | _(Mặc định — không cần header)_ |
| `runners` | Quản lý thiết bị máy trạm, Chromium, Proxies | `devices`, `browsers`, `proxies` | `Accept-Profile: runners` |
| `automa` | Kịch bản đồ họa, chiến dịch chạy, nhật ký bước | `workflows`, `campaign_runs`, `execution_logs` | `Accept-Profile: automa` |
| `billing` | Hợp đồng thuê bao SaaS, bảng giá gói cước | `subscriptions`, `plans`, `usage_meters` | `Accept-Profile: billing` |
| `media` | Tệp tin lưu trữ và tài nguyên đa phương tiện | `assets`, `buckets` | `Accept-Profile: media` |

### Hợp Đồng Giao Tiếp API Client:

Toàn bộ các truy vấn HTTP tới Supabase sử dụng hàm dùng chung `supabaseRequest<T>()` tại [`apps/web-admin/src/api/core/supabase-client.ts`](../../apps/web-admin/src/api/core/supabase-client.ts):

```typescript
export interface SupabaseRequestOptions extends RequestInit {
  preferRepresentation?: boolean;
  schema?: 'automa' | 'billing' | 'events' | 'media' | 'public' | 'runners';
}
// GET / HEAD -> headers['Accept-Profile'] = schema
// POST / PATCH / DELETE -> headers['Content-Profile'] = schema
```

---

## 4. Mô Hình Phân Quyền & Hai Chế Độ Truy Cập (Security & Access Models)

Hệ thống vận hành theo 2 chế độ truy cập rõ rệt:

```mermaid
flowchart TD
    User([Người dùng đăng nhập]) --> CheckRole{Có platform_role = 'superadmin'?}

    CheckRole -- Có --> SuperadminMode[Chế Độ Platform Superadmin]
    SuperadminMode --> BypassRLS[Bypass RLS qua public.is_platform_admin]
    SuperadminMode --> FullAccess[Toàn quyền quản trị nền tảng: /system/* & toàn bộ Workspaces]

    CheckRole -- Không --> TenantMode[Chế Độ Multi-Tenant Member]
    TenantMode --> NormalRLS[Áp dụng nghiêm ngặt RLS get_user_tenant_ids]
    TenantMode --> DBPerms[Tính quyền động từ DB: tenant_members -> roles -> permissions]
    TenantMode --> ScopedAccess[Chỉ truy cập các Workspace mà user là thành viên]
```

### 4.1. Chế Độ Multi-Tenant Member (User Thông Thường)
- **Cô lập RLS:** Người dùng chỉ có thể xem và thao tác trên những tenant mà họ là thành viên thông qua hàm `get_user_tenant_ids()`.
- **Động hóa quyền hạn từ Database:**
  - Tuyệt đối không suy quyền giao diện từ JWT claim (JWT hook bị giới hạn 25 permissions, trong khi Owner có tới 36 quyền).
  - Quyền hạn được truy vấn trực tiếp từ cơ sở dữ liệu qua chuỗi quan hệ: `tenant_members` $\rightarrow$ `member_roles` $\rightarrow$ `roles` $\rightarrow$ `role_permissions`.
  - Kết quả được lưu bộ nhớ đệm (single-flight in-memory cache) cho mỗi phiên làm việc để tối ưu số lần gọi mạng.

### 4.2. Chế Độ Platform Superadmin (Quản Trị Nền Tảng)
- **Nhận diện danh tính:** Tài khoản sở hữu claim `raw_app_meta_data.platform_role = 'superadmin'` trong bảng `auth.users` (chỉ có thể gán bởi service role backend).
- **Cơ chế Bypass RLS:** Hàm bảo mật `public.is_platform_admin()` kiểm tra claim trên; các chính sách RLS cho phép tài khoản superadmin đọc toàn bộ dữ liệu trên mọi tenant (`public.tenants`, `public.profiles`, `public.audit_logs`, `billing.subscriptions`).
- **Giao diện:** Router gán quyền `superadmin` vào bộ quyền hiệu lực, mở khóa 4 màn hình quản trị cấp cao tại `/system/users`, `/system/audit-logs`, `/system/subscriptions`, `/system/roles`.

---

## 5. Bộ Lọc Định Tuyến Plugin Gate (`plugin-gate.ts`)

Mỗi cụm route nghiệp vụ trong hệ thống được gắn liền với một **Plugin ID** trong bảng `public.system_plugins`:

```mermaid
graph LR
    CoreIAM["core-iam"] --> D["/dashboard"]
    CoreIAM --> T["/tenants"]
    CoreIAM --> S1["/system/plugins, /system/users, /system/audit-logs, /system/roles"]
    Runners["runners"] --> F["/fleet (devices, browsers, proxies)"]
    Automa["automa"] --> A["/automation (workflows, runs)"]
    Subs["subscriptions"] --> S2["/system/plans, /system/subscriptions"]
```

Khi ứng dụng khởi chạy, hàm thuần khiết `filterRoutesByPlugins(routes, installedPluginIds)` tự động ẩn toàn bộ các nhánh route có plugin chưa mang trạng thái `installed`.

---

## 6. Cơ Chế Giám Sát Tác Vụ & Polling (Telemetry & Polling)

- **Chiến lược Polling 3s:** Do bảng nhật ký `automa.execution_logs` phát sinh lưu lượng bản ghi lớn trong các chiến dịch tự động hóa hàng loạt, việc đưa bảng này vào WebSocket Realtime publication sẽ gây nghẽn băng thông.
- Giao diện chi tiết lần chạy (`/automation/runs/:id`) thực hiện cơ chế polling định kỳ mỗi **3000ms** khi lần chạy ở trạng thái hoạt động (`pending`, `queued`, `running`).
- Khi trạng thái chuyển sang kết thúc (`completed`, `failed`, `cancelled`), bộ đếm thời gian được hủy ngay lập tức để tiết kiệm tài nguyên mạng và pin thiết bị.

---

## 7. Cây Định Tuyến Tổng Thể (Master Route Tree)

Hệ thống quản trị bao gồm **22 tuyến đường** chuẩn mực:

```text
/                                   BasicLayout (Chuyển hướng mặc định -> /dashboard/analytics)
├── /dashboard                      [core-iam]        lucide:layout-dashboard
│   └── /dashboard/analytics        Thống kê Telemetry thực tế từ Cloud & Loopback
├── /tenants                        [core-iam]        lucide:building-2
│   ├── /tenants                    Danh sách Workspace (Dual View)
│   └── /tenants/:id                Chi tiết Workspace (4 tabs: overview, members, usage, audit)
├── /fleet                          [runners]         lucide:cpu
│   ├── /fleet/devices              Thiết bị & Nodes Specter Desk / Cloud VPS
│   ├── /fleet/browsers             Phiên bản Chromium tự động hóa
│   └── /fleet/proxies              Pool Proxy mạng phân tán
├── /automation                     [automa]          lucide:workflow
│   ├── /automation/workflows       Sơ đồ kịch bản Canvas Workflows
│   ├── /automation/runs            Lịch sử các đợt chạy chiến dịch
│   └── /automation/runs/:id        Chi tiết lần chạy & Terminal Logs Viewer (Polling 3s)
└── /system                         [core-iam]        lucide:shield-check
    ├── /system/plugins             Danh mục Microservice Plugins đã cài đặt
    ├── /system/plans               [subscriptions]   Bảng giá cước & Quotas SaaS
    ├── /system/users               [superadmin]      Người dùng toàn nền tảng
    ├── /system/audit-logs          [superadmin]      Nhật ký kiểm toán an ninh toàn cầu
    ├── /system/subscriptions       [superadmin]      Quản lý hợp đồng thuê bao các Workspace
    └── /system/roles               [superadmin]      Ma trận 4 System Roles & 36 Permissions

Core & Auth (AuthPageLayout):
/auth/login, /auth/register, /auth/forget-password, /auth/reset-password, /auth/callback, /auth/desktop, /profile
```

---

## 8. Tiêu Chuẩn Giao Tiếp Mạng Cục Bộ (Private Network Access - PNA)

Khi Admin Console thực hiện thăm dò hoặc chuyển giao phiên đăng nhập SSO xuống daemon máy trạm Specter Desk (`http://127.0.0.1:8765`):
1. **Lệnh Probe Analytics:** Gửi qua `fetch` với `mode: 'no-cors'` và `AbortController` timeout tối đa $1200\text{ms}$. Lỗi mạng được xử lý ngầm (non-blocking) để đảm bảo trang web vẫn render bình thường ngay cả khi daemon chưa khởi động.
2. **Desktop SSO Bridge (`/auth/desktop`):** Nhận `redirect_uri=http://127.0.0.1:8765/sso/callback`, xác thực phiên với Tuquet Cloud và POST token về loopback port cục bộ.
