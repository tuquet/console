import type { UserInfo } from '@vben/types';

import { useAccessStore } from '@vben/stores';

/**
 * 获取用户信息 (Supabase GoTrue REST)
 */
export async function getUserInfoApi(): Promise<UserInfo> {
  const supabaseUrl =
    (import.meta.env.VITE_SUPABASE_URL as string) ||
    'https://dswhacsoaxgpfnkaxnhz.supabase.co';
  const anonKey =
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
    'sb_publishable_8Y-l9FtldJSSuFAWhzICqg_UobFOsua';
  const accessStore = useAccessStore();
  const token = accessStore.accessToken;

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }

  const user = await response.json();
  const meta = user.user_metadata || {};
  const realName =
    meta.full_name ||
    meta.display_name ||
    user.email?.split('@')[0] ||
    'Tuquet Admin';
  const avatar =
    meta.avatar_url || 'https://avatars.githubusercontent.com/u/tuquet';

  return {
    avatar,
    desc: user.email || 'Tuquet Administrator',
    homePath: '/dashboard/analytics',
    realName,
    roles: ['super', 'admin'],
    token,
    userId: user.id,
    username: user.email || 'admin',
  };
}
