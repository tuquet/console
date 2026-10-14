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
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  toast,
} from '@tuquet/vue-ui';

import { VxeForm, VxeFormItem } from '#/adapter/vxe-table';
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

// Active Workspace ID
const activeTenantId = ref('');

// User initials for avatar fallback
const initials = computed(() => {
  if (!fullName.value) return 'TQ';
  const parts = fullName.value.trim().split(/\s+/);
  if (parts.length >= 2) {
    const first = parts[0]?.[0] || '';
    const last = parts[parts.length - 1]?.[0] || '';
    return (first + last).toUpperCase();
  }
  return fullName.value.slice(0, 2).toUpperCase();
});

async function fetchProfile() {
  try {
    loading.value = true;
    const res = await getUserInfoApi();
    if (res) {
      fullName.value = res.realName || '';
      avatarUrl.value = res.avatar || '';
      bio.value = (res as any).bio || '';
      email.value = (res as any).email || '';
      userId.value = res.userId || '';
    }
  } catch (error: any) {
    toast.error(`Không thể tải thông tin hồ sơ: ${error.message || ''}`);
  } finally {
    loading.value = false;
  }
}

async function handleSaveProfile() {
  if (!userId.value) return;
  try {
    savingProfile.value = true;
    await updateUserProfileApi({
      avatar_url: avatarUrl.value,
      full_name: fullName.value,
      introduction: bio.value,
    });
    userStore.setUserInfo({
      userId: userId.value,
      username: email.value || 'admin',
      roles: userStore.userInfo?.roles ?? ['admin'],
      avatar: avatarUrl.value,
      realName: fullName.value,
    });
    toast.success('Cập nhật thông tin hồ sơ thành công!');
  } catch (error: any) {
    toast.error(`Lỗi lưu hồ sơ: ${error.message || ''}`);
  } finally {
    savingProfile.value = false;
  }
}

async function handleSavePassword() {
  if (!newPassword.value) {
    toast.warning('Vui lòng nhập mật khẩu mới');
    return;
  }
  if (newPassword.value.length < 6) {
    toast.warning('Mật khẩu phải có tối thiểu 6 ký tự');
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    toast.warning('Mật khẩu xác nhận không khớp');
    return;
  }

  try {
    savingPassword.value = true;
    await updateUserPasswordApi(newPassword.value);
    toast.success('Đổi mật khẩu thành công!');
    newPassword.value = '';
    confirmPassword.value = '';
  } catch (error: any) {
    toast.error(`Lỗi đổi mật khẩu: ${error.message || ''}`);
  } finally {
    savingPassword.value = false;
  }
}

onMounted(async () => {
  activeTenantId.value = getActiveTenantId();
  await fetchProfile();
});
</script>

