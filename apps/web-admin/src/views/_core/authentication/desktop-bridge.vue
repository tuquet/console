<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAccessStore, useUserStore } from '@vben/stores';

import { CheckCircle2, Laptop } from '@lucide/vue';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
} from '@tuquet/vue-ui';

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
        label: `${t.name} · ${t.slug}`,
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
  <div class="flex min-h-screen items-center justify-center bg-background p-4">
    <Card class="w-full max-w-lg shadow-lg border-border/60 p-6">
      <!-- Trạng thái đã ủy quyền thành công -->
      <template v-if="isAuthorized">
        <div class="text-center py-6 space-y-4">
          <div
            class="mx-auto flex size-12 items-center justify-center rounded-full bg-success/10 text-success"
          >
            <CheckCircle2 class="size-7" />
          </div>
          <h3 class="text-xl font-bold">Ủy quyền thành công</h3>
          <p class="text-xs text-muted-foreground max-w-sm mx-auto">
            Máy trạm đã được kết nối an toàn với tài khoản Tuquet. Bạn có thể
            đóng tab này và tiếp tục trên Specter Desk.
          </p>
          <div class="space-y-3 pt-2">
            <div class="flex gap-2 justify-center">
              <Button @click="handleReopenDesk"> Mở lại Specter Desk </Button>
              <Button variant="outline" @click="handleCopyTokenBundle">
                {{
                  isCopied('Mã ghép nối Specter Desk')
                    ? 'Đã sao chép'
                    : 'Sao chép token ghép nối'
                }}
              </Button>
            </div>
            <div>
              <Button class="w-full h-10" @click="handleCancel">
                Đóng tab này
              </Button>
            </div>
          </div>
        </div>
      </template>

      <!-- Trạng thái yêu cầu đăng nhập trước -->
      <template v-else-if="!isLoggedIn">
        <div class="text-center py-6 space-y-4">
          <Avatar class="size-16 mx-auto mb-2">
            <AvatarImage src="https://tuquet.com/icons/cli.svg" />
            <AvatarFallback>CLI</AvatarFallback>
          </Avatar>
          <h3 class="text-xl font-bold">Kết nối thiết bị</h3>
          <p class="text-xs text-muted-foreground">
            Đăng nhập tài khoản <strong>Tuquet</strong> để cấp quyền truy cập
            cho thiết bị.
          </p>

          <div class="rounded-lg bg-muted p-4 text-left">
            <span
              class="text-xs font-semibold text-muted-foreground block mb-1"
            >
              Thiết bị yêu cầu:
            </span>
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-foreground">{{
                machineName
              }}</span>
              <Badge
                variant="outline"
                class="bg-primary/10 text-primary border-primary/30"
              >
                Local Workstation
              </Badge>
            </div>
          </div>

          <Button class="w-full h-10" @click="goToLogin"> Đăng nhập </Button>
        </div>
      </template>

      <!-- Màn hình Xác nhận cấp quyền (Consent Screen) -->
      <template v-else>
        <div class="text-center pb-4">
          <div
            class="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-3 text-primary"
          >
            <Laptop class="size-8" />
          </div>
          <h3 class="text-xl font-bold">Ủy quyền thiết bị</h3>
          <p class="text-xs text-muted-foreground mt-1">
            Cấp quyền kết nối và đồng bộ tài nguyên với Tuquet Cloud.
          </p>
        </div>

        <div
          class="space-y-4 rounded-xl border border-border/60 bg-muted/40 p-4"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs text-muted-foreground">Tài khoản</span>
            <div class="flex items-center space-x-2">
              <Avatar class="size-6">
                <AvatarImage :src="userAvatar" />
                <AvatarFallback>{{ userName.slice(0, 1) }}</AvatarFallback>
              </Avatar>
              <span class="font-medium text-sm text-foreground">{{
                userName
              }}</span>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-xs text-muted-foreground">Thiết bị</span>
            <Badge
              variant="outline"
              class="bg-accent text-accent-foreground border-border"
            >
              {{ machineName }}
            </Badge>
          </div>

          <div>
            <span class="text-xs text-muted-foreground block mb-2"
              >Workspace</span
            >
            <select
              v-model="selectedTenant"
              class="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option
                v-for="opt in tenantOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>

        <div
          class="mt-4 p-3 bg-warning/10 rounded-lg border border-warning/20 text-xs text-warning"
        >
          <strong>Lưu ý:</strong> Thiết bị này sẽ được cấp quyền thực thi tác vụ
          runner và quản lý profile trình duyệt trong Workspace đã chọn.
        </div>

        <div
          v-if="errorMessage"
          class="mt-3 text-sm text-destructive font-medium"
        >
          {{ errorMessage }}
        </div>

        <div class="mt-6 flex gap-3">
          <Button variant="outline" class="flex-1 h-10" @click="handleCancel">
            Hủy
          </Button>
          <Button
            class="flex-1 h-10"
            :disabled="loading"
            @click="handleAuthorize"
          >
            {{ loading ? 'Đang xử lý...' : 'Cấp quyền' }}
          </Button>
        </div>
      </template>
    </Card>
  </div>
</template>
