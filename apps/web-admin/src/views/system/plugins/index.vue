<script lang="ts" setup>
import type { SystemPluginItem } from '#/api';

import { ref } from 'vue';

import {
  CreditCard,
  Database,
  HardDrive,
  Layers,
  RefreshCw,
  ShieldCheck,
  Webhook,
  Workflow,
  Zap,
} from '@lucide/vue';
import { Badge, Button } from '@tuquet/vue-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSystemPluginsApi } from '#/api';
import { useDateFormat } from '#/composables';
import { $t } from '#/locales';

defineOptions({ name: 'SystemPlugins' });

const { formatDate } = useDateFormat();

const allPlugins = ref<SystemPluginItem[]>([]);

const [Grid, gridApi] = useVbenVxeGrid<SystemPluginItem>({
  formOptions: {
    schema: [
      {
        component: 'Select',
        fieldName: 'is_core',
        label: 'Phân loại',
        defaultValue: 'all',
        componentProps: {
          placeholder: 'Tất cả phân loại',
          options: [
            { label: 'Tất cả phân loại', value: 'all' },
            { label: 'Core Kernel', value: 'core' },
            { label: 'Extension', value: 'extension' },
          ],
        },
      },
      {
        component: 'Input',
        fieldName: 'keyword',
        label: 'Tìm kiếm',
        componentProps: {
          placeholder: 'Tên plugin hoặc định danh...',
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
          const data = await getSystemPluginsApi();
          allPlugins.value = data;

          let filtered = data;
          if (formValues?.is_core === 'core') {
            filtered = filtered.filter((p) => p.is_core);
          } else if (formValues?.is_core === 'extension') {
            filtered = filtered.filter((p) => !p.is_core);
          }

          if (formValues?.keyword) {
            const kw = formValues.keyword.toLowerCase().trim();
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
        title: 'Plugin',
        minWidth: 220,
        slots: { default: 'plugin-cell' },
      },
      {
        field: 'is_core',
        title: 'Phân loại',
        width: 150,
        slots: { default: 'type-cell' },
      },
      {
        field: 'version',
        title: 'Phiên bản & schema',
        minWidth: 200,
        slots: { default: 'version-cell' },
      },
      {
        field: 'status',
        title: 'Trạng thái',
        width: 140,
        slots: { default: 'status-cell' },
      },
      {
        field: 'installed_at',
        title: 'Ngày cài đặt',
        minWidth: 150,
        align: 'right',
        slots: { default: 'date-cell' },
      },
    ],
  },
});

function getPluginIcon(pluginId: string) {
  switch (pluginId?.toLowerCase()) {
    case 'core-iam':
      return ShieldCheck;
    case 'runners':
      return Zap;
    case 'automa':
      return Workflow;
    case 'subscriptions':
      return CreditCard;
    case 'storage':
      return HardDrive;
    case 'webhooks':
      return Webhook;
    default:
      return Database;
  }
}

function refresh() {
  gridApi.reload();
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
          {{ $t('page.system.plugins') }}
        </h1>
        <p class="text-xs text-muted-foreground">
          {{ $t('page.system.plugins_desc') }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          class="size-8 shrink-0"
          :title="$t('common.refresh')"
          @click="refresh"
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
          <Layers class="size-4 text-muted-foreground" />
          <span class="text-sm font-semibold text-foreground">
            Danh sách plugins
          </span>
          <span class="text-muted-foreground"
            >· {{ allPlugins.length }} tổng số</span
          >
        </div>

        <div class="flex items-center gap-3 text-muted-foreground">
          <span
            >{{ allPlugins.filter((p) => p.is_core).length }} Core Kernel</span
          >
          <span>&bull;</span>
          <span
            >{{ allPlugins.filter((p) => !p.is_core).length }} Extensions</span
          >
        </div>
      </div>

      <!-- Table Grid -->
      <Grid class="plugins-vxe-grid">
        <template #plugin-cell="{ row }">
          <div class="flex items-center gap-2.5 py-1">
            <div
              class="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground shrink-0"
            >
              <component :is="getPluginIcon(row.id)" class="size-4" />
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

        <template #type-cell="{ row }">
          <Badge
            :variant="row.is_core ? 'default' : 'secondary'"
            class="text-xs font-normal"
          >
            {{ row.is_core ? 'Core Kernel' : 'Extension' }}
          </Badge>
        </template>

        <template #version-cell="{ row }">
          <div class="flex items-center gap-2 text-xs font-mono">
            <Badge variant="outline" class="font-mono text-xs">
              v{{ row.version }}
            </Badge>
            <span v-if="row.schema_name" class="text-muted-foreground">
              schema: {{ row.schema_name }}
            </span>
          </div>
        </template>

        <template #status-cell="{ row }">
          <Badge variant="outline" class="text-xs font-normal">
            <span
              class="mr-1.5 size-1.5 rounded-full"
              :class="{
                'bg-success': row.status === 'installed',
                'bg-muted-foreground': row.status === 'disabled',
                'bg-warning': row.status === 'pending',
              }"
            ></span>
            {{
              row.status === 'installed'
                ? 'Đã cài đặt'
                : row.status === 'disabled'
                  ? 'Tạm dừng'
                  : 'Đang chờ'
            }}
          </Badge>
        </template>

        <template #date-cell="{ row }">
          <span class="text-xs text-muted-foreground">
            {{ formatDate(row.installed_at) }}
          </span>
        </template>
      </Grid>
    </div>
  </div>
</template>
