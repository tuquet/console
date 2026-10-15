import type { Recordable, UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import {
  resetAllStores,
  useAccessStore,
  useTabbarStore,
  useUserStore,
} from '@vben/stores';

import { toast } from '@tuquet/vue-ui';
import { defineStore } from 'pinia';

import {
  clearAccessCache,
  getAccessCodesApi,
  getUserInfoApi,
  loginApi,
  logoutApi,
} from '#/api';
import { $t } from '#/locales';
import { router as appRouter } from '#/router';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const tabbarStore = useTabbarStore();
  const router = useRouter() || appRouter;

  const loginLoading = ref(false);

  /**
   * Asynchronously handle the login process
   * @param params Login form parameters
   */
  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    // Asynchronously handle user login and obtain accessToken
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      const { accessToken, refreshToken } = await loginApi(params);

      // On successful accessToken retrieval
      if (accessToken) {
        accessStore.setAccessToken(accessToken);
        if (refreshToken) {
          accessStore.setRefreshToken(refreshToken);
        }

        // Fetch user info and store into accessStore
        const [fetchUserInfoResult, accessCodes] = await Promise.all([
          fetchUserInfo(),
          getAccessCodesApi(),
        ]);

        userInfo = fetchUserInfoResult;

        userStore.setUserInfo(userInfo);
        accessStore.setAccessCodes(accessCodes);

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
          // Reload current route view so tables/metrics re-fetch with the new token
          await tabbarStore.refresh(router);
        } else if (onSuccess) {
          await onSuccess?.();
        } else {
          const redirectParam = router.currentRoute.value.query?.redirect as
            | string
            | undefined;
          let targetPath =
            userInfo?.homePath || preferences.app.defaultHomePath;

          if (redirectParam) {
            try {
              let decoded = decodeURIComponent(redirectParam).trim();
              if (decoded.startsWith('#')) {
                decoded = decoded.replace(/^#+/, '');
              }
              if (
                decoded &&
                !decoded.startsWith('/auth/login') &&
                decoded.startsWith('/')
              ) {
                targetPath = decoded;
              }
            } catch {
              // Ignore decoding error, fallback to targetPath
            }
          }

          await router.push(targetPath);
        }

        if (userInfo?.realName) {
          toast.success($t('authentication.loginSuccess'), {
            description: `${$t('authentication.loginSuccessDesc')}: ${userInfo?.realName}`,
            duration: 3000,
          });
        }
      }
    } catch (error: any) {
      toast.error($t('authentication.passwordErrorTip'), {
        description:
          error?.message || 'Login failed. Please check your credentials.',
        duration: 4000,
      });
      throw error;
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  async function logout(redirect: boolean = true) {
    clearAccessCache();
    try {
      await logoutApi();
    } catch {
      // Ignore network errors on logout
    }
    resetAllStores();
    accessStore.setLoginExpired(false);

    // On the login page the current route is the login page itself, so carrying it as
    // `redirect` would nest one more encoded layer on every repeat.
    const currentRoute = router.currentRoute.value;
    const alreadyOnLogin = currentRoute.path === LOGIN_PATH;

    // Redirect to login page carrying previous target route if applicable
    await router.replace({
      path: LOGIN_PATH,
      query:
        redirect && !alreadyOnLogin
          ? { redirect: encodeURIComponent(currentRoute.fullPath) }
          : {},
    });
  }

  /**
   * Single canonical handler when both accessToken and refreshToken are expired/invalid.
   * Respects `preferences.app.loginExpiredMode` ('modal' vs 'page').
   */
  async function handleSessionExpired(): Promise<'modal' | 'redirect'> {
    clearAccessCache();
    accessStore.setAccessToken(null);
    accessStore.setRefreshToken(null);

    if (
      preferences.app.loginExpiredMode === 'modal' &&
      accessStore.isAccessChecked
    ) {
      accessStore.setLoginExpired(true);
      return 'modal';
    }

    toast.warning($t('authentication.loginAgainTitle'), {
      description: $t('authentication.loginAgainSubTitle'),
      duration: 4000,
    });

    await logout(true);
    return 'redirect';
  }

  async function fetchUserInfo() {
    const userInfo = await getUserInfoApi();
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  function $reset() {
    clearAccessCache();
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    fetchUserInfo,
    handleSessionExpired,
    loginLoading,
    logout,
  };
});
