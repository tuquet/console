<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAccessStore, useUserStore } from '@vben/stores';
import { notification, Spin } from 'ant-design-vue';

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
      errorMessage.value = `Đăng nhập thất bại: ${error}`;
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

      notification.success({
        description: 'Đăng nhập GitHub thành công!',
        duration: 3,
        message: 'Chào mừng bạn trở lại',
      });

      await router.push('/');
      return;
    }

    loading.value = false;
    errorMessage.value = 'Không tìm thấy dữ liệu phiên làm việc từ GitHub OAuth.';
  } catch (err: any) {
    loading.value = false;
    errorMessage.value = err.message || 'Lỗi xử lý xác thực GitHub';
  }
});
</script>

<template>
  <div class="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
    <div v-if="loading" class="space-y-4">
      <Spin size="large" />
      <p class="text-muted-foreground text-sm">
        Đang xác thực thông tin tài khoản GitHub từ Supabase...
      </p>
    </div>

    <div v-else class="space-y-4 max-w-md">
      <div class="text-3xl text-destructive font-bold">!</div>
      <h3 class="text-lg font-semibold text-destructive">
        Xác thực thất bại
      </h3>
      <p class="text-muted-foreground text-xs">
        {{ errorMessage }}
      </p>
      <div class="pt-2">
        <a href="/auth/login" class="ant-btn ant-btn-primary">
          Quay lại trang đăng nhập
        </a>
      </div>
    </div>
  </div>
</template>
