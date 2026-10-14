<script lang="ts" setup>
import { ref, watch } from 'vue';

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  toast,
} from '@tuquet/vue-ui';

interface Props {
  loading?: boolean;
  open: boolean;
  slug?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  slug: '',
});

const emit = defineEmits<{
  (e: 'submit'): void;
  (e: 'update:open', val: boolean): void;
}>();

const confirmSlugInput = ref('');

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      confirmSlugInput.value = '';
    }
  },
);

function handleOk() {
  if (confirmSlugInput.value.trim() !== props.slug) {
    toast.error('Mã Slug xác nhận không chính xác!');
    return;
  }
  emit('submit');
}
</script>

<template>
  <Dialog :open="props.open" @update:open="(val) => emit('update:open', val)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Xác nhận xóa hoặc lưu trữ workspace</DialogTitle>
      </DialogHeader>

      <div class="space-y-5 py-2">
        <div
          class="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
        >
          Hành động này sẽ vô hiệu hóa toàn bộ API keys, ngắt kết nối thiết bị
          và loại bỏ workspace khỏi hệ thống.
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            Để xác nhận, hãy nhập chính xác slug:
            <strong class="font-mono text-destructive">{{ props.slug }}</strong>
          </label>
          <Input v-model="confirmSlugInput" :placeholder="props.slug" />
        </div>
      </div>

      <DialogFooter class="flex items-center justify-end gap-2 pt-2">
        <Button
          variant="outline"
          :disabled="props.loading"
          @click="emit('update:open', false)"
        >
          Hủy
        </Button>
        <Button
          variant="destructive"
          :disabled="props.loading || confirmSlugInput.trim() !== props.slug"
          @click="handleOk"
        >
          Xác nhận xóa
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
