<script lang="ts" setup>
import type { BrowserProfile } from '#/api';

import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@operon/common-ui';

import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  toast,
} from '@operon-core/shadcn-ui';

import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Globe,
  Laptop,
  Lock,
  Monitor,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Server,
  Shield,
  Square,
  Unlock,
} from '@lucide/vue';

import {
  type FacetedOption,
  useVbenVxeGrid,
  VxeBatchActionBar,
  VxeFacetedFilter,
  VxeInlineToolbar,
} from '#/adapter/vxe-table';
import {
  listBrowserReleases,
  listBrowsers,
  listProxies,
  startBrowserProfile,
  stopBrowserProfile,
  unbindBrowser,
} from '#/api';
import { useClipboard } from '#/composables';
import { $t } from '#/locales';
import { paginateArray } from '#/utils/pagination';

defineOptions({ name: 'AutomationBrowsers' });

const route = useRoute();
const { copyToClipboard } = useClipboard();

const allBrowsers = ref<BrowserProfile[]>([]);
const isUnbinding = ref<Record<string, boolean>>({});
const isToggling = ref<Record<string, boolean>>({});
const isBatchOperating = ref(false);

// Filter & Search states
const searchKeyword = ref('');
const statusFilter = ref<string[]>([]);
const platformFilter = ref<string[]>([]);
const proxyFilter = ref<string[]>([]);
const selectedRows = ref<BrowserProfile[]>([]);

// Faceted Filter Options
const statusOptions = computed<FacetedOption[]>(() => [
  {
    icon: CheckCircle2,
    label: $t('page.automation_view.device_status_idle'),
    value: 'idle',
  },
  {
    icon: Play,
    label: $t('common.running'),
    value: 'running',
  },
  {
    icon: RefreshCw,
    label: $t('page.automation_view.browser_status_syncing'),
    value: 'syncing',
  },
  {
    icon: AlertCircle,
    label: $t('common.error'),
    value: 'error',
  },
]);

const platformOptions: FacetedOption[] = [
  {
    icon: Laptop,
    label: 'Windows',
    value: 'windows',
  },
  {
    icon: Server,
    label: 'Linux',
    value: 'linux',
  },
  {
    icon: Monitor,
    label: 'macOS',
    value: 'macos',
  },
];

const proxyOptions: FacetedOption[] = [
  {
    icon: Shield,
    label: 'Có Proxy',
    value: 'proxied',
  },
  {
    icon: Globe,
    label: 'Trực tiếp (Direct)',
    value: 'direct',
  },
];

// Reactive Dynamic Counts for Faceted Filters
const statusCounts = computed(() => {
  const counts: Record<string, number> = {};
  for (const b of allBrowsers.value) {
    const s = b.status || 'unknown';
    counts[s] = (counts[s] || 0) + 1;
  }
  return counts;
});

const platformCounts = computed(() => {
  const counts: Record<string, number> = {};
  for (const b of allBrowsers.value) {
    const p = (b.os_platform || 'other').toLowerCase();
    counts[p] = (counts[p] || 0) + 1;
  }
  return counts;
});

const proxyCounts = computed(() => {
  let direct = 0;
  let proxied = 0;
  for (const b of allBrowsers.value) {
    if (b.proxy) proxied++;
    else direct++;
  }
  return { direct, proxied };
});

const isFiltered = computed(() => {
  return (
    Boolean(searchKeyword.value.trim()) ||
    statusFilter.value.length > 0 ||
    platformFilter.value.length > 0 ||
    proxyFilter.value.length > 0
  );
});

function handleResetFilters() {
  searchKeyword.value = '';
  statusFilter.value = [];
  platformFilter.value = [];
  proxyFilter.value = [];
  void gridApi.reload();
}

async function handleToggleRun(row: BrowserProfile) {
  if (!row.id || isToggling.value[row.id]) return;
  isToggling.value[row.id] = true;
  try {
    const isStopping = row.status === 'running';
    await (isStopping ? stopBrowserProfile(row.id) : startBrowserProfile(row.id));
    toast.success(
      isStopping
        ? `Đã dừng profile ${row.name}`
        : `Đã khởi chạy profile ${row.name}`,
    );
    await gridApi.reload();
  } catch (err: any) {
    toast.error(err?.message || 'Thao tác thất bại');
  } finally {
    isToggling.value[row.id] = false;
  }
}

async function handleUnbind(row: BrowserProfile) {
  if (!row.id || isUnbinding.value[row.id]) return;
  isUnbinding.value[row.id] = true;
  try {
    const ok = await unbindBrowser(row.id);
    if (ok) {
      toast.success(`Đã gỡ khóa thiết bị cho ${row.name}`);
      await gridApi.reload();
    }
  } catch (err: any) {
    toast.error(err?.message || 'Gỡ khóa thất bại');
  } finally {
    isUnbinding.value[row.id] = false;
  }
}

