import { useAccessStore } from '@vben/stores';

import { getEffectiveAccessApi } from './access';
import { getSupabaseConfig } from './supabase-client';

export namespace AuthApi {
  /** Login API parameters */
  export interface LoginParams {
    captchaToken?: string;
    password?: string;
    username?: string;
  }

  /** Login API response */
  export interface LoginResult {
    accessToken: string;
    refreshToken?: string;
  }

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }
}

/**
 * Login (Supabase GoTrue REST)
 */
export async function loginApi(
  data: AuthApi.LoginParams,
): Promise<AuthApi.LoginResult> {
  const { anonKey, supabaseUrl } = getSupabaseConfig();
  const email = (data.username || '').trim();
  const password = data.password || '';
  const captchaToken = data.captchaToken;

  // Verify Turnstile with Cloudflare Pages Function if available (non-blocking)
  if (captchaToken) {
    try {
      const verifyRes = await fetch('/api/verify-turnstile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: captchaToken }),
      });
      if (verifyRes.ok) {
        const result = (await verifyRes.json().catch(() => ({}))) as any;
        if (result.success === false && result.error?.includes('bot')) {
          throw new Error('Turnstile verification flagged automated access.');
        }
      }
    } catch (error: any) {
      if (error?.message?.includes('flagged automated access')) {
        throw error;
      }
      // Non-blocking for edge function network unavailability or Cloudflare challenge
    }
  }

  const reqBody: Record<string, any> = { email, password };
  if (captchaToken) {
    reqBody.gotrue_meta_security = { captcha_token: captchaToken };
  }

  const response = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
      },
      body: JSON.stringify(reqBody),
    },
  );

  const resJson = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      resJson.msg ||
      resJson.error_description ||
      resJson.message ||
      'Invalid email or password';
    throw new Error(errorMsg);
  }

  return {
    accessToken: resJson.access_token,
    refreshToken: resJson.refresh_token,
  };
}

/**
 * Refresh accessToken (Supabase GoTrue REST)
 */
export async function refreshTokenApi(): Promise<AuthApi.RefreshTokenResult> {
  const { anonKey, supabaseUrl } = getSupabaseConfig();
  const accessStore = useAccessStore();
  const currentRefreshToken = accessStore.refreshToken;

  if (!currentRefreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
      },
      body: JSON.stringify({ refresh_token: currentRefreshToken }),
    },
  );

  const resJson = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      resJson.msg || resJson.error_description || 'Session refresh failed',
    );
  }

  if (resJson.refresh_token) {
    accessStore.setRefreshToken(resJson.refresh_token);
  }

  return {
    data: resJson.access_token,
    status: 200,
  };
}

/**
 * Logout (Supabase GoTrue REST)
 */
export async function logoutApi() {
  const { anonKey, supabaseUrl } = getSupabaseConfig();
  const accessStore = useAccessStore();
  const token = accessStore.accessToken;

  if (token) {
    try {
      await fetch(`${supabaseUrl}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Ignore network errors during logout
    }
  }
}

/**
 * Get user permission codes (Supabase Admin Console RBAC)
 */
export async function getAccessCodesApi(): Promise<string[]> {
  const access = await getEffectiveAccessApi();
  return access.permissions;
}

/**
 * Recover password (Supabase GoTrue REST)
 */
export async function resetPasswordApi(email: string): Promise<void> {
  const { anonKey, supabaseUrl } = getSupabaseConfig();
  const response = await fetch(`${supabaseUrl}/auth/v1/recover`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
    },
    body: JSON.stringify({
      email: email.trim(),
      redirect_to: `${window.location.origin}/auth/reset-password`,
    }),
  });

  const resJson = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      resJson.msg ||
      resJson.error_description ||
      resJson.message ||
      'Failed to send password recovery email';
    throw new Error(errorMsg);
  }
}

/**
 * Update password (Supabase GoTrue REST)
 */
export async function updatePasswordApi(
  password: string,
  customToken?: string,
): Promise<void> {
  const { anonKey, supabaseUrl } = getSupabaseConfig();
  const accessStore = useAccessStore();
  const token = customToken || accessStore.accessToken;

  if (!token) {
    throw new Error('No active session or recovery token found');
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ password }),
  });

  const resJson = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      resJson.msg ||
      resJson.error_description ||
      resJson.message ||
      'Password update failed';
    throw new Error(errorMsg);
  }
}

/**
 * GitHub OAuth Login (Supabase GoTrue REST)
 */
export function loginWithGitHubApi(redirectTo?: string) {
  const { supabaseUrl } = getSupabaseConfig();
  const target = redirectTo || `${window.location.origin}/auth/callback`;
  const authUrl = `${supabaseUrl}/auth/v1/authorize?provider=github&redirect_to=${encodeURIComponent(target)}`;
  window.location.href = authUrl;
}
