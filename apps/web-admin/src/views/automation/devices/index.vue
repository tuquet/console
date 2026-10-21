<script lang="ts" setup>
import type { FleetDeviceItem } from '#/api';

import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { usePreferences } from '@tuquet/preferences';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Button,
  toast,
} from '@tuquet/vue-ui';

import { Cpu, HardDrive, Laptop, Plus, RefreshCw } from '@lucide/vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getFleetDevicesApi,
  probeLocalDaemonApi,
  revokeFleetDeviceApi,
} from '#/api';
import { useDateFormat } from '#/composables';
import { $t } from '#/locales';
import { captureError } from '#/utils/bugsink';

import ConnectFleetModal from './components/modals/connect-fleet-modal.vue';

defineOptions({ name: 'AutomationDevices' });

const route = useRoute();
const { formatDate } = useDateFormat();
const { isMobile } = usePreferences();

const probingDaemon = ref(false);
const nodes = ref<FleetDeviceItem[]>([]);
const loopbackOnline = ref(false);

// Modals
const isConnectModalVisible = ref(false);

function getOsBadgeVariant(os?: string): 'default' | 'outline' | 'secondary' {
  if (!os) return 'outline';
  const lower = os.toLowerCase();
  if (lower.includes('win')) return 'default';
  if (lower.includes('linux')) return 'secondary';
  return 'outline';
}

async function checkDaemonHealth() {
  probingDaemon.value = true;
  try {
    const res = await probeLocalDaemonApi(8765);
    loopbackOnline.value = res.online;
  } catch {
    loopbackOnline.value = false;
  } finally {
    probingDaemon.value = false;
  }
}

async function handleRevokeNode(node: FleetDeviceItem) {
  try {
    await revokeFleetDeviceApi(node.id);
    toast.success(
      $t('page.automation_view.device_revoke_success', { name: node.name }),
    );
    gridApi.reload();
  } catch (error: any) {
    captureError(error, {
      action: 'handleRevokeNode',
      nodeId: node.id,
      view: 'AutomationDevices',
    });
    toast.error(
      error.message || $t('page.automation_view.device_revoke_failed'),
    );
  }
}

function getColumns() {
  return [
    {
      field: 'name',
      title: $t('page.automation_view.col_workstation'),
      minWidth: 240,
      slots: { default: 'name-cell' },
    },
    {
      field: 'os_info',
      title: $t('page.automation_view.col_os'),
      minWidth: 140,
      slots: { default: 'os-cell' },
    },
    {
      field: 'hardware',
      title: $t('page.automation_view.col_hardware'),
      minWidth: 190,
      slots: { default: 'hardware-cell' },
    },
    {
      field: 'driver_type',
      title: $t('page.automation_view.col_driver'),
      minWidth: 130,
      slots: { default: 'driver-cell' },
    },
    {
      field: 'status',
      title: $t('common.status'),
      minWidth: 140,
      slots: { default: 'status-cell' },
    },
    {
      field: 'active_jobs',
      title: $t('term.jobs'),
      minWidth: 110,
      slots: { default: 'jobs-cell' },
    },
    {
      field: 'last_heartbeat_at',
      title: $t('page.fleet_view.col_last_seen'),
      minWidth: 150,
      slots: { default: 'heartbeat-cell' },
    },
    {
      field: 'actions',
      title: $t('common.actions'),
      minWidth: 115,
      align: 'right' as const,
      showOverflow: false,
      slots: { default: 'actions-cell' },
    },
  ];
}

