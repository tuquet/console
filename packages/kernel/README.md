# @operon/kernel — Micro-Frontend Shared Contract & Bridge

> **Mô hình:** Hợp đồng giao tiếp kiểu dữ liệu (Contract SSOT) và cầu nối trung tâm giữa Host Shell (`@operon/shell`) và các ứng dụng vệ tinh (Micro-Apps).

---

## 1. Mục đích Kiến trúc

Để đạt được tiêu chí **Decoupling hoàn toàn**, các Micro-Apps (`@operon/automation`, `@operon/system`) **tuyệt đối không được import trực tiếp** các Store hay hàm nội bộ của Shell.

Thay vào đó:

1. **Shell** triển khai `KernelContext` và cung cấp qua Vue injection:
   ```ts
   // Tại apps/shell
   import { KERNEL_INJECTION_KEY } from '@operon/kernel';
   app.provide(KERNEL_INJECTION_KEY, hostKernel);
   ```
2. **Micro-App** tiêu thụ context thông qua hook chuẩn:
   ```ts
   // Tại micro-app
   import { useKernel } from '@operon/kernel';
   const kernel = useKernel();
   console.log(kernel.auth.userId, kernel.auth.tenantId);
   kernel.events.notify('success', 'Thao tác thành công');
   ```
3. **Chế độ Dev Offline (Standalone):**
   ```ts
   // Micro-app tự chạy độc lập không cần Shell
   import { createMockKernel, KERNEL_INJECTION_KEY } from '@operon/kernel';
   app.provide(KERNEL_INJECTION_KEY, createMockKernel());
   ```

---

## 2. Giao diện Hợp đồng (Contract API)

```ts
export interface KernelAuthContext {
  accessToken: null | string;
  hasCloudAuth: boolean;
  userId: null | string;
  tenantId: null | string;
  roles: string[];
  isSuperadmin: boolean;
  username?: string;
}

export interface KernelApiContext {
  supabaseRequest: <T = any>(path: string, options?: any) => Promise<T>;
  localDaemonFetch: <T = any>(
    endpoint: string,
    options?: RequestInit,
  ) => Promise<T>;
  daemonPort: number;
}

export interface KernelEventContext {
  notify: (
    type: 'error' | 'info' | 'success' | 'warning',
    message: string,
  ) => void;
  openLoginModal: () => void;
  navigate: (path: string) => void;
}

export interface KernelContext {
  auth: Readonly<KernelAuthContext>;
  api: Readonly<KernelApiContext>;
  events: Readonly<KernelEventContext>;
}
```

---

## 3. Quy tắc Versioning (SemVer)

- Mọi thay đổi trong `@operon/kernel` phải đảm bảo tương thích ngược tối đa (Backward Compatibility).
- Khi thêm thuộc tính mới vào `KernelContext` (Minor version), các micro-apps cũ vẫn hoạt động bình thường mà không cần cập nhật.
