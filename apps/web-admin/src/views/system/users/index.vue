<script lang="ts" setup>
import type { PlatformUserItem } from '#/api';

import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { usePreferences } from '@vben/preferences';

import {
  ArrowUpRight,
  Building2,
  Check,
  Copy,
  Eye,
  RefreshCw,
  ShieldCheck,
  Users,
} from '@lucide/vue';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@tuquet/vue-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { filterPlatformUsers, getPlatformUsersApi } from '#/api';
import RoleBadge from '#/components/iam/role-badge.vue';
import { useClipboard, useDateFormat } from '#/composables';
import { $t } from '#/locales';

defineOptions({ name: 'SystemUsers' });

const router = useRouter();
const { formatDate } = useDateFormat();
const { copyToClipboard, isCopied } = useClipboard();
const { isMobile } = usePreferences();

const allUsers = ref<PlatformUserItem[]>([]);
const usersLoaded = ref(false);
const loadingUsers = ref(false);
const selectedUser = ref<null | PlatformUserItem>(null);
const detailOpen = ref(false);

let loadUsersPromise: null | Promise<void> = null;

async function ensureUsersLoaded(force = false): Promise<void> {
  if (usersLoaded.value && !force) {
    return;
  }
  if (loadUsersPromise && !force) {
    return loadUsersPromise;
  }

  loadingUsers.value = true;
  loadUsersPromise = (async () => {
    try {
      allUsers.value = await getPlatformUsersApi();
      usersLoaded.value = true;
    } finally {
      loadingUsers.value = false;
      loadUsersPromise = null;
    }
  })();

  return loadUsersPromise;
}

function getInitials(name: null | string): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function handleCopyId(id: string) {
  copyToClipboard(id, id);
}

function openUserDetail(user: PlatformUserItem) {
  gridApi.openDetailSheet(user);
}

function navigateToWorkspace(tenantId: string) {
  if (!tenantId) return;
  detailOpen.value = false;
  router.push(`/tenants/${tenantId}`);
}

function getColumns() {
  return [
    {
      field: 'full_name',
      title: $t('term.user'),
      minWidth: isMobile.value ? 185 : 250,
      align: 'left' as const,
      slots: { default: 'user-cell' },
    },
    {
      field: 'primary_role',
      title: $t('page.system_view.users_col_primary_role'),
      width: isMobile.value ? 100 : 140,
      align: 'left' as const,
      slots: { default: 'role-cell' },
    },
    {
      field: 'tenant_count',
      title: $t('page.system_view.users_col_organizations'),
      minWidth: 210,
      align: 'left' as const,
      visible: !isMobile.value,
      slots: { default: 'tenant-cell' },
    },
    {
      field: 'id',
      title: $t('page.system_view.users_col_id'),
      width: 175,
      align: 'left' as const,
      visible: !isMobile.value,
      slots: { default: 'id-cell' },
    },
    {
      field: 'created_at',
      title: $t('page.system_view.users_col_joined_at'),
      width: 150,
      align: 'left' as const,
      visible: !isMobile.value,
      slots: { default: 'date-cell' },
    },
    {
      field: 'actions',
      title: $t('common.actions'),
      width: isMobile.value ? 56 : 110,
      align: 'right' as const,
      slots: { default: 'actions-cell' },
    },
  ];
}

