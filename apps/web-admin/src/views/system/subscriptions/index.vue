<script lang="ts" setup>
import type { PlatformSubscriptionItem } from '#/api';

import { computed, ref, watch } from 'vue';

import { FILTER_ALL, SUBSCRIPTION_STATUS } from '@vben/constants';
import { usePreferences } from '@vben/preferences';

import { Plus, RefreshCw } from '@lucide/vue';
import { Badge, Button } from '@tuquet/vue-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getPlatformSubscriptionsApi } from '#/api';
import { useDateFormat } from '#/composables';
import { $t } from '#/locales';

defineOptions({ name: 'SystemSubscriptions' });

const { formatDate } = useDateFormat();
const { isMobile } = usePreferences();

const allSubscriptions = ref<PlatformSubscriptionItem[]>([]);

function getStatusBadge(status: string): {
  label: string;
  variant: 'default' | 'destructive' | 'outline' | 'secondary';
} {
  switch (status) {
    case SUBSCRIPTION_STATUS.ACTIVE: {
      return { label: $t('common.active'), variant: 'default' };
    }
    case SUBSCRIPTION_STATUS.CANCELED: {
      return { label: $t('common.cancelled'), variant: 'outline' };
    }
    case SUBSCRIPTION_STATUS.PAST_DUE: {
      return {
        label: $t('page.system_view.subs_status_past_due'),
        variant: 'destructive',
      };
    }
    case SUBSCRIPTION_STATUS.TRIALING: {
      return {
        label: $t('page.system_view.subs_status_trialing'),
        variant: 'secondary',
      };
    }
    default: {
      return { label: status, variant: 'outline' };
    }
  }
}

function getColumns() {
  return [
    {
      field: 'tenant_name',
      title: $t('term.workspace'),
      minWidth: isMobile.value ? 180 : 220,
      slots: { default: 'workspace-cell' },
    },
    {
      field: 'plan_name',
      title: $t('term.plan'),
      width: 150,
      visible: !isMobile.value,
      slots: { default: 'plan-cell' },
    },
    {
      field: 'price_monthly_usd',
      title: $t('page.system_view.subs_col_unit_price'),
      width: 150,
      visible: !isMobile.value,
      slots: { default: 'price-cell' },
    },
    {
      field: 'status',
      title: $t('common.status'),
      width: isMobile.value ? 115 : 160,
      slots: { default: 'status-cell' },
    },
    {
      field: 'current_period_end',
      title: $t('page.system_view.subs_col_next_billing'),
      minWidth: 170,
      visible: !isMobile.value,
      slots: { default: 'period-cell' },
    },
    {
      field: 'cancel_at_period_end',
      title: $t('page.system_view.subs_col_auto_renew'),
      width: 150,
      align: 'right' as const,
      visible: !isMobile.value,
      slots: { default: 'renewal-cell' },
    },
  ];
}

