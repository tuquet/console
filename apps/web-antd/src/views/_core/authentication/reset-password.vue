<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Button, Form, Input, message } from 'ant-design-vue';

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
    message.warning('Vui lòng nhập mật khẩu mới');
    return;
  }
  if (password.value.length < 6) {
    message.warning('Mật khẩu phải có tối thiểu 6 ký tự');
    return;
  }
  if (password.value !== confirmPassword.value) {
    message.warning('Mật khẩu xác nhận không khớp');
    return;
  }

  try {
    loading.value = true;
    await updatePasswordApi(password.value, recoveryToken.value);
    message.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
    router.push('/auth/login');
  } catch (error: any) {
    message.error(error.message || 'Cập nhật mật khẩu thất bại');
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

    <Form layout="vertical" @submit.prevent="handleSubmit">
      <Form.Item label="Mật khẩu mới" required>
        <Input.Password
          v-model:value="password"
          placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
          size="large"
        />
      </Form.Item>

      <Form.Item label="Xác nhận mật khẩu" required>
        <Input.Password
          v-model:value="confirmPassword"
          placeholder="Nhập lại mật khẩu mới"
          size="large"
        />
      </Form.Item>

      <Button
        type="primary"
        html-type="submit"
        :loading="loading"
        block
        size="large"
        class="mt-2"
      >
        Lưu mật khẩu mới
      </Button>

      <Button
        type="link"
        block
        class="mt-2"
        @click="router.push('/auth/login')"
      >
        Quay lại đăng nhập
      </Button>
    </Form>
  </div>
</template>