function handleClearSelection() {
  selectedRows.value = [];
  const table = gridApi.grid as any;
  table?.clearCheckboxRow?.();
}

async function handleBatchRun(rows: BrowserProfile[]) {
  const toRun = rows.filter((r) => r.status !== 'running' && r.id);
  if (toRun.length === 0) {
    toast.info('Tất cả profile đã chọn đều đang chạy.');
    return;
  }
  isBatchOperating.value = true;
  try {
    const results = await Promise.allSettled(
      toRun.map((r) => startBrowserProfile(r.id)),
    );
    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    toast.success(`Đã khởi chạy ${successCount}/${toRun.length} trình duyệt.`);
    handleClearSelection();
    await gridApi.reload();
  } catch (error: any) {
    toast.error(error?.message || 'Khởi chạy thất bại');
  } finally {
    isBatchOperating.value = false;
  }
}

async function handleBatchStop(rows: BrowserProfile[]) {
  const toStop = rows.filter((r) => r.status === 'running' && r.id);
  if (toStop.length === 0) {
    toast.info('Không có profile nào đang chạy trong danh sách chọn.');
    return;
  }
  isBatchOperating.value = true;
  try {
    const results = await Promise.allSettled(
      toStop.map((r) => stopBrowserProfile(r.id)),
    );
    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    toast.success(`Đã dừng ${successCount}/${toStop.length} trình duyệt.`);
    handleClearSelection();
    await gridApi.reload();
  } catch (error: any) {
    toast.error(error?.message || 'Dừng thất bại');
  } finally {
    isBatchOperating.value = false;
  }
}

async function handleBatchUnbind(rows: BrowserProfile[]) {
  const toUnbind = rows.filter((r) => r.locked_by_device && r.id);
  if (toUnbind.length === 0) {
    toast.info('Không có profile nào đang bị khóa bởi thiết bị.');
    return;
  }
  isBatchOperating.value = true;
  try {
    const results = await Promise.allSettled(
      toUnbind.map((r) => unbindBrowser(r.id)),
    );
    const successCount = results.filter(
      (r) => r.status === 'fulfilled' && r.value,
    ).length;
    toast.success(`Đã gỡ khóa ${successCount}/${toUnbind.length} trình duyệt.`);
    handleClearSelection();
    await gridApi.reload();
  } catch (error: any) {
    toast.error(error?.message || 'Gỡ khóa thất bại');
  } finally {
    isBatchOperating.value = false;
  }
}

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
      type: 'checkbox',
      width: 44,
      align: 'center' as const,
      fixed: 'left',
    },
    {
      field: 'name',
      title: $t('page.automation_view.col_browser_profile'),
      minWidth: 220,
      canHide: false,
      slots: { default: 'name-cell' },
    },
    {
      field: 'status',
      title: $t('common.status'),
      width: 125,
      cellRender: {
        name: 'CellStatus',
        props: {
          statusMap: {
            error: {
              label: $t('common.error'),
              variant: 'destructive',
            },
            idle: {
              label: $t('page.automation_view.device_status_idle'),
              variant: 'success',
            },
            running: {
              label: $t('common.running'),
              pulse: true,
              variant: 'primary',
            },
            syncing: {
              label: $t('page.automation_view.browser_status_syncing'),
              pulse: true,
              variant: 'warning',
            },
          },
        },
      },
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
      minWidth: 180,
      slots: { default: 'proxy-cell' },
    },
    {
      field: 'storage_size_bytes',
      title: $t('page.automation_view.col_storage_cookies'),
      minWidth: 160,
      slots: { default: 'storage-cell' },
    },
    {
      field: 'created_at',
      title: $t('common.createdAt'),
      width: 135,
      cellRender: { name: 'CellDate' },
    },
    {
      field: 'actions',
      title: $t('common.actions'),
      width: 120,
      align: 'right' as const,
      fixed: 'right',
      showOverflow: false,
      slots: { default: 'actions-cell' },
    },
  ];
}

