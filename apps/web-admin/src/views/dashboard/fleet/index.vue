<script lang="ts" setup>
import type { FleetMetricsData, FleetNodeItem } from '#/api';

import { computed, onMounted, ref } from 'vue';

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
  getFleetNodesApi,
  probeLocalDaemonApi,
  revokeFleetNodeApi,
} from '#/api';
import { useDateFormat } from '#/composables';

import FleetMetrics from './components/fleet-metrics.vue';
import ConnectFleetModal from './components/modals/connect-fleet-modal.vue';
import NodeDetailModal from './components/modals/node-detail-modal.vue';

defineOptions({ name: 'Fleet' });

const { formatDate } = useDateFormat();

const loading = ref(true);
const probingDaemon = ref(false);
const nodes = ref<FleetNodeItem[]>([]);
const loopbackOnline = ref(false);
const filterStatus = ref<'all' | 'busy' | 'offline' | 'online'>('all');

// Modals
const isConnectModalVisible = ref(false);
const isDetailModalVisible = ref(false);
const selectedNode = ref<FleetNodeItem | null>(null);

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
    nodes.value = await getFleetNodesApi();
  } catch (error: any) {
    toast.error(error.message || 'Không thể tải danh sách máy trạm');
  } finally {
    loading.value = false;
  }
}

function handleOpenDetail(node: FleetNodeItem) {
  selectedNode.value = node;
  isDetailModalVisible.value = true;
}

async function handleRevokeNode(node: FleetNodeItem) {
  try {
    await revokeFleetNodeApi(node.id);
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
  <div class="space-y-6 p-4 sm:p-6">
    <!-- Top Header -->
    <div
      class="flex flex-col justify-between gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm sm:flex-row sm:items-center"
    >
      <div>
        <div class="flex items-center gap-2.5">
          <h1
            class="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
          >
            Quản Trị Máy Trạm
          </h1>
          <Badge
            variant="outline"
            class="font-mono text-xs uppercase text-sky-500 border-sky-500/30 bg-sky-500/10"
          >
            Specter Fleet
          </Badge>
        </div>
        <p class="mt-1 text-sm text-muted-foreground">
          Giám sát trạng thái hoạt động, năng lực phần cứng và kết nối Specter
          CLI Daemon.
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <Button
          class="inline-flex items-center justify-center w-full sm:w-auto font-medium"
          @click="isConnectModalVisible = true"
        >
          <Plus class="size-3.5 mr-1" />
          Ghép Nối Máy Trạm
        </Button>
        <Button
          variant="outline"
          :disabled="loading"
          class="inline-flex items-center justify-center w-full sm:w-auto"
          @click="loadFleetData"
        >
          <RefreshCw
            class="size-3.5 mr-1"
            :class="{ 'animate-spin': loading }"
          />
          Làm Mới
        </Button>
      </div>
    </div>

    <!-- 4 Platform Metric Cards -->
    <FleetMetrics :metrics="metrics" :loading="loading" />

    <!-- Main Content Container: Filter + Table/Cards -->
    <div
      class="rounded-xl border border-border/60 bg-card p-5 shadow-sm space-y-4"
    >
      <!-- Filter Bar -->
      <div
        class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4"
      >
        <div class="flex items-center gap-2">
          <Terminal class="size-4 text-muted-foreground" />
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
              filterStatus === 'online'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="filterStatus = 'online'"
          >
            Trực Tuyến ({{ nodes.filter((n) => n.status === 'online').length }})
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
        </div>
      </div>

      <!-- Desktop Table (Hidden on Mobile) -->
      <div
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
                    class="flex size-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400"
                  >
                    <Laptop class="size-4" />
                  </div>
                  <div>
                    <div class="font-medium text-foreground">
                      {{ record.name }}
                    </div>
                    <div class="font-mono text-xs text-muted-foreground">
                      {{ record.hostname }} • {{ record.ip_address }}
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
                    <Cpu class="size-3.5 text-indigo-400" />
                    {{ record.cpu_cores }} Cores
                  </span>
                  <span class="inline-flex items-center gap-1 font-mono">
                    <HardDrive class="size-3.5 text-emerald-400" />
                    {{ record.ram_gb }} GB
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
                <Badge
                  variant="outline"
                  :class="
                    record.status === 'online'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : record.status === 'busy'
                        ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400'
                        : 'border-border/60 bg-muted/40 text-muted-foreground'
                  "
                  class="text-xs"
                >
                  {{
                    record.status === 'online'
                      ? 'Trực Tuyến'
                      : record.status === 'busy'
                        ? 'Đang Bận'
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
                      ? 'text-indigo-400'
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
                    <Eye class="size-3" />
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

            <TableRow v-if="filteredNodes.length === 0 && !loading">
              <TableCell
                colspan="8"
                class="h-24 text-center text-sm text-muted-foreground"
              >
                Không có máy trạm nào phù hợp bộ lọc.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <!-- Mobile Touch Cards (Shown only on Mobile) -->
      <div class="block space-y-3 md:hidden">
        <div
          v-for="node in filteredNodes"
          :key="node.id"
          class="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-3"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <div
                class="flex size-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400"
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

            <Badge
              variant="outline"
              :class="
                node.status === 'online'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : node.status === 'busy'
                    ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400'
                    : 'border-border/60 bg-muted/40 text-muted-foreground'
              "
              class="text-xs"
            >
              {{
                node.status === 'online'
                  ? 'Online'
                  : node.status === 'busy'
                    ? 'Busy'
                    : 'Offline'
              }}
            </Badge>
          </div>

          <div class="flex flex-wrap items-center gap-2 text-xs">
            <Badge
              :variant="getOsBadgeVariant(node.os_info)"
              class="uppercase font-mono"
            >
              {{ node.os_info }}
            </Badge>
            <Badge variant="secondary" class="uppercase font-mono">
              {{ node.driver_type }}
            </Badge>
            <span class="font-mono text-muted-foreground ml-auto">
              {{ node.cpu_cores }}C / {{ node.ram_gb }}GB
            </span>
          </div>

          <div
            class="flex items-center justify-between border-t border-border/40 pt-2 text-xs"
          >
            <span class="text-muted-foreground">
              Ping: {{ formatDate(node.last_heartbeat_at) }}
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
              <AlertDialog>
                <AlertDialogTrigger as-child>
                  <Button variant="destructive" size="sm" class="h-7 text-xs">
                    Thu Hồi
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Thu hồi quyền máy trạm?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Máy trạm "{{ node.name }}" sẽ không thể kết nối tới Tuquet
                      Cloud cho tới khi được ghép nối lại.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction @click="handleRevokeNode(node)">
                      Thu Hồi
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        <div
          v-if="filteredNodes.length === 0 && !loading"
          class="py-8 text-center text-sm text-muted-foreground"
        >
          Không có máy trạm nào phù hợp bộ lọc.
        </div>
      </div>
    </div>

    <!-- Modals -->
    <ConnectFleetModal
      v-model:open="isConnectModalVisible"
      :loopback-online="metrics.loopback_online"
      :loopback-port="metrics.loopback_port"
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
