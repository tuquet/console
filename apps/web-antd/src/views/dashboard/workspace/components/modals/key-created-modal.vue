<script lang="ts" setup>
import { Check, Copy } from '@lucide/vue';
import { Button, Modal } from 'ant-design-vue';

import { useClipboard } from '#/composables';

interface Props {
  fullKey: string;
  open: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
}>();

const { copyToClipboard, isCopied } = useClipboard();
</script>

<template>
  <Modal
    :open="props.open"
    title="Khóa API Đã Được Tạo Thành Công"
    :footer="null"
    @cancel="emit('update:open', false)"
  >
    <div class="space-y-4 py-3">
      <div
        class="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300"
      >
        <strong>Lưu ý bảo mật quan trọng:</strong> Khóa này chỉ hiển thị một lần
        duy nhất. Hãy sao chép và lưu trữ an toàn ngay bây giờ.
      </div>

      <div>
        <label
          class="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
        >
          Khóa Token Truy Cập Bí Mật
        </label>
        <div
          class="rounded bg-black/60 p-3 font-mono text-xs text-sky-300 flex items-center justify-between gap-2 break-all"
        >
          <span>{{ props.fullKey }}</span>
          <Button
            type="text"
            size="small"
            class="text-sky-300 hover:text-white p-0 size-6 shrink-0"
            @click="copyToClipboard(props.fullKey, 'Full API Key')"
          >
            <Check
              v-if="isCopied('Full API Key')"
              class="size-4 text-green-500"
            />
            <Copy v-else class="size-4" />
          </Button>
        </div>
      </div>

      <div class="flex justify-end pt-2">
        <Button type="primary" @click="emit('update:open', false)">
          Đã Lưu Khóa & Đóng
        </Button>
      </div>
    </div>
  </Modal>
</template>
