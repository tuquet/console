<script lang="ts" setup>
import { Check, Copy } from '@lucide/vue';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@tuquet/vue-ui';

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
  <Dialog :open="props.open" @update:open="(val) => emit('update:open', val)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Khóa API Đã Được Tạo Thành Công</DialogTitle>
      </DialogHeader>

      <div class="space-y-5 py-2">
        <div
          class="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300"
        >
          <strong>Lưu ý bảo mật quan trọng:</strong> Khóa này chỉ hiển thị một
          lần duy nhất. Hãy sao chép và lưu trữ an toàn ngay bây giờ.
        </div>

        <div>
          <label
            class="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2"
          >
            Khóa Token Truy Cập Bí Mật
          </label>
          <div
            class="rounded bg-muted/60 border border-border p-3 font-mono text-xs text-foreground flex items-center justify-between gap-2 break-all"
          >
            <span>{{ props.fullKey }}</span>
            <Button
              variant="ghost"
              size="icon"
              class="text-muted-foreground hover:text-foreground p-0 size-6 shrink-0"
              @click="copyToClipboard(props.fullKey, 'Full API Key')"
            >
              <Check
                v-if="isCopied('Full API Key')"
                class="size-4 text-emerald-500"
              />
              <Copy v-else class="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <DialogFooter class="flex justify-end pt-2">
        <Button @click="emit('update:open', false)">
          Đã Lưu Khóa & Đóng
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
