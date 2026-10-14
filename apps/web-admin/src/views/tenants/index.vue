<script lang="ts" setup>
import type { TenantItem } from '#/api';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useUserStore } from '@vben/stores';

import {
  Building2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Terminal,
} from '@lucide/vue';
import { Badge, Button, toast } from '@tuquet/vue-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createTenantApi,
  getActiveTenantId,
  getTenantsApi,
  setActiveTenantId,
} from '#/api';
import { useDateFormat } from '#/composables';
import { $t } from '#/locales';

import CreateWorkspaceModal from './components/modals/create-workspace-modal.vue';

defineOptions({ name: 'Workspace' });

const router = useRouter();
const userStore = useUserStore();
const { formatDate } = useDateFormat();

// Loading states
const creatingTenant = ref(false);

// Data
const tenants = ref<TenantItem[]>([]);
const activeTenantId = ref(getActiveTenantId());

// Modal state
const isModalVisible = ref(false);

const activeTenant = computed(() => {
  return (
    tenants.value.find((t) => t.id === activeTenantId.value) ||
    tenants.value[0] ||
    null
  );
});

// Plan mapping config
const PLAN_MAP: Record<string, { color: string; label: string }> = {
  enterprise: { color: 'purple', label: 'Enterprise' },
  free: { color: 'default', label: 'Free' },
  pro: { color: 'geekblue', label: 'Pro' },
};

function getPlanInfo(plan?: string) {
  const key = plan?.toLowerCase() || 'pro';
  return PLAN_MAP[key] || { color: 'default', label: plan || 'Standard' };
}

function handleSelectTenant(record: any) {
  activeTenantId.value = record.id;
  setActiveTenantId(record.id);
  toast.success($t('page.workspace.switched_to', { name: record.name }));
}

function handleConnectCli(record?: any) {
  const targetId = record?.id || activeTenantId.value;
  router.push(
    `/auth/desktop?machine_name=Local Workstation&tenant_id=${encodeURIComponent(targetId)}`,
  );
}

function openCreateModal() {
  isModalVisible.value = true;
}

async function handleCreateTenant(payload: {
  name: string;
  plan: string;
  slug: string;
}) {
  creatingTenant.value = true;
  try {
    const created = await createTenantApi({
      name: payload.name,
      plan: payload.plan,
      slug: payload.slug,
    });
    toast.success($t('page.workspace.create_success', { name: created.name }));
    isModalVisible.value = false;
    activeTenantId.value = created.id;
    setActiveTenantId(created.id);
    gridApi.reload();
  } catch (error: any) {
    toast.error(error.message || $t('page.workspace.create_failed'));
  } finally {
    creatingTenant.value = false;
  }
}

const [Grid, gridApi] = useVbenVxeGrid<TenantItem>({
  formOptions: {
    schema: [
      {
        component: 'Select',
        fieldName: 'plan',
        label: 'Gói cước',
        defaultValue: 'all',
        componentProps: {
          placeholder: 'Tất cả gói cước',
          options: [
            { label: 'Tất cả gói cước', value: 'all' },
            { label: 'Free', value: 'free' },
            { label: 'Pro', value: 'pro' },
            { label: 'Enterprise', value: 'enterprise' },
          ],
        },
      },
      {
        component: 'Select',
        fieldName: 'status',
        label: 'Trạng thái',
        defaultValue: 'all',
        componentProps: {
          placeholder: 'Tất cả trạng thái',
          options: [
            { label: 'Tất cả trạng thái', value: 'all' },
            { label: 'Đang hoạt động', value: 'active' },
            { label: 'Tạm khóa', value: 'suspended' },
          ],
        },
      },
      {
        component: 'Input',
        fieldName: 'search',
        label: 'Tìm kiếm',
        componentProps: {
          placeholder: 'Tìm theo tên hoặc slug workspace...',
          clearable: true,
        },
      },
    ],
    layout: 'vertical',
    showCollapseButton: false,
    submitButtonOptions: {
      content: $t('common.filter'),
    },
    resetButtonOptions: {
      content: $t('common.reset'),
    },
    actionWrapperClass: 'flex items-center justify-end gap-2 pt-2 sm:pt-6',
    wrapperClass: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3',
  },
  gridOptions: {
    border: false,
    round: true,
    showOverflow: true,
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
          const list = await getTenantsApi();
          tenants.value = list;
          if (list.length > 0 && !activeTenantId.value) {
            activeTenantId.value = list[0]?.id || '';
            setActiveTenantId(activeTenantId.value);
          }

          let filtered = list;
          if (formValues?.plan && formValues.plan !== 'all') {
            filtered = filtered.filter(
              (t) =>
                (t.metadata?.plan || 'pro').toLowerCase() ===
                formValues.plan.toLowerCase(),
            );
          }

          if (formValues?.status && formValues.status !== 'all') {
            filtered = filtered.filter(
              (t) =>
                (t.status || 'active').toLowerCase() ===
                formValues.status.toLowerCase(),
            );
          }

          if (formValues?.search) {
            const kw = String(formValues.search).toLowerCase().trim();
            filtered = filtered.filter(
              (t) =>
                t.name.toLowerCase().includes(kw) ||
                t.slug.toLowerCase().includes(kw) ||
                t.id.toLowerCase().includes(kw),
            );
          }

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
        title: 'Tổ chức',
        minWidth: 240,
        slots: { default: 'name-cell' },
      },
      {
        field: 'slug',
        title: 'Slug',
        width: 150,
        slots: { default: 'slug-cell' },
      },
      {
        field: 'plan',
        title: 'Gói cước',
        width: 140,
        slots: { default: 'plan-cell' },
      },
      {
        field: 'status',
        title: 'Trạng thái',
        width: 130,
        slots: { default: 'status-cell' },
      },
      {
        field: 'created_at',
        title: 'Ngày tạo',
        width: 150,
        slots: { default: 'date-cell' },
      },
      {
        field: 'actions',
        title: 'Thao tác',
        width: 220,
        align: 'right',
        slots: { default: 'actions-cell' },
      },
    ],
  },
});
</script>

