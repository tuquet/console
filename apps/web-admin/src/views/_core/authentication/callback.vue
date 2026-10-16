<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { $t } from '@vben/locales';
import { useAccessStore, useUserStore } from '@vben/stores';

import { Button, Spinner, toast } from '@tuquet/vue-ui';

import { getAccessCodesApi } from '#/api';
import { useAuthStore } from '#/store';

defineOptions({ name: 'AuthCallback' });

const router = useRouter();
const accessStore = useAccessStore();
const userStore = useUserStore();
const authStore = useAuthStore();

const loading = ref(true);
const errorMessage = ref('');

onMounted(async () => {
  if (typeof window === 'undefined') return;

  try {
    const hash = window.location.hash.replace(/^#/, '');
    const params = new URLSearchParams(hash);
    const searchParams = new URLSearchParams(window.location.search);

    const error =
      searchParams.get('error_description') ||
      searchParams.get('error') ||
      params.get('error_description');

    if (error) {
      loading.value = false;
      errorMessage.value = $t('authentication.githubLoginFailedWithReason', {
        error,
      });
      return;
    }

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type');

    if (type === 'recovery') {
      await router.push(`/auth/reset-password${window.location.hash}`);
      return;
    }

    if (accessToken) {
      accessStore.setAccessToken(accessToken);
      if (refreshToken) {
        accessStore.setRefreshToken(refreshToken);
      }

      // Load user profile & access codes
      const [userInfo, accessCodes] = await Promise.all([
        authStore.fetchUserInfo(),
        getAccessCodesApi(),
      ]);

      if (userInfo) {
        userStore.setUserInfo(userInfo);
      }
      accessStore.setAccessCodes(accessCodes);

      toast.success($t('authentication.loginSuccessDesc'), {
        description: $t('authentication.githubLoginSuccess'),
        duration: 3000,
      });

      await router.push('/');
      return;
    }

    loading.value = false;
    errorMessage.value = $t('authentication.githubSessionMissing');
  } catch (error: any) {
    loading.value = false;
    errorMessage.value =
      error.message || $t('authentication.githubCallbackError');
  }
});
</script>

<template>
  <div
    class="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center"
  >
    <div v-if="loading" class="space-y-4">
      <Spinner class="mx-auto size-8 text-primary" />
      <p class="text-muted-foreground text-sm">
        {{ $t('authentication.githubVerifying') }}
      </p>
    </div>

    <div v-else class="space-y-4 max-w-md">
      <div class="text-3xl text-destructive font-bold">!</div>
      <h3 class="text-lg font-semibold text-destructive">
        {{ $t('authentication.githubAuthFailed') }}
      </h3>
      <p class="text-muted-foreground text-xs">
        {{ errorMessage }}
      </p>
      <div class="pt-2">
        <Button @click="router.push('/auth/login')">
          {{ $t('authentication.backToLogin') }}
        </Button>
      </div>
    </div>
  </div>
</template>
