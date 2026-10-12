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
  Badge,
  Button,
  message,
  Popconfirm,
  Radio,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

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
    message.error(error.message || 'Không thể tải danh sách máy trạm');
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
    message.success(`Đã thu hồi quyền máy trạm ${node.name}`);
    isDetailModalVisible.value = false;
    await loadFleetData();
  } catch (error: any) {
    message.error(error.message || 'Thu hồi quyền thất bại');
  }
}

function getOsTagColor(os: string) {
  const o = os.toLowerCase();
  if (o.includes('win')) return 'blue';
  if (o.includes('mac') || o.includes('darwin')) return 'purple';
  if (o.includes('linux') || o.includes('ubuntu')) return 'orange';
  return 'default';
}

function getDriverTagColor(driver: string) {
  switch (driver) {
    case 'automa': {
      return 'purple';
    }
    case 'browser': {
      return 'cyan';
    }
    case 'shell': {
      return 'geekblue';
    }
    default: {
      return 'default';
    }
  }
}

const tableColumns = [
  { key: 'name', title: 'Máy Trạm' },
  { key: 'os', title: 'Hệ Điều Hành' },
  { key: 'specs', title: 'Cấu Hình Phần Cứng' },
  { key: 'driver', title: 'Driver' },
  { key: 'status', title: 'Trạng Thái' },
  { key: 'active_jobs', title: 'Tác Vụ' },
  { key: 'last_heartbeat', title: 'Ping Cuối' },
  { key: 'action', title: 'Thao Tác', width: 140 },
];

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
          <Tag color="blue" class="font-mono text-xs uppercase">
            Specter Fleet
          </Tag>
        </div>
        <p class="mt-1 text-sm text-muted-foreground">
          Giám sát trạng thái hoạt động, năng lực phần cứng và kết nối Specter
          CLI Daemon.
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <Button
          type="primary"
          class="inline-flex items-center justify-center w-full sm:w-auto font-medium"
          @click="isConnectModalVisible = true"
        >
          <template #icon>
            <Plus class="size-3.5 mr-1" />
          </template>
          Ghép Nối Máy Trạm
        </Button>
        <Button
          :loading="loading"
          class="inline-flex items-center justify-center w-full sm:w-auto"
          @click="loadFleetData"
        >
          <template #icon>
            <RefreshCw class="size-3.5 mr-1" />
          </template>
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

        <div>
          <Radio.Group
            v-model:value="filterStatus"
            button-style="solid"
            size="small"
          >
            <Radio.Button value="all">
              Tất Cả ({{ nodes.length }})
            </Radio.Button>
            <Radio.Button value="online">
              Trực Tuyến ({{
                nodes.filter((n) => n.status === 'online').length
              }})
            </Radio.Button>
            <Radio.Button value="busy">
              Đang Bận ({{ nodes.filter((n) => n.status === 'busy').length }})
            </Radio.Button>
            <Radio.Button value="offline">
              Ngoại Tuyến ({{
                nodes.filter((n) => n.status === 'offline').length
              }})
            </Radio.Button>
          </Radio.Group>
        </div>
      </div>

      <!-- Desktop Table (Hidden on Mobile) -->
      <div class="hidden md:block">
        <Table
          :columns="tableColumns"
          :data-source="filteredNodes"
          :loading="loading"
          row-key="id"
          :pagination="{ pageSize: 10 }"
        >
          <template #bodyCell="{ column, record }">
            <!-- Name Column -->
            <template v-if="column.key === 'name'">
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
            </template>

            <!-- OS Column -->
            <template v-else-if="column.key === 'os'">
              <Tag
                :color="getOsTagColor(record.os_info)"
                class="uppercase text-xs font-mono"
              >
                {{ record.os_info }}
              </Tag>
            </template>

            <!-- Specs Column -->
            <template v-else-if="column.key === 'specs'">
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
            </template>

            <!-- Driver Column -->
            <template v-else-if="column.key === 'driver'">
              <Tag
                :color="getDriverTagColor(record.driver_type)"
                class="uppercase text-xs"
              >
                {{ record.driver_type }}
              </Tag>
            </template>

            <!-- Status Column -->
            <template v-else-if="column.key === 'status'">
              <Badge
                :status="
                  record.status === 'online'
                    ? 'success'
                    : record.status === 'busy'
                      ? 'processing'
                      : 'default'
                "
                :text="
                  record.status === 'online'
                    ? 'Trực Tuyến'
                    : record.status === 'busy'
                      ? 'Đang Bận'
                      : 'Ngoại Tuyến'
                "
                class="text-xs"
              />
            </template>

            <!-- Active Jobs Column -->
            <template v-else-if="column.key === 'active_jobs'">
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
            </template>

            <!-- Last Heartbeat Column -->
            <template v-else-if="column.key === 'last_heartbeat'">
              <span class="text-xs text-muted-foreground">
                {{ formatDate(record.last_heartbeat_at) }}
              </span>
            </template>

            <!-- Action Column -->
            <template v-else-if="column.key === 'action'">
              <Space size="small">
                <Button
                  size="small"
                  class="flex items-center gap-1"
                  @click="handleOpenDetail(record as FleetNodeItem)"
                >
                  <Eye class="size-3" />
                  <span>Chi Tiết</span>
                </Button>
                <Popconfirm
                  title="Thu hồi quyền truy cập máy trạm này?"
                  ok-text="Thu Hồi"
                  cancel-text="Hủy"
                  @confirm="handleRevokeNode(record as FleetNodeItem)"
                >
                  <Button danger size="small"> Thu Hồi </Button>
                </Popconfirm>
              </Space>
            </template>
          </template>
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
              :status="
                node.status === 'online'
                  ? 'success'
                  : node.status === 'busy'
                    ? 'processing'
                    : 'default'
              "
              :text="
                node.status === 'online'
                  ? 'Online'
                  : node.status === 'busy'
                    ? 'Busy'
                    : 'Offline'
              "
              class="text-xs"
            />
          </div>

          <div class="flex flex-wrap items-center gap-2 text-xs">
            <Tag
              :color="getOsTagColor(node.os_info)"
              class="uppercase font-mono"
            >
              {{ node.os_info }}
            </Tag>
            <Tag :color="getDriverTagColor(node.driver_type)" class="uppercase">
              {{ node.driver_type }}
            </Tag>
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
              <Button size="small" @click="handleOpenDetail(node)">
                Chi Tiết
              </Button>
              <Popconfirm
                title="Thu hồi quyền máy trạm?"
                ok-text="Thu Hồi"
                cancel-text="Hủy"
                @confirm="handleRevokeNode(node)"
              >
                <Button danger size="small"> Thu Hồi </Button>
              </Popconfirm>
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
