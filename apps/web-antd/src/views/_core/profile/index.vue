<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useUserStore } from '@vben/stores';

import {
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
  Save,
  ShieldCheck,
  User,
} from '@lucide/vue';
import {
  Avatar,
  Badge,
  Button,
  Input,
  message,
  Tabs,
  Tag,
} from 'ant-design-vue';

import {
  getActiveTenantId,
  getUserInfoApi,
  updateUserPasswordApi,
  updateUserProfileApi,
} from '#/api';
import CliSnippetCard from '#/components/common/cli-snippet-card.vue';
import { useClipboard } from '#/composables';

defineOptions({ name: 'Profile' });

const router = useRouter();
const userStore = useUserStore();

const loading = ref(false);
const savingProfile = ref(false);
const savingPassword = ref(false);

const { copyToClipboard, isCopied } = useClipboard();

// Form states
const fullName = ref('');
const avatarUrl = ref('');
const bio = ref('');
const email = ref('');
const userId = ref('');

// Password form states
const newPassword = ref('');
const confirmPassword = ref('');

// Active Workspace
const activeTenantId = ref(getActiveTenantId());

async function fetchProfile() {
  loading.value = true;
  try {
    const info = await getUserInfoApi();
    userStore.setUserInfo(info);
    fullName.value = info.realName || '';
    avatarUrl.value = info.avatar || '';
    email.value = info.username || '';
    userId.value = info.userId || '';
    bio.value = info.desc || 'Kỹ sư kiến trúc hệ thống Tuquet Cloud';
  } catch (error: any) {
    message.error(error.message || 'Không thể tải thông tin hồ sơ');
  } finally {
    loading.value = false;
  }
}

async function handleSaveProfile() {
  if (!fullName.value.trim()) {
    message.warning('Vui lòng nhập họ và tên');
    return;
  }

  savingProfile.value = true;
  try {
    const updated = await updateUserProfileApi({
      avatar_url: avatarUrl.value.trim() || undefined,
      full_name: fullName.value.trim(),
      introduction: bio.value.trim(),
    });
    userStore.setUserInfo(updated);
    message.success('Cập nhật hồ sơ cá nhân thành công!');
  } catch (error: any) {
    message.error(error.message || 'Cập nhật thất bại');
  } finally {
    savingProfile.value = false;
  }
}

async function handleSavePassword() {
  if (!newPassword.value || newPassword.value.length < 6) {
    message.warning('Mật khẩu mới phải có tối thiểu 6 ký tự');
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    message.warning('Xác nhận mật khẩu không khớp');
    return;
  }

  savingPassword.value = true;
  try {
    await updateUserPasswordApi(newPassword.value);
    message.success('Đổi mật khẩu thành công! Vui lòng ghi nhớ mật khẩu mới.');
    newPassword.value = '';
    confirmPassword.value = '';
  } catch (error: any) {
    message.error(error.message || 'Đổi mật khẩu thất bại');
  } finally {
    savingPassword.value = false;
  }
}

const userInitials = computed(() => {
  const name = fullName.value || email.value || 'AD';
  return name.slice(0, 2).toUpperCase();
});

onMounted(() => {
  fetchProfile();
});
</script>

