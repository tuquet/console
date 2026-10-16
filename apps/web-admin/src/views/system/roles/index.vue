<script lang="ts" setup>
import type { SystemPermissionItem, SystemRoleItem } from '#/api';

import { computed, ref, watch } from 'vue';

import { usePreferences } from '@vben/preferences';

import {
  Check,
  Copy,
  Folder,
  KeyRound,
  Lock,
  Plus,
  RefreshCw,
  ShieldCheck,
} from '@lucide/vue';
import {
  Badge,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  toast,
} from '@tuquet/vue-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  filterSystemPermissions,
  filterSystemRoles,
  getSystemPermissionsApi,
  getSystemRolesApi,
  sortRoleNamesByPriority,
} from '#/api';
import RoleBadge from '#/components/iam/role-badge.vue';
import { useClipboard, useDateFormat } from '#/composables';
import { $t } from '#/locales';

defineOptions({ name: 'SystemRoles' });

const { formatDate } = useDateFormat();
const { copyToClipboard, isCopied } = useClipboard();
const { isMobile } = usePreferences();

const activeTab = ref<'permissions' | 'roles'>('roles');
const allRoles = ref<SystemRoleItem[]>([]);
const allPermissions = ref<SystemPermissionItem[]>([]);
const catalogLoaded = ref(false);
const loadingCatalog = ref(false);

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
      toast.error(error.message || $t('page.system_view.roles_load_error'));
    } finally {
      loadingCatalog.value = false;
      loadPromise = null;
    }
  })();

  return loadPromise;
}

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

function handleCopyKey(text: string) {
  copyToClipboard(text, text);
}

function getModuleOptions() {
  return [
    { label: $t('page.system_view.roles_module_all'), value: 'all' },
    { label: $t('page.system_view.roles_module_core_iam'), value: 'core-iam' },
    { label: $t('page.system_view.roles_module_runners'), value: 'runners' },
    { label: $t('page.system_view.roles_module_automa'), value: 'automa' },
    {
      label: $t('page.system_view.roles_module_subscriptions'),
      value: 'subscriptions',
    },
    { label: $t('page.system_view.roles_module_storage'), value: 'storage' },
    { label: $t('page.system_view.roles_module_webhooks'), value: 'webhooks' },
  ];
}

function getRoleColumns() {
  return [
    {
      field: 'name',
      title: $t('term.role'),
      minWidth: isMobile.value ? 130 : 175,
      align: 'left' as const,
      slots: { default: 'role-name-cell' },
    },
    {
      field: 'description',
      title: $t('page.system_view.roles_col_policy_desc'),
      minWidth: 250,
      align: 'left' as const,
      visible: !isMobile.value,
      slots: { default: 'role-desc-cell' },
    },
    {
      field: 'is_system',
      title: $t('page.system_view.plugins_col_type'),
      width: 140,
      align: 'left' as const,
      visible: !isMobile.value,
      slots: { default: 'role-type-cell' },
    },
    {
      field: 'permissions',
      title: $t('page.system_view.roles_col_assigned_perms'),
      minWidth: isMobile.value ? 120 : 290,
      align: 'left' as const,
      slots: { default: 'role-perms-cell' },
    },
    {
      field: 'created_at',
      title: $t('common.createdAt'),
      width: 145,
      align: 'left' as const,
      visible: !isMobile.value,
      slots: { default: 'role-date-cell' },
    },
  ];
}

function getPermColumns() {
  return [
    {
      field: 'id',
      title: $t('page.system_view.perms_col_id'),
      minWidth: isMobile.value ? 180 : 230,
      align: 'left' as const,
      slots: { default: 'perm-id-cell' },
    },
    {
      field: 'module',
      title: $t('page.system_view.roles_col_module'),
      width: isMobile.value ? 115 : 155,
      align: 'left' as const,
      slots: { default: 'perm-module-cell' },
    },
    {
      field: 'description',
      title: $t('page.system_view.perms_col_desc'),
      minWidth: 260,
      align: 'left' as const,
      visible: !isMobile.value,
      slots: { default: 'perm-desc-cell' },
    },
    {
      field: 'roles',
      title: $t('page.system_view.roles_col_assigned_roles'),
      minWidth: 260,
      align: 'left' as const,
      visible: !isMobile.value,
      slots: { default: 'perm-roles-cell' },
    },
  ];
}

