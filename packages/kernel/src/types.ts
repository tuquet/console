import type { SupabaseSchema } from '@operon/constants';

export interface KernelAuthContext {
  /** JWT token for authenticated Supabase sessions */
  accessToken: null | string;
  /** True when a valid authenticated cloud session is active */
  hasCloudAuth: boolean;
  /** Active user ID (sub claim from JWT) or 'local-operator' */
  userId: null | string;
  /** Active multi-workspace organization ID */
  workspaceId: null | string;
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

export type NotificationPlatform = 'pwa' | 'tauri' | 'web';

export type NotificationPermissionState =
  | 'default'
  | 'denied'
  | 'granted'
  | 'unsupported';

export type NotificationSeverity = 'error' | 'info' | 'success' | 'warning';

export type NotificationChannel = 'in-app' | 'native' | 'toast';

export interface NotificationPayload {
  /** Optional unique ID (auto-generated when omitted) */
  id?: string;
  /** Notification title */
  title: string;
  /** Detailed notification message */
  body?: string;
  /** Visual severity level for toast & in-app indicator */
  severity?: NotificationSeverity;
  /** Avatar or icon URL */
  icon?: string;
  /** Badge icon URL (used by PWA Service Worker notifications) */
  badge?: string;
  /** Deduplication tag for native Web/PWA notifications */
  tag?: string;
  /** Target route path or external URL when clicked */
  link?: string;
  /** Optional route query params */
  query?: Record<string, unknown>;
  /** Optional route state */
  state?: Record<string, unknown>;
  /** Suppress sound/vibration on native notifications */
  silent?: boolean;
  /**
   * Delivery channels. Defaults to `['in-app', 'toast']`.
   * Include `'native'` to also dispatch an OS/Browser/PWA notification.
   */
  channels?: NotificationChannel[];
}

export interface NativeNotificationOptions {
  badge?: string;
  body?: string;
  data?: Record<string, unknown>;
  icon?: string;
  link?: string;
  onClick?: () => void;
  silent?: boolean;
  tag?: string;
  title: string;
}

export interface NotificationDriver {
  readonly platform: NotificationPlatform;
  getPermission: () => Promise<NotificationPermissionState>;
  isSupported: () => boolean | Promise<boolean>;
  requestPermission: () => Promise<NotificationPermissionState>;
  send: (options: NativeNotificationOptions) => Promise<boolean>;
}

export interface KernelNotificationContext {
  /** Active runtime notification platform ('web' | 'pwa' | 'tauri') */
  readonly platform: NotificationPlatform;
  /** Push a notification across configured channels (in-app, toast, native) */
  push: (payload: NotificationPayload) => Promise<void>;
  /** Query current native notification permission state */
  getPermission: () => Promise<NotificationPermissionState>;
  /** Request native notification permission from the user */
  requestPermission: () => Promise<NotificationPermissionState>;
}

export interface KernelWorkspaceRecord {
  avatarUrl: null | string;
  createdAt: string;
  createdBy: null | string;
  id: string;
  metadata?: Record<string, unknown>;
  name: string;
  plan: string;
  slug: string;
  status: 'active' | 'archived' | 'suspended';
  updatedAt: string;
}

export interface CreateKernelWorkspaceInput {
  name: string;
  plan?: string;
  slug: string;
}

export interface UpdateKernelWorkspacePatch {
  name?: string;
  plan?: string;
  slug?: string;
  status?: 'active' | 'archived' | 'suspended';
}

export interface KernelWorkspaceContext {
  /** Active workspace ID ('local-default', 'local-*', or Cloud workspace UUID) */
  activeId: string;
  /** Active workspace URL-safe slug */
  activeSlug: null | string;
  /** Active workspace display name */
  activeName: null | string;
  /** All accessible workspaces for the active session */
  items: KernelWorkspaceRecord[];
  /** True while workspaces are being loaded or mutated */
  isLoading: boolean;
  /** Refresh workspace list from local store or Cloud */
  refresh?: (force?: boolean) => Promise<KernelWorkspaceRecord[]>;
  /** Switch the host shell's active workspace */
  switchWorkspace?: (id: string) => void;
  /** Create a new local or Cloud workspace */
  createWorkspace?: (
    input: CreateKernelWorkspaceInput,
  ) => Promise<KernelWorkspaceRecord>;
  /** Update workspace name, slug, plan, or status */
  updateWorkspace?: (
    id: string,
    patch: UpdateKernelWorkspacePatch,
  ) => Promise<KernelWorkspaceRecord>;
  /** Delete a custom workspace */
  deleteWorkspace?: (id: string) => Promise<void>;
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
  notifications: Readonly<KernelNotificationContext>;
  workspace: Readonly<KernelWorkspaceContext>;
}
