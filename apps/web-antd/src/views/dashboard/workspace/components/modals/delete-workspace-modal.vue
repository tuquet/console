<script lang="ts" setup>
import { ref, watch } from 'vue';

import { Input, message, Modal } from 'ant-design-vue';

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
    message.error('Mã Slug xác nhận không chính xác!');
    return;
  }
  emit('submit');
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Xác Nhận Xóa / Lưu Trữ Workspace"
    ok-text="Xác Nhận Xóa"
    cancel-text="Hủy"
    ok-type="danger"
    :confirm-loading="props.loading"
    @cancel="emit('update:open', false)"
    @ok="handleOk"
  >
    <div class="space-y-4 py-3">
      <div
        class="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400"
      >
        Hành động này sẽ vô hiệu hóa toàn bộ API keys, ngắt kết nối thiết bị và
        loại bỏ workspace khỏi hệ thống.
      </div>

      <div>
        <label class="block text-sm font-medium text-foreground mb-1.5">
          Để xác nhận, hãy nhập chính xác slug:
          <strong class="font-mono text-red-400">{{ props.slug }}</strong>
        </label>
        <Input
          v-model:value="confirmSlugInput"
          :placeholder="props.slug"
          size="large"
        />
      </div>
    </div>
  </Modal>
</template>
