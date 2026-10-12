<script lang="ts" setup>
import type { FleetNodeItem } from '#/api';

import {
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  Globe,
  HardDrive,
  Laptop,
  ShieldAlert,
} from '@lucide/vue';
import { Badge, Button, Modal, Popconfirm, Tag } from 'ant-design-vue';

import { useClipboard, useDateFormat } from '#/composables';

interface Props {
  node: FleetNodeItem | null;
  open: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'revoke', node: FleetNodeItem): void;
  (e: 'update:open', val: boolean): void;
}>();

const { copyToClipboard, isCopied } = useClipboard();
const { formatDate } = useDateFormat();
</script>

<template>
  <Modal
    :open="props.open"
    title="Thông Tin Chi Tiết Máy Trạm"
    :footer="null"
    class="max-w-[calc(100vw-2rem)] sm:max-w-lg"
    @cancel="emit('update:open', false)"
  >
    <div v-if="props.node" class="space-y-5 py-2">
      <!-- Header Summary -->
      <div
        class="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-4"
      >
        <div class="flex items-center gap-3">
          <div
            class="flex size-10 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400"
          >
            <Laptop class="size-5" />
          </div>
          <div>
            <div class="font-semibold text-foreground text-base">
              {{ props.node.name }}
            </div>
            <div class="font-mono text-xs text-muted-foreground">
              {{ props.node.hostname }}
            </div>
          </div>
        </div>

        <Badge
          :status="
            props.node.status === 'online'
              ? 'success'
              : props.node.status === 'busy'
                ? 'processing'
                : 'default'
          "
          :text="
            props.node.status === 'online'
              ? 'Trực Tuyến'
              : props.node.status === 'busy'
                ? 'Đang Bận'
                : 'Ngoại Tuyến'
          "
          class="font-medium text-xs"
        />
      </div>

      <!-- Specs Grid -->
      <div class="grid grid-cols-2 gap-3 text-xs">
        <div class="rounded-lg border border-border/60 bg-card p-3 space-y-1">
          <div class="text-muted-foreground flex items-center gap-1.5">
            <Cpu class="size-3.5 text-indigo-400" />
            <span>Vi Xử Lý (CPU)</span>
          </div>
          <div class="font-semibold text-foreground text-sm">
            {{ props.node.cpu_cores }} Cores
          </div>
        </div>

        <div class="rounded-lg border border-border/60 bg-card p-3 space-y-1">
          <div class="text-muted-foreground flex items-center gap-1.5">
            <HardDrive class="size-3.5 text-emerald-400" />
            <span>Bộ Nhớ (RAM)</span>
          </div>
          <div class="font-semibold text-foreground text-sm">
            {{ props.node.ram_gb }} GB
          </div>
        </div>

        <div class="rounded-lg border border-border/60 bg-card p-3 space-y-1">
          <div class="text-muted-foreground flex items-center gap-1.5">
            <Globe class="size-3.5 text-sky-400" />
            <span>Hệ Điều Hành</span>
          </div>
          <div class="font-semibold text-foreground uppercase">
            {{ props.node.os_info }}
          </div>
        </div>

        <div class="rounded-lg border border-border/60 bg-card p-3 space-y-1">
          <div class="text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 class="size-3.5 text-amber-400" />
            <span>Driver Thực Thi</span>
          </div>
          <div class="font-semibold text-foreground uppercase">
            {{ props.node.driver_type }}
          </div>
        </div>
      </div>

      <!-- Identity Details -->
      <div
        class="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4 text-xs"
      >
        <div class="flex items-center justify-between">
          <span class="text-muted-foreground">Mã Thiết Bị (ID):</span>
          <div class="flex items-center gap-1.5 font-mono text-foreground">
            <span>{{ props.node.id }}</span>
            <Button
              size="small"
              type="text"
              class="size-5 p-0 inline-flex items-center justify-center"
              @click="copyToClipboard(props.node.id, 'Node ID')"
            >
              <Check v-if="isCopied('Node ID')" class="size-3 text-green-500" />
              <Copy v-else class="size-3 text-muted-foreground" />
            </Button>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-muted-foreground">Địa Chỉ Mạng (IP):</span>
          <span class="font-mono text-foreground">{{
            props.node.ip_address
          }}</span>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-muted-foreground">Phiên Bản Specter Daemon:</span>
          <Tag class="font-mono text-xs">
            {{ props.node.version || 'v0.8.4' }}
          </Tag>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-muted-foreground">Tác Vụ Đang Xử Lý:</span>
          <span class="font-semibold text-foreground"
            >{{ props.node.active_jobs }} jobs</span
          >
        </div>

        <div class="flex items-center justify-between">
          <span class="text-muted-foreground">Thời Điểm Ping Cuối:</span>
          <span class="text-foreground">{{
            formatDate(props.node.last_heartbeat_at)
          }}</span>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-muted-foreground">Ngày Ghép Nối:</span>
          <span class="text-foreground">{{
            formatDate(props.node.registered_at)
          }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-between pt-2">
        <Popconfirm
          title="Bạn có chắc chắn muốn thu hồi quyền truy cập của máy trạm này?"
          ok-text="Thu Hồi"
          cancel-text="Hủy"
          @confirm="emit('revoke', props.node)"
        >
          <Button danger class="flex items-center gap-1.5">
            <ShieldAlert class="size-4" />
            <span>Thu Hồi Quyền</span>
          </Button>
        </Popconfirm>

        <Button @click="emit('update:open', false)">Đóng</Button>
      </div>
    </div>
  </Modal>
</template>
