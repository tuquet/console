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
  (e: 'submit', payload: { name: string; plan: string; slug: string }): void;
  (e: 'update:open', val: boolean): void;
}>();

const name = ref('');
const slug = ref('');
const plan = ref('pro');

watch(
  () => props.tenant,
  (t) => {
    if (t) {
      name.value = t.name || '';
      slug.value = t.slug || '';
      plan.value = t.metadata?.plan || 'pro';
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
    plan: plan.value,
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

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            Gói Dịch Vụ
          </label>
          <select
            v-model="plan"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="pro">
              Pro (25 Nodes, 10 Thành viên, 10 GB Storage)
            </option>
            <option value="enterprise">
              Enterprise (100 Nodes, 50 Thành viên, 50 GB Storage)
            </option>
            <option value="free">
              Free (3 Nodes, 3 Thành viên, 1 GB Storage)
            </option>
          </select>
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
