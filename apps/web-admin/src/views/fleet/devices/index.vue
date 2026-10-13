<script lang="ts" setup>
import type { FleetDeviceItem, FleetMetricsData } from '#/api';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  Cpu,
  Eye,
  HardDrive,
  Laptop,
  Plus,
  RefreshCw,
  Terminal,
} from '@lucide/vue';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@tuquet/vue-ui';

import {
  calculateFleetMetrics,
  getFleetDevicesApi,
  probeLocalDaemonApi,
  revokeFleetDeviceApi,
} from '#/api';
import { useDateFormat } from '#/composables';

import FleetMetrics from './components/fleet-metrics.vue';
import ConnectFleetModal from './components/modals/connect-fleet-modal.vue';
import NodeDetailModal from './components/modals/node-detail-modal.vue';

defineOptions({ name: 'FleetDevices' });

const route = useRoute();
const router = useRouter();
const { formatDate } = useDateFormat();

const loading = ref(true);
const probingDaemon = ref(false);
const nodes = ref<FleetDeviceItem[]>([]);
const loopbackOnline = ref(false);

const VALID_STATUSES = new Set([
  'all',
  'busy',
  'disabled',
  'idle',
  'maintenance',
  'offline',
]);

const filterStatus = computed({
  get() {
    const s = route.query.status as string;
    return VALID_STATUSES.has(s) ? s : 'all';
  },
  set(val: string) {
    router.replace({
      query: {
        ...route.query,
        status: val === 'all' ? undefined : val,
      },
    });
  },
});

// Modals
const isConnectModalVisible = ref(false);
const isDetailModalVisible = ref(false);
const selectedNode = ref<FleetDeviceItem | null>(null);

const metrics = computed<FleetMetricsData>(() => {
  return calculateFleetMetrics(nodes.value, loopbackOnline.value);
});

const filteredNodes = computed(() => {
  if (filterStatus.value === 'all') return nodes.value;
  return nodes.value.filter((n) => n.status === filterStatus.value);
});

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

async function loadFleetData() {
  loading.value = true;
  try {
    await checkDaemonHealth();
    const tenantId = (route.query.tenant as string) || undefined;
    nodes.value = await getFleetDevicesApi({ tenantId });
  } catch (error: any) {
    toast.error(error.message || 'Không thể tải danh sách máy trạm');
  } finally {
    loading.value = false;
  }
}

watch(
  () => route.query.tenant,
  () => {
    loadFleetData();
  },
);

function handleOpenDetail(node: FleetDeviceItem) {
  selectedNode.value = node;
  isDetailModalVisible.value = true;
}

async function handleRevokeNode(node: FleetDeviceItem) {
  try {
    await revokeFleetDeviceApi(node.id);
    toast.success(`Đã thu hồi quyền máy trạm ${node.name}`);
    isDetailModalVisible.value = false;
    await loadFleetData();
  } catch (error: any) {
    toast.error(error.message || 'Thu hồi quyền thất bại');
  }
}

function getOsBadgeVariant(os: string) {
  const o = os.toLowerCase();
  if (o.includes('win')) return 'default';
  if (o.includes('mac') || o.includes('darwin')) return 'secondary';
  return 'outline';
}

onMounted(() => {
  loadFleetData();
});
</script>

