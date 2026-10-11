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
    homePath: '/dashboard/workspace',
    realName,
    roles: ['super', 'admin'],
    token,
    userId: user.id,
    username: user.email || 'admin',
  };
}

/**
 * Cập nhật thông tin hồ sơ người dùng (Supabase Auth metadata & public.profiles)
 */
export async function updateUserProfileApi(data: {
  avatar_url?: string;
  full_name?: string;
  introduction?: string;
}): Promise<UserInfo> {
  const supabaseUrl =
    (import.meta.env.VITE_SUPABASE_URL as string) ||
    'https://dswhacsoaxgpfnkaxnhz.supabase.co';
  const anonKey =
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
    'sb_publishable_8Y-l9FtldJSSuFAWhzICqg_UobFOsua';
  const accessStore = useAccessStore();
  const token = accessStore.accessToken;

  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const payload: { data: Record<string, any> } = { data: {} };
  if (data.full_name) payload.data.full_name = data.full_name;
  if (data.avatar_url) payload.data.avatar_url = data.avatar_url;
  if (data.introduction) payload.data.introduction = data.introduction;

  // 1. Cập nhật GoTrue auth metadata
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
    },
    method: 'PUT',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Cập nhật thông tin hồ sơ thất bại');
  }

  // 2. Cập nhật public.profiles nếu có
  const userInfo = await getUserInfoApi();
  if (userInfo.userId) {
    await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userInfo.userId)}`,
      {
        body: JSON.stringify({
          avatar_url: data.avatar_url,
          full_name: data.full_name,
        }),
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
          Authorization: `Bearer ${token}`,
        },
        method: 'PATCH',
      },
    ).catch(() => {});
  }

  return userInfo;
}

/**
 * Đổi mật khẩu tài khoản người dùng qua Supabase Auth
 */
export async function updateUserPasswordApi(
  newPassword: string,
): Promise<void> {
  const supabaseUrl =
    (import.meta.env.VITE_SUPABASE_URL as string) ||
    'https://dswhacsoaxgpfnkaxnhz.supabase.co';
  const anonKey =
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
    'sb_publishable_8Y-l9FtldJSSuFAWhzICqg_UobFOsua';
  const accessStore = useAccessStore();
  const token = accessStore.accessToken;

  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    body: JSON.stringify({ password: newPassword }),
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
    },
    method: 'PUT',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Đổi mật khẩu thất bại');
  }
}
