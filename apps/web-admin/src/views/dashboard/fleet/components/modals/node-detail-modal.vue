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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@tuquet/vue-ui';

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
  <Dialog :open="props.open" @update:open="(val) => emit('update:open', val)">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Thông Tin Chi Tiết Máy Trạm</DialogTitle>
      </DialogHeader>

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
            variant="outline"
            :class="
              props.node.status === 'online'
                ? 'bg-green-500/10 text-green-400 border-green-500/30'
                : props.node.status === 'busy'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-muted text-muted-foreground'
            "
          >
            {{
              props.node.status === 'online'
                ? 'Trực Tuyến'
                : props.node.status === 'busy'
                  ? 'Đang Bận'
                  : 'Ngoại Tuyến'
            }}
          </Badge>
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
              <button
                type="button"
                class="size-5 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
                @click="copyToClipboard(props.node.id, 'Node ID')"
              >
                <Check
                  v-if="isCopied('Node ID')"
                  class="size-3 text-green-500"
                />
                <Copy v-else class="size-3" />
              </button>
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
            <Badge variant="outline" class="font-mono text-xs">
              {{ props.node.version || 'v0.8.4' }}
            </Badge>
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
          <AlertDialog>
            <AlertDialogTrigger as-child>
              <Button variant="destructive" class="flex items-center gap-1.5">
                <ShieldAlert class="size-4" />
                <span>Thu Hồi Quyền</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Xác nhận thu hồi quyền máy trạm?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Máy trạm "{{ props.node.name }}" sẽ không thể kết nối tới
                  Tuquet Cloud cho tới khi được ghép nối lại.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction @click="emit('revoke', props.node)">
                  Thu Hồi
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button variant="outline" @click="emit('update:open', false)">
            Đóng
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
