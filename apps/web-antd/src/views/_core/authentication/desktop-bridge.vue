<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAccessStore, useUserStore } from '@vben/stores';

import {
  Avatar,
  Button,
  Card,
  message,
  Result,
  Select,
  Tag,
  Typography,
} from 'ant-design-vue';

defineOptions({ name: 'DesktopBridge' });

const route = useRoute();
const router = useRouter();
const accessStore = useAccessStore();
const userStore = useUserStore();

// Query parameters from Desk app
const machineName = computed(
  () => (route.query.machine_name as string) || 'Local Workstation',
);
const state = computed(() => (route.query.state as string) || '');
const port = computed(() => (route.query.port as string) || '8765');

// Auth status
const isLoggedIn = computed(() => Boolean(accessStore.accessToken));
const userName = computed(
  () =>
    userStore.userInfo?.realName || userStore.userInfo?.username || 'Operator',
);
const userAvatar = computed(
  () => userStore.userInfo?.avatar || 'https://tuquet.com/icons/cli.svg',
);

// Tenancy
const selectedTenant = ref('default-workspace');
const tenantOptions = ref([
  { label: 'Default Workspace (Owner)', value: 'default-workspace' },
  { label: 'Production Automation (Admin)', value: 'prod-automation' },
]);

const loading = ref(false);
const isAuthorized = ref(false);
const errorMessage = ref('');
const isCopied = ref(false);

const deepLinkUrl = computed(() => {
  const token = accessStore.accessToken || '';
  const refreshToken = accessStore.refreshToken || '';
  return `tuquet://auth/callback?token=${encodeURIComponent(token)}&refresh_token=${encodeURIComponent(refreshToken)}&state=${encodeURIComponent(state.value)}&tenant_id=${encodeURIComponent(selectedTenant.value)}&machine_name=${encodeURIComponent(machineName.value)}`;
});

function goToLogin() {
  const currentUrl = encodeURIComponent(window.location.href);
  router.push(`/auth/login?redirect=${currentUrl}`);
}

