<script lang="ts" setup>
import type { BrowserProfile } from '#/api';

import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { usePreferences } from '@tuquet/preferences';
import { Badge, Button } from '@tuquet/vue-ui';

import {
  Copy,
  Globe,
  Lock,
  Plus,
  RefreshCw,
  Shield,
  Unlock,
} from '@lucide/vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { listBrowserReleases, listBrowsers, listProxies } from '#/api';
import { useClipboard, useDateFormat } from '#/composables';
import { $t } from '#/locales';

defineOptions({ name: 'AutomationBrowsers' });

const route = useRoute();
const { formatDate } = useDateFormat();
const { copyToClipboard } = useClipboard();
const { isMobile } = usePreferences();

const allBrowsers = ref<BrowserProfile[]>([]);

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

function getColumns() {
  return [
    {
      field: 'name',
      title: $t('page.automation_view.col_browser_profile'),
      minWidth: 240,
      slots: { default: 'name-cell' },
    },
    {
      field: 'locked_by_device',
      title: $t('page.automation_view.col_locked_by'),
      minWidth: 160,
      slots: { default: 'lock-cell' },
    },
    {
      field: 'proxy',
      title: $t('page.automation_view.col_proxy_routing'),
      minWidth: 200,
      slots: { default: 'proxy-cell' },
    },
    {
      field: 'storage_size_bytes',
      title: $t('page.automation_view.col_storage_cookies'),
      minWidth: 170,
      slots: { default: 'storage-cell' },
    },
    {
      field: 'status',
      title: $t('common.status'),
      minWidth: 140,
      slots: { default: 'status-cell' },
    },
    {
      field: 'created_at',
      title: $t('common.createdAt'),
      minWidth: 160,
      slots: { default: 'date-cell' },
    },
    {
      field: 'actions',
      title: $t('common.actions'),
      minWidth: 110,
      align: 'right' as const,
      showOverflow: false,
      slots: { default: 'actions-cell' },
    },
  ];
}