<template>
  <div class="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
    <!-- Breadcrumb / Back button -->
    <div class="flex items-center gap-3">
      <Button variant="ghost" size="icon" class="size-8" @click="router.back()">
        <ArrowLeft class="size-4" />
      </Button>
      <div class="text-xs text-muted-foreground">
        <span>Cài đặt</span>
        <span class="mx-1.5">/</span>
        <span class="text-foreground font-medium">Hồ sơ cá nhân</span>
      </div>
    </div>

    <!-- Header Card: Minimalist Shadcn Style -->
    <div
      class="rounded-xl border border-border/60 bg-card p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
    >
      <div class="flex items-center gap-4 sm:gap-5">
        <!-- Avatar Preview -->
        <Avatar class="size-16 sm:size-20 border-2 border-border/60 shadow-sm">
          <AvatarImage v-if="avatarUrl" :src="avatarUrl" class="object-cover" />
          <AvatarFallback class="bg-primary/10 text-primary font-bold text-lg">
            {{ initials }}
          </AvatarFallback>
        </Avatar>

        <!-- User Info -->
        <div class="space-y-1.5">
          <div class="flex items-center gap-2 flex-wrap">
            <h1
              class="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
            >
              {{ fullName || 'Kỹ sư Tuquet' }}
            </h1>
            <Badge
              variant="outline"
              class="bg-primary/10 text-primary border-primary/30 text-xs font-medium"
            >
              Super Administrator
            </Badge>
            <Badge
              variant="outline"
              class="bg-success/10 text-success border-success/30 text-xs"
            >
              Active
            </Badge>
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
              <button
                type="button"
                class="size-5 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
                @click="copyToClipboard(userId, 'User ID')"
              >
                <Check v-if="isCopied('User ID')" class="size-3 text-success" />
                <Copy v-else class="size-3" />
              </button>
            </span>
          </div>
        </div>
      </div>

      <!-- Action Button -->
      <div>
        <Button
          variant="outline"
          class="flex items-center gap-1.5"
          :disabled="loading"
          @click="fetchProfile"
        >
          <RefreshCw class="size-4" :class="{ 'animate-spin': loading }" />
          <span>Làm mới</span>
        </Button>
      </div>
    </div>

    <!-- Tabs Container: Shadcn Slate Tabs -->
    <div
      class="rounded-xl border border-border/60 bg-card p-5 sm:p-6 shadow-sm"
    >
      <Tabs default-value="info" class="w-full">
        <TabsList class="grid w-full max-w-xs grid-cols-3 mb-6">
          <TabsTrigger value="info">Hồ sơ</TabsTrigger>
          <TabsTrigger value="security">Bảo mật</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
        </TabsList>

        <!-- Tab 1: Hồ sơ cá nhân -->
        <TabsContent value="info">
          <div class="max-w-2xl space-y-5 pt-1">
            <div>
              <h3 class="text-base font-semibold text-foreground">
                Hồ sơ cá nhân
              </h3>
              <p class="text-xs text-muted-foreground">
                Thông tin hiển thị trên các Workspace của bạn.
              </p>
            </div>

            <VxeForm
              :data="{ fullName, email, avatarUrl, bio }"
              custom-layout
              size="small"
              class="w-full space-y-3"
            >
              <VxeFormItem title="Họ và tên" span="24">
                <template #default>
                  <div class="relative w-full">
                    <Input
                      v-model="fullName"
                      placeholder="Ví dụ: Nguyễn Đình Tứ"
                      class="h-10 pl-9"
                    />
                    <User
                      class="size-4 text-muted-foreground absolute left-3 top-3 pointer-events-none"
                    />
                  </div>
                </template>
              </VxeFormItem>

              <VxeFormItem title="Email đăng nhập" span="24">
                <template #default>
                  <div class="space-y-1.5 w-full">
                    <div class="relative w-full">
                      <Input
                        :value="email"
                        disabled
                        class="h-10 pl-9 bg-muted"
                      />
                      <Mail
                        class="size-4 text-muted-foreground absolute left-3 top-3 pointer-events-none"
                      />
                    </div>
                    <p class="text-xs text-muted-foreground">
                      Email định danh tài khoản, không thể thay đổi trực tiếp.
                    </p>
                  </div>
                </template>
              </VxeFormItem>

              <VxeFormItem title="Ảnh đại diện URL" span="24">
                <template #default>
                  <Input
                    v-model="avatarUrl"
                    placeholder="https://..."
                    class="h-10"
                  />
                </template>
              </VxeFormItem>

              <VxeFormItem title="Tiểu sử" span="24">
                <template #default>
                  <Textarea
                    v-model="bio"
                    placeholder="Kỹ sư phần mềm, DevOps..."
                    :rows="3"
                  />
                </template>
              </VxeFormItem>

              <VxeFormItem span="24">
                <template #default>
                  <Button
                    class="flex items-center gap-2 h-10 mt-1"
                    :disabled="savingProfile"
                    @click="handleSaveProfile"
                  >
                    <Save class="size-4" />
                    <span>{{
                      savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'
                    }}</span>
                  </Button>
                </template>
              </VxeFormItem>
            </VxeForm>
          </div>
        </TabsContent>

        <!-- Tab 2: Bảo Mật -->
        <TabsContent value="security">
          <div class="max-w-2xl space-y-6 pt-1">
            <div>
              <h3 class="text-base font-semibold text-foreground">
                Đổi mật khẩu
              </h3>
              <p class="text-xs text-muted-foreground">
                Cập nhật mật khẩu mới cho tài khoản đăng nhập.
              </p>
            </div>

            <VxeForm
              :data="{ newPassword, confirmPassword }"
              custom-layout
              size="small"
              class="w-full space-y-3"
            >
              <VxeFormItem title="Mật khẩu mới" span="24">
                <template #default>
                  <div class="relative w-full">
                    <Input
                      v-model="newPassword"
                      type="password"
                      placeholder="Tối thiểu 6 ký tự"
                      class="h-10 pl-9"
                    />
                    <Lock
                      class="size-4 text-muted-foreground absolute left-3 top-3 pointer-events-none"
                    />
                  </div>
                </template>
              </VxeFormItem>

              <VxeFormItem title="Xác nhận mật khẩu" span="24">
                <template #default>
                  <div class="relative w-full">
                    <Input
                      v-model="confirmPassword"
                      type="password"
                      placeholder="Nhập lại mật khẩu mới"
                      class="h-10 pl-9"
                    />
                    <Lock
                      class="size-4 text-muted-foreground absolute left-3 top-3 pointer-events-none"
                    />
                  </div>
                </template>
              </VxeFormItem>

              <VxeFormItem span="24">
                <template #default>
                  <Button
                    class="flex items-center gap-2 h-10 mt-1"
                    :disabled="savingPassword"
                    @click="handleSavePassword"
                  >
                    <KeyRound class="size-4" />
                    <span>{{
                      savingPassword ? 'Đang lưu...' : 'Lưu mật khẩu'
                    }}</span>
                  </Button>
                </template>
              </VxeFormItem>
            </VxeForm>

            <!-- Security Overview Cards -->
            <div class="border-t border-border/40 pt-5 space-y-4">
              <h4 class="text-sm font-semibold text-foreground">
                Tình trạng bảo mật
              </h4>

              <div
                class="rounded-lg border border-border/60 p-4 flex items-center justify-between"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="flex size-9 items-center justify-center rounded-lg bg-success/10 text-success"
                  >
                    <ShieldCheck class="size-5" />
                  </div>
                  <div>
                    <div class="text-sm font-medium text-foreground">
                      Xác thực 2 lớp MFA
                    </div>
                    <div class="text-xs text-muted-foreground">
                      Bảo vệ tài khoản qua mã OTP hoặc FIDO2
                    </div>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  class="bg-muted text-muted-foreground border-border"
                >
                  Sẵn sàng
                </Badge>
              </div>

              <div
                class="rounded-lg border border-border/60 p-4 flex items-center justify-between"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"
                  >
                    <CheckCircle2 class="size-5" />
                  </div>
                  <div>
                    <div class="text-sm font-medium text-foreground">
                      Phiên đăng nhập
                    </div>
                    <div class="text-xs text-muted-foreground">
                      Mã hóa JWT tự động gia hạn an toàn
                    </div>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  class="bg-success/10 text-success border-success/30"
                >
                  Hoạt động
                </Badge>
              </div>
            </div>
          </div>
        </TabsContent>

        <!-- Tab 3: Workspace -->
        <TabsContent value="workspace">
          <div class="max-w-2xl space-y-5 pt-1">
            <div>
              <h3 class="text-base font-semibold text-foreground">
                Workspace đang hoạt động
              </h3>
              <p class="text-xs text-muted-foreground">
                Không gian làm việc mặc định của tài khoản hiện tại.
              </p>
            </div>

            <div
              class="rounded-xl border border-border/60 bg-muted/20 p-5 space-y-3"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Building2 class="size-4.5 text-primary" />
                  <span class="font-semibold text-foreground"
                    >Workspace hiện tại</span
                  >
                </div>
                <Badge
                  variant="outline"
                  class="bg-primary/10 text-primary border-primary/30 font-mono text-xs"
                >
                  Active
                </Badge>
              </div>
              <div class="text-xs text-muted-foreground font-mono">
                ID: {{ activeTenantId || 'Chưa chọn workspace' }}
              </div>
              <div class="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  @click="router.push('/tenants')"
                >
                  Xem tất cả workspace
                </Button>
              </div>
            </div>

            <!-- CLI Command -->
            <CliSnippetCard command="tuquet login" label="Lệnh ghép nối CLI" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  </div>
</template>
