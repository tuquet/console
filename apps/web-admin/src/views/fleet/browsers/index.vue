<script lang="ts" setup>
import type { FleetBrowserItem } from '#/api';

import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Globe, Lock, RefreshCw, Shield, Unlock } from '@lucide/vue';
import { Badge, Button } from '@tuquet/vue-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getFleetBrowsersApi } from '#/api';
import { useDateFormat } from '#/composables';
import { $t } from '#/locales';

defineOptions({ name: 'FleetBrowsers' });

const route = useRoute();
const { formatDate } = useDateFormat();

const allBrowsers = ref<FleetBrowserItem[]>([]);

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

const [Grid, gridApi] = useVbenVxeGrid<FleetBrowserItem>({
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
            { label: 'Sẵn sàng', value: 'idle' },
            { label: 'Đang chạy', value: 'running' },
            { label: 'Đồng bộ', value: 'syncing' },
            { label: 'Lỗi', value: 'error' },
          ],
        },
      },
      {
        component: 'Input',
        fieldName: 'search',
        label: 'Tìm kiếm',
        componentProps: {
          placeholder: 'Tìm theo tên profile, OS...',
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
          const data = await getFleetBrowsersApi({ tenantId });
          allBrowsers.value = data;

          let filtered = data;
          if (formValues?.status && formValues.status !== 'all') {
            filtered = filtered.filter((b) => b.status === formValues.status);
          }

          if (formValues?.search) {
            const kw = String(formValues.search).toLowerCase().trim();
            filtered = filtered.filter(
              (b) =>
                b.name.toLowerCase().includes(kw) ||
                (b.os_platform && b.os_platform.toLowerCase().includes(kw)) ||
                (b.engine_version &&
                  b.engine_version.toLowerCase().includes(kw)),
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
        title: 'Hồ sơ trình duyệt',
        minWidth: 240,
        slots: { default: 'name-cell' },
      },
      {
        field: 'locked_by_device',
        title: 'Khóa bởi',
        width: 160,
        slots: { default: 'lock-cell' },
      },
      {
        field: 'proxy',
        title: 'Định tuyến Proxy',
        width: 200,
        slots: { default: 'proxy-cell' },
      },
      {
        field: 'storage_size_bytes',
        title: 'Bộ nhớ & Cookies',
        width: 170,
        slots: { default: 'storage-cell' },
      },
      {
        field: 'status',
        title: 'Trạng thái',
        width: 140,
        slots: { default: 'status-cell' },
      },
      {
        field: 'created_at',
        title: 'Ngày tạo',
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
          Browser profiles
        </h1>
        <p class="text-xs text-muted-foreground">
          Quản lý profile và vân tay trình duyệt anti-detect
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
        <Globe class="size-4 shrink-0 text-muted-foreground" />
        <span class="text-sm font-semibold text-foreground">
          Danh sách profile
        </span>
        <span class="text-xs text-muted-foreground">
          · {{ allBrowsers.length }} tổng số
        </span>
      </div>

      <Grid class="browsers-vxe-grid">
        <template #name-cell="{ row }">
          <div class="flex items-center gap-2.5">
            <div
              class="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground shrink-0"
            >
              <Globe class="size-4" />
            </div>
            <div class="min-w-0">
              <div class="font-medium text-foreground truncate">
                {{ row.name }}
              </div>
              <div
                class="flex items-center gap-1.5 text-2xs text-muted-foreground"
              >
                <Badge
                  variant="outline"
                  class="text-[10px] font-mono capitalize py-0 px-1"
                >
                  {{ row.os_platform }}
                </Badge>
                <span class="font-mono">{{ row.engine_version }}</span>
              </div>
            </div>
          </div>
        </template>

        <template #lock-cell="{ row }">
          <div
            v-if="row.locked_by_device"
            class="inline-flex items-center gap-1.5 text-xs text-primary font-medium truncate"
          >
            <Lock class="size-3 text-primary shrink-0" />
            <span class="truncate">{{ row.locked_by_device.name }}</span>
          </div>
          <div
            v-else
            class="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Unlock class="size-3 shrink-0" />
            <span>Chưa khóa</span>
          </div>
        </template>

        <template #proxy-cell="{ row }">
          <div
            v-if="row.proxy"
            class="inline-flex items-center gap-1.5 font-mono text-xs text-foreground truncate"
          >
            <Shield class="size-3 text-success shrink-0" />
            <span class="truncate"
              >{{ row.proxy.protocol }}://{{ row.proxy.host }}:{{
                row.proxy.port
              }}</span
            >
          </div>
          <span v-else class="text-xs text-muted-foreground"> Direct </span>
        </template>

        <template #storage-cell="{ row }">
          <div
            class="flex items-center gap-2 text-xs text-foreground font-mono"
          >
            <span>{{ formatBytes(row.storage_size_bytes) }}</span>
            <span class="text-muted-foreground">&bull;</span>
            <span class="text-muted-foreground"
              >{{ row.cookies_count }} cookies</span
            >
          </div>
        </template>

        <template #status-cell="{ row }">
          <Badge variant="outline" class="text-xs font-normal">
            <span
              class="mr-1.5 size-1.5 rounded-full"
              :class="{
                'bg-success': row.status === 'idle',
                'bg-primary animate-pulse': row.status === 'running',
                'bg-warning animate-pulse': row.status === 'syncing',
                'bg-destructive': row.status === 'error',
              }"
            ></span>
            {{
              row.status === 'idle'
                ? 'Sẵn sàng'
                : row.status === 'running'
                  ? 'Đang chạy'
                  : row.status === 'syncing'
                    ? 'Đồng bộ'
                    : 'Lỗi'
            }}
          </Badge>
        </template>

        <template #date-cell="{ row }">
          <span class="text-xs text-muted-foreground">
            {{ formatDate(row.created_at) }}
          </span>
        </template>

        <template #empty>
          <div
            class="flex flex-col items-center justify-center p-8 text-center text-muted-foreground"
          >
            <Globe class="size-10 stroke-[1.5] text-muted-foreground/60 mb-3" />
            <p class="text-sm font-medium text-foreground">
              Chưa có browser profile nào
            </p>
            <p class="text-xs text-muted-foreground max-w-sm mt-1">
              Browser profile anti-detect được khởi tạo và đồng bộ tự động từ
              Runner daemon.
            </p>
          </div>
        </template>
      </Grid>
    </div>
  </div>
</template>