const [Grid, gridApi] = useVbenVxeGrid<BrowserProfile>({
  separator: false,
  gridClass: 'p-0',
  detailSheetOptions: {
    dynamicFieldOptions: async ({ formData }) => {
      const tenantId = (route.query.tenant_id as string) || undefined;
      const [proxies, releases] = await Promise.all([
        listProxies({ tenantId }),
        listBrowserReleases({
          osPlatform: formData.os_platform || undefined,
        }),
      ]);

      const proxyOptions = [
        { label: 'None (Direct Egress)', value: '' },
        ...proxies.map((p) => ({
          label: `${p.protocol.toUpperCase()}://${p.host}:${p.port}${p.country_code ? ` [${p.country_code}]` : ''}`,
          value: p.id,
        })),
      ];

      const versionOptions =
        releases.length > 0
          ? releases.map((r) => ({
              label: `${r.version} (${r.channel.toUpperCase()}${r.is_recommended ? ' - Verified' : ''})`,
              value: r.version,
            }))
          : [
              {
                label: '148.0.7778.215 (Golden LTS - Verified)',
                value: '148.0.7778.215',
              },
            ];

      return {
        engine_version: versionOptions,
        proxy_id: proxyOptions,
      };
    },
    resource: 'workers.browsers',
    subtitleField: 'engine_version',
    titleField: 'name',
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
        formItemClass: 'col-span-2 sm:col-span-1',
        label: () => $t('common.status'),
        defaultValue: (route.query.status as string) || 'all',
        componentProps: () => ({
          placeholder: $t('page.runs_view.status_all'),
          options: [
            { label: $t('page.runs_view.status_all'), value: 'all' },
            {
              label: $t('page.automation_view.device_status_idle'),
              value: 'idle',
            },
            { label: $t('common.running'), value: 'running' },
            {
              label: $t('page.automation_view.browser_status_syncing'),
              value: 'syncing',
            },
            { label: $t('common.error'), value: 'error' },
          ],
        }),
      },
      {
        component: 'Input',
        fieldName: 'search',
        formItemClass: 'col-span-2 sm:col-span-1',
        label: () => $t('common.search'),
        componentProps: () => ({
          placeholder: $t('page.automation_view.browser_search_placeholder'),
          clearable: true,
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
      'hidden sm:flex sm:col-span-2 lg:col-span-2 items-center justify-end gap-2 pt-1 sm:pt-6',
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
          const tenantId = (route.query.tenant as string) || undefined;
          const data = await listBrowsers({ tenantId });
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
    columns: getColumns(),
  },
});

watch([() => $t('page.automation_view.col_browser_profile'), isMobile], () => {
  gridApi.setGridOptions({ columns: getColumns() });
  gridApi.formApi?.setState({
    commonConfig: {
      componentProps: { class: 'w-full' },
      hideLabel: isMobile.value,
    },
  });
});

watch(
  () => route.query.tenant,
  () => {
    gridApi.reload();
  },
);
</script>

<template>
  <div class="space-y-3 p-3 sm:space-y-4 sm:p-5">
    <!-- Compact Single-Row Header -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <h1
            class="truncate text-base font-semibold tracking-tight text-foreground sm:text-xl"
          >
            {{ $t('page.automation.browsers') }}
          </h1>
          <Badge variant="secondary" class="shrink-0 text-2xs">
            {{ allBrowsers.length }}
          </Badge>
        </div>
        <p class="hidden text-xs text-muted-foreground sm:block">
          {{ $t('page.automation.browsers_desc') }}
        </p>
      </div>

      <div class="flex shrink-0 flex-wrap items-center gap-1.5 sm:gap-2">
        <Button
          variant="outline"
          size="sm"
          class="h-8 gap-1.5 px-2.5 text-xs"
          :title="$t('common.refresh')"
          @click="() => gridApi.reload()"
        >
          <RefreshCw class="size-3.5" />
          <span class="hidden sm:inline">{{ $t('common.refresh') }}</span>
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

    <!-- Main Container -->
    <div
      class="overflow-hidden rounded-xl border border-border/60 bg-card p-2.5 shadow-xs sm:p-4"
    >
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
                <Badge variant="outline" class="text-2xs capitalize py-0 px-1">
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
            <span>{{ $t('page.automation_view.browser_unlocked') }}</span>
          </div>
        </template>

        <template #proxy-cell="{ row }">
          <div
            v-if="row.proxy"
            class="inline-flex items-center gap-1.5 text-xs text-foreground truncate"
          >
            <Shield class="size-3 text-success shrink-0" />
            <span class="truncate"
              >{{ row.proxy.protocol }}://{{ row.proxy.host }}:{{
                row.proxy.port
              }}</span
            >
          </div>
          <span v-else class="text-xs text-muted-foreground">
            {{ $t('page.automation_view.proxy_direct') }}
          </span>
        </template>

        <template #storage-cell="{ row }">
          <div
            class="flex items-center gap-2 text-xs text-foreground font-mono"
          >
            <span>{{ formatBytes(row.storage_size_bytes) }}</span>
            <span class="text-muted-foreground">&bull;</span>
            <span class="text-muted-foreground">
              {{
                $t('page.automation_view.cookies_count_unit', [
                  row.cookies_count,
                ])
              }}
            </span>
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
                ? $t('page.automation_view.device_status_idle')
                : row.status === 'running'
                  ? $t('common.running')
                  : row.status === 'syncing'
                    ? $t('page.automation_view.browser_status_syncing')
                    : $t('common.error')
            }}
          </Badge>
        </template>

        <template #date-cell="{ row }">
          <span class="text-xs text-muted-foreground">
            {{ formatDate(row.created_at) }}
          </span>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center justify-end gap-1">
            <Button
              variant="outline"
              size="sm"
              class="h-7 gap-1 px-2 text-xs"
              :title="$t('common.copy')"
              @click="copyToClipboard(row.id, 'Browser ID')"
            >
              <Copy class="size-3 shrink-0" />
              <span>{{ $t('common.copy') }}</span>
            </Button>
          </div>
        </template>

        <template #empty>
          <div
            class="flex flex-col items-center justify-center p-8 text-center text-muted-foreground"
          >
            <Globe class="size-10 stroke-[1.5] text-muted-foreground/60 mb-3" />
            <p class="text-sm font-medium text-foreground">
              {{ $t('page.fleet_view.browsers_empty') }}
            </p>
            <p class="text-xs text-muted-foreground max-w-sm mt-1">
              {{ $t('page.fleet_view.browsers_empty_desc') }}
            </p>
          </div>
        </template>
      </Grid>
    </div>
  </div>
</template>
