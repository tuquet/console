<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { ExternalLink, RefreshCw, Terminal } from '@lucide/vue';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@tuquet/vue-ui';

import CliSnippetCard from '#/components/common/cli-snippet-card.vue';

interface Props {
  loopbackOnline: boolean;
  loopbackPort: number;
  open: boolean;
  probing?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  probing: false,
});

const emit = defineEmits<{
  (e: 'reprobe'): void;
  (e: 'update:open', val: boolean): void;
}>();

const router = useRouter();

function handleOpenAuthBridge() {
  emit('update:open', false);
  router.push('/auth/desktop');
}
</script>

<template>
  <Dialog :open="props.open" @update:open="(val) => emit('update:open', val)">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Kết nối thiết bị</DialogTitle>
      </DialogHeader>

      <div class="space-y-5 py-2">
        <!-- Status Badge -->
        <div
          class="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-3.5"
        >
          <div class="flex items-center gap-2">
            <Terminal class="size-4 text-primary shrink-0" />
            <span class="text-sm font-medium text-foreground">
              Cổng daemon local
            </span>
            <Badge variant="outline" class="font-mono text-xs">
              :{{ props.loopbackPort }}
            </Badge>
          </div>
          <div class="flex items-center gap-2">
            <Badge
              variant="outline"
              :class="
                props.loopbackOnline
                  ? 'bg-success/10 text-success border-success/30'
                  : 'bg-muted text-muted-foreground'
              "
            >
              {{ props.loopbackOnline ? 'Online' : 'Chưa phát hiện' }}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              class="flex items-center gap-1 h-7 px-2 text-xs"
              :disabled="props.probing"
              @click="emit('reprobe')"
            >
              <RefreshCw
                class="size-3 shrink-0"
                :class="{ 'animate-spin': props.probing }"
              />
              <span>Kiểm tra</span>
            </Button>
          </div>
        </div>

        <!-- Step 1 -->
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span
              class="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
            >
              1
            </span>
            <span class="text-sm font-semibold text-foreground">
              Đăng nhập qua CLI trên thiết bị
            </span>
          </div>
          <p class="text-xs text-muted-foreground ml-7">
            Mở terminal trên thiết bị của bạn và chạy lệnh kết nối:
          </p>
          <div class="ml-7">
            <CliSnippetCard
              command="tuquet login"
              label="Lệnh đăng nhập CLI"
              copied-label="Lệnh đăng nhập"
            />
          </div>
        </div>

        <!-- Step 2 -->
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span
              class="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
            >
              2
            </span>
            <span class="text-sm font-semibold text-foreground">
              Xác thực phiên trên trình duyệt
            </span>
          </div>
          <p class="text-xs text-muted-foreground ml-7">
            Trình duyệt sẽ tự động chuyển tiếp tới màn hình cấp quyền xác thực
            desktop. Bạn cũng có thể mở thủ công:
          </p>
          <div class="ml-7">
            <Button
              class="flex items-center gap-1.5"
              @click="handleOpenAuthBridge"
            >
              <ExternalLink class="size-3.5 shrink-0" />
              <span>Mở trang ủy quyền desktop SSO</span>
            </Button>
          </div>
        </div>

        <!-- Footer Note -->
        <div
          class="rounded-lg bg-muted/50 p-3 border border-border text-xs text-muted-foreground"
        >
          <strong class="text-foreground">Mẹo:</strong> Sau khi hoàn tất đăng
          nhập, thiết bị của bạn sẽ tự động xuất hiện trong danh sách với trạng
          thái trực tuyến.
        </div>
      </div>

      <DialogFooter class="pt-2">
        <Button variant="outline" @click="emit('update:open', false)">
          Đóng
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
