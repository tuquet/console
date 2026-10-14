<script lang="ts" setup>
import type { SystemPermissionItem, SystemRoleItem } from '#/api';

import { computed, ref } from 'vue';

import {
  Check,
  Copy,
  Eye,
  Folder,
  KeyRound,
  Lock,
  RefreshCw,
  ShieldCheck,
} from '@lucide/vue';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  toast,
} from '@tuquet/vue-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  filterSystemPermissions,
  filterSystemRoles,
  getSystemPermissionsApi,
  getSystemRolesApi,
  groupPermissionsByModule,
  sortRoleNamesByPriority,
} from '#/api';
import RoleBadge from '#/components/iam/role-badge.vue';
import { useDateFormat } from '#/composables';
import { $t } from '#/locales';

defineOptions({ name: 'SystemRoles' });

const { formatDate } = useDateFormat();

const activeTab = ref<'permissions' | 'roles'>('roles');
const allRoles = ref<SystemRoleItem[]>([]);
const allPermissions = ref<SystemPermissionItem[]>([]);
const catalogLoaded = ref(false);
const loadingCatalog = ref(false);

const selectedRole = ref<null | SystemRoleItem>(null);
const roleDetailOpen = ref(false);
const copiedKey = ref<null | string>(null);

let loadPromise: null | Promise<void> = null;

async function ensureCatalogLoaded(force = false): Promise<void> {
  if (catalogLoaded.value && !force) {
    return;
  }
  if (loadPromise && !force) {
    return loadPromise;
  }

  loadingCatalog.value = true;
  loadPromise = (async () => {
    try {
      const [rolesData, permsData] = await Promise.all([
        getSystemRolesApi(),
        getSystemPermissionsApi(),
      ]);
      allRoles.value = rolesData;
      allPermissions.value = permsData;
      catalogLoaded.value = true;
    } catch (error: any) {
      toast.error(
        error.message || 'Không thể tải danh mục vai trò và phân quyền',
      );
    } finally {
      loadingCatalog.value = false;
      loadPromise = null;
    }
  })();

  return loadPromise;
}

const systemRolesCount = computed(
  () => allRoles.value.filter((r) => r.is_system).length,
);

const modulesCount = computed(() => {
  const mods = new Set(allPermissions.value.map((p) => p.module));
  return mods.size;
});

const permissionMap = computed(() => {
  const map = new Map<string, SystemPermissionItem>();
  for (const p of allPermissions.value) {
    map.set(p.id, p);
  }
  return map;
});

const selectedRoleGroupedPermissions = computed(() => {
  if (!selectedRole.value) return {};
  const resolvedItems: SystemPermissionItem[] =
    selectedRole.value.permissions.map((permId) => {
      const found = permissionMap.value.get(permId);
      if (found) return found;
      const prefix = permId.split(':')[0] || 'core-iam';
      return {
        description: null,
        id: permId,
        module: prefix,
      };
    });
  return groupPermissionsByModule(resolvedItems);
});

const rolesByPermissionMap = computed<Record<string, string[]>>(() => {
  const map: Record<string, string[]> = {};
  for (const role of allRoles.value) {
    for (const permId of role.permissions) {
      if (!map[permId]) {
        map[permId] = [];
      }
      map[permId].push(role.name);
    }
  }
  for (const permId of Object.keys(map)) {
    map[permId] = sortRoleNamesByPriority(map[permId] ?? []);
  }
  return map;
});

async function handleCopyKey(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    copiedKey.value = text;
    toast.success(`Đã sao chép: ${text}`);
    setTimeout(() => {
      if (copiedKey.value === text) {
        copiedKey.value = null;
      }
    }, 1800);
  } catch {
    toast.error('Không thể sao chép vào bộ nhớ tạm');
  }
}

function openRoleDetail(role: SystemRoleItem) {
  selectedRole.value = role;
  roleDetailOpen.value = true;
}

const MODULE_OPTIONS = [
  { label: 'Tất cả module', value: 'all' },
  { label: 'Core IAM (core-iam)', value: 'core-iam' },
  { label: 'Runners (runners)', value: 'runners' },
  { label: 'Automa (automa)', value: 'automa' },
  { label: 'Subscriptions (subscriptions)', value: 'subscriptions' },
  { label: 'Storage (storage)', value: 'storage' },
  { label: 'Webhooks (webhooks)', value: 'webhooks' },
];