<template>
  <div class="space-y-4 p-4 sm:space-y-5 sm:p-5">
    <!-- Top Header: Streamlined, Flat & Compact -->
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex items-center gap-2.5">
        <h1
          class="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
        >
          Quản Trị Máy Trạm
        </h1>
        <Badge variant="secondary" class="font-mono text-xs uppercase">
          Device Fleet
        </Badge>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          class="h-8 gap-1.5 font-medium"
          @click="isConnectModalVisible = true"
        >
          <Plus class="size-3.5 shrink-0" />
          <span>Ghép Nối Máy Trạm</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          :disabled="loading"
          class="size-8 shrink-0"
          title="Làm mới"
          @click="loadFleetData"
        >
          <RefreshCw
            class="size-3.5 shrink-0"
            :class="{ 'animate-spin': loading }"
          />
        </Button>
      </div>
    </div>

    <!-- 4 Platform Metric Cards -->
    <FleetMetrics :metrics="metrics" :loading="loading" />

    <!-- Main Content Container: Filter + Table/Cards -->
    <div
      class="rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm space-y-4"
    >
      <!-- Filter Bar -->
      <div
        class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4"
      >
        <div class="flex items-center gap-2">
          <Terminal class="size-4 shrink-0 text-muted-foreground" />
          <span class="text-sm font-semibold text-foreground">
            Danh Sách Thiết Bị
          </span>
          <span class="text-xs text-muted-foreground">
            ({{ filteredNodes.length }} / {{ nodes.length }})
          </span>
        </div>

        <div
          class="inline-flex rounded-lg border border-border/60 bg-muted/40 p-1"
        >
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs font-medium transition-all"
            :class="
              filterStatus === 'all'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="filterStatus = 'all'"
          >
            Tất Cả ({{ nodes.length }})
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs font-medium transition-all"
            :class="
              filterStatus === 'idle'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="filterStatus = 'idle'"
          >
            Sẵn Sàng ({{ nodes.filter((n) => n.status === 'idle').length }})
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs font-medium transition-all"
            :class="
              filterStatus === 'busy'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="filterStatus = 'busy'"
          >
            Đang Bận ({{ nodes.filter((n) => n.status === 'busy').length }})
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs font-medium transition-all"
            :class="
              filterStatus === 'offline'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="filterStatus = 'offline'"
          >
            Ngoại Tuyến ({{
              nodes.filter((n) => n.status === 'offline').length
            }})
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs font-medium transition-all"
            :class="
              filterStatus === 'maintenance'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="filterStatus = 'maintenance'"
          >
            Bảo Trì ({{
              nodes.filter((n) => n.status === 'maintenance').length
            }})
          </button>
        </div>
      </div>

      <!-- Desktop Table (Hidden on Mobile) -->
      <div
        v-if="filteredNodes.length > 0"
        class="hidden md:block overflow-x-auto rounded-lg border border-border/60"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Máy Trạm</TableHead>
              <TableHead>Hệ Điều Hành</TableHead>
              <TableHead>Cấu Hình Phần Cứng</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Trạng Thái</TableHead>
              <TableHead>Tác Vụ</TableHead>
              <TableHead>Ping Cuối</TableHead>
              <TableHead class="text-right">Thao Tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="record in filteredNodes" :key="record.id">
              <!-- Name Column -->
              <TableCell>
                <div class="flex items-center gap-2.5">
                  <div
                    class="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground"
                  >
                    <Laptop class="size-4" />
                  </div>
                  <div>
                    <div class="font-medium text-foreground">
                      {{ record.name }}
                    </div>
                    <div class="font-mono text-xs text-muted-foreground">
                      {{ record.hostname }} &bull; {{ record.ip_address }}
                    </div>
                  </div>
                </div>
              </TableCell>

              <!-- OS Column -->
              <TableCell>
                <Badge
                  :variant="getOsBadgeVariant(record.os_info)"
                  class="uppercase text-xs font-mono"
                >
                  {{ record.os_info }}
                </Badge>
              </TableCell>

              <!-- Specs Column -->
              <TableCell>
                <div class="flex items-center gap-3 text-xs text-foreground">
                  <span class="inline-flex items-center gap-1 font-mono">
                    <Cpu class="size-3.5 shrink-0 text-muted-foreground" />
                    <span class="leading-none"
                      >{{ record.cpu_cores }} Cores</span
                    >
                  </span>
                  <span class="inline-flex items-center gap-1 font-mono">
                    <HardDrive
                      class="size-3.5 shrink-0 text-muted-foreground"
                    />
                    <span class="leading-none">{{ record.ram_gb }} GB</span>
                  </span>
                </div>
              </TableCell>

              <!-- Driver Column -->
              <TableCell>
                <Badge variant="secondary" class="uppercase text-xs font-mono">
                  {{ record.driver_type }}
                </Badge>
              </TableCell>

              <!-- Status Column -->
              <TableCell>
                <Badge variant="outline" class="text-xs font-normal">
                  <span
                    class="mr-1.5 size-1.5 rounded-full"
                    :class="{
                      'bg-success': record.status === 'idle',
                      'bg-primary': record.status === 'busy',
                      'bg-warning': record.status === 'maintenance',
                      'bg-destructive': record.status === 'disabled',
                      'bg-muted-foreground': record.status === 'offline',
                    }"
                  ></span>
                  {{
                    record.status === 'idle'
                      ? 'Sẵn Sàng'
                      : record.status === 'busy'
                        ? 'Đang Bận'
                        : record.status === 'maintenance'
                          ? 'Bảo Trì'
                          : record.status === 'disabled'
                            ? 'Vô Hiệu'
                            : 'Ngoại Tuyến'
                  }}
                </Badge>
              </TableCell>

              <!-- Active Jobs Column -->
              <TableCell>
                <span
                  class="font-mono text-xs font-semibold"
                  :class="
                    record.active_jobs > 0
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  "
                >
                  {{ record.active_jobs }} jobs
                </span>
              </TableCell>

              <!-- Last Heartbeat Column -->
              <TableCell>
                <span class="text-xs text-muted-foreground">
                  {{ formatDate(record.last_heartbeat_at) }}
                </span>
              </TableCell>

              <!-- Action Column -->
              <TableCell class="text-right">
                <div class="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    class="h-7 text-xs flex items-center gap-1"
                    @click="handleOpenDetail(record)"
                  >
                    <Eye class="size-3 shrink-0" />
                    <span>Chi Tiết</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger as-child>
                      <Button
                        variant="destructive"
                        size="sm"
                        class="h-7 text-xs"
                      >
                        Thu Hồi
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Thu hồi quyền máy trạm?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Máy trạm "{{ record.name }}" sẽ không thể kết nối tới
                          Tuquet Cloud cho tới khi được ghép nối lại.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction @click="handleRevokeNode(record)">
                          Thu Hồi
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <!-- Mobile Touch Cards (Shown only on Mobile) -->
      <div v-if="filteredNodes.length > 0" class="block space-y-3 md:hidden">
        <div
          v-for="node in filteredNodes"
          :key="node.id"
          class="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-3"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <div
                class="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground"
              >
                <Laptop class="size-4.5" />
              </div>
              <div>
                <div class="font-semibold text-foreground text-sm">
                  {{ node.name }}
                </div>
                <div class="font-mono text-xs text-muted-foreground">
                  {{ node.hostname }}
                </div>
              </div>
            </div>

            <Badge variant="outline" class="text-xs font-normal">
              <span
                class="mr-1.5 size-1.5 rounded-full"
                :class="{
                  'bg-success': node.status === 'idle',
                  'bg-primary': node.status === 'busy',
                  'bg-warning': node.status === 'maintenance',
                  'bg-destructive': node.status === 'disabled',
                  'bg-muted-foreground': node.status === 'offline',
                }"
              ></span>
              {{
                node.status === 'idle'
                  ? 'Sẵn Sàng'
                  : node.status === 'busy'
                    ? 'Đang Bận'
                    : node.status === 'maintenance'
                      ? 'Bảo Trì'
                      : node.status === 'disabled'
                        ? 'Vô Hiệu'
                        : 'Ngoại Tuyến'
              }}
            </Badge>
          </div>

          <!-- Specs Info -->
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="flex items-center gap-1.5 text-muted-foreground">
              <Cpu class="size-3 shrink-0" />
              <span>{{ node.cpu_cores }} Cores</span>
            </div>
            <div class="flex items-center gap-1.5 text-muted-foreground">
              <HardDrive class="size-3 shrink-0" />
              <span>{{ node.ram_gb }} GB RAM</span>
            </div>
            <div class="flex items-center gap-1.5 text-muted-foreground">
              <span class="font-mono">{{ node.ip_address }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-muted-foreground">
              <span>{{ node.active_jobs }} jobs đang chạy</span>
            </div>
          </div>

          <div
            class="flex items-center justify-between border-t border-border/40 pt-2"
          >
            <span class="text-xs text-muted-foreground">
              {{ formatDate(node.last_heartbeat_at) }}
            </span>
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                class="h-7 text-xs"
                @click="handleOpenDetail(node)"
              >
                Chi Tiết
              </Button>
              <Button
                variant="destructive"
                size="sm"
                class="h-7 text-xs"
                @click="handleRevokeNode(node)"
              >
                Thu Hồi
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State Card (When 0 devices match filter) -->
      <div
        v-if="filteredNodes.length === 0 && !loading"
        class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-12 text-center"
      >
        <div
          class="flex size-12 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground"
        >
          <Laptop class="size-6" />
        </div>
        <h3 class="mt-3 text-sm font-semibold text-foreground">
          {{
            filterStatus === 'all'
              ? 'Chưa có máy trạm nào'
              : 'Không có máy trạm phù hợp bộ lọc'
          }}
        </h3>
        <p class="mt-1 max-w-sm text-xs text-muted-foreground">
          {{
            filterStatus === 'all'
              ? 'Ghép nối máy trạm chạy daemon để nhận và thực thi các tác vụ tự động.'
              : 'Thử chuyển sang bộ lọc khác hoặc kiểm tra lại kết nối thiết bị.'
          }}
        </p>
        <Button
          v-if="filterStatus === 'all'"
          size="sm"
          class="mt-4 gap-1.5 text-xs font-medium"
          @click="isConnectModalVisible = true"
        >
          <Plus class="size-3.5" />
          <span>Ghép Nối Máy Trạm</span>
        </Button>
      </div>
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