<template>
  <div class="space-y-4 p-4 sm:space-y-5 sm:p-5">
    <!-- Top Action Bar -->
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h1
          class="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
        >
          {{ $t('page.workspace.title') }}
        </h1>
        <p class="text-xs text-muted-foreground">
          {{ $t('page.workspace.subtitle') }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          class="gap-1.5"
          :title="$t('common.refresh')"
          @click="() => gridApi.reload()"
        >
          <RefreshCw class="size-3.5" />
          <span>{{ $t('common.refresh') }}</span>
        </Button>
        <Button
          size="sm"
          class="gap-1.5 text-xs font-medium"
          @click="openCreateModal"
        >
          <Plus class="size-3.5" />
          <span>{{ $t('common.create') }}</span>
        </Button>
      </div>
    </div>

    <!-- Active Workspace Identity Card -->
    <div
      class="rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm"
    >
      <div
        class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex items-center gap-3">
          <div
            class="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm"
          >
            <Building2 class="size-5.5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base font-semibold text-foreground">
                {{ activeTenant?.name || $t('page.workspace.not_selected') }}
              </h2>
              <Badge variant="outline" class="text-2xs font-mono">
                /{{ activeTenant?.slug || 'none' }}
              </Badge>
            </div>
            <p class="text-xs text-muted-foreground">
              ID: <span class="font-mono">{{ activeTenant?.id || '—' }}</span>
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            class="gap-1.5 text-xs"
            @click="handleConnectCli(activeTenant)"
          >
            <Terminal class="size-3.5" />
            <span>{{ $t('page.workspace.connect_cli') }}</span>
          </Button>
        </div>
      </div>
    </div>

    <!-- Metric Cards Grid -->
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">
            {{ $t('page.workspace.tenants_count') }}
          </span>
          <span
            class="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground"
          >
            <Building2 class="size-4.5" />
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-2xl font-bold tracking-tight text-foreground">
            {{ tenants.length }}
          </span>
          <span class="text-xs font-medium text-muted-foreground">
            {{ $t('page.workspace.tenants_label') }}
          </span>
        </div>
        <div class="mt-2 text-xs text-muted-foreground truncate">
          {{ $t('page.workspace.selected') }}:
          <span class="font-semibold text-foreground">
            {{ activeTenant?.name || $t('page.workspace.not_selected') }}
          </span>
        </div>
      </div>

      <div class="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">
            {{ $t('page.workspace.current_workspace') }}
          </span>
          <span
            class="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground"
          >
            <Building2 class="size-4.5" />
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2 truncate">
          <span
            class="text-lg font-bold tracking-tight text-foreground truncate"
          >
            {{ activeTenant?.name || $t('page.workspace.not_selected') }}
          </span>
        </div>
        <div class="mt-2 text-xs text-muted-foreground truncate font-mono">
          slug: {{ activeTenant?.slug || 'none' }}
        </div>
      </div>

      <div class="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">
            {{ $t('page.workspace.service_plan') }}
          </span>
          <span
            class="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground"
          >
            <Sparkles class="size-4.5" />
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-xl font-bold tracking-tight text-foreground">
            {{ getPlanInfo(activeTenant?.metadata?.plan).label }}
          </span>
          <Badge variant="secondary" class="text-xs font-normal capitalize">
            <span
              class="mr-1.5 size-1.5 rounded-full"
              :class="
                activeTenant?.status === 'active'
                  ? 'bg-success'
                  : 'bg-muted-foreground'
              "
            ></span>
            {{ activeTenant?.status || 'Active' }}
          </Badge>
        </div>
        <div class="mt-2 text-xs text-muted-foreground">
          {{ $t('page.workspace.certified_by_cloud') }}
        </div>
      </div>

      <div class="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">
            {{ $t('page.workspace.administrator') }}
          </span>
          <span
            class="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground"
          >
            <ShieldCheck class="size-4.5" />
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2 truncate">
          <span
            class="text-lg font-bold tracking-tight text-foreground truncate"
          >
            {{
              userStore.userInfo?.realName ||
              userStore.userInfo?.username ||
              'Admin'
            }}
          </span>
        </div>
        <div class="mt-2 text-xs text-muted-foreground">
          {{ $t('page.workspace.role_superadmin') }}
        </div>
      </div>
    </div>

    <!-- Main Content Container: Tenants Workspace List -->
    <div
      class="overflow-hidden rounded-none sm:rounded-xl border-0 sm:border border-border/60 bg-card p-0 sm:p-5 shadow-none sm:shadow-sm space-y-4"
    >
      <div
        class="flex items-center justify-between border-b border-border/40 pb-3 px-3 sm:px-0 pt-2 sm:pt-0"
      >
        <div class="flex items-center gap-2">
          <Building2 class="size-4 text-foreground" />
          <h2 class="text-sm font-semibold text-foreground">
            {{ $t('page.workspace.list_title') }}
          </h2>
        </div>
        <span class="text-xs text-muted-foreground">
          {{ $t('page.workspace.available_count', [tenants.length]) }}
        </span>
      </div>

      <Grid class="tenants-vxe-grid">
        <template #name-cell="{ row }">
          <div class="flex items-center gap-2">
            <span class="font-medium text-foreground">
              {{ row.name }}
            </span>
            <Badge
              v-if="row.id === activeTenantId"
              variant="secondary"
              class="text-xs font-normal"
            >
              {{ $t('page.workspace.action_selected') }}
            </Badge>
          </div>
        </template>

        <template #slug-cell="{ row }">
          <code
            class="rounded bg-muted/60 px-2 py-0.5 font-mono text-xs text-foreground"
          >
            {{ row.slug }}
          </code>
        </template>

        <template #plan-cell="{ row }">
          <Badge variant="outline" class="text-xs font-medium">
            {{ getPlanInfo(row.metadata?.plan).label }}
          </Badge>
        </template>

        <template #status-cell="{ row }">
          <Badge variant="outline" class="text-xs capitalize font-normal">
            <span
              class="mr-1.5 size-1.5 rounded-full"
              :class="
                row.status === 'active' ? 'bg-success' : 'bg-muted-foreground'
              "
            ></span>
            {{ row.status || 'Active' }}
          </Badge>
        </template>

        <template #date-cell="{ row }">
          <span class="text-xs text-muted-foreground">
            {{ formatDate(row.created_at) }}
          </span>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center justify-end gap-1.5">
            <Button
              size="sm"
              :variant="row.id === activeTenantId ? 'secondary' : 'default'"
              class="h-7 text-xs"
              @click="handleSelectTenant(row)"
            >
              {{
                row.id === activeTenantId
                  ? $t('page.workspace.action_active')
                  : $t('page.workspace.action_activate')
              }}
            </Button>
            <Button
              variant="outline"
              size="sm"
              class="h-7 text-xs"
              @click="router.push(`/tenants/${row.id}`)"
            >
              {{ $t('page.workspace.action_detail') }}
            </Button>
            <Button
              variant="outline"
              size="sm"
              class="h-7 text-xs"
              @click="handleConnectCli(row)"
            >
              {{ $t('page.workspace.action_connect') }}
            </Button>
          </div>
        </template>
      </Grid>
    </div>

    <!-- Create Workspace Modal -->
    <CreateWorkspaceModal
      v-model:open="isModalVisible"
      :loading="creatingTenant"
      @submit="handleCreateTenant"
    />
  </div>
</template>
