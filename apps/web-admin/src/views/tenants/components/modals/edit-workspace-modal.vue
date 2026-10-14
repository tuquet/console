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

import { VxeForm, VxeFormItem } from '#/adapter/vxe-table';

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
        <DialogTitle>Cài đặt và cập nhật workspace</DialogTitle>
      </DialogHeader>

      <div class="py-2">
        <VxeForm
          :data="{ name, slug }"
          custom-layout
          size="small"
          class="w-full space-y-3"
        >
          <VxeFormItem title="Tên workspace" span="24">
            <template #default>
              <Input
                v-model="name"
                placeholder="Ví dụ: Core Engineering"
                class="h-10"
              />
            </template>
          </VxeFormItem>

          <VxeFormItem title="Mã slug định danh URL" span="24">
            <template #default>
              <Input v-model="slug" placeholder="core-eng" class="h-10" />
            </template>
          </VxeFormItem>
        </VxeForm>
      </div>

      <DialogFooter class="flex items-center justify-end gap-2 pt-2">
        <Button
          variant="outline"
          :disabled="props.loading"
          @click="emit('update:open', false)"
        >
          Hủy
        </Button>
        <Button :disabled="props.loading" @click="handleOk"> Cập nhật </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
