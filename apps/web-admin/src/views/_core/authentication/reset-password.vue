<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Button, Input, toast } from '@tuquet/vue-ui';

import { updatePasswordApi } from '#/api/core/auth';

defineOptions({ name: 'ResetPassword' });

const router = useRouter();
const loading = ref(false);
const recoveryToken = ref('');
const password = ref('');
const confirmPassword = ref('');

onMounted(() => {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash.replace(/^#/, '');
    const params = new URLSearchParams(hash);
    recoveryToken.value = params.get('access_token') || '';
  }
});

async function handleSubmit() {
  if (!password.value) {
    toast.warning('Vui lòng nhập mật khẩu mới');
    return;
  }
  if (password.value.length < 6) {
    toast.warning('Mật khẩu phải có tối thiểu 6 ký tự');
    return;
  }
  if (password.value !== confirmPassword.value) {
    toast.warning('Mật khẩu xác nhận không khớp');
    return;
  }

  try {
    loading.value = true;
    await updatePasswordApi(password.value, recoveryToken.value);
    toast.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
    router.push('/auth/login');
  } catch (error: any) {
    toast.error(error.message || 'Cập nhật mật khẩu thất bại');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-sm p-4">
    <div class="mb-6 text-center">
      <h2 class="text-xl font-bold">Đặt lại mật khẩu 🔐</h2>
      <p class="text-xs text-muted-foreground mt-1">
        Tạo mật khẩu mới cho tài khoản quản trị của bạn
      </p>
    </div>

    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div class="space-y-1.5">
        <label class="text-sm font-medium leading-none">
          Mật khẩu mới <span class="text-destructive">*</span>
        </label>
        <Input
          v-model="password"
          type="password"
          placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
          class="h-10"
        />
      </div>

      <div class="space-y-1.5">
        <label class="text-sm font-medium leading-none">
          Xác nhận mật khẩu <span class="text-destructive">*</span>
        </label>
        <Input
          v-model="confirmPassword"
          type="password"
          placeholder="Nhập lại mật khẩu mới"
          class="h-10"
        />
      </div>

      <Button type="submit" :disabled="loading" class="w-full h-10 mt-2">
        {{ loading ? 'Đang cập nhật...' : 'Lưu mật khẩu mới' }}
      </Button>

      <Button
        variant="link"
        type="button"
        class="w-full mt-2"
        @click="router.push('/auth/login')"
      >
        Quay lại đăng nhập
      </Button>
    </form>
  </div>
</template>
