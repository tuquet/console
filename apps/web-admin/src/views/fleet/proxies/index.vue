<script lang="ts" setup>
import type { FleetProxyItem } from '#/api';

import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Activity, Network, RefreshCw } from '@lucide/vue';
import { Badge, Button } from '@tuquet/vue-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getFleetProxiesApi } from '#/api';
import { useDateFormat } from '#/composables';
import { $t } from '#/locales';

defineOptions({ name: 'FleetProxies' });

const route = useRoute();
const { formatDate } = useDateFormat();

const allProxies = ref<FleetProxyItem[]>([]);

function getLatencyBadgeClass(latency: null | number) {
  if (latency === null || latency === undefined) return 'text-muted-foreground';
  if (latency < 300) return 'text-success font-semibold';
  if (latency < 800) return 'text-warning font-semibold';
  return 'text-destructive font-semibold';
}

const [Grid, gridApi] = useVbenVxeGrid<FleetProxyItem>({
  formOptions: {
    schema: [
      {
        component: 'Select',
        fieldName: 'status',
        label: 'Trạng thái',
        defaultValue: (route.query.status as string) || 'all',
        componentProps: {
          placeholder: 'Tất cả trạng thái',
          options: [
            { label: 'Tất cả trạng thái', value: 'all' },
            { label: 'Hoạt động', value: 'active' },
            { label: 'Lỗi kết nối', value: 'failing' },
            { label: 'Đang kiểm tra', value: 'testing' },
            { label: 'Vô hiệu', value: 'disabled' },
          ],
        },
      },
      {
        component: 'Select',
        fieldName: 'type',
        label: 'Phân loại',
        defaultValue: 'all',
        componentProps: {
          placeholder: 'Tất cả phân loại',
          options: [
            { label: 'Tất cả phân loại', value: 'all' },
            { label: 'Residential', value: 'residential' },
            { label: 'Datacenter', value: 'datacenter' },
          ],
        },
      },
      {
        component: 'Input',
        fieldName: 'search',
        label: 'Tìm kiếm',
        componentProps: {
          placeholder: 'Tìm theo IP, port hoặc quốc gia...',
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
          const tenantId = (route.query.tenant as string) || undefined;
          const data = await getFleetProxiesApi({ tenantId });
          allProxies.value = data;

          let filtered = data;
          if (formValues?.status && formValues.status !== 'all') {
            filtered = filtered.filter((p) => p.status === formValues.status);
          }

          if (formValues?.type && formValues.type !== 'all') {
            if (formValues.type === 'residential') {
              filtered = filtered.filter((p) => p.is_residential);
            } else if (formValues.type === 'datacenter') {
              filtered = filtered.filter((p) => !p.is_residential);
            }
          }

          if (formValues?.search) {
            const kw = String(formValues.search).toLowerCase().trim();
            filtered = filtered.filter(
              (p) =>
                p.host.toLowerCase().includes(kw) ||
                String(p.port).includes(kw) ||
                (p.country_code && p.country_code.toLowerCase().includes(kw)) ||
                (p.city && p.city.toLowerCase().includes(kw)),
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
        field: 'host',
        title: 'Địa chỉ proxy',
        minWidth: 220,
        slots: { default: 'proxy-cell' },
      },
      {
        field: 'country_code',
        title: 'Vị trí & phân loại',
        width: 190,
        slots: { default: 'location-cell' },
      },
      {
        field: 'latency_ms',
        title: 'Độ trễ',
        width: 130,
        slots: { default: 'latency-cell' },
      },
      {
        field: 'error_count',
        title: 'Lỗi',
        width: 100,
        slots: { default: 'error-cell' },
      },
      {
        field: 'status',
        title: 'Trạng thái',
        width: 140,
        slots: { default: 'status-cell' },
      },
      {
        field: 'last_checked_at',
        title: 'Kiểm tra cuối',
        width: 160,
        slots: { default: 'date-cell' },
      },
    ],
  },
});

watch(
  () => route.query.tenant,
  () => {
    gridApi.reload();
  },
);
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
          Proxy pool
        </h1>
        <p class="text-xs text-muted-foreground">
          Quản lý proxy xoay vòng và định tuyến mạng
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
          {{ $t('common.refresh') }}
        </Button>
      </div>
    </div>

    <!-- Main Container -->
    <div
      class="overflow-hidden rounded-none sm:rounded-xl border-0 sm:border border-border/60 bg-card p-0 sm:p-5 shadow-none sm:shadow-sm space-y-4"
    >
      <div
        class="flex items-center gap-2 border-b border-border/40 pb-3 px-3 sm:px-0 pt-2 sm:pt-0"
      >
        <Network class="size-4 shrink-0 text-muted-foreground" />
        <span class="text-sm font-semibold text-foreground">
          Danh sách proxy
        </span>
        <span class="text-xs text-muted-foreground">
          · {{ allProxies.length }} tổng số
        </span>
      </div>

      <Grid class="proxies-vxe-grid">
        <template #proxy-cell="{ row }">
          <div class="flex items-center gap-2.5">
            <div
              class="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground shrink-0"
            >
              <Network class="size-4" />
            </div>
            <div
              class="min-w-0 font-mono text-xs font-medium text-foreground truncate"
            >
              {{ row.protocol }}://{{ row.host }}:{{ row.port }}
            </div>
          </div>
        </template>

        <template #location-cell="{ row }">
          <div class="flex items-center gap-2 text-xs">
            <span
              v-if="row.country_code"
              class="font-semibold text-foreground uppercase"
            >
              {{ row.country_code }}
            </span>
            <span v-if="row.city" class="text-muted-foreground truncate">
              · {{ row.city }}
            </span>
            <Badge
              :variant="row.is_residential ? 'secondary' : 'outline'"
              class="text-2xs font-normal shrink-0"
            >
              {{ row.is_residential ? 'Residential' : 'Datacenter' }}
            </Badge>
          </div>
        </template>

        <template #latency-cell="{ row }">
          <div class="flex items-center gap-1.5 text-xs font-mono">
            <Activity class="size-3.5 shrink-0 text-muted-foreground" />
            <span :class="getLatencyBadgeClass(row.latency_ms)">
              {{
                row.latency_ms !== null && row.latency_ms !== undefined
                  ? `${row.latency_ms} ms`
                  : '—'
              }}
            </span>
          </div>
        </template>

        <template #error-cell="{ row }">
          <span
            class="font-mono text-xs"
            :class="
              row.error_count > 0
                ? 'text-destructive font-semibold'
                : 'text-muted-foreground'
            "
          >
            {{ row.error_count }} lỗi
          </span>
        </template>

        <template #status-cell="{ row }">
          <Badge variant="outline" class="text-xs font-normal">
            <span
              class="mr-1.5 size-1.5 rounded-full"
              :class="{
                'bg-success': row.status === 'active',
                'bg-destructive': row.status === 'failing',
                'bg-warning animate-pulse': row.status === 'testing',
                'bg-muted-foreground': row.status === 'disabled',
              }"
            ></span>
            {{
              row.status === 'active'
                ? 'Hoạt động'
                : row.status === 'failing'
                  ? 'Lỗi kết nối'
                  : row.status === 'testing'
                    ? 'Đang test'
                    : 'Vô hiệu'
            }}
          </Badge>
        </template>

        <template #date-cell="{ row }">
          <span class="text-xs text-muted-foreground">
            {{ formatDate(row.last_checked_at) }}
          </span>
        </template>

        <template #empty>
          <div
            class="flex flex-col items-center justify-center p-8 text-center text-muted-foreground"
          >
            <Network
              class="size-10 stroke-[1.5] text-muted-foreground/60 mb-3"
            />
            <p class="text-sm font-medium text-foreground">Chưa có proxy nào</p>
            <p class="text-xs text-muted-foreground max-w-sm mt-1">
              Proxy được điều phối qua Bridge daemon hoặc cấu hình hệ thống.
            </p>
          </div>
        </template>
      </Grid>
    </div>
  </div>
</template>
