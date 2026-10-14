<script lang="ts" setup>
import type { FleetDeviceItem, FleetMetricsData } from '#/api';

import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Cpu, Eye, HardDrive, Laptop, Plus, RefreshCw } from '@lucide/vue';
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

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  calculateFleetMetrics,
  getFleetDevicesApi,
  probeLocalDaemonApi,
  revokeFleetDeviceApi,
} from '#/api';
import { useDateFormat } from '#/composables';
import { $t } from '#/locales';

import FleetMetrics from './components/fleet-metrics.vue';
import ConnectFleetModal from './components/modals/connect-fleet-modal.vue';
import NodeDetailModal from './components/modals/node-detail-modal.vue';

defineOptions({ name: 'AutomationDevices' });

const route = useRoute();
const { formatDate } = useDateFormat();

const probingDaemon = ref(false);
const nodes = ref<FleetDeviceItem[]>([]);
const loopbackOnline = ref(false);

// Modals
const isConnectModalVisible = ref(false);
const isDetailModalVisible = ref(false);
const selectedNode = ref<FleetDeviceItem | null>(null);

const metrics = computed<FleetMetricsData>(() => {
  return calculateFleetMetrics(nodes.value, loopbackOnline.value);
});

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

function handleOpenDetail(node: FleetDeviceItem) {
  selectedNode.value = node;
  isDetailModalVisible.value = true;
}

async function handleRevokeNode(node: FleetDeviceItem) {
  try {
    await revokeFleetDeviceApi(node.id);
    toast.success(`Đã thu hồi quyền thiết bị ${node.name}`);
    isDetailModalVisible.value = false;
    gridApi.reload();
  } catch (error: any) {
    toast.error(error.message || 'Không thể thu hồi thiết bị');
  }
}

const [Grid, gridApi] = useVbenVxeGrid<FleetDeviceItem>({
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
            { label: 'Đang bận', value: 'busy' },
            { label: 'Ngoại tuyến', value: 'offline' },
            { label: 'Bảo trì', value: 'maintenance' },
            { label: 'Vô hiệu', value: 'disabled' },
          ],
        },
      },
      {
        component: 'Input',
        fieldName: 'search',
        label: 'Tìm kiếm',
        componentProps: {
          placeholder: 'Tìm theo tên, hostname hoặc IP...',
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
    columns: [
      {
        field: 'name',
        title: 'Máy trạm',
        minWidth: 240,
        slots: { default: 'name-cell' },
      },
      {
        field: 'os_info',
        title: 'Hệ điều hành',
        width: 140,
        slots: { default: 'os-cell' },
      },
      {
        field: 'hardware',
        title: 'Phần cứng',
        width: 190,
        slots: { default: 'hardware-cell' },
      },
      {
        field: 'driver_type',
        title: 'Driver',
        width: 130,
        slots: { default: 'driver-cell' },
      },
      {
        field: 'status',
        title: 'Trạng thái',
        width: 140,
        slots: { default: 'status-cell' },
      },
      {
        field: 'active_jobs',
        title: 'Tác vụ',
        width: 110,
        slots: { default: 'jobs-cell' },
      },
      {
        field: 'last_heartbeat_at',
        title: 'Ping cuối',
        width: 150,
        slots: { default: 'heartbeat-cell' },
      },
      {
        field: 'actions',
        title: 'Thao tác',
        minWidth: 185,
        align: 'right',
        showOverflow: false,
        slots: { default: 'actions-cell' },
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
          {{ $t('page.automation.devices') }}
        </h1>
        <p class="text-xs text-muted-foreground">
          {{ $t('page.automation.devices_desc') }}
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
        <Button
          size="sm"
          class="gap-1.5 text-xs font-medium"
          @click="isConnectModalVisible = true"
        >
          <Plus class="size-3.5" />
          <span>{{ $t('common.connect') }}</span>
        </Button>
      </div>
    </div>

    <!-- Fleet Real-time Overview Cards -->
    <FleetMetrics :metrics="metrics" />

    <!-- Main Container -->
    <div
      class="overflow-hidden rounded-none sm:rounded-xl border-0 sm:border border-border/60 bg-card p-0 sm:p-5 shadow-none sm:shadow-sm space-y-4"
    >
      <div
        class="flex items-center gap-2 border-b border-border/40 pb-3 px-3 sm:px-0 pt-2 sm:pt-0"
      >
        <Laptop class="size-4 shrink-0 text-muted-foreground" />
        <span class="text-sm font-semibold text-foreground">
          Danh sách thiết bị
        </span>
        <span class="text-xs text-muted-foreground">
          · {{ nodes.length }} tổng số
        </span>
      </div>

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
              <div class="font-mono text-2xs text-muted-foreground truncate">
                {{ row.hostname }} &bull; {{ row.ip_address }}
              </div>
            </div>
          </div>
        </template>

        <template #os-cell="{ row }">
          <Badge
            :variant="getOsBadgeVariant(row.os_info)"
            class="text-xs font-mono font-medium capitalize"
          >
            {{ row.os_info }}
          </Badge>
        </template>

        <template #hardware-cell="{ row }">
          <div class="flex items-center gap-2.5 text-xs text-foreground">
            <span class="inline-flex items-center gap-1 font-mono">
              <Cpu class="size-3.5 shrink-0 text-muted-foreground" />
              <span class="leading-none">{{ row.cpu_cores }} Cores</span>
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
                ? 'Sẵn sàng'
                : row.status === 'busy'
                  ? 'Đang bận'
                  : row.status === 'maintenance'
                    ? 'Bảo trì'
                    : row.status === 'disabled'
                      ? 'Vô hiệu'
                      : 'Ngoại tuyến'
            }}
          </Badge>
        </template>

        <template #jobs-cell="{ row }">
          <span
            class="font-mono text-xs font-semibold"
            :class="
              row.active_jobs > 0 ? 'text-primary' : 'text-muted-foreground'
            "
          >
            {{ row.active_jobs }} jobs
          </span>
        </template>

        <template #heartbeat-cell="{ row }">
          <span class="text-xs text-muted-foreground">
            {{ formatDate(row.last_heartbeat_at) }}
          </span>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center justify-end gap-1.5">
            <Button
              variant="outline"
              size="sm"
              class="h-7 text-xs flex items-center gap-1"
              @click="handleOpenDetail(row)"
            >
              <Eye class="size-3 shrink-0" />
              <span>Chi tiết</span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger as-child>
                <Button variant="destructive" size="sm" class="h-7 text-xs">
                  Thu hồi
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Thu hồi thiết bị?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Thiết bị "{{ row.name }}" sẽ không thể kết nối tới hệ thống
                    cho tới khi được kết nối lại.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction @click="handleRevokeNode(row)">
                    Thu hồi
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
              Chưa có thiết bị nào
            </p>
            <p class="text-xs text-muted-foreground max-w-sm mt-1">
              Kết nối thiết bị chạy daemon để thực thi các tác vụ tự động hóa.
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

    <NodeDetailModal
      v-model:open="isDetailModalVisible"
      :node="selectedNode"
      @revoke="handleRevokeNode"
    />
  </div>
</template>