async function handleAuthorize() {
  if (!isLoggedIn.value) {
    goToLogin();
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const payload = {
      token: accessStore.accessToken || '',
      refreshToken: accessStore.refreshToken || '',
      state: state.value,
      tenantId: selectedTenant.value,
      machineName: machineName.value,
    };

    // 1. Gửi qua local HTTP loopback bằng POST (JSON Body - Không lộ token trên URL)
    try {
      await fetch(`http://127.0.0.1:${port.value}/api/v1/auth/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // Loopback có thể cần fallback
    }

    // 2. Chuyển hướng tới custom URI protocol để đưa cửa sổ Desk lên đầu
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = deepLinkUrl.value;
    document.body.append(iframe);

    // Đánh dấu ủy quyền thành công
    setTimeout(() => {
      isAuthorized.value = true;
      loading.value = false;
    }, 600);
  } catch (error: any) {
    loading.value = false;
    errorMessage.value =
      error?.message || 'Không thể gửi phản hồi xác thực tới Specter Desk';
  }
}

function handleReopenDesk() {
  window.location.href = deepLinkUrl.value;
}

function handleCopyTokenBundle() {
  const bundle = btoa(
    JSON.stringify({
      token: accessStore.accessToken || '',
      refreshToken: accessStore.refreshToken || '',
      tenantId: selectedTenant.value,
      state: state.value,
      machineName: machineName.value,
    }),
  );

  navigator.clipboard.writeText(bundle);
  isCopied.value = true;
  message.success('Đã sao chép mã ghép nối vào clipboard!');
  setTimeout(() => {
    isCopied.value = false;
  }, 3000);
}

function handleCancel() {
  window.close();
}

onMounted(() => {
  // Sẵn sàng nhận lệnh
});
</script>

<template>
  <div
    class="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-neutral-900"
  >
    <Card class="w-full max-w-lg shadow-xl" :bordered="false">
      <!-- Trạng thái đã ủy quyền thành công -->
      <template v-if="isAuthorized">
        <Result
          status="success"
          title="Ủy quyền Specter Desk thành công!"
          sub-title="Máy trạm của bạn đã được kết nối an toàn với tài khoản Tuquet Admin. Bạn có thể đóng tab trình duyệt này và quay lại ứng dụng Desk."
        >
          <template #extra>
            <div class="space-y-3">
              <div class="flex gap-2 justify-center">
                <Button @click="handleReopenDesk"> Mở lại Specter Desk </Button>
                <Button type="dashed" @click="handleCopyTokenBundle">
                  {{
                    isCopied ? 'Đã sao chép!' : 'Sao chép mã ghép nối thủ công'
                  }}
                </Button>
              </div>
              <div>
                <Button type="primary" size="large" block @click="handleCancel">
                  Đóng tab này
                </Button>
              </div>
            </div>
          </template>
        </Result>
      </template>

      <!-- Trạng thái yêu cầu đăng nhập trước -->
      <template v-else-if="!isLoggedIn">
        <div class="text-center py-6">
          <Avatar
            :size="64"
            src="https://tuquet.com/icons/cli.svg"
            class="mb-4"
          />
          <Typography.Title :level="3" class="!mb-2">
Kết nối Specter Desk
</Typography.Title>
          <Typography.Paragraph type="secondary" class="mb-6">
            Bạn cần đăng nhập tài khoản <strong>Tuquet Admin</strong> trước khi
            cấp quyền truy cập cho máy trạm này.
          </Typography.Paragraph>

          <div
            class="rounded-lg bg-gray-100 p-4 text-left dark:bg-neutral-800 mb-6"
          >
            <Typography.Text strong>Máy trạm yêu cầu:</Typography.Text>
            <div class="mt-1 flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-300">{{
                machineName
              }}</span>
              <Tag color="blue">Local Workstation</Tag>
            </div>
          </div>

          <Button type="primary" size="large" block @click="goToLogin">
            Đăng nhập ngay
          </Button>
        </div>
      </template>

      <!-- Màn hình Xác nhận cấp quyền (Consent Screen) -->
      <template v-else>
        <div class="text-center pb-4">
          <div
            class="inline-flex items-center justify-center p-3 bg-blue-50 dark:bg-blue-950/40 rounded-full mb-3"
          >
            <svg
              class="w-10 h-10 text-blue-600 dark:text-blue-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <Typography.Title :level="3" class="!mb-1">
Ủy quyền kết nối Specter Desk
</Typography.Title>
          <Typography.Paragraph type="secondary">
            Ứng dụng máy trạm đang yêu cầu quyền truy cập và đồng bộ tài nguyên
            từ hệ sinh thái Tuquet.
          </Typography.Paragraph>
        </div>

        <div
          class="space-y-4 rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-neutral-800 dark:bg-neutral-800/50"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-500 uppercase tracking-wider">Tài khoản</span>
            <div class="flex items-center space-x-2">
              <Avatar :size="24" :src="userAvatar" />
              <span
                class="font-medium text-sm text-gray-800 dark:text-gray-200"
                >{{ userName }}</span>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-500 uppercase tracking-wider">Thiết bị</span>
            <Tag color="cyan">{{ machineName }}</Tag>
          </div>

          <div>
            <span
              class="text-xs text-gray-500 uppercase tracking-wider block mb-1.5"
              >Chọn Workspace / Tenant</span>
            <Select
              v-model:value="selectedTenant"
              :options="tenantOptions"
              class="w-full"
              placeholder="Chọn Workspace làm việc"
            />
          </div>
        </div>

        <div
          class="mt-4 p-3 bg-amber-50 rounded-lg dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300"
        >
          <strong>Lưu ý bảo mật:</strong> Specter Desk sẽ được cấp quyền điều
          khiển profile browser và quản lý tác vụ runner trong Workspace bạn đã
          chọn.
        </div>

        <div
          v-if="errorMessage"
          class="mt-3 text-sm text-red-600 dark:text-red-400"
        >
          {{ errorMessage }}
        </div>

        <div class="mt-6 flex gap-3">
          <Button size="large" class="flex-1" @click="handleCancel">
            Từ chối
          </Button>
          <Button
            type="primary"
            size="large"
            class="flex-1"
            :loading="loading"
            @click="handleAuthorize"
          >
            Cho phép kết nối
          </Button>
        </div>
      </template>
    </Card>
  </div>
</template>
