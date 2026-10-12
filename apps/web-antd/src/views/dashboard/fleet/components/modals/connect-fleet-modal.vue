<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { ExternalLink, RefreshCw, Terminal } from '@lucide/vue';
import { Badge, Button, Modal, Tag } from 'ant-design-vue';

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
  <Modal
    :open="props.open"
    title="Ghép Nối Máy Trạm Specter Desk"
    :footer="null"
    class="max-w-[calc(100vw-2rem)] sm:max-w-lg"
    @cancel="emit('update:open', false)"
  >
    <div class="space-y-5 py-3">
      <!-- Status Badge -->
      <div
        class="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-3.5"
      >
        <div class="flex items-center gap-2">
          <Terminal class="size-4 text-primary" />
          <span class="text-sm font-medium text-foreground">
            Cổng Loopback Daemon
          </span>
          <Tag class="font-mono text-xs">:{{ props.loopbackPort }}</Tag>
        </div>
        <div class="flex items-center gap-2">
          <Badge
            :status="props.loopbackOnline ? 'success' : 'default'"
            :text="props.loopbackOnline ? 'Online' : 'Chưa phát hiện'"
          />
          <Button
            size="small"
            class="flex items-center gap-1"
            :loading="props.probing"
            @click="emit('reprobe')"
          >
            <RefreshCw class="size-3" />
            <span>Kiểm tra</span>
          </Button>
        </div>
      </div>

      <!-- Step 1 -->
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <span
            class="flex size-5 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
          >
            1
          </span>
          <span class="text-sm font-semibold text-foreground">
            Khởi động và đăng nhập trên máy trạm
          </span>
        </div>
        <p class="text-xs text-muted-foreground ml-7">
          Mở terminal trên máy trạm của bạn và chạy lệnh kết nối:
        </p>
        <div class="ml-7">
          <CliSnippetCard
            command="tuquet login"
            label="LỆNH ĐĂNG NHẬP SPECTER CLI"
            copied-label="Lệnh đăng nhập"
          />
        </div>
      </div>

      <!-- Step 2 -->
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <span
            class="flex size-5 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
          >
            2
          </span>
          <span class="text-sm font-semibold text-foreground">
            Xác thực phiên trên trình duyệt
          </span>
        </div>
        <p class="text-xs text-muted-foreground ml-7">
          Trình duyệt sẽ tự động chuyển tiếp tới màn hình cấp quyền Specter
          Desk. Bạn cũng có thể mở thủ công:
        </p>
        <div class="ml-7">
          <Button
            type="primary"
            class="flex items-center gap-1.5"
            @click="handleOpenAuthBridge"
          >
            <ExternalLink class="size-3.5" />
            <span>Mở Trang Ủy Quyền Desktop SSO</span>
          </Button>
        </div>
      </div>

      <!-- Footer Note -->
      <div
        class="rounded-lg bg-sky-500/10 p-3 border border-sky-500/20 text-xs text-sky-700 dark:text-sky-300"
      >
        <strong>Mẹo:</strong> Sau khi hoàn tất đăng nhập, máy trạm của bạn sẽ tự
        động xuất hiện trong danh sách thiết bị với trạng thái trực tuyến.
      </div>

      <div class="flex justify-end pt-2">
        <Button @click="emit('update:open', false)">Đóng</Button>
      </div>
    </div>
  </Modal>
</template>
