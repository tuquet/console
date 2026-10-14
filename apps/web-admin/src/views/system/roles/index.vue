<script lang="ts" setup>
import type { SystemPermissionItem, SystemRoleItem } from '#/api';

import { computed, onMounted, ref } from 'vue';

import {
  Check,
  Folder,
  KeyRound,
  Lock,
  RefreshCw,
  ShieldCheck,
} from '@lucide/vue';
import { Badge, Button, toast } from '@tuquet/vue-ui';

import {
  getSystemPermissionsApi,
  getSystemRolesApi,
  groupPermissionsByModule,
} from '#/api';
import { $t } from '#/locales';

defineOptions({ name: 'SystemRoles' });

const loading = ref(true);
const roles = ref<SystemRoleItem[]>([]);
const permissions = ref<SystemPermissionItem[]>([]);
const activeTab = ref<'permissions' | 'roles'>('roles');

async function loadData() {
  loading.value = true;
  try {
    const [rolesData, permsData] = await Promise.all([
      getSystemRolesApi(),
      getSystemPermissionsApi(),
    ]);
    roles.value = rolesData;
    permissions.value = permsData;
  } catch (error: any) {
    toast.error(
      error.message || 'Không thể tải danh mục vai trò và phân quyền',
    );
  } finally {
    loading.value = false;
  }
}

const groupedPermissions = computed(() => {
  return groupPermissionsByModule(permissions.value);
});

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="space-y-4 p-4 sm:space-y-5 sm:p-5">
    <!-- Header -->
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex flex-col gap-1">
        <h1
          class="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
        >
          {{ $t('page.system.roles') }}
        </h1>
        <p class="text-xs text-muted-foreground">
          {{ $t('page.system.roles_desc') }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="loading"
          :title="$t('common.refresh')"
          @click="loadData"
          class="gap-1.5"
        >
          <RefreshCw
            class="size-3.5 text-muted-foreground"
            :class="{ 'animate-spin': loading }"
          />
          {{ $t('common.refresh') }}
        </Button>
      </div>
    </div>

    <!-- Mode Selector Tabs -->
    <div class="flex items-center gap-2 border-b border-border/60 pb-2">
      <Button
        variant="ghost"
        size="sm"
        :class="{
          'bg-muted font-medium text-foreground': activeTab === 'roles',
        }"
        @click="activeTab = 'roles'"
        class="gap-1.5"
      >
        <ShieldCheck class="size-4 text-primary" />
        Vai trò hệ thống ({{ roles.length }})
      </Button>
      <Button
        variant="ghost"
        size="sm"
        :class="{
          'bg-muted font-medium text-foreground': activeTab === 'permissions',
        }"
        @click="activeTab = 'permissions'"
        class="gap-1.5"
      >
        <KeyRound class="size-4 text-muted-foreground" />
        Danh mục quyền hạn ({{ permissions.length }})
      </Button>
    </div>

    <!-- Tab 1: System Roles List -->
    <div v-if="activeTab === 'roles'" class="space-y-4">
      <template v-if="loading">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div
            v-for="i in 4"
            :key="i"
            class="h-44 animate-pulse rounded-xl border border-border/60 bg-card p-5"
          ></div>
        </div>
      </template>

      <template v-else-if="roles.length === 0">
        <div
          class="flex flex-col items-center justify-center gap-2 rounded-xl border border-border/60 bg-card p-12 text-center text-muted-foreground"
        >
          <KeyRound class="size-8 stroke-[1.5]" />
          <p class="text-sm font-medium">Không tìm thấy vai trò nào</p>
        </div>
      </template>

      <template v-else>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div
            v-for="role in roles"
            :key="role.id"
            class="flex flex-col justify-between rounded-xl border border-border/60 bg-card p-5 space-y-4"
          >
            <div>
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <Lock class="size-4 text-primary" />
                  <h3 class="text-base font-semibold text-foreground">
                    {{ role.name }}
                  </h3>
                </div>
                <Badge
                  :variant="role.is_system ? 'default' : 'outline'"
                  class="text-[11px]"
                >
                  {{ role.is_system ? 'System Role' : 'Custom' }}
                </Badge>
              </div>

              <p class="mt-2 text-xs text-muted-foreground">
                {{
                  role.description ||
                  'Vai trò phân quyền chuẩn mực cho thành viên workspace.'
                }}
              </p>
            </div>

            <div class="pt-3 border-t border-border/40">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold text-foreground">
                  Quyền được gán ({{ role.permissions.length }})
                </span>
              </div>
              <div class="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                <Badge
                  v-for="perm in role.permissions"
                  :key="perm"
                  variant="secondary"
                  class="font-mono text-[10px] py-0.5"
                >
                  <Check class="size-2.5 mr-1 text-success" />
                  {{ perm }}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Tab 2: Permissions Catalog Grouped by Module -->
    <div v-else-if="activeTab === 'permissions'" class="space-y-4">
      <template v-if="loading">
        <div class="space-y-4">
          <div
            v-for="i in 3"
            :key="i"
            class="h-32 animate-pulse rounded-xl border border-border/60 bg-card p-4"
          ></div>
        </div>
      </template>

      <template v-else-if="permissions.length === 0">
        <div
          class="flex flex-col items-center justify-center gap-2 rounded-xl border border-border/60 bg-card p-12 text-center text-muted-foreground"
        >
          <KeyRound class="size-8 stroke-[1.5]" />
          <p class="text-sm font-medium">Không tìm thấy quyền hạn nào</p>
        </div>
      </template>

      <template v-else>
        <div class="space-y-4">
          <div
            v-for="(perms, moduleName) in groupedPermissions"
            :key="moduleName"
            class="rounded-xl border border-border/60 bg-card p-5 space-y-3"
          >
            <div
              class="flex items-center gap-2 border-b border-border/40 pb-2.5"
            >
              <Folder class="size-4 text-primary" />
              <h3 class="font-semibold text-foreground text-xs">
                Module: {{ moduleName }}
              </h3>
              <Badge variant="outline" class="text-2xs ml-auto">
                {{ perms.length }} quyền
              </Badge>
            </div>

            <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              <div
                v-for="perm in perms"
                :key="perm.id"
                class="rounded-lg border border-border/40 bg-muted/20 p-3 flex flex-col justify-between"
              >
                <code
                  class="font-mono text-xs font-semibold text-primary break-all"
                >
                  {{ perm.id }}
                </code>
                <p class="mt-1 text-[11px] text-muted-foreground">
                  {{
                    perm.description ||
                    `Quyền hạn thực thi tác vụ trên module ${moduleName}`
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
