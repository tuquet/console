<script lang="ts" setup>
import type { TenantItem } from '#/api';

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
  tenant: null | TenantItem;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  (e: 'submit', payload: { name: string; slug: string }): void;
  (e: 'update:open', val: boolean): void;
}>();

const name = ref('');
const slug = ref('');

watch(
  () => props.tenant,
  (t) => {
    if (t) {
      name.value = t.name || '';
      slug.value = t.slug || '';
    }
  },
  { immediate: true },
);

function handleOk() {
  if (!name.value.trim() || !slug.value.trim()) {
    toast.warning('Vui lòng điền đầy đủ tên và slug Workspace');
    return;
  }
  emit('submit', {
    name: name.value.trim(),
    slug: slug.value.trim(),
  });
}
</script>

<template>
  <Dialog :open="props.open" @update:open="(val) => emit('update:open', val)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Cài Đặt & Cập Nhật Workspace</DialogTitle>
      </DialogHeader>

      <div class="space-y-5 py-2">
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            Tên Workspace / Tổ Chức
          </label>
          <Input v-model="name" placeholder="Ví dụ: Core Engineering" />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            Mã Slug (Định danh URL)
          </label>
          <Input v-model="slug" placeholder="core-eng" />
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
        <Button :disabled="props.loading" @click="handleOk"> Cập Nhật </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
