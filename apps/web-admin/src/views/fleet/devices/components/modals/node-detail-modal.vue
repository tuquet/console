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

import { VxeForm, VxeFormItem } from '#/adapter/vxe-table';
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
        <DialogTitle>Chi tiết thiết bị</DialogTitle>
      </DialogHeader>

      <div v-if="props.node" class="space-y-5 py-2">
        <!-- Header Summary -->
        <div
          class="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground"
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

          <Badge variant="outline" class="text-xs font-normal">
            <span
              class="mr-1.5 size-1.5 rounded-full"
              :class="{
                'bg-success': props.node.status === 'idle',
                'bg-primary': props.node.status === 'busy',
                'bg-warning': props.node.status === 'maintenance',
                'bg-destructive': props.node.status === 'disabled',
                'bg-muted-foreground': props.node.status === 'offline',
              }"
            ></span>
            {{
              props.node.status === 'idle'
                ? 'Sẵn sàng'
                : props.node.status === 'busy'
                  ? 'Đang bận'
                  : props.node.status === 'maintenance'
                    ? 'Bảo trì'
                    : props.node.status === 'disabled'
                      ? 'Vô hiệu'
                      : 'Ngoại tuyến'
            }}
          </Badge>
        </div>

        <!-- Device Specs & Identity Form via VXE UI Form -->
        <div class="rounded-xl border border-border/60 bg-muted/20 p-4">
          <VxeForm
            :data="props.node"
            custom-layout
            readonly
            size="small"
            class="w-full"
          >
            <!-- Hardware Specs Group -->
            <VxeFormItem title="CPU" span="12">
              <template #default>
                <div
                  class="flex items-center gap-1.5 font-semibold text-foreground text-sm"
                >
                  <Cpu class="size-3.5 text-muted-foreground shrink-0" />
                  <span>{{ props.node.cpu_cores }} Cores</span>
                </div>
              </template>
            </VxeFormItem>

            <VxeFormItem title="RAM" span="12">
              <template #default>
                <div
                  class="flex items-center gap-1.5 font-semibold text-foreground text-sm"
                >
                  <HardDrive class="size-3.5 text-muted-foreground shrink-0" />
                  <span>{{ props.node.ram_gb }} GB</span>
                </div>
              </template>
            </VxeFormItem>

            <VxeFormItem title="Hệ điều hành" span="12">
              <template #default>
                <div
                  class="flex items-center gap-1.5 font-medium text-foreground capitalize text-xs"
                >
                  <Globe class="size-3.5 text-muted-foreground shrink-0" />
                  <span>{{ props.node.os_info }}</span>
                </div>
              </template>
            </VxeFormItem>

            <VxeFormItem title="Driver" span="12">
              <template #default>
                <div
                  class="flex items-center gap-1.5 font-medium text-foreground capitalize text-xs"
                >
                  <CheckCircle2
                    class="size-3.5 text-muted-foreground shrink-0"
                  />
                  <span>{{ props.node.driver_type }}</span>
                </div>
              </template>
            </VxeFormItem>

            <!-- Network & Identity Group -->
            <VxeFormItem title="Mã thiết bị" span="24">
              <template #default>
                <div
                  class="flex items-center gap-2 font-mono text-xs text-foreground"
                >
                  <span class="truncate">{{ props.node.id }}</span>
                  <button
                    type="button"
                    class="size-5 inline-flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"
                    @click="copyToClipboard(props.node.id, 'Node ID')"
                  >
                    <Check
                      v-if="isCopied('Node ID')"
                      class="size-3 text-success"
                    />
                    <Copy v-else class="size-3" />
                  </button>
                </div>
              </template>
            </VxeFormItem>

            <VxeFormItem title="Địa chỉ IP" span="12">
              <template #default>
                <span class="font-mono text-xs text-foreground">{{
                  props.node.ip_address
                }}</span>
              </template>
            </VxeFormItem>

            <VxeFormItem title="Phiên bản daemon" span="12">
              <template #default>
                <Badge variant="outline" class="font-mono text-xs">
                  {{ props.node.version || 'v0.8.4' }}
                </Badge>
              </template>
            </VxeFormItem>

            <VxeFormItem title="Tác vụ đang chạy" span="12">
              <template #default>
                <span class="font-semibold text-foreground text-xs"
                  >{{ props.node.active_jobs }} jobs</span
                >
              </template>
            </VxeFormItem>

            <VxeFormItem title="Ping cuối" span="12">
              <template #default>
                <span class="text-xs text-foreground">{{
                  formatDate(props.node.last_heartbeat_at)
                }}</span>
              </template>
            </VxeFormItem>

            <VxeFormItem title="Ngày kết nối" span="24">
              <template #default>
                <span class="text-xs text-foreground">{{
                  formatDate(props.node.registered_at)
                }}</span>
              </template>
            </VxeFormItem>
          </VxeForm>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-between pt-2">
          <AlertDialog>
            <AlertDialogTrigger as-child>
              <Button variant="destructive" class="flex items-center gap-1.5">
                <ShieldAlert class="size-4 shrink-0" />
                <span>Thu hồi quyền</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Xác nhận thu hồi thiết bị?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Thiết bị "{{ props.node.name }}" sẽ ngắt kết nối với hệ thống
                  cho đến khi được kết nối lại.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction @click="emit('revoke', props.node)">
                  Thu hồi
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