const [RolesGrid, rolesGridApi] = useVbenVxeGrid<SystemRoleItem>({
  separator: false,
  detailSheetOptions: {
    resource: 'public.roles',
    subtitleField: 'id',
    titleField: 'name',
    onCreated: async () => {
      await ensureCatalogLoaded(true);
    },
    onSaved: async () => {
      await ensureCatalogLoaded(true);
    },
  },
  formOptions: {
    commonConfig: {
      componentProps: {
        class: 'w-full',
      },
      hideLabel: isMobile.value,
    },
    schema: [
      {
        component: 'Select',
        fieldName: 'role_type',
        label: () => $t('page.system_view.plugins_filter_type'),
        defaultValue: 'all',
        componentProps: () => ({
          placeholder: $t('page.system_view.plugins_type_all'),
          options: [
            { label: $t('page.system_view.plugins_type_all'), value: 'all' },
            {
              label: $t('page.system_view.roles_type_system'),
              value: 'system',
            },
            {
              label: $t('page.system_view.roles_type_custom'),
              value: 'custom',
            },
          ],
        }),
      },
      {
        component: 'Select',
        fieldName: 'module',
        label: () => $t('page.system_view.roles_filter_module'),
        defaultValue: 'all',
        componentProps: () => ({
          placeholder: $t('page.system_view.roles_module_all'),
          options: getModuleOptions(),
        }),
      },
      {
        component: 'Input',
        fieldName: 'search',
        label: () => $t('common.search'),
        componentProps: () => ({
          placeholder: $t('page.system_view.roles_search_placeholder'),
        }),
      },
    ],
    layout: 'vertical',
    showCollapseButton: false,
    submitOnChange: true,
    submitOnEnter: true,
    submitButtonOptions: {
      content: computed(() => $t('common.filter')),
    },
    resetButtonOptions: {
      content: computed(() => $t('common.reset')),
    },
    actionWrapperClass:
      'col-span-2 sm:col-span-1 flex items-center justify-end gap-2 pt-1 sm:pt-6',
    wrapperClass: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3',
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
    columns: getRoleColumns(),
  },
});

const [PermissionsGrid, permsGridApi] = useVbenVxeGrid<SystemPermissionItem>({
  separator: false,
  detailSheetOptions: {
    resource: 'public.permissions',
    subtitleField: 'module',
    titleField: 'id',
    onCreated: async () => {
      await ensureCatalogLoaded(true);
    },
    onSaved: async () => {
      await ensureCatalogLoaded(true);
    },
  },
  formOptions: {
    commonConfig: {
      componentProps: {
        class: 'w-full',
      },
      hideLabel: isMobile.value,
    },
    schema: [
      {
        component: 'Select',
        fieldName: 'module',
        label: () => $t('page.system_view.roles_col_module'),
        defaultValue: 'all',
        componentProps: () => ({
          placeholder: $t('page.system_view.roles_module_all'),
          options: getModuleOptions(),
        }),
      },
      {
        component: 'Select',
        fieldName: 'role',
        label: () => $t('page.system_view.roles_col_assigned_roles'),
        defaultValue: 'all',
        componentProps: () => ({
          placeholder: $t('page.system_view.roles_all'),
          options: [
            { label: $t('page.system_view.roles_all'), value: 'all' },
            { label: $t('page.system_view.role_owner'), value: 'owner' },
            { label: $t('page.system_view.role_admin'), value: 'admin' },
            { label: $t('page.system_view.role_member'), value: 'member' },
            { label: $t('page.system_view.role_viewer'), value: 'viewer' },
          ],
        }),
      },
      {
        component: 'Input',
        fieldName: 'search',
        label: () => $t('common.search'),
        componentProps: () => ({
          placeholder: $t('page.system_view.perms_search_placeholder'),
        }),
      },
    ],
    layout: 'vertical',
    showCollapseButton: false,
    submitOnChange: true,
    submitOnEnter: true,
    submitButtonOptions: {
      content: computed(() => $t('common.filter')),
    },
    resetButtonOptions: {
      content: computed(() => $t('common.reset')),
    },
    actionWrapperClass:
      'col-span-2 sm:col-span-1 flex items-center justify-end gap-2 pt-1 sm:pt-6',
    wrapperClass: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3',
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
          ).map((perm) => ({
            ...perm,
            roles: rolesByPermissionMap.value[perm.id] ?? [],
          }));

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
    columns: getPermColumns(),
  },
});