<template>
  <div class="space-y-6 p-4 sm:p-6 max-w-5xl mx-auto">
    <!-- Navigation Back -->
    <div>
      <Button
        type="link"
        class="flex items-center gap-1.5 p-0 text-muted-foreground hover:text-foreground"
        @click="router.push('/dashboard/workspace')"
      >
        <ArrowLeft class="size-4" />
        <span>Quay lại Danh sách Workspace</span>
      </Button>
    </div>

    <!-- Header Card: Shadcn Slate Profile Hero -->
    <div
      class="flex flex-col justify-between gap-5 rounded-xl border border-border/60 bg-card p-6 shadow-sm sm:flex-row sm:items-center"
    >
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
        <!-- Big Avatar -->
        <Avatar
          :size="72"
          :src="avatarUrl || undefined"
          class="bg-sky-600 text-lg font-bold text-white uppercase shadow-md flex-shrink-0"
        >
          {{ userInitials }}
        </Avatar>

        <!-- User Identity Info -->
        <div class="space-y-1">
          <div class="flex flex-wrap items-center gap-2.5">
            <h1
              class="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
            >
              {{ fullName || 'Kỹ Sư Tuquet' }}
            </h1>
            <Tag color="purple" class="font-mono text-xs uppercase font-medium">
              Super Administrator
            </Tag>
            <Badge status="success" text="Active" class="ml-1" />
          </div>

          <div
            class="flex flex-wrap items-center gap-3 text-xs text-muted-foreground"
          >
            <span class="flex items-center gap-1">
              <Mail class="size-3.5" />
              <span>{{ email }}</span>
            </span>
            <span class="hidden sm:inline">•</span>
            <span class="flex items-center gap-1 font-mono">
              UID: {{ userId.slice(0, 12) }}...
              <Button
                type="text"
                size="small"
                class="size-5 p-0 inline-flex items-center justify-center"
                @click="copyToClipboard(userId, 'User ID')"
              >
                <Check
                  v-if="isCopied('User ID')"
                  class="size-3 text-green-500"
                />
                <Copy v-else class="size-3 text-muted-foreground" />
              </Button>
            </span>
          </div>
        </div>
      </div>

      <!-- Action Button -->
      <div>
        <Button
          class="flex items-center gap-1.5"
          :loading="loading"
          @click="fetchProfile"
        >
          <RefreshCw class="size-4" />
          <span>Làm Mới</span>
        </Button>
      </div>
    </div>

    <!-- Tabs Container: Shadcn Slate Tabs -->
    <div
      class="rounded-xl border border-border/60 bg-card p-5 sm:p-6 shadow-sm"
    >
      <Tabs default-active-key="info">
        <!-- Tab 1: Thông Tin Cá Nhân -->
        <Tabs.TabPane key="info" tab="Thông Tin Cá Nhân">
          <div class="max-w-2xl space-y-5 pt-3">
            <div>
              <h3 class="text-base font-semibold text-foreground">
                Hồ Sơ Tài Khoản
              </h3>
              <p class="text-xs text-muted-foreground">
                Thông tin cá nhân hiển thị trên toàn bộ các Workspace thuộc
                Tuquet Cloud
              </p>
            </div>

            <!-- Field 1: Họ và tên -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">
                Họ và Tên
              </label>
              <Input
                v-model:value="fullName"
                placeholder="Ví dụ: Nguyễn Đình Tứ"
                size="large"
              >
                <template #prefix>
                  <User class="size-4 text-muted-foreground mr-1" />
                </template>
              </Input>
            </div>

            <!-- Field 2: Email -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">
                Địa Chỉ Email Đăng Nhập
              </label>
              <Input :value="email" disabled size="large">
                <template #prefix>
                  <Mail class="size-4 text-muted-foreground mr-1" />
                </template>
              </Input>
              <p class="mt-1 text-xs text-muted-foreground">
                Email được định danh từ hệ thống xác thực Supabase Auth và không
                thể thay đổi trực tiếp.
              </p>
            </div>

            <!-- Field 3: Avatar URL -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">
                Đường Dẫn Ảnh Đại Diện (Avatar URL)
              </label>
              <Input
                v-model:value="avatarUrl"
                placeholder="https://..."
                size="large"
              />
            </div>

            <!-- Field 4: Bio / Ghi chú -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">
                Tiểu Sử / Vai Trò Công Việc
              </label>
              <Input.TextArea
                v-model:value="bio"
                placeholder="Kỹ sư phần mềm / DevOps..."
                :rows="3"
              />
            </div>

            <!-- Save Button -->
            <div class="pt-2">
              <Button
                type="primary"
                size="large"
                class="flex items-center gap-2"
                :loading="savingProfile"
                @click="handleSaveProfile"
              >
                <Save class="size-4" />
                <span>Lưu Thay Đổi Hồ Sơ</span>
              </Button>
            </div>
          </div>
        </Tabs.TabPane>

        <!-- Tab 2: Bảo Mật & Mật Khẩu -->
        <Tabs.TabPane key="security" tab="Bảo Mật & Mật Khẩu">
          <div class="max-w-2xl space-y-6 pt-3">
            <div>
              <h3 class="text-base font-semibold text-foreground">
                Đổi Mật Khẩu Tài Khoản
              </h3>
              <p class="text-xs text-muted-foreground">
                Cập nhật mật khẩu mới thông qua giao thức Supabase GoTrue Auth
              </p>
            </div>

            <!-- New Password -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">
                Mật Khẩu Mới
              </label>
              <Input.Password
                v-model:value="newPassword"
                placeholder="Nhập tối thiểu 6 ký tự"
                size="large"
              >
                <template #prefix>
                  <Lock class="size-4 text-muted-foreground mr-1" />
                </template>
              </Input.Password>
            </div>

            <!-- Confirm Password -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">
                Xác Nhận Mật Khẩu Mới
              </label>
              <Input.Password
                v-model:value="confirmPassword"
                placeholder="Nhập lại mật khẩu mới"
                size="large"
              >
                <template #prefix>
                  <Lock class="size-4 text-muted-foreground mr-1" />
                </template>
              </Input.Password>
            </div>

            <div>
              <Button
                type="primary"
                size="large"
                class="flex items-center gap-2"
                :loading="savingPassword"
                @click="handleSavePassword"
              >
                <KeyRound class="size-4" />
                <span>Cập Nhật Mật Khẩu</span>
              </Button>
            </div>

            <!-- Security Overview Cards -->
            <div class="border-t border-border/40 pt-5 space-y-4">
              <h4 class="text-sm font-semibold text-foreground">
                Tình Trạng An Toàn Tài Khoản
              </h4>

              <div
                class="rounded-lg border border-border/60 p-4 flex items-center justify-between"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="flex size-9 items-center justify-center rounded-lg bg-green-500/10 text-green-400"
                  >
                    <ShieldCheck class="size-5" />
                  </div>
                  <div>
                    <div class="text-sm font-medium text-foreground">
                      Xác Thực Hai Yếu Tố (MFA)
                    </div>
                    <div class="text-xs text-muted-foreground">
                      Bảo vệ tài khoản bằng OTP hoặc khóa bảo mật FIDO2
                    </div>
                  </div>
                </div>
                <Tag color="default">Sẵn sàng kích hoạt</Tag>
              </div>

              <div
                class="rounded-lg border border-border/60 p-4 flex items-center justify-between"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="flex size-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400"
                  >
                    <CheckCircle2 class="size-5" />
                  </div>
                  <div>
                    <div class="text-sm font-medium text-foreground">
                      Phiên Đăng Nhập Trình Duyệt
                    </div>
                    <div class="text-xs text-muted-foreground">
                      Mã hóa token JWT 3600 giây tự động gia hạn
                    </div>
                  </div>
                </div>
                <Tag color="success">Đang hoạt động</Tag>
              </div>
            </div>
          </div>
        </Tabs.TabPane>

        <!-- Tab 3: Workspace & Specter CLI -->
        <Tabs.TabPane key="workspace" tab="Workspace Của Tôi">
          <div class="max-w-2xl space-y-5 pt-3">
            <div>
              <h3 class="text-base font-semibold text-foreground">
                Không Gian Làm Việc & Ghép Nối CLI
              </h3>
              <p class="text-xs text-muted-foreground">
                Workspace hiện tại đang được kích hoạt cho tài khoản này
              </p>
            </div>

            <div
              class="rounded-xl border border-border/60 bg-muted/20 p-5 space-y-3"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Building2 class="size-4.5 text-sky-400" />
                  <span class="font-semibold text-foreground">Workspace Đang Chọn</span>
                </div>
                <Tag color="blue" class="font-mono text-xs">ACTIVE</Tag>
              </div>
              <div class="text-xs text-muted-foreground font-mono">
                ID: {{ activeTenantId || 'Chưa chọn workspace' }}
              </div>
              <div class="pt-2">
                <Button
                  size="small"
                  type="primary"
                  ghost
                  @click="router.push('/dashboard/workspace')"
                >
                  Quản Trị Danh Sách Workspace
                </Button>
              </div>
            </div>

            <!-- CLI Command -->
            <CliSnippetCard
              command="tuquet login"
              label="Lệnh Đăng Nhập Specter CLI"
            />
          </div>
        </Tabs.TabPane>
      </Tabs>
    </div>
  </div>
</template>
