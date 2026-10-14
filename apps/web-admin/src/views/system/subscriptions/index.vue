<script lang="ts" setup>
import type { PlatformSubscriptionItem } from '#/api';

import { computed, ref } from 'vue';

import { Building2, DollarSign, RefreshCw } from '@lucide/vue';
import { Badge, Button } from '@tuquet/vue-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getPlatformSubscriptionsApi } from '#/api';
import { useDateFormat } from '#/composables';
import { $t } from '#/locales';

defineOptions({ name: 'SystemSubscriptions' });

const { formatDate } = useDateFormat();

const allSubscriptions = ref<PlatformSubscriptionItem[]>([]);

const STATUS_MAP: Record<
  string,
  {
    label: string;
    variant: 'default' | 'destructive' | 'outline' | 'secondary';
  }
> = {
  active: { label: 'Đang hoạt động', variant: 'default' },
  canceled: { label: 'Đã hủy', variant: 'outline' },
  past_due: { label: 'Quá hạn', variant: 'destructive' },
  trialing: { label: 'Dùng thử', variant: 'secondary' },
};

function getStatusBadge(status: string): {
  label: string;
  variant: 'default' | 'destructive' | 'outline' | 'secondary';
} {
  return STATUS_MAP[status] || { label: status, variant: 'outline' };
}

const totalMRR = computed(() => {
  return allSubscriptions.value
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + (s.price_monthly_usd || 0), 0);
});

const activeCount = computed(() => {
  return allSubscriptions.value.filter((s) => s.status === 'active').length;
});

const [Grid, gridApi] = useVbenVxeGrid<PlatformSubscriptionItem>({
  formOptions: {
    schema: [
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
            { label: 'Đã hủy', value: 'canceled' },
            { label: 'Dùng thử', value: 'trialing' },
          ],
        },
      },
      {
        component: 'Input',
        fieldName: 'search',
        label: 'Tìm kiếm',
        componentProps: {
          placeholder: 'Tìm theo tên tổ chức hoặc định danh...',
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
          const data = await getPlatformSubscriptionsApi();
          allSubscriptions.value = data;

          const filterStatus = formValues?.status;
          let filtered =
            filterStatus && filterStatus !== 'all'
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
    columns: [
      {
        field: 'tenant_name',
        title: 'Workspace',
        minWidth: 220,
        slots: { default: 'workspace-cell' },
      },
      {
        field: 'plan_name',
        title: 'Gói cước',
        width: 150,
        slots: { default: 'plan-cell' },
      },
      {
        field: 'price_monthly_usd',
        title: 'Đơn giá',
        width: 150,
        slots: { default: 'price-cell' },
      },
      {
        field: 'status',
        title: 'Trạng thái',
        width: 160,
        slots: { default: 'status-cell' },
      },
      {
        field: 'current_period_end',
        title: 'Kỳ gia hạn tiếp theo',
        minWidth: 170,
        slots: { default: 'period-cell' },
      },
      {
        field: 'cancel_at_period_end',
        title: 'Tự động gia hạn',
        width: 150,
        align: 'right',
        slots: { default: 'renewal-cell' },
      },
    ],
  },
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
          {{ $t('page.system.subscriptions') }}
        </h1>
        <p class="text-xs text-muted-foreground">
          {{ $t('page.system.subscriptions_desc') }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          :title="$t('common.refresh')"
          @click="() => gridApi.reload()"
          class="gap-1.5"
        >
          <RefreshCw class="size-3.5 text-muted-foreground" />
          {{ $t('common.refresh') }}
        </Button>
      </div>
    </div>

    <!-- Metric Cards -->
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div class="rounded-xl border border-border/60 bg-card p-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-muted-foreground"
            >Doanh thu định kỳ MRR</span
          >
          <DollarSign class="size-4 text-primary" />
        </div>
        <p class="mt-2 text-2xl font-bold tracking-tight text-foreground">
          ${{ totalMRR.toLocaleString('en-US') }}
        </p>
      </div>

      <div class="rounded-xl border border-border/60 bg-card p-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-muted-foreground"
            >Thuê bao kích hoạt</span
          >
          <CreditCard class="size-4 text-success" />
        </div>
        <p class="mt-2 text-2xl font-bold tracking-tight text-foreground">
          {{ activeCount }}
        </p>
      </div>

      <div class="rounded-xl border border-border/60 bg-card p-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-muted-foreground"
            >Tổng workspace ký kết</span
          >
          <Building2 class="size-4 text-primary" />
        </div>
        <p class="mt-2 text-2xl font-bold tracking-tight text-foreground">
          {{ allSubscriptions.length }}
        </p>
      </div>
    </div>

    <!-- Table Container with Integrated Form & Pager -->
    <div
      class="overflow-hidden rounded-none sm:rounded-xl border-0 sm:border border-border/60 bg-card p-0 sm:p-5 shadow-none sm:shadow-xs space-y-4"
    >
      <Grid class="subscriptions-vxe-grid">
        <template #workspace-cell="{ row }">
          <div class="flex flex-col text-left py-1">
            <span class="font-medium text-foreground">
              {{ row.tenant_name }}
            </span>
            <span class="font-mono text-xs text-muted-foreground">
              /{{ row.tenant_slug || row.tenant_id.slice(0, 8) }}
            </span>
          </div>
        </template>

        <template #plan-cell="{ row }">
          <Badge variant="outline" class="font-semibold">
            {{ row.plan_name }}
          </Badge>
        </template>

        <template #price-cell="{ row }">
          <span class="font-medium text-foreground">
            ${{ row.price_monthly_usd }}/tháng
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
            {{ row.cancel_at_period_end ? 'Hủy cuối kỳ' : 'Tự động' }}
          </Badge>
        </template>
      </Grid>
    </div>
  </div>
</template>
