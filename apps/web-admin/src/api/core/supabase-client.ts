import type { SupabaseSchema } from '@vben/constants';

import { $t } from '@vben/locales';
import { useAccessStore } from '@vben/stores';

import { addNetworkBreadcrumb, captureError } from '../../utils/bugsink';

export { SUPABASE_SCHEMA } from '@vben/constants';
export type { SupabaseSchema };

export interface SupabaseRequestOptions extends RequestInit {
  _isRetry?: boolean;
  _retryToken?: string;
  preferRepresentation?: boolean;
  schema?: SupabaseSchema;
  skipAuth?: boolean;
}

export interface SupabaseAuthError extends Error {
  isAuthError: boolean;
  status?: number;
}

type UnauthorizedHandler = () => Promise<void> | void;

let unauthorizedHandler: null | UnauthorizedHandler = null;
let refreshPromise: null | Promise<null | string> = null;
let unauthorizedPromise: null | Promise<void> = null;

/**
 * Registers the application-level handler invoked when a 401/expired JWT
 * cannot be refreshed (e.g. clear stores, show toast, redirect to login).
 */
export function setSupabaseUnauthorizedHandler(
  handler: null | UnauthorizedHandler,
): void {
  unauthorizedHandler = handler;
}

/**
 * Safely decodes the JSON payload of a JWT token using standard Web APIs (UTF-8 safe).
 */
export function decodeJwtPayload<T = Record<string, any>>(
  token?: null | string,
): null | T {
  if (!token || typeof token !== 'string') {
    return null;
  }
  const parts = token.split('.');
  if (parts.length < 2 || !parts[1]) {
    return null;
  }
  try {
    const base64 = parts[1].replaceAll('-', '+').replaceAll('_', '/');
    const padLength = (4 - (base64.length % 4)) % 4;
    const padded = base64.padEnd(base64.length + padLength, '=');
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.codePointAt(0) ?? 0);
    const jsonStr = new TextDecoder('utf-8').decode(bytes);
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}

/**
 * Safely checks whether a JWT token has an `exp` claim that has already passed
 * (or will expire within `bufferSeconds`).
 * Returns `false` for non-JWT strings or tokens without a numeric `exp` claim.
 */
export function isJwtTokenExpired(
  token?: null | string,
  bufferSeconds = 10,
): boolean {
  const payload = decodeJwtPayload<{ exp?: number }>(token);
  if (typeof payload?.exp !== 'number') {
    return false;
  }
  return payload.exp * 1000 <= Date.now() + bufferSeconds * 1000;
}

/**
 * Type guard checking if an error was raised by Supabase authentication expiration.
 */
export function isSupabaseAuthError(
  error: unknown,
): error is SupabaseAuthError {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'isAuthError' in error &&
    (error as SupabaseAuthError).isAuthError === true,
  );
}

/**
 * Checks whether a Supabase HTTP error response indicates an expired or invalid JWT.
 */
export function isUnauthorizedResponse(
  status: number,
  errorJson?: Record<string, any>,
): boolean {
  if (status === 401) {
    return true;
  }
  const code = String(errorJson?.code || errorJson?.error_code || '');
  if (code === 'PGRST301' || code === 'bad_jwt') {
    return true;
  }
  const msg = String(
    errorJson?.message || errorJson?.msg || errorJson?.error_description || '',
  );
  return /jwt expired|invalid jwt|token is expired/i.test(msg);
}

function createAuthError(message: string, status = 401): SupabaseAuthError {
  const error = new Error(message) as SupabaseAuthError;
  error.isAuthError = true;
  error.status = status;
  return error;
}

/**
 * Builds PostgREST schema switching headers.
 * Uses Accept-Profile for read operations (GET/HEAD) and Content-Profile for write operations.
 */
export function buildSupabaseProfileHeaders(
  schema?: SupabaseSchema,
  method: string = 'GET',
): Record<string, string> {
  if (!schema || schema === 'public') {
    return {};
  }
  const upper = method.toUpperCase();
  if (upper === 'GET' || upper === 'HEAD') {
    return { 'Accept-Profile': schema };
  }
  return { 'Content-Profile': schema };
}

export function getSupabaseConfig() {
  const supabaseUrl =
    (import.meta.env.VITE_SUPABASE_URL as string) ||
    'https://dswhacsoaxgpfnkaxnhz.supabase.co';
  const anonKey =
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
    'sb_publishable_8Y-l9FtldJSSuFAWhzICqg_UobFOsua';
  return { anonKey, supabaseUrl };
}

/**
 * Single-flight Supabase GoTrue refresh token exchange.
 * Prevents concurrent 401 responses from racing and invalidating rotated refresh tokens.
 */
