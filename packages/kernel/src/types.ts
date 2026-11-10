import type { SupabaseSchema } from '@operon/constants';

export interface KernelAuthContext {
  /** JWT token for authenticated Supabase sessions */
  accessToken: null | string;
  /** True when a valid authenticated cloud session is active */
  hasCloudAuth: boolean;
  /** Active user ID (sub claim from JWT) or 'local-operator' */
  userId: null | string;
  /** Active multi-tenant organization ID */
  tenantId: null | string;
  /** User role identifiers, e.g. ['superadmin'], ['local_operator'] */
  roles: string[];
  /** True if the user has platform superadmin privileges */
  isSuperadmin: boolean;
  /** Display username or nickname */
  username?: string;
}

/** Public cloud request options. Retry state stays inside the host client. */
export interface KernelRequestOptions extends RequestInit {
  preferRepresentation?: boolean;
  schema?: SupabaseSchema;
  skipAuth?: boolean;
  suppressErrorCapture?: boolean;
}

export interface KernelApiContext {
  /** Centralized Supabase PostgREST client invoking cloud tables */
  supabaseRequest: <T = unknown>(
    path: string,
    options?: KernelRequestOptions,
  ) => Promise<T>;
  /** Client for invoking device-local CLI daemon (opn) on port 8765 */
  localDaemonFetch: <T = unknown>(
    endpoint: string,
    options?: RequestInit,
  ) => Promise<T>;
  /** Base URL / port of local daemon (default: 8765) */
  daemonPort: number;
}

export interface KernelEventContext {
  /** Push global notification toast */
  notify: (
    type: 'error' | 'info' | 'success' | 'warning',
    message: string,
  ) => void;
  /** Open host-level authentication modal when cloud auth is requested */
  openLoginModal: () => void;
  /** Navigate across routes */
  navigate: (path: string) => void;
}

export interface KernelContext {
  auth: Readonly<KernelAuthContext>;
  api: Readonly<KernelApiContext>;
  events: Readonly<KernelEventContext>;
}
