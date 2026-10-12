<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAccessStore, useUserStore } from '@vben/stores';

import { Laptop } from '@lucide/vue';
import {
  Avatar,
  Button,
  Card,
  Result,
  Select,
  Tag,
  Typography,
} from 'ant-design-vue';

import { getTenantsApi } from '#/api';
import { useClipboard } from '#/composables';

defineOptions({ name: 'DesktopBridge' });

const route = useRoute();
const router = useRouter();
const accessStore = useAccessStore();
const userStore = useUserStore();
const { copyToClipboard, isCopied } = useClipboard();

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
const selectedTenant = ref('');
const tenantOptions = ref<{ label: string; value: string }[]>([]);

async function loadTenants() {
  if (!accessStore.accessToken) return;
  try {
    const list = await getTenantsApi();
    if (list && list.length > 0) {
      tenantOptions.value = list.map((t) => ({
        label: `${t.name} (${t.slug})`,
        value: t.id,
      }));
      selectedTenant.value = tenantOptions.value[0]?.value || '';
    }
  } catch (error) {
    console.error('Failed to load tenants:', error);
  }

  if (tenantOptions.value.length === 0) {
    tenantOptions.value = [
      { label: 'Workspace Mặc định', value: 'default-workspace' },
    ];
    selectedTenant.value = 'default-workspace';
  }
}

const loading = ref(false);
const isAuthorized = ref(false);
const errorMessage = ref('');

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
  copyToClipboard(bundle, 'Mã ghép nối Specter Desk');
}

function handleCancel() {
  window.close();
}

onMounted(() => {
  if (isLoggedIn.value) {
    loadTenants();
  }
});
</script>

<template>
  <div
    class="flex min-h-screen items-center justify-center bg-muted/30 p-4 dark:bg-neutral-950"
  >
    <Card class="w-full max-w-lg shadow-lg border-border/60" :bordered="true">
      <!-- Trạng thái đã ủy quyền thành công -->
      <template v-if="isAuthorized">
        <Result
          status="success"
          title="Ủy quyền thành công"
          sub-title="Máy trạm đã được kết nối an toàn với tài khoản Tuquet. Bạn có thể đóng tab này và tiếp tục trên Specter Desk."
        >
          <template #extra>
            <div class="space-y-3">
              <div class="flex gap-2 justify-center">
                <Button @click="handleReopenDesk"> Mở lại Specter Desk </Button>
                <Button type="dashed" @click="handleCopyTokenBundle">
                  {{
                    isCopied('Mã ghép nối Specter Desk')
                      ? 'Đã sao chép'
                      : 'Sao chép token ghép nối'
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
            Kết Nối Specter Desk
          </Typography.Title>
          <Typography.Paragraph type="secondary" class="mb-6">
            Đăng nhập tài khoản <strong>Tuquet</strong> để cấp quyền truy cập
            cho máy trạm.
          </Typography.Paragraph>

          <div class="rounded-lg bg-muted p-4 text-left mb-6">
            <Typography.Text strong>Máy trạm yêu cầu:</Typography.Text>
            <div class="mt-1 flex items-center justify-between">
              <span class="text-sm text-foreground">{{ machineName }}</span>
              <Tag color="blue">Local Workstation</Tag>
            </div>
          </div>

          <Button type="primary" size="large" block @click="goToLogin">
            Đăng Nhập
          </Button>
        </div>
      </template>

      <!-- Màn hình Xác nhận cấp quyền (Consent Screen) -->
      <template v-else>
        <div class="text-center pb-4">
          <div
            class="inline-flex items-center justify-center p-3 bg-sky-500/10 rounded-full mb-3 text-sky-500"
          >
            <Laptop class="size-8" />
          </div>
          <Typography.Title :level="3" class="!mb-1">
            Ủy Quyền Specter Desk
          </Typography.Title>
          <Typography.Paragraph type="secondary">
            Cấp quyền kết nối và đồng bộ tài nguyên với Tuquet Cloud.
          </Typography.Paragraph>
        </div>

        <div
          class="space-y-4 rounded-xl border border-border/60 bg-muted/40 p-4"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs text-muted-foreground uppercase tracking-wider"
              >Tài khoản</span
            >
            <div class="flex items-center space-x-2">
              <Avatar :size="24" :src="userAvatar" />
              <span class="font-medium text-sm text-foreground">{{
                userName
              }}</span>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-xs text-muted-foreground uppercase tracking-wider"
              >Thiết bị</span
            >
            <Tag color="cyan">{{ machineName }}</Tag>
          </div>

          <div>
            <span
              class="text-xs text-muted-foreground uppercase tracking-wider block mb-1.5"
              >Workspace</span
            >
            <Select
              v-model:value="selectedTenant"
              :options="tenantOptions"
              class="w-full"
              placeholder="Chọn Workspace làm việc"
            />
          </div>
        </div>

        <div
          class="mt-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400"
        >
          <strong>Lưu ý:</strong> Thiết bị này sẽ được cấp quyền thực thi tác vụ
          runner và quản lý profile trình duyệt trong Workspace đã chọn.
        </div>

        <div v-if="errorMessage" class="mt-3 text-sm text-red-500">
          {{ errorMessage }}
        </div>

        <div class="mt-6 flex gap-3">
          <Button size="large" class="flex-1" @click="handleCancel">
            Hủy
          </Button>
          <Button
            type="primary"
            size="large"
            class="flex-1"
            :loading="loading"
            @click="handleAuthorize"
          >
            Cấp Quyền
          </Button>
        </div>
      </template>
    </Card>
  </div>
</template>