const [RolesGrid, rolesGridApi] = useVbenVxeGrid<SystemRoleItem>({
  separator: false,
  formOptions: {
    schema: [
      {
        component: 'Select',
        fieldName: 'role_type',
        label: 'Phân loại',
        defaultValue: 'all',
        componentProps: {
          placeholder: 'Tất cả phân loại',
          options: [
            { label: 'Tất cả phân loại', value: 'all' },
            { label: 'System Role', value: 'system' },
            { label: 'Custom Role', value: 'custom' },
          ],
        },
      },
      {
        component: 'Select',
        fieldName: 'module',
        label: 'Module quyền hạn',
        defaultValue: 'all',
        componentProps: {
          placeholder: 'Tất cả module',
          options: MODULE_OPTIONS,
        },
      },
      {
        component: 'Input',
        fieldName: 'search',
        label: 'Tìm kiếm',
        componentProps: {
          placeholder: 'Tìm theo tên vai trò, mô tả hoặc mã quyền...',
        },
      },
    ],
    layout: 'vertical',
    showCollapseButton: false,
    submitOnChange: true,
    submitOnEnter: true,
    submitButtonOptions: {
      content: $t('common.filter'),
    },
    resetButtonOptions: {
      content: $t('common.reset'),
    },
    actionWrapperClass: 'flex items-center justify-end gap-2',
    wrapperClass: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3',
  },
  gridOptions: {
    border: false,
    round: true,
    showOverflow: true,
    cellConfig: {
      height: 56,
    },
    rowConfig: {
      isHover: true,
      keyField: 'id',
    },
    pagerConfig: {
      pageSize: 15,
      pageSizes: [10, 15, 30],
    },
    proxyConfig: {
      autoLoad: true,
      ajax: {
        query: async (
          { page }: { page?: { currentPage?: number; pageSize?: number } },
          formValues: Record<string, any>,
        ) => {
          await ensureCatalogLoaded();
          const filtered = filterSystemRoles(
            allRoles.value,
            {
              module: formValues?.module,
              role_type: formValues?.role_type,
              search: formValues?.search,
            },
            allPermissions.value,
          );

          const currentPage = page?.currentPage || 1;
          const pageSize = page?.pageSize || 15;
          const start = (currentPage - 1) * pageSize;
          const end = start + pageSize;
          return {
            items: filtered.slice(start, end),
            total: filtered.length,
          };
        },
      },
    },
    columns: [
      {
        field: 'name',
        title: 'Vai trò',
        width: 175,
        align: 'left',
        slots: { default: 'role-name-cell' },
      },
      {
        field: 'description',
        title: 'Mô tả chính sách',
        minWidth: 250,
        align: 'left',
        slots: { default: 'role-desc-cell' },
      },
      {
        field: 'is_system',
        title: 'Phân loại',
        width: 140,
        align: 'left',
        slots: { default: 'role-type-cell' },
      },
      {
        field: 'permissions',
        title: 'Quyền hạn được gán',
        minWidth: 290,
        align: 'left',
        slots: { default: 'role-perms-cell' },
      },
      {
        field: 'created_at',
        title: 'Ngày tạo',
        width: 145,
        align: 'left',
        slots: { default: 'role-date-cell' },
      },
      {
        field: 'actions',
        title: 'Thao tác',
        width: 105,
        align: 'right',
        slots: { default: 'role-actions-cell' },
      },
    ],
  },
});

