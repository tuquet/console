import { useAccessStore } from '@vben/stores';

export interface SupabaseRequestOptions extends RequestInit {
  preferRepresentation?: boolean;
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
 * Universal Supabase HTTP Request client adhering to Dependency Inversion (DIP)
 * Centralizes auth headers, URL building, error handling, and representation preferences.
 */
export async function supabaseRequest<T = any>(
  path: string,
  options: SupabaseRequestOptions = {},
): Promise<T> {
  const { anonKey, supabaseUrl } = getSupabaseConfig();
  const accessStore = useAccessStore();
  const token = accessStore.accessToken;

  const url = path.startsWith('http') ? path : `${supabaseUrl}${path}`;

  const headers: Record<string, string> = {
    apikey: anonKey,
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (options.preferRepresentation) {
    headers.Prefer = 'return=representation';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(
      errorJson.message ||
        errorJson.msg ||
        errorJson.error_description ||
        `Yêu cầu Supabase thất bại (${response.status})`,
    );
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
