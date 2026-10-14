<script lang="ts" setup>
import type { BillingPlanItem } from '#/api';

import { ref } from 'vue';

import { Cpu, HardDrive, RefreshCw, Users } from '@lucide/vue';
import { Badge, Button } from '@tuquet/vue-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getBillingPlansApi } from '#/api';
import { useDateFormat } from '#/composables';
import { $t } from '#/locales';

defineOptions({ name: 'SystemPlans' });

const { formatDate } = useDateFormat();

const plansCount = ref(0);
const activePlansCount = ref(0);

function formatStorage(mb: number): string {
  if (mb >= 1024) {
    return `${Number((mb / 1024).toFixed(1))} GB`;
  }
  return `${mb} MB`;
}

const [Grid, gridApi] = useVbenVxeGrid<BillingPlanItem>({
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
            { label: 'Đang kích hoạt', value: 'active' },
            { label: 'Tạm dừng', value: 'paused' },
          ],
        },
      },
      {
        component: 'Input',
        fieldName: 'search',
        label: 'Tìm kiếm',
        componentProps: {
          placeholder: 'Tìm theo tên gói cước hoặc mã ID...',
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
      pageSizes: [10, 15, 30],
    },
    proxyConfig: {
      autoLoad: true,
      ajax: {
        query: async (
          { page }: { page?: { currentPage?: number; pageSize?: number } },
          formValues: Record<string, any>,
        ) => {
          const data = await getBillingPlansApi();
          plansCount.value = data.length;
          activePlansCount.value = data.filter((p) => p.is_active).length;

          let filtered = data;
          if (formValues?.status === 'active') {
            filtered = filtered.filter((p) => p.is_active);
          } else if (formValues?.status === 'paused') {
            filtered = filtered.filter((p) => !p.is_active);
          }

          if (formValues?.search) {
            const kw = String(formValues.search).toLowerCase().trim();
            filtered = filtered.filter(
              (p) =>
                p.name.toLowerCase().includes(kw) ||
                p.id.toLowerCase().includes(kw),
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
        title: 'Tên gói',
        minWidth: 200,
        slots: { default: 'name-cell' },
      },
      {
        field: 'price_monthly_usd',
        title: 'Giá cước',
        width: 140,
        slots: { default: 'price-cell' },
      },
      {
        field: 'max_members',
        title: 'Hạn mức thành viên',
        width: 170,
        slots: { default: 'members-cell' },
      },
      {
        field: 'max_storage_mb',
        title: 'Dung lượng',
        width: 140,
        slots: { default: 'storage-cell' },
      },
      {
        field: 'max_monthly_runs',
        title: 'Lượt chạy / tháng',
        width: 160,
        slots: { default: 'runs-cell' },
      },
      {
        field: 'is_active',
        title: 'Trạng thái',
        width: 130,
        slots: { default: 'status-cell' },
      },
      {
        field: 'created_at',
        title: 'Ngày tạo',
        minWidth: 150,
        align: 'right',
        slots: { default: 'date-cell' },
      },
    ],
  },
});
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
          Gói cước & hạn mức dịch vụ
        </h1>
        <p class="text-xs text-muted-foreground">
          Cấu hình định mức tài nguyên và biểu phí dịch vụ cho các tổ chức
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          class="size-8 shrink-0"
          :title="$t('common.refresh')"
          @click="gridApi.reload()"
        >
          <RefreshCw class="size-3.5 shrink-0" />
        </Button>
      </div>
    </div>

    <!-- Main Container -->
    <div
      class="overflow-hidden rounded-none sm:rounded-xl border-0 sm:border border-border/60 bg-card p-0 sm:p-5 shadow-none sm:shadow-sm space-y-4"
    >
      <!-- Stats Bar -->
      <div
        class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4 text-xs"
      >
        <div class="flex items-center gap-2">
          <CreditCard class="size-4 text-muted-foreground" />
          <span class="text-sm font-semibold text-foreground">
            Danh sách gói dịch vụ
          </span>
          <span class="text-muted-foreground">· {{ plansCount }} gói</span>
        </div>

        <div class="flex items-center gap-3 text-muted-foreground">
          <span>{{ activePlansCount }} đang kích hoạt</span>
        </div>
      </div>

      <!-- Table Grid -->
      <Grid class="plans-vxe-grid">
        <template #name-cell="{ row }">
          <div class="flex items-center gap-2.5 py-1">
            <div
              class="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground"
            >
              <CreditCard class="size-4" />
            </div>
            <div class="text-left">
              <div class="font-medium text-foreground">
                {{ row.name }}
              </div>
              <div class="font-mono text-xs text-muted-foreground">
                {{ row.id }}
              </div>
            </div>
          </div>
        </template>

        <template #price-cell="{ row }">
          <div v-if="row.price_monthly_usd === 0">
            <Badge variant="secondary" class="text-xs font-normal">
              Miễn phí
            </Badge>
          </div>
          <div v-else class="font-semibold text-foreground text-sm">
            ${{ row.price_monthly_usd }}
            <span class="text-xs font-normal text-muted-foreground"
              >/tháng</span
            >
          </div>
        </template>

        <template #members-cell="{ row }">
          <div
            class="inline-flex items-center gap-1.5 text-xs text-foreground font-medium"
          >
            <Users class="size-3.5 text-muted-foreground shrink-0" />
            <span>{{ row.max_members }} users</span>
          </div>
        </template>

        <template #storage-cell="{ row }">
          <div
            class="inline-flex items-center gap-1.5 text-xs text-foreground font-medium"
          >
            <HardDrive class="size-3.5 text-muted-foreground shrink-0" />
            <span>{{ formatStorage(row.max_storage_mb) }}</span>
          </div>
        </template>

        <template #runs-cell="{ row }">
          <div
            class="inline-flex items-center gap-1.5 text-xs text-foreground font-medium"
          >
            <Cpu class="size-3.5 text-muted-foreground shrink-0" />
            <span>{{ row.max_monthly_runs.toLocaleString() }} runs</span>
          </div>
        </template>

        <template #status-cell="{ row }">
          <Badge variant="outline" class="text-xs font-normal">
            <span
              class="mr-1.5 size-1.5 rounded-full"
              :class="row.is_active ? 'bg-success' : 'bg-muted-foreground'"
            ></span>
            {{ row.is_active ? 'Kích hoạt' : 'Tạm dừng' }}
          </Badge>
        </template>

        <template #date-cell="{ row }">
          <span class="text-xs text-muted-foreground">
            {{ formatDate(row.created_at) }}
          </span>
        </template>
      </Grid>
    </div>
  </div>
</template>
