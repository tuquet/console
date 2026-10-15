<script lang="ts" setup>
import type { TenantItem } from '#/api';

import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { usePreferences } from '@vben/preferences';

import { Building2, Check, Eye, Plus, RefreshCw, Terminal } from '@lucide/vue';
import { Badge, Button, toast } from '@tuquet/vue-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createTenantApi,
  getActiveTenantId,
  getTenantsApi,
  setActiveTenantId,
} from '#/api';
import { useDateFormat } from '#/composables';
import { FILTER_ALL, TENANT_PLAN, TENANT_STATUS } from '#/constants';
import { $t } from '#/locales';

defineOptions({ name: 'Workspace' });

const router = useRouter();
const { formatDate } = useDateFormat();
const { isMobile } = usePreferences();

// Data
const tenants = ref<TenantItem[]>([]);
const activeTenantId = ref(getActiveTenantId());

const activeTenant = computed(() => {
  return (
    tenants.value.find((t) => t.id === activeTenantId.value) ||
    tenants.value[0] ||
    null
  );
});

// Plan mapping config
const PLAN_MAP: Record<string, { color: string; label: string }> = {
  [TENANT_PLAN.ENTERPRISE]: { color: 'purple', label: 'Enterprise' },
  [TENANT_PLAN.FREE]: { color: 'default', label: 'Free' },
  [TENANT_PLAN.PRO]: { color: 'geekblue', label: 'Pro' },
};