const [PermissionsGrid, permsGridApi] = useVbenVxeGrid<SystemPermissionItem>({
  separator: false,
  formOptions: {
    schema: [
      {
        component: 'Select',
        fieldName: 'module',
        label: 'Module',
        defaultValue: 'all',
        componentProps: {
          placeholder: 'Tất cả module',
          options: MODULE_OPTIONS,
        },
      },
      {
        component: 'Select',
        fieldName: 'role',
        label: 'Vai trò sở hữu',
        defaultValue: 'all',
        componentProps: {
          placeholder: 'Tất cả vai trò',
          options: [
            { label: 'Tất cả vai trò', value: 'all' },
            { label: 'Owner', value: 'owner' },
            { label: 'Admin', value: 'admin' },
            { label: 'Member', value: 'member' },
            { label: 'Viewer', value: 'viewer' },
          ],
        },
      },
      {
        component: 'Input',
        fieldName: 'search',
        label: 'Tìm kiếm',
        componentProps: {
          placeholder: 'Tìm theo mã quyền (id) hoặc mô tả tác vụ...',
        },
      },
    ],
    layout: 'vertical',
    showCollapseButton: false,
    submitOnChange: true,
    submitOnEnter: true,
    submitButtonOptions: {
      content: $t('common.filter'),
    },
    resetButtonOptions: {
      content: $t('common.reset'),
    },
    actionWrapperClass: 'flex items-center justify-end gap-2',
    wrapperClass: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3',
  },
  gridOptions: {
    border: false,
    round: true,
    showOverflow: true,
    cellConfig: {
      height: 52,
    },
    rowConfig: {
      isHover: true,
      keyField: 'id',
    },
    pagerConfig: {
      pageSize: 15,
      pageSizes: [10, 15, 30, 50],
    },
    proxyConfig: {
      autoLoad: true,
      ajax: {
        query: async (
          { page }: { page?: { currentPage?: number; pageSize?: number } },
          formValues: Record<string, any>,
        ) => {
          await ensureCatalogLoaded();
          const filtered = filterSystemPermissions(
            allPermissions.value,
            {
              module: formValues?.module,
              role: formValues?.role,
              search: formValues?.search,
            },
            allRoles.value,
          );

          const currentPage = page?.currentPage || 1;
          const pageSize = page?.pageSize || 15;
          const start = (currentPage - 1) * pageSize;
          const end = start + pageSize;
          return {
            items: filtered.slice(start, end),
            total: filtered.length,
          };
        },
      },
    },
    columns: [
      {
        field: 'id',
        title: 'Mã quyền hạn',
        minWidth: 230,
        align: 'left',
        slots: { default: 'perm-id-cell' },
      },
      {
        field: 'module',
        title: 'Module',
        width: 155,
        align: 'left',
        slots: { default: 'perm-module-cell' },
      },
      {
        field: 'description',
        title: 'Mô tả tác vụ',
        minWidth: 260,
        align: 'left',
        slots: { default: 'perm-desc-cell' },
      },
      {
        field: 'roles',
        title: 'Vai trò sở hữu',
        minWidth: 260,
        align: 'left',
        slots: { default: 'perm-roles-cell' },
      },
    ],
  },
});

async function handleRefresh() {
  await ensureCatalogLoaded(true);
  if (activeTab.value === 'roles') {
    rolesGridApi.reload();
  } else {
    permsGridApi.reload();
  }
}
</script>