const columns = computed(() => getColumns());

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

      const proxyOptionsList = [
        { label: 'None (Direct Egress)', value: '__none__' },
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
        proxy_id: proxyOptionsList,
      };
    },
    resource: 'operon.browser_profiles',
    subtitleField: 'engine_version',
    titleField: 'name',
  },
  gridEvents: {
    checkboxChange(params: any) {
      selectedRows.value = (params.$table?.getCheckboxRecords?.() || []) as BrowserProfile[];
    },
    checkboxAll(params: any) {
      selectedRows.value = (params.$table?.getCheckboxRecords?.() || []) as BrowserProfile[];
    },
  },
  gridOptions: {
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
        ) => {
          const tenantId = (route.query.tenant as string) || undefined;
          const data = await listBrowsers({ tenantId });
          allBrowsers.value = data;

          let filtered = data;

          // Search keyword filter
          if (searchKeyword.value.trim()) {
            const kw = searchKeyword.value.toLowerCase().trim();
            filtered = filtered.filter(
              (b) =>
                b.name.toLowerCase().includes(kw) ||
                (b.os_platform && b.os_platform.toLowerCase().includes(kw)) ||
                (b.engine_version &&
                  b.engine_version.toLowerCase().includes(kw)) ||
                (b.id && b.id.toLowerCase().includes(kw)),
            );
          }

          // Status faceted filter
          if (statusFilter.value.length > 0) {
            filtered = filtered.filter((b) => statusFilter.value.includes(b.status));
          }

          // Platform faceted filter
          if (platformFilter.value.length > 0) {
            filtered = filtered.filter(
              (b) =>
                b.os_platform &&
                platformFilter.value.includes(b.os_platform.toLowerCase()),
            );
          }

          // Proxy faceted filter
          if (proxyFilter.value.length > 0) {
            filtered = filtered.filter((b) => {
              const hasProxy = Boolean(b.proxy);
              if (proxyFilter.value.includes('proxied') && hasProxy) return true;
              if (proxyFilter.value.includes('direct') && !hasProxy) return true;
              return false;
            });
          }

          return paginateArray(filtered, page);
        },
      },
    },
    columns: getColumns,
  },
});

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
watch(searchKeyword, () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    void gridApi.reload();
  }, 200);
});

watch([statusFilter, platformFilter, proxyFilter], () => {
  void gridApi.reload();
});

watch(
  () => route.query.tenant,
  () => {
    void gridApi.reload();
  },
);
</script>