watch([() => $t('page.system_view.roles_col_policy_desc'), isMobile], () => {
  rolesGridApi.setGridOptions({ columns: getRoleColumns() });
  permsGridApi.setGridOptions({ columns: getPermColumns() });
  rolesGridApi.formApi?.setState({
    commonConfig: {
      componentProps: {
        class: 'w-full',
      },
      hideLabel: isMobile.value,
    },
  });
  permsGridApi.formApi?.setState({
    commonConfig: {
      componentProps: {
        class: 'w-full',
      },
      hideLabel: isMobile.value,
    },
  });
});

async function handleRefresh() {
  await ensureCatalogLoaded(true);
  if (activeTab.value === 'roles') {
    rolesGridApi.reload();
  } else {
    permsGridApi.reload();
  }
}

function handleOpenCreate() {
  if (activeTab.value === 'roles') {
    rolesGridApi.openCreateSheet();
  } else {
    permsGridApi.openCreateSheet();
  }
}
</script>

<template>
  <div class="space-y-3 p-3 sm:space-y-4 sm:p-5">
    <!-- Top Header -->
    <div class="flex items-center justify-between gap-2">
      <div class="min-w-0">
        <h1
          class="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl"
        >
          {{ $t('page.system.roles') }}
        </h1>
        <p class="hidden text-xs text-muted-foreground sm:block">
          {{ $t('page.system.roles_desc') }}
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <Button
          variant="outline"
          size="icon"
          class="size-8 shrink-0"
          :disabled="loadingCatalog"
          :title="$t('common.refresh')"
          @click="handleRefresh"
        >
          <RefreshCw
            class="size-3.5 shrink-0"
            :class="{ 'animate-spin': loadingCatalog }"
          />
        </Button>
        <Button
          size="sm"
          class="h-8 gap-1.5 px-2.5 text-xs font-medium sm:px-3"
          @click="handleOpenCreate"
        >
          <Plus class="size-3.5 shrink-0" />
          <span>{{ $t('common.createRecord') }}</span>
        </Button>
      </div>
    </div>

    <!-- Main Container: Mode Tabs + VXE Grid -->
    <div
      class="overflow-hidden rounded-xl border border-border/60 bg-card p-3 sm:p-5 shadow-xs space-y-3"
    >
      <!-- Mode Selector -->
      <div class="flex items-center gap-1.5 border-b border-border/40 pb-2.5">
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
          <span>{{
            $t('page.system_view.roles_tab_roles', [allRoles.length])
          }}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          :class="{
            'bg-muted font-medium text-foreground': activeTab === 'permissions',
          }"
          @click="activeTab = 'permissions'"
          class="h-8 gap-1.5 text-xs"
        >
          <KeyRound class="size-3.5 text-muted-foreground" />
          <span>{{
            $t('page.system_view.roles_tab_permissions', [
              allPermissions.length,
            ])
          }}</span>
        </Button>
      </div>

      <!-- Tab 1: System Roles VXE Grid -->
      <div v-if="activeTab === 'roles'">
        <RolesGrid class="roles-vxe-grid">
          <template #role-name-cell="{ row }">
            <div class="flex items-center gap-2">
              <RoleBadge :role="row.name" :uppercase="true" />
              <code class="hidden text-2xs text-muted-foreground sm:inline">
                {{ row.name }}
              </code>
            </div>
          </template>

          <template #role-desc-cell="{ row }">
            <span class="text-xs text-muted-foreground">
              {{ row.description || $t('page.system_view.roles_default_desc') }}
            </span>
          </template>

          <template #role-type-cell="{ row }">
            <Badge
              :variant="row.is_system ? 'default' : 'outline'"
              class="gap-1 text-xs font-normal"
            >
              <Lock v-if="row.is_system" class="size-3 shrink-0" />
              <span>{{
                row.is_system
                  ? $t('page.system_view.roles_type_system')
                  : $t('page.system_view.roles_badge_custom')
              }}</span>
            </Badge>
          </template>

          <template #role-perms-cell="{ row }">
            <div class="flex items-center gap-1.5 min-w-0">
              <Badge variant="outline" class="shrink-0 text-xs font-semibold">
                {{
                  $t('page.system_view.roles_perms_count', [
                    row.permissions.length,
                  ])
                }}
              </Badge>
              <code
                v-for="perm in row.permissions.slice(0, 2)"
                :key="perm"
                class="hidden max-w-36 truncate rounded bg-muted px-1.5 py-0.5 text-2xs text-muted-foreground sm:inline-block"
                :title="perm"
              >
                {{ perm }}
              </code>
              <Badge
                v-if="row.permissions.length > 2"
                variant="secondary"
                class="hidden shrink-0 text-2xs font-normal sm:inline-flex"
              >
                {{
                  $t('page.system_view.roles_more_perms', [
                    row.permissions.length - 2,
                  ])
                }}
              </Badge>
            </div>
          </template>

          <template #role-date-cell="{ row }">
            <span class="text-xs text-muted-foreground">
              {{ formatDate(row.created_at) }}
            </span>
          </template>

          <template #empty>
            <div
              class="flex flex-col items-center justify-center p-8 text-center text-muted-foreground"
            >
              <ShieldCheck
                class="size-10 stroke-[1.5] text-muted-foreground/60 mb-3"
              />
              <p class="text-sm font-medium text-foreground">
                {{ $t('page.system_view.roles_empty_title') }}
              </p>
              <p class="text-xs text-muted-foreground max-w-sm mt-1">
                {{ $t('page.system_view.roles_empty_desc') }}
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
                class="rounded bg-muted px-2 py-0.5 text-xs font-semibold text-primary"
              >
                {{ row.id }}
              </code>
              <Button
                variant="ghost"
                size="icon"
                class="size-6 shrink-0 text-muted-foreground hover:text-foreground"
                :title="$t('page.system_view.perms_copy_key')"
                @click.stop="handleCopyKey(row.id)"
              >
                <Check v-if="isCopied(row.id)" class="size-3.5 text-success" />
                <Copy v-else class="size-3.5" />
              </Button>
            </div>
          </template>

          <template #perm-module-cell="{ row }">
            <Badge variant="outline" class="gap-1.5 text-xs font-normal">
              <Folder class="size-3 text-primary shrink-0" />
              <span>{{ row.module }}</span>
            </Badge>
          </template>

          <template #perm-desc-cell="{ row }">
            <span class="text-xs text-muted-foreground">
              {{
                row.description ||
                $t('page.system_view.perms_default_desc', [row.module])
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
                {{ $t('page.system_view.perms_empty_title') }}
              </p>
              <p class="text-xs text-muted-foreground max-w-sm mt-1">
                {{ $t('page.system_view.perms_empty_desc') }}
              </p>
            </div>
          </template>
        </PermissionsGrid>
      </div>
    </div>
  </div>
</template>