function getPlanInfo(plan?: string) {
  const key = plan?.toLowerCase() || TENANT_PLAN.PRO;
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

function getColumns() {
  const mobile = isMobile.value;
  return [
    {
      field: 'name',
      title: $t('page.workspace.col_name'),
      minWidth: mobile ? 165 : 220,
      slots: { default: 'name-cell' },
    },
    {
      field: 'slug',
      title: $t('page.workspace.col_slug'),
      minWidth: 140,
      visible: !mobile,
      slots: { default: 'slug-cell' },
    },
    {
      field: 'plan',
      title: $t('page.workspace.col_plan'),
      minWidth: 110,
      visible: !mobile,
      slots: { default: 'plan-cell' },
    },
    {
      field: 'status',
      title: $t('page.workspace.col_status'),
      minWidth: mobile ? 95 : 130,
      slots: { default: 'status-cell' },
    },
    {
      field: 'created_at',
      title: $t('page.workspace.col_created_at'),
      minWidth: 140,
      visible: !mobile,
      slots: { default: 'date-cell' },
    },
    {
      field: 'actions',
      title: $t('page.workspace.col_actions'),
      minWidth: mobile ? 110 : 280,
      align: 'right' as const,
      showOverflow: false,
      slots: { default: 'actions-cell' },
    },
  ];
}

const [Grid, gridApi] = useVbenVxeGrid<TenantItem>({
  separator: false,
  gridClass: 'p-0',
  detailSheetOptions: {
    resource: 'public.tenants',
    subtitleField: 'slug',
    titleField: 'name',
    onCreate: async ({ formData }) => {
      return await createTenantApi({
        name: String(formData.name || '').trim(),
        plan: String(formData.plan || 'starter'),
        slug: String(formData.slug || '').trim(),
      });
    },
    onCreated: (created) => {
      if (created?.id) {
        activeTenantId.value = created.id;
        setActiveTenantId(created.id);
      }
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
        fieldName: 'plan',
        label: () => $t('page.tenants_view.filter_plan'),
        defaultValue: FILTER_ALL,
        componentProps: () => ({
          placeholder: $t('page.tenants_view.plan_all'),
          options: [
            { label: $t('page.tenants_view.plan_all'), value: FILTER_ALL },
            { label: 'Free', value: TENANT_PLAN.FREE },
            { label: 'Pro', value: TENANT_PLAN.PRO },
            { label: 'Enterprise', value: TENANT_PLAN.ENTERPRISE },
          ],
        }),
      },
      {
        component: 'Select',
        fieldName: 'status',
        label: () => $t('common.status'),
        defaultValue: FILTER_ALL,
        componentProps: () => ({
          placeholder: $t('page.tenants_view.status_all'),
          options: [
            { label: $t('page.tenants_view.status_all'), value: FILTER_ALL },
            { label: $t('common.active'), value: TENANT_STATUS.ACTIVE },
            { label: $t('common.suspended'), value: TENANT_STATUS.SUSPENDED },
          ],
        }),
      },
      {
        component: 'Input',
        fieldName: 'search',
        label: () => $t('common.search'),
        componentProps: () => ({
          placeholder: $t('page.tenants_view.search_placeholder'),
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
    pagerConfig: {
      autoHidden: true,
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
          if (formValues?.plan && formValues.plan !== FILTER_ALL) {
            filtered = filtered.filter(
              (t) =>
                (t.metadata?.plan || TENANT_PLAN.PRO).toLowerCase() ===
                formValues.plan.toLowerCase(),
            );
          }

          if (formValues?.status && formValues.status !== FILTER_ALL) {
            filtered = filtered.filter(
              (t) =>
                (t.status || TENANT_STATUS.ACTIVE).toLowerCase() ===
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
    columns: getColumns(),
  },
});

watch([() => $t('page.workspace.col_name'), isMobile], () => {
  gridApi.setGridOptions({ columns: getColumns() });
  gridApi.formApi?.setState({
    commonConfig: {
      componentProps: { class: 'w-full' },
      hideLabel: isMobile.value,
    },
  });
});
</script>

<template>
  <div class="space-y-3 p-3 sm:space-y-4 sm:p-5">
    <!-- Top Action Bar -->
    <div class="flex items-center justify-between gap-2">
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <h1
            class="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl"
          >
            {{ $t('page.workspace.title') }}
          </h1>
          <Badge variant="secondary" class="font-mono text-xs font-normal">
            {{ tenants.length }}
          </Badge>
        </div>
        <p class="hidden text-xs text-muted-foreground sm:block">
          {{ $t('page.workspace.subtitle') }}
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <Button
          variant="outline"
          size="icon"
          class="size-8 shrink-0"
          :title="$t('common.refresh')"
          @click="() => gridApi.reload()"
        >
          <RefreshCw class="size-3.5" />
        </Button>
        <Button
          size="sm"
          class="h-8 gap-1.5 px-2.5 text-xs font-medium sm:px-3"
          @click="() => gridApi.openCreateSheet()"
        >
          <Plus class="size-3.5" />
          <span>{{ $t('common.createRecord') }}</span>
        </Button>
      </div>
    </div>

    <!-- Compact Active Workspace Strip -->
    <div
      class="flex items-center justify-between gap-2.5 rounded-xl border border-border/60 bg-card px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-xs"
    >
      <div class="flex min-w-0 items-center gap-2.5">
        <div
          class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
        >
          <Building2 class="size-4" />
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-1.5">
            <span class="truncate text-sm font-semibold text-foreground">
              {{ activeTenant?.name || $t('page.workspace.not_selected') }}
            </span>
            <Badge
              variant="outline"
              class="hidden font-mono text-2xs sm:inline-flex"
            >
              /{{ activeTenant?.slug || 'none' }}
            </Badge>
          </div>
          <p class="truncate font-mono text-2xs text-muted-foreground">
            ID: {{ activeTenant?.id || '—' }}
          </p>
        </div>
      </div>

      <Button
        size="sm"
        variant="outline"
        class="h-7 shrink-0 gap-1.5 px-2.5 text-xs"
        @click="handleConnectCli(activeTenant)"
      >
        <Terminal class="size-3.5" />
        <span class="hidden sm:inline">{{
          $t('page.workspace.connect_cli')
        }}</span>
        <span class="sm:hidden">CLI</span>
      </Button>
    </div>

    <!-- Main Content Container: Tenants Workspace List -->
    <div
      class="overflow-hidden rounded-xl border border-border/60 bg-card p-3 sm:p-5 shadow-xs"
    >
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
          <Badge variant="outline" class="text-xs font-normal">
            <span
              class="mr-1.5 size-1.5 rounded-full"
              :class="
                row.status === 'active' ? 'bg-success' : 'bg-muted-foreground'
              "
            ></span>
            {{
              row.status === 'active'
                ? $t('common.active')
                : $t('common.suspended')
            }}
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
              class="h-7 px-2.5 text-xs gap-1"
              @click="handleSelectTenant(row)"
            >
              <Check v-if="row.id === activeTenantId" class="size-3 shrink-0" />
              <span>
                {{
                  row.id === activeTenantId
                    ? $t('page.workspace.action_selected')
                    : $t('page.workspace.action_activate')
                }}
              </span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              class="h-7 px-2.5 text-xs gap-1"
              @click="router.push(`/tenants/${row.id}`)"
            >
              <Eye class="size-3 shrink-0" />
              <span>{{ $t('page.workspace.action_detail') }}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              class="h-7 px-2 text-xs gap-1"
              :title="$t('page.workspace.action_connect')"
              @click="handleConnectCli(row)"
            >
              <Terminal class="size-3 shrink-0" />
              <span>CLI</span>
            </Button>
          </div>
        </template>
      </Grid>
    </div>
  </div>
</template>