<template>
  <div class="space-y-4 p-4 sm:space-y-5 sm:p-5">
    <!-- Top Header -->
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
          :disabled="loadingCatalog"
          :title="$t('common.refresh')"
          @click="handleRefresh"
          class="gap-1.5"
        >
          <RefreshCw
            class="size-3.5 text-muted-foreground"
            :class="{ 'animate-spin': loadingCatalog }"
          />
          {{ $t('common.refresh') }}
        </Button>
      </div>
    </div>

    <!-- Main Container: Mode Tabs + Stats Bar + VXE Grid -->
    <div
      class="overflow-hidden rounded-none sm:rounded-xl border-0 sm:border border-border/60 bg-card p-0 sm:p-5 shadow-none sm:shadow-xs space-y-3"
    >
      <!-- Mode Selector & Stats Bar -->
      <div
        class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-3 px-3 sm:px-0 pt-2 sm:pt-0"
      >
        <div class="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            :class="{
              'bg-muted font-medium text-foreground': activeTab === 'roles',
            }"
            @click="activeTab = 'roles'"
            class="h-8 gap-1.5 text-xs"
          >
            <ShieldCheck class="size-3.5 text-primary" />
            <span>Vai trò hệ thống ({{ allRoles.length }})</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            :class="{
              'bg-muted font-medium text-foreground':
                activeTab === 'permissions',
            }"
            @click="activeTab = 'permissions'"
            class="h-8 gap-1.5 text-xs"
          >
            <KeyRound class="size-3.5 text-muted-foreground" />
            <span>Danh mục quyền hạn ({{ allPermissions.length }})</span>
          </Button>
        </div>

        <div class="flex items-center gap-3 text-xs text-muted-foreground">
          <template v-if="activeTab === 'roles'">
            <span>{{ systemRolesCount }} System Roles</span>
            <span>&bull;</span>
            <span>{{ allPermissions.length }} quyền hạt nhân</span>
          </template>
          <template v-else>
            <span>{{ modulesCount }} modules</span>
            <span>&bull;</span>
            <span>{{ allPermissions.length }} quyền hạt nhân</span>
          </template>
        </div>
      </div>

      <!-- Tab 1: System Roles VXE Grid -->
      <div v-if="activeTab === 'roles'">
        <RolesGrid class="roles-vxe-grid">
          <template #role-name-cell="{ row }">
            <div class="flex items-center gap-2">
              <RoleBadge :role="row.name" :uppercase="true" />
              <code class="font-mono text-[11px] text-muted-foreground">
                {{ row.name }}
              </code>
            </div>
          </template>

          <template #role-desc-cell="{ row }">
            <span class="text-xs text-muted-foreground">
              {{
                row.description ||
                'Vai trò phân quyền chuẩn mực cho thành viên workspace'
              }}
            </span>
          </template>

          <template #role-type-cell="{ row }">
            <Badge
              :variant="row.is_system ? 'default' : 'outline'"
              class="gap-1 text-xs font-normal"
            >
              <Lock v-if="row.is_system" class="size-3 shrink-0" />
              <span>{{ row.is_system ? 'System Role' : 'Custom' }}</span>
            </Badge>
          </template>

          <template #role-perms-cell="{ row }">
            <div class="flex items-center gap-1.5 min-w-0">
              <Badge
                variant="outline"
                class="shrink-0 font-mono text-xs font-semibold"
              >
                {{ row.permissions.length }} quyền
              </Badge>
              <code
                v-for="perm in row.permissions.slice(0, 2)"
                :key="perm"
                class="max-w-36 truncate rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                :title="perm"
              >
                {{ perm }}
              </code>
              <Badge
                v-if="row.permissions.length > 2"
                variant="secondary"
                class="shrink-0 cursor-pointer text-[11px] font-normal hover:bg-accent"
                @click.stop="openRoleDetail(row as SystemRoleItem)"
              >
                +{{ row.permissions.length - 2 }} khác
              </Badge>
            </div>
          </template>

          <template #role-date-cell="{ row }">
            <span class="font-mono text-xs text-muted-foreground">
              {{ formatDate(row.created_at) }}
            </span>
          </template>

          <template #role-actions-cell="{ row }">
            <div class="flex items-center justify-end">
              <Button
                variant="outline"
                size="sm"
                class="h-7 text-xs inline-flex items-center gap-1"
                @click="openRoleDetail(row as SystemRoleItem)"
              >
                <Eye class="size-3 shrink-0" />
                <span>{{ $t('common.detail') }}</span>
              </Button>
            </div>
          </template>

          <template #empty>
            <div
              class="flex flex-col items-center justify-center p-8 text-center text-muted-foreground"
            >
              <ShieldCheck
                class="size-10 stroke-[1.5] text-muted-foreground/60 mb-3"
              />
              <p class="text-sm font-medium text-foreground">
                Không tìm thấy vai trò phù hợp
              </p>
              <p class="text-xs text-muted-foreground max-w-sm mt-1">
                Thử thay đổi bộ lọc phân loại, module hoặc từ khóa tìm kiếm.
              </p>
            </div>
          </template>
        </RolesGrid>
      </div>

      <!-- Tab 2: Permissions Catalog VXE Grid -->
      <div v-else>
        <PermissionsGrid class="permissions-vxe-grid">
          <template #perm-id-cell="{ row }">
            <div class="inline-flex items-center gap-1">
              <code
                class="rounded bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-primary"
              >
                {{ row.id }}
              </code>
              <Button
                variant="ghost"
                size="icon"
                class="size-6 shrink-0 text-muted-foreground hover:text-foreground"
                title="Sao chép mã quyền"
                @click.stop="handleCopyKey(row.id)"
              >
                <Check
                  v-if="copiedKey === row.id"
                  class="size-3.5 text-success"
                />
                <Copy v-else class="size-3.5" />
              </Button>
            </div>
          </template>

          <template #perm-module-cell="{ row }">
            <Badge
              variant="outline"
              class="gap-1.5 font-mono text-xs font-normal"
            >
              <Folder class="size-3 text-primary shrink-0" />
              <span>{{ row.module }}</span>
            </Badge>
          </template>

          <template #perm-desc-cell="{ row }">
            <span class="text-xs text-muted-foreground">
              {{
                row.description ||
                `Quyền hạn thực thi tác vụ trên module ${row.module}`
              }}
            </span>
          </template>

          <template #perm-roles-cell="{ row }">
            <div class="flex items-center gap-1.5">
              <RoleBadge
                v-for="roleName in rolesByPermissionMap[row.id] ?? []"
                :key="roleName"
                :role="roleName"
              />
              <span
                v-if="(rolesByPermissionMap[row.id] ?? []).length === 0"
                class="text-xs text-muted-foreground"
              >
                —
              </span>
            </div>
          </template>

          <template #empty>
            <div
              class="flex flex-col items-center justify-center p-8 text-center text-muted-foreground"
            >
              <KeyRound
                class="size-10 stroke-[1.5] text-muted-foreground/60 mb-3"
              />
              <p class="text-sm font-medium text-foreground">
                Không tìm thấy quyền hạn phù hợp
              </p>
              <p class="text-xs text-muted-foreground max-w-sm mt-1">
                Thử thay đổi bộ lọc module, vai trò sở hữu hoặc từ khóa tìm
                kiếm.
              </p>
            </div>
          </template>
        </PermissionsGrid>
      </div>
    </div>

    <!-- Role Policy Inspector Dialog -->
    <Dialog v-model:open="roleDetailOpen">
      <DialogContent class="max-w-[calc(100vw-2rem)] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2 text-base">
            <ShieldCheck class="size-4 text-primary" />
            <span>Chi tiết chính sách vai trò</span>
            <RoleBadge v-if="selectedRole" :role="selectedRole.name" />
          </DialogTitle>
          <DialogDescription class="text-xs">
            {{
              selectedRole?.description ||
              'Danh sách các quyền hạn hạt nhân được cấp phát cho vai trò này theo từng phân hệ'
            }}
          </DialogDescription>
        </DialogHeader>

        <div
          v-if="selectedRole"
          class="space-y-4 max-h-[65vh] overflow-y-auto pr-1 text-xs"
        >
          <!-- Summary Bar -->
          <div
            class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/20 p-3.5"
          >
            <div class="flex items-center gap-2">
              <Badge :variant="selectedRole.is_system ? 'default' : 'outline'">
                {{ selectedRole.is_system ? 'System Role' : 'Custom Role' }}
              </Badge>
              <span class="text-muted-foreground">
                ID:
                <code class="font-mono text-foreground">{{
                  selectedRole.id
                }}</code>
              </span>
            </div>
            <div class="font-medium text-foreground">
              Đã cấp {{ selectedRole.permissions.length }} /
              {{ allPermissions.length || selectedRole.permissions.length }}
              quyền hạn
            </div>
          </div>

          <!-- Grouped Permissions by Module -->
          <div
            v-for="(perms, moduleName) in selectedRoleGroupedPermissions"
            :key="moduleName"
            class="rounded-xl border border-border/60 bg-card p-4 space-y-3"
          >
            <div
              class="flex items-center justify-between border-b border-border/40 pb-2"
            >
              <div class="flex items-center gap-2">
                <Folder class="size-4 text-primary" />
                <span class="font-semibold text-foreground">
                  Module: {{ moduleName }}
                </span>
              </div>
              <Badge variant="outline" class="font-mono text-[11px]">
                {{ perms.length }} quyền
              </Badge>
            </div>

            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div
                v-for="perm in perms"
                :key="perm.id"
                class="flex items-start justify-between gap-2 rounded-lg border border-border/40 bg-muted/15 p-2.5"
              >
                <div class="min-w-0 space-y-0.5">
                  <div class="flex items-center gap-1.5">
                    <Check class="size-3 text-success shrink-0" />
                    <code
                      class="font-mono text-xs font-semibold text-foreground truncate"
                    >
                      {{ perm.id }}
                    </code>
                  </div>
                  <p class="text-[11px] text-muted-foreground pl-4.5">
                    {{
                      perm.description ||
                      `Thực thi tác vụ trên module ${moduleName}`
                    }}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-6 shrink-0 text-muted-foreground hover:text-foreground"
                  title="Sao chép mã quyền"
                  @click="handleCopyKey(perm.id)"
                >
                  <Check
                    v-if="copiedKey === perm.id"
                    class="size-3 text-success"
                  />
                  <Copy v-else class="size-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