const [Grid, gridApi] = useVbenVxeGrid<PlatformUserItem>({
  separator: false,
  detailSheetOptions: {
    actions: [
      {
        disabled: (row) => !row?.workspaces?.[0]?.tenant_id,
        icon: ArrowUpRight,
        label: $t('page.system_view.users_open_workspace'),
        onClick: (row) => {
          const tenantId = row?.workspaces?.[0]?.tenant_id;
          if (tenantId) {
            navigateToWorkspace(tenantId);
          }
        },
        variant: 'outline',
      },
    ],
    forwardActionSlot: false,
    resource: 'public.profiles',
    subtitleField: 'primary_role',
    titleField: 'full_name',
    onSaved: async () => {
      await ensureUsersLoaded(true);
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
        fieldName: 'tenant_filter',
        label: () => $t('page.system_view.users_filter_org'),
        defaultValue: 'all',
        componentProps: () => ({
          placeholder: $t('page.system_view.users_org_all'),
          options: [
            { label: $t('page.system_view.users_org_all'), value: 'all' },
            {
              label: $t('page.system_view.users_org_has_tenants'),
              value: 'has_tenants',
            },
            {
              label: $t('page.system_view.users_org_no_tenants'),
              value: 'no_tenants',
            },
          ],
        }),
      },
      {
        component: 'Select',
        fieldName: 'role_filter',
        label: () => $t('term.role'),
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
          placeholder: $t('page.system_view.users_search_placeholder'),
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
      height: 58,
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
          await ensureUsersLoaded();

          const filtered = filterPlatformUsers(allUsers.value, {
            role_filter: formValues?.role_filter,
            search: formValues?.search,
            tenant_filter: formValues?.tenant_filter,
          });

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
    columns: getColumns(),
  },
});

watch([() => $t('page.system_view.users_col_primary_role'), isMobile], () => {
  gridApi.setGridOptions({ columns: getColumns() });
  gridApi.formApi?.setState({
    commonConfig: {
      componentProps: {
        class: 'w-full',
      },
      hideLabel: isMobile.value,
    },
  });
});

async function handleRefresh() {
  await ensureUsersLoaded(true);
  gridApi.reload();
}
</script>

<template>
  <div class="space-y-3 p-3 sm:space-y-4 sm:p-5">
    <!-- Top Header -->
    <div class="flex items-center justify-between gap-2">
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <h1
            class="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl"
          >
            {{ $t('page.system.users') }}
          </h1>
          <Badge variant="secondary" class="font-mono text-xs font-normal">
            {{ allUsers.length }}
          </Badge>
        </div>
        <p class="hidden text-xs text-muted-foreground sm:block">
          {{ $t('page.system.users_desc') }}
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          class="size-8 shrink-0"
          :disabled="loadingUsers"
          :title="$t('common.refresh')"
          @click="handleRefresh"
        >
          <RefreshCw
            class="size-3.5 shrink-0"
            :class="{ 'animate-spin': loadingUsers }"
          />
        </Button>
      </div>
    </div>

    <!-- Main Container: VXE Grid -->
    <div
      class="overflow-hidden rounded-xl border border-border/60 bg-card p-3 sm:p-5 shadow-xs"
    >
      <!-- VXE Grid Table -->
      <Grid class="users-vxe-grid">
        <template #user-cell="{ row }">
          <div class="flex items-center gap-2.5 sm:gap-3">
            <Avatar
              class="size-8 shrink-0 rounded-lg border border-border/50 sm:size-9"
            >
              <AvatarImage
                v-if="row.avatar_url"
                :src="row.avatar_url"
                :alt="row.full_name || ''"
              />
              <AvatarFallback
                class="rounded-lg bg-muted text-xs font-semibold text-foreground"
              >
                {{ getInitials(row.full_name) }}
              </AvatarFallback>
            </Avatar>
            <div class="flex min-w-0 flex-col text-left leading-snug">
              <span class="truncate text-xs font-semibold text-foreground">
                {{ row.full_name || $t('page.system_view.users_anonymous') }}
              </span>
              <div
                class="flex items-center gap-1.5 text-2xs text-muted-foreground sm:text-xs"
              >
                <span class="truncate">
                  {{ row.email || $t('page.system_view.users_no_email') }}
                </span>
                <span class="sm:hidden">&bull;</span>
                <span class="shrink-0 sm:hidden">
                  {{
                    $t('page.system_view.users_orgs_count', [row.tenant_count])
                  }}
                </span>
              </div>
            </div>
          </div>
        </template>

        <template #role-cell="{ row }">
          <RoleBadge
            v-if="row.primary_role"
            :role="row.primary_role"
            :uppercase="true"
          />
          <span v-else class="text-xs text-muted-foreground">{{
            $t('page.system_view.users_unassigned_role')
          }}</span>
        </template>

        <template #tenant-cell="{ row }">
          <div class="flex items-center gap-2 min-w-0">
            <Badge
              :variant="row.tenant_count > 0 ? 'outline' : 'secondary'"
              class="shrink-0 gap-1 font-normal text-xs"
            >
              <Building2 class="size-3 text-muted-foreground shrink-0" />
              <span>{{
                $t('page.system_view.users_orgs_count', [row.tenant_count])
              }}</span>
            </Badge>
            <span
              v-if="row.workspaces?.[0]?.tenant_name"
              class="truncate text-xs text-muted-foreground"
              :title="row.workspaces[0].tenant_name"
            >
              {{ row.workspaces[0].tenant_name }}
            </span>
          </div>
        </template>

        <template #id-cell="{ row }">
          <div class="inline-flex items-center gap-1">
            <code
              class="rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground"
              :title="row.id"
            >
              {{ row.id.slice(0, 8) }}...{{ row.id.slice(-4) }}
            </code>
            <Button
              variant="ghost"
              size="icon"
              class="size-6 shrink-0 text-muted-foreground hover:text-foreground"
              :title="$t('page.system_view.users_copy_uuid')"
              @click.stop="handleCopyId(row.id)"
            >
              <Check v-if="isCopied(row.id)" class="size-3.5 text-success" />
              <Copy v-else class="size-3.5" />
            </Button>
          </div>
        </template>

        <template #date-cell="{ row }">
          <span class="font-mono text-xs text-muted-foreground">
            {{ formatDate(row.created_at) }}
          </span>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center justify-end">
            <Button
              variant="outline"
              size="sm"
              class="h-7 px-2 text-xs inline-flex items-center gap-1"
              :title="$t('common.detail')"
              @click="openUserDetail(row as PlatformUserItem)"
            >
              <Eye class="size-3 shrink-0" />
              <span class="hidden sm:inline">{{ $t('common.detail') }}</span>
            </Button>
          </div>
        </template>

        <template #empty>
          <div
            class="flex flex-col items-center justify-center p-8 text-center text-muted-foreground"
          >
            <Users class="size-10 stroke-[1.5] text-muted-foreground/60 mb-3" />
            <p class="text-sm font-medium text-foreground">
              {{ $t('page.system_view.users_empty_title') }}
            </p>
            <p class="text-xs text-muted-foreground max-w-sm mt-1">
              {{ $t('page.system_view.users_empty_desc') }}
            </p>
          </div>
        </template>
      </Grid>
    </div>

    <!-- Enterprise User Inspector Dialog -->
    <Dialog v-model:open="detailOpen">
      <DialogContent class="max-w-[calc(100vw-2rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2 text-base">
            <ShieldCheck class="size-4 text-primary" />
            {{ $t('page.system_view.users_dialog_title') }}
          </DialogTitle>
          <DialogDescription class="text-xs">
            {{ $t('page.system_view.users_dialog_desc') }}
          </DialogDescription>
        </DialogHeader>

        <div v-if="selectedUser" class="space-y-4 text-xs">
          <!-- Identity Card -->
          <div
            class="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-4"
          >
            <div class="flex items-center gap-3 min-w-0">
              <Avatar
                class="size-11 rounded-xl border border-border/40 shrink-0"
              >
                <AvatarImage
                  v-if="selectedUser.avatar_url"
                  :src="selectedUser.avatar_url"
                  :alt="selectedUser.full_name || ''"
                />
                <AvatarFallback
                  class="rounded-xl bg-muted text-sm font-semibold text-foreground"
                >
                  {{ getInitials(selectedUser.full_name) }}
                </AvatarFallback>
              </Avatar>
              <div class="min-w-0 space-y-0.5">
                <div class="text-sm font-semibold text-foreground truncate">
                  {{
                    selectedUser.full_name ||
                    $t('page.system_view.users_anonymous')
                  }}
                </div>
                <div class="text-xs text-muted-foreground truncate">
                  {{
                    selectedUser.email || $t('page.system_view.users_no_email')
                  }}
                </div>
                <div class="flex items-center gap-1.5 pt-1">
                  <code
                    class="rounded bg-muted px-1.5 py-0.5 font-mono text-2xs text-muted-foreground"
                  >
                    {{ selectedUser.id }}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-5 text-muted-foreground hover:text-foreground"
                    :title="$t('page.system_view.users_copy_uuid')"
                    @click="handleCopyId(selectedUser.id)"
                  >
                    <Check
                      v-if="isCopied(selectedUser.id)"
                      class="size-3 text-success"
                    />
                    <Copy v-else class="size-3" />
                  </Button>
                </div>
              </div>
            </div>

            <RoleBadge
              v-if="selectedUser.primary_role"
              :role="selectedUser.primary_role"
            />
          </div>

          <!-- Metadata Grid -->
          <div
            class="grid grid-cols-2 gap-3 rounded-xl border border-border/60 p-3.5"
          >
            <div>
              <div class="text-muted-foreground">
                {{ $t('page.system_view.users_col_joined_at') }}
              </div>
              <div class="mt-0.5 font-mono font-medium text-foreground">
                {{ formatDate(selectedUser.created_at) }}
              </div>
            </div>
            <div>
              <div class="text-muted-foreground">
                {{ $t('page.system_view.users_last_updated') }}
              </div>
              <div class="mt-0.5 font-mono font-medium text-foreground">
                {{ formatDate(selectedUser.updated_at) }}
              </div>
            </div>
          </div>

          <!-- Workspaces Membership List -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <h4 class="font-semibold text-foreground">
                {{
                  $t('page.system_view.users_orgs_header', [
                    selectedUser.tenant_count,
                  ])
                }}
              </h4>
            </div>

            <div
              v-if="
                selectedUser.workspaces && selectedUser.workspaces.length > 0
              "
              class="max-h-56 space-y-2 overflow-y-auto pr-1"
            >
              <div
                v-for="ws in selectedUser.workspaces"
                :key="ws.tenant_id"
                class="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-card p-3"
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  <div
                    class="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground shrink-0"
                  >
                    <Building2 class="size-4" />
                  </div>
                  <div class="min-w-0">
                    <div class="font-medium text-foreground truncate">
                      {{ ws.tenant_name }}
                    </div>
                    <div
                      class="font-mono text-2xs text-muted-foreground truncate"
                    >
                      /{{ ws.tenant_slug || ws.tenant_id.slice(0, 8) }}
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  <RoleBadge :role="ws.role_name" />
                  <Button
                    v-if="ws.tenant_id"
                    variant="outline"
                    size="sm"
                    class="h-7 px-2 text-xs gap-1"
                    @click="navigateToWorkspace(ws.tenant_id)"
                  >
                    <span>{{
                      $t('page.system_view.users_open_workspace')
                    }}</span>
                    <ArrowUpRight class="size-3" />
                  </Button>
                </div>
              </div>
            </div>

            <div
              v-else-if="selectedUser.tenant_count > 0"
              class="rounded-lg border border-border/60 bg-muted/10 p-4 text-center text-muted-foreground"
            >
              {{
                $t('page.system_view.users_member_of_orgs', [
                  selectedUser.tenant_count,
                ])
              }}
            </div>

            <div
              v-else
              class="rounded-lg border border-border/60 bg-muted/10 p-4 text-center text-muted-foreground"
            >
              {{ $t('page.system_view.users_no_orgs_desc') }}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