const [Grid, gridApi] = useVbenVxeGrid<PlatformSubscriptionItem>({
  detailSheetOptions: {
    resource: 'billing.subscriptions',
    subtitleField: 'plan_name',
    titleField: 'tenant_name',
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
        fieldName: 'status',
        label: () => $t('common.status'),
        defaultValue: FILTER_ALL,
        componentProps: () => ({
          placeholder: $t('page.system_view.status_all'),
          options: [
            { label: $t('page.system_view.status_all'), value: FILTER_ALL },
            {
              label: $t('common.active'),
              value: SUBSCRIPTION_STATUS.ACTIVE,
            },
            {
              label: $t('common.cancelled'),
              value: SUBSCRIPTION_STATUS.CANCELED,
            },
            {
              label: $t('page.system_view.subs_status_trialing'),
              value: SUBSCRIPTION_STATUS.TRIALING,
            },
          ],
        }),
      },
      {
        component: 'Input',
        fieldName: 'search',
        label: () => $t('common.search'),
        componentProps: () => ({
          placeholder: $t('page.system_view.subs_search_placeholder'),
          clearable: true,
        }),
      },
    ],
    layout: 'vertical',
    showCollapseButton: false,
    submitButtonOptions: {
      content: computed(() => $t('common.filter')),
    },
    resetButtonOptions: {
      content: computed(() => $t('common.reset')),
    },
    actionWrapperClass:
      'col-span-2 sm:col-span-2 lg:col-span-2 flex items-center justify-end gap-2 pt-1 sm:pt-6',
    wrapperClass: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3',
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
          const data = await getPlatformSubscriptionsApi();
          allSubscriptions.value = data;

          const filterStatus = formValues?.status;
          let filtered =
            filterStatus && filterStatus !== FILTER_ALL
              ? data.filter((s) => s.status === filterStatus)
              : data;

          if (formValues?.search) {
            const kw = String(formValues.search).toLowerCase().trim();
            filtered = filtered.filter(
              (s) =>
                s.tenant_name.toLowerCase().includes(kw) ||
                (s.tenant_slug && s.tenant_slug.toLowerCase().includes(kw)) ||
                s.tenant_id.toLowerCase().includes(kw),
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

watch([() => $t('page.system_view.subs_col_unit_price'), isMobile], () => {
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
</script>

<template>
  <div class="space-y-3 p-3 sm:space-y-4 sm:p-5">
    <!-- Header -->
    <div class="flex items-center justify-between gap-2">
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <h1
            class="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl"
          >
            {{ $t('page.system.subscriptions') }}
          </h1>
          <Badge variant="secondary" class="text-xs font-normal">
            {{ allSubscriptions.length }}
          </Badge>
        </div>
        <p class="hidden text-xs text-muted-foreground sm:block">
          {{ $t('page.system.subscriptions_desc') }}
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
          <RefreshCw class="size-3.5 shrink-0" />
        </Button>
        <Button
          size="sm"
          class="h-8 gap-1.5 px-2.5 text-xs font-medium sm:px-3"
          @click="() => gridApi.openCreateSheet()"
        >
          <Plus class="size-3.5 shrink-0" />
          <span>{{ $t('common.createRecord') }}</span>
        </Button>
      </div>
    </div>

    <!-- Table Container with Integrated Form & Pager -->
    <div
      class="overflow-hidden rounded-xl border border-border/60 bg-card p-3 sm:p-5 shadow-xs"
    >
      <Grid class="subscriptions-vxe-grid">
        <template #workspace-cell="{ row }">
          <div class="flex min-w-0 flex-col py-1 text-left">
            <span class="truncate font-medium text-foreground">
              {{ row.tenant_name }}
            </span>
            <div
              class="flex items-center gap-1.5 text-2xs text-muted-foreground sm:text-xs"
            >
              <span class="truncate">
                /{{ row.tenant_slug || row.tenant_id.slice(0, 8) }}
              </span>
              <span class="sm:hidden">&bull;</span>
              <span
                class="truncate font-sans font-medium text-foreground sm:hidden"
              >
                {{ row.plan_name }}
              </span>
              <span class="sm:hidden">&bull;</span>
              <span class="sm:hidden">
                ${{ row.price_monthly_usd
                }}{{ $t('page.system_view.per_month_suffix') }}
              </span>
            </div>
          </div>
        </template>

        <template #plan-cell="{ row }">
          <Badge variant="outline" class="font-semibold">
            {{ row.plan_name }}
          </Badge>
        </template>

        <template #price-cell="{ row }">
          <span class="font-medium text-foreground">
            ${{ row.price_monthly_usd
            }}{{ $t('page.system_view.per_month_suffix') }}
          </span>
        </template>

        <template #status-cell="{ row }">
          <Badge :variant="getStatusBadge(row.status).variant">
            {{ getStatusBadge(row.status).label }}
          </Badge>
        </template>

        <template #period-cell="{ row }">
          <span class="text-xs text-muted-foreground">
            {{ formatDate(row.current_period_end) }}
          </span>
        </template>

        <template #renewal-cell="{ row }">
          <Badge
            :variant="row.cancel_at_period_end ? 'outline' : 'secondary'"
            class="text-xs"
          >
            {{
              row.cancel_at_period_end
                ? $t('page.system_view.subs_cancel_period_end')
                : $t('page.system_view.subs_auto_renew')
            }}
          </Badge>
        </template>
      </Grid>
    </div>
  </div>
</template>