export async function tryRefreshSupabaseToken(): Promise<null | string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  const task = (async () => {
    try {
      const accessStore = useAccessStore();
      const currentRefreshToken = accessStore.refreshToken;
      if (!currentRefreshToken) {
        return null;
      }

      const { anonKey, supabaseUrl } = getSupabaseConfig();
      const response = await fetch(
        `${supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
        {
          body: JSON.stringify({ refresh_token: currentRefreshToken }),
          headers: {
            apikey: anonKey,
            'Content-Type': 'application/json',
          },
          method: 'POST',
        },
      );

      if (!response.ok) {
        return null;
      }

      const resJson = (await response.json().catch(() => ({}))) as Record<
        string,
        any
      >;
      const newAccessToken = resJson?.access_token as string | undefined;
      const newRefreshToken = resJson?.refresh_token as string | undefined;

      if (!newAccessToken) {
        return null;
      }

      accessStore.setAccessToken?.(newAccessToken);
      if (newRefreshToken) {
        accessStore.setRefreshToken?.(newRefreshToken);
      }
      return newAccessToken;
    } catch {
      return null;
    }
  })();

  refreshPromise = task.finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

/**
 * Single-flight handler for unrecoverable 401 / expired session states.
 */
export async function handleSupabaseUnauthorized(): Promise<void> {
  if (unauthorizedPromise) {
    return unauthorizedPromise;
  }

  const task = (async () => {
    const accessStore = useAccessStore();
    accessStore.setAccessToken?.(null);
    accessStore.setRefreshToken?.(null);

    if (unauthorizedHandler) {
      await unauthorizedHandler();
      return;
    }

    if (
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/auth/login')
    ) {
      const currentPath = `${window.location.pathname}${window.location.search}`;
      const query =
        currentPath && currentPath !== '/'
          ? `?redirect=${encodeURIComponent(currentPath)}`
          : '';
      window.location.replace(`/auth/login${query}`);
    }
  })();

  unauthorizedPromise = task.finally(() => {
    unauthorizedPromise = null;
  });

  return unauthorizedPromise;
}

/**
 * Universal Supabase HTTP Request client adhering to Dependency Inversion (DIP)
 * Centralizes auth headers, proactive/reactive JWT refresh, 401 interception,
 * URL building, error handling, and representation preferences.
 */
export async function supabaseRequest<T = any>(
  path: string,
  options: SupabaseRequestOptions = {},
): Promise<T> {
  const { anonKey, supabaseUrl } = getSupabaseConfig();
  const accessStore = useAccessStore();
  let token = options._retryToken ?? accessStore.accessToken;

  // 1. Proactive JWT expiry check to avoid unnecessary 401 network errors
  if (!options.skipAuth && token && isJwtTokenExpired(token)) {
    const refreshedToken = await tryRefreshSupabaseToken();
    if (refreshedToken) {
      token = refreshedToken;
    } else {
      await handleSupabaseUnauthorized();
      throw createAuthError('JWT expired', 401);
    }
  }

  const url = path.startsWith('http') ? path : `${supabaseUrl}${path}`;

  const {
    _isRetry,
    _retryToken,
    preferRepresentation,
    schema,
    skipAuth,
    ...fetchInit
  } = options;

  const headers: Record<string, string> = {
    apikey: anonKey,
    'Content-Type': 'application/json',
    ...buildSupabaseProfileHeaders(schema, fetchInit.method),
    ...(fetchInit.headers as Record<string, string>),
  };

  if (preferRepresentation) {
    headers.Prefer = 'return=representation';
  }

  if (!skipAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  const startTime = typeof performance === 'undefined' ? 0 : performance.now();
  try {
    response = await fetch(url, {
      ...fetchInit,
      headers,
    });
    const durationMs = startTime
      ? Math.round(performance.now() - startTime)
      : undefined;
    addNetworkBreadcrumb({
      durationMs,
      method: fetchInit.method || 'GET',
      status: response.status,
      url,
    });
  } catch (error) {
    const durationMs = startTime
      ? Math.round(performance.now() - startTime)
      : undefined;
    addNetworkBreadcrumb({
      durationMs,
      method: fetchInit.method || 'GET',
      status: 0,
      url,
    });
    captureError(error, {
      method: fetchInit.method || 'GET',
      path,
      phase: 'supabase_network',
      schema: schema || 'public',
    });
    throw error;
  }

  if (!response.ok) {
    const errorJson = (await response.json().catch(() => ({}))) as Record<
      string,
      any
    >;

    // 2. Reactive 401 / JWT expired interceptor with single retry after token refresh
    if (!skipAuth && isUnauthorizedResponse(response.status, errorJson)) {
      if (!_isRetry) {
        const latestToken = accessStore.accessToken;
        const refreshedToken =
          latestToken &&
          latestToken !== token &&
          !isJwtTokenExpired(latestToken)
            ? latestToken
            : await tryRefreshSupabaseToken();
        if (refreshedToken) {
          return supabaseRequest<T>(path, {
            ...options,
            _isRetry: true,
            _retryToken: refreshedToken,
          });
        }
      }

      await handleSupabaseUnauthorized();
      throw createAuthError(
        errorJson.message ||
          errorJson.msg ||
          errorJson.error_description ||
          'JWT expired',
        response.status,
      );
    }

    const apiError = new Error(
      errorJson.message ||
        errorJson.msg ||
        errorJson.error_description ||
        $t('authentication.supabaseRequestFailed', { status: response.status }),
    );
    captureError(apiError, {
      errorCode: errorJson.code || errorJson.error_code,
      errorDetails: errorJson.details || errorJson.hint,
      method: fetchInit.method || 'GET',
      path,
      phase: 'supabase_rest',
      schema: schema || 'public',
      status: response.status,
    });
    throw apiError;
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
