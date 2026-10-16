<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { $t } from '@vben/locales';
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
    toast.error($t('profile.loadProfileError', { error: error.message || '' }));
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
    toast.success($t('profile.saveProfileSuccess'));
  } catch (error: any) {
    toast.error($t('profile.saveProfileError', { error: error.message || '' }));
  } finally {
    savingProfile.value = false;
  }
}

async function handleSavePassword() {
  if (!newPassword.value) {
    toast.warning($t('authentication.newPasswordRequired'));
    return;
  }
  if (newPassword.value.length < 6) {
    toast.warning($t('authentication.passwordMinLength'));
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    toast.warning($t('authentication.confirmPasswordTip'));
    return;
  }

  try {
    savingPassword.value = true;
    await updateUserPasswordApi(newPassword.value);
    toast.success($t('profile.changePasswordSuccess'));
    newPassword.value = '';
    confirmPassword.value = '';
  } catch (error: any) {
    toast.error(
      $t('profile.changePasswordError', { error: error.message || '' }),
    );
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
        <span>{{ $t('profile.settingsBreadcrumb') }}</span>
        <span class="mx-1.5">/</span>
        <span class="text-foreground font-medium">{{
          $t('profile.personalProfile')
        }}</span>
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
              {{ fullName || $t('profile.defaultEngineerName') }}
            </h1>
            <Badge
              variant="outline"
              class="bg-primary/10 text-primary border-primary/30 text-xs font-medium"
            >
              {{ $t('profile.superAdminBadge') }}
            </Badge>
            <Badge
              variant="outline"
              class="bg-success/10 text-success border-success/30 text-xs"
            >
              {{ $t('common.active') }}
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
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="size-5 text-muted-foreground hover:text-foreground"
                @click="copyToClipboard(userId, 'User ID')"
              >
                <Check v-if="isCopied('User ID')" class="size-3 text-success" />
                <Copy v-else class="size-3" />
              </Button>
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
          <span>{{ $t('common.refresh') }}</span>
        </Button>
      </div>
    </div>

    <!-- Tabs Container: Shadcn Slate Tabs -->
    <div
      class="rounded-xl border border-border/60 bg-card p-5 sm:p-6 shadow-sm"
    >
      <Tabs default-value="info" class="w-full">
        <TabsList class="grid w-full max-w-xs grid-cols-3 mb-6">
          <TabsTrigger value="info">{{ $t('profile.tabProfile') }}</TabsTrigger>
          <TabsTrigger value="security">
            {{ $t('profile.tabSecurity') }}
          </TabsTrigger>
          <TabsTrigger value="workspace">
            {{ $t('profile.tabWorkspace') }}
          </TabsTrigger>
        </TabsList>

        <!-- Tab 1: Personal profile -->
        <TabsContent value="info">
          <div class="max-w-2xl space-y-5 pt-1">
            <div>
              <h3 class="text-base font-semibold text-foreground">
                {{ $t('profile.personalProfile') }}
              </h3>
              <p class="text-xs text-muted-foreground">
                {{ $t('profile.personalProfileDesc') }}
              </p>
            </div>

            <VxeForm
              :data="{ fullName, email, avatarUrl, bio }"
              custom-layout
              size="small"
              class="w-full space-y-3"
            >
              <VxeFormItem :title="$t('profile.fullName')" span="24">
                <template #default>
                  <div class="relative w-full">
                    <Input
                      v-model="fullName"
                      :placeholder="$t('profile.fullNamePlaceholder')"
                      class="h-10 pl-9"
                    />
                    <User
                      class="size-4 text-muted-foreground absolute left-3 top-3 pointer-events-none"
                    />
                  </div>
                </template>
              </VxeFormItem>

              <VxeFormItem :title="$t('profile.loginEmail')" span="24">
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
                      {{ $t('profile.loginEmailHint') }}
                    </p>
                  </div>
                </template>
              </VxeFormItem>

              <VxeFormItem :title="$t('profile.avatarUrl')" span="24">
                <template #default>
                  <Input
                    v-model="avatarUrl"
                    placeholder="https://..."
                    class="h-10"
                  />
                </template>
              </VxeFormItem>

              <VxeFormItem :title="$t('profile.bio')" span="24">
                <template #default>
                  <Textarea
                    v-model="bio"
                    :placeholder="$t('profile.bioPlaceholder')"
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
                      savingProfile
                        ? $t('profile.saving')
                        : $t('profile.saveChanges')
                    }}</span>
                  </Button>
                </template>
              </VxeFormItem>
            </VxeForm>
          </div>
        </TabsContent>

        <!-- Tab 2: Security -->
        <TabsContent value="security">
          <div class="max-w-2xl space-y-6 pt-1">
            <div>
              <h3 class="text-base font-semibold text-foreground">
                {{ $t('profile.changePasswordTitle') }}
              </h3>
              <p class="text-xs text-muted-foreground">
                {{ $t('profile.changePasswordDesc') }}
              </p>
            </div>

            <VxeForm
              :data="{ newPassword, confirmPassword }"
              custom-layout
              size="small"
              class="w-full space-y-3"
            >
              <VxeFormItem :title="$t('authentication.newPassword')" span="24">
                <template #default>
                  <div class="relative w-full">
                    <Input
                      v-model="newPassword"
                      type="password"
                      :placeholder="$t('profile.min6CharsPlaceholder')"
                      class="h-10 pl-9"
                    />
                    <Lock
                      class="size-4 text-muted-foreground absolute left-3 top-3 pointer-events-none"
                    />
                  </div>
                </template>
              </VxeFormItem>

              <VxeFormItem
                :title="$t('authentication.confirmPassword')"
                span="24"
              >
                <template #default>
                  <div class="relative w-full">
                    <Input
                      v-model="confirmPassword"
                      type="password"
                      :placeholder="$t('authentication.reenterNewPassword')"
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
                      savingPassword
                        ? $t('profile.saving')
                        : $t('profile.savePassword')
                    }}</span>
                  </Button>
                </template>
              </VxeFormItem>
            </VxeForm>

            <!-- Security Overview Cards -->
            <div class="border-t border-border/40 pt-5 space-y-4">
              <h4 class="text-sm font-semibold text-foreground">
                {{ $t('profile.securityStatusTitle') }}
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
                      {{ $t('profile.mfaTitle') }}
                    </div>
                    <div class="text-xs text-muted-foreground">
                      {{ $t('profile.mfaDesc') }}
                    </div>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  class="bg-muted text-muted-foreground border-border"
                >
                  {{ $t('profile.mfaReady') }}
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
                      {{ $t('profile.sessionTitle') }}
                    </div>
                    <div class="text-xs text-muted-foreground">
                      {{ $t('profile.sessionDesc') }}
                    </div>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  class="bg-success/10 text-success border-success/30"
                >
                  {{ $t('common.active') }}
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
                {{ $t('profile.activeWorkspaceTitle') }}
              </h3>
              <p class="text-xs text-muted-foreground">
                {{ $t('profile.activeWorkspaceDesc') }}
              </p>
            </div>

            <div
              class="rounded-xl border border-border/60 bg-muted/20 p-5 space-y-3"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Building2 class="size-4.5 text-primary" />
                  <span class="font-semibold text-foreground">{{
                    $t('profile.currentWorkspace')
                  }}</span>
                </div>
                <Badge
                  variant="outline"
                  class="bg-primary/10 text-primary border-primary/30 text-xs"
                >
                  {{ $t('common.active') }}
                </Badge>
              </div>
              <div class="text-xs text-muted-foreground font-mono">
                ID: {{ activeTenantId || $t('profile.noWorkspaceSelected') }}
              </div>
              <div class="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  @click="router.push('/tenants')"
                >
                  {{ $t('profile.viewAllWorkspaces') }}
                </Button>
              </div>
            </div>

            <!-- CLI Command -->
            <CliSnippetCard
              command="tuquet login"
              :label="$t('profile.cliPairingCommand')"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  </div>
</template>