<template>
  <Page :title="$t('page.automation.browsers')">
    <template #extra>
      <div class="flex shrink-0 flex-wrap items-center gap-1.5 sm:gap-2">
        <Button
          variant="outline"
          size="sm"
          class="h-8 gap-1.5 px-2.5"
          :title="$t('common.refresh')"
          @click="() => gridApi.reload()"
        >
          <RefreshCw class="size-3.5" />
          <span class="hidden sm:inline">{{ $t('common.refresh') }}</span>
        </Button>
        <Button
          size="sm"
          class="h-8 gap-1.5 px-2.5 sm:px-3"
          @click="() => gridApi.openCreateSheet()"
        >
          <Plus class="size-3.5 shrink-0" />
          <span>{{ $t('common.createRecord') }}</span>
        </Button>
      </div>
    </template>

    <div class="flex h-full flex-1 flex-col gap-2 overflow-hidden">
      <!-- Modern Inline Filter Toolbar -->
      <VxeInlineToolbar
        v-model:search-value="searchKeyword"
        :columns="columns"
        :grid="gridApi.grid"
        :is-filtered="isFiltered"
        :placeholder="$t('page.automation_view.browser_search_placeholder')"
        @reset="handleResetFilters"
      >
        <template #filters>
          <!-- Status Faceted Filter -->
          <VxeFacetedFilter
            v-model="statusFilter"
            :title="$t('common.status')"
            :options="statusOptions"
            :counts="statusCounts"
          />

          <!-- OS Platform Faceted Filter -->
          <VxeFacetedFilter
            v-model="platformFilter"
            title="Hệ điều hành"
            :options="platformOptions"
            :counts="platformCounts"
          />

          <!-- Proxy Routing Filter -->
          <VxeFacetedFilter
            v-model="proxyFilter"
            title="Proxy"
            :options="proxyOptions"
            :counts="proxyCounts"
          />
        </template>
      </VxeInlineToolbar>

      <!-- Main Container: Grid at Level 1 -->
      <Grid class="browsers-vxe-grid flex-1 min-h-0 overflow-hidden">
        <template #name-cell="{ row }">
          <div class="flex items-center gap-2.5">
            <div
              class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground"
            >
              <Globe class="size-4" />
            </div>
            <div class="min-w-0">
              <div class="truncate font-medium text-foreground">
                {{ row.name }}
              </div>
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <Badge variant="outline" class="px-1 py-0 text-[10px] capitalize">
                  {{ row.os_platform }}
                </Badge>
                <Badge variant="secondary" class="px-1 py-0 text-[10px]">
                  {{ row.engine_version }}
                </Badge>
              </div>
            </div>
          </div>
        </template>

        <template #lock-cell="{ row }">
          <div
            v-if="row.locked_by_device"
            class="inline-flex items-center gap-1.5 truncate text-primary"
          >
            <Lock class="size-3 shrink-0 text-primary" />
            <span class="truncate">{{ row.locked_by_device.name }}</span>
          </div>
          <div
            v-else
            class="inline-flex items-center gap-1.5 text-muted-foreground"
          >
            <Unlock class="size-3 shrink-0" />
            <span>{{ $t('page.automation_view.browser_unlocked') }}</span>
          </div>
        </template>

        <template #proxy-cell="{ row }">
          <div
            v-if="row.proxy"
            class="inline-flex items-center gap-1.5 truncate text-foreground"
          >
            <Shield class="size-3 shrink-0 text-success" />
            <span class="truncate"
              >{{ row.proxy.protocol }}://{{ row.proxy.host }}:{{
                row.proxy.port
              }}</span
            >
          </div>
          <span v-else class="text-muted-foreground">
            {{ $t('page.automation_view.proxy_direct') }}
          </span>
        </template>

        <template #storage-cell="{ row }">
          <div class="flex items-center gap-2 text-foreground">
            <span class="font-mono text-xs">{{ formatBytes(row.storage_size_bytes) }}</span>
            <span class="text-muted-foreground">&bull;</span>
            <span class="text-xs text-muted-foreground">
              {{
                $t('page.automation_view.cookies_count_unit', [row.cookies_count])
              }}
            </span>
          </div>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center justify-end gap-1.5">
            <!-- Primary Action: Run / Stop -->
            <Button
              :variant="row.status === 'running' ? 'destructive' : 'default'"
              size="sm"
              class="h-7 gap-1 px-2.5 text-xs font-medium"
              :class="{
                'bg-success hover:bg-success/90 text-success-foreground':
                  row.status !== 'running',
              }"
              :disabled="isToggling[row.id] || row.status === 'syncing'"
              :title="row.status === 'running' ? 'Dừng Browser' : 'Chạy Browser'"
              @click.stop="handleToggleRun(row)"
            >
              <Square
                v-if="row.status === 'running'"
                class="size-3 fill-current shrink-0"
              />
              <Play v-else class="size-3 fill-current shrink-0" />
              <span>{{ row.status === 'running' ? 'Stop' : 'Run' }}</span>
            </Button>

            <!-- More Actions Dropdown -->
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-7 p-0 text-muted-foreground hover:text-foreground data-[state=open]:bg-muted"
                  @click.stop
                >
                  <MoreHorizontal class="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="w-48">
                <DropdownMenuItem
                  class="cursor-pointer text-xs"
                  @select="gridApi.openDetailSheet(row)"
                >
                  <Pencil class="mr-2 size-3.5 text-muted-foreground" />
                  <span>{{ $t('common.edit') }}</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  v-if="row.locked_by_device || row.status === 'running' || row.status === 'error'"
                  class="cursor-pointer text-xs text-warning focus:bg-warning/10 focus:text-warning"
                  :disabled="isUnbinding[row.id]"
                  @select="handleUnbind(row)"
                >
                  <Unlock class="mr-2 size-3.5 text-warning" />
                  <span>{{ $t('page.automation_view.browser_unlocked') }}</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  class="cursor-pointer text-xs"
                  @select="copyToClipboard(row.id, 'Browser ID')"
                >
                  <Copy class="mr-2 size-3.5 text-muted-foreground" />
                  <span>{{ $t('common.copy') }} ID</span>
                  <DropdownMenuShortcut class="ml-auto text-[10px]">ID</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </template>

        <template #empty>
          <div
            class="flex flex-col items-center justify-center p-8 text-center text-muted-foreground"
          >
            <Globe class="mb-3 size-10 stroke-[1.5] text-muted-foreground/60" />
            <p class="text-foreground">
              {{ $t('page.fleet_view.browsers_empty') }}
            </p>
            <p class="mt-1 max-w-sm text-muted-foreground">
              {{ $t('page.fleet_view.browsers_empty_desc') }}
            </p>
          </div>
        </template>
      </Grid>

      <!-- Floating Batch Action Bar -->
      <VxeBatchActionBar
        :selected-rows="selectedRows"
        :clear-text="$t('common.cancel')"
        @clear="handleClearSelection"
      >
        <template #default="{ rows }">
          <Button
            size="sm"
            class="h-7 gap-1 bg-success px-2.5 text-xs text-success-foreground hover:bg-success/90"
            :disabled="isBatchOperating"
            @click="handleBatchRun(rows)"
          >
            <Play class="size-3 fill-current" />
            <span>Khởi chạy</span>
          </Button>
          <Button
            size="sm"
            variant="destructive"
            class="h-7 gap-1 px-2.5 text-xs"
            :disabled="isBatchOperating"
            @click="handleBatchStop(rows)"
          >
            <Square class="size-3 fill-current" />
            <span>Dừng</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            class="h-7 gap-1 px-2 text-xs text-warning hover:text-warning"
            :disabled="isBatchOperating"
            @click="handleBatchUnbind(rows)"
          >
            <Unlock class="size-3" />
            <span>Gỡ khóa</span>
          </Button>
        </template>
      </VxeBatchActionBar>
    </div>
  </Page>
</template>