const [Grid, gridApi] = useVbenVxeGrid<FleetDeviceItem>({
  separator: false,
  gridClass: 'p-0',
  detailSheetOptions: {
    resource: 'workers.devices',
    subtitleField: 'hostname',
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
            {
              label: $t('page.automation_view.device_status_busy'),
              value: 'busy',
            },
            { label: $t('common.offline'), value: 'offline' },
            {
              label: $t('page.automation_view.device_status_maintenance'),
              value: 'maintenance',
            },
            { label: $t('common.disabled'), value: 'disabled' },
          ],
        }),
      },
      {
        component: 'Input',
        fieldName: 'search',
        formItemClass: 'col-span-2 sm:col-span-1',
        label: () => $t('common.search'),
        componentProps: () => ({
          placeholder: $t('page.automation_view.device_search_placeholder'),
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
          await checkDaemonHealth();
          const tenantId = (route.query.tenant as string) || undefined;
          const data = await getFleetDevicesApi({ tenantId });
          nodes.value = data;

          let filtered = data;
          if (formValues?.status && formValues.status !== 'all') {
            filtered = filtered.filter((n) => n.status === formValues.status);
          }

          if (formValues?.search) {
            const kw = String(formValues.search).toLowerCase().trim();
            filtered = filtered.filter(
              (n) =>
                n.name.toLowerCase().includes(kw) ||
                (n.hostname && n.hostname.toLowerCase().includes(kw)) ||
                (n.ip_address && n.ip_address.toLowerCase().includes(kw)),
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

watch([() => $t('page.automation_view.col_workstation'), isMobile], () => {
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
            {{ $t('page.automation.devices') }}
          </h1>
          <Badge variant="secondary" class="shrink-0 text-2xs">
            {{ nodes.length }}
          </Badge>
        </div>
        <p class="hidden text-xs text-muted-foreground sm:block">
          {{ $t('page.automation.devices_desc') }}
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
          class="h-8 gap-1.5 px-2.5 text-xs font-medium"
          @click="isConnectModalVisible = true"
        >
          <Plus class="size-3.5" />
          <span>{{ $t('common.connect') }}</span>
        </Button>
      </div>
    </div>

    <!-- Main Container -->
    <div
      class="overflow-hidden rounded-xl border border-border/60 bg-card p-2.5 shadow-xs sm:p-4"
    >
      <Grid class="devices-vxe-grid">
        <template #name-cell="{ row }">
          <div class="flex items-center gap-2.5">
            <div
              class="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground shrink-0"
            >
              <Laptop class="size-4" />
            </div>
            <div class="min-w-0">
              <div class="font-medium text-foreground truncate">
                {{ row.name }}
              </div>
              <div class="text-2xs text-muted-foreground truncate">
                {{ row.hostname }} &bull; {{ row.ip_address }}
              </div>
            </div>
          </div>
        </template>

        <template #os-cell="{ row }">
          <Badge
            :variant="getOsBadgeVariant(row.os_info)"
            class="text-xs font-medium capitalize"
          >
            {{ row.os_info }}
          </Badge>
        </template>

        <template #hardware-cell="{ row }">
          <div class="flex items-center gap-2.5 text-xs text-foreground">
            <span class="inline-flex items-center gap-1 font-mono">
              <Cpu class="size-3.5 shrink-0 text-muted-foreground" />
              <span class="leading-none">
                {{ $t('page.automation_view.cpu_cores_unit', [row.cpu_cores]) }}
              </span>
            </span>
            <span class="inline-flex items-center gap-1 font-mono">
              <HardDrive class="size-3.5 shrink-0 text-muted-foreground" />
              <span class="leading-none">{{ row.ram_gb }} GB</span>
            </span>
          </div>
        </template>

        <template #driver-cell="{ row }">
          <Badge variant="secondary" class="text-xs font-medium capitalize">
            {{ row.driver_type }}
          </Badge>
        </template>

        <template #status-cell="{ row }">
          <Badge variant="outline" class="text-xs font-normal">
            <span
              class="mr-1.5 size-1.5 rounded-full"
              :class="{
                'bg-success': row.status === 'idle',
                'bg-primary': row.status === 'busy',
                'bg-warning': row.status === 'maintenance',
                'bg-destructive': row.status === 'disabled',
                'bg-muted-foreground': row.status === 'offline',
              }"
            ></span>
            {{
              row.status === 'idle'
                ? $t('page.automation_view.device_status_idle')
                : row.status === 'busy'
                  ? $t('page.automation_view.device_status_busy')
                  : row.status === 'maintenance'
                    ? $t('page.automation_view.device_status_maintenance')
                    : row.status === 'disabled'
                      ? $t('common.disabled')
                      : $t('common.offline')
            }}
          </Badge>
        </template>

        <template #jobs-cell="{ row }">
          <span
            class="text-xs font-semibold"
            :class="
              row.active_jobs > 0 ? 'text-primary' : 'text-muted-foreground'
            "
          >
            {{ $t('page.automation_view.active_jobs_unit', [row.active_jobs]) }}
          </span>
        </template>

        <template #heartbeat-cell="{ row }">
          <span class="text-xs text-muted-foreground">
            {{ formatDate(row.last_heartbeat_at) }}
          </span>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center justify-end gap-1.5">
            <AlertDialog>
              <AlertDialogTrigger as-child>
                <Button variant="destructive" size="sm" class="h-7 text-xs">
                  {{ $t('page.automation_view.revoke_btn') }}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {{ $t('page.automation_view.revoke_device_confirm_title') }}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {{
                      $t('page.automation_view.revoke_device_confirm_desc', {
                        name: row.name,
                      })
                    }}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {{ $t('common.cancel') }}
                  </AlertDialogCancel>
                  <AlertDialogAction @click="handleRevokeNode(row)">
                    {{ $t('page.automation_view.revoke_btn') }}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </template>

        <template #empty>
          <div
            class="flex flex-col items-center justify-center p-8 text-center text-muted-foreground"
          >
            <Laptop
              class="size-10 stroke-[1.5] text-muted-foreground/60 mb-3"
            />
            <p class="text-sm font-medium text-foreground">
              {{ $t('page.fleet_view.empty_all') }}
            </p>
            <p class="text-xs text-muted-foreground max-w-sm mt-1">
              {{ $t('page.fleet_view.empty_desc') }}
            </p>
          </div>
        </template>
      </Grid>
    </div>

    <!-- Modals -->
    <ConnectFleetModal
      v-model:open="isConnectModalVisible"
      :loopback-online="loopbackOnline"
      :loopback-port="8765"
      :probing="probingDaemon"
      @reprobe="checkDaemonHealth"
    />
  </div>
</template>
