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
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      name.value = '';
      slug.value = '';
      plan.value = 'pro';
    }
  },
);

function handleNameChange() {
  slug.value = name.value
    .toLowerCase()
    .trim()
    .replaceAll(/[^\w\s-]/g, '')
    .replaceAll(/[\s_-]+/g, '-')
    .replaceAll(/^-+|-+$/g, '');
}

function handleOk() {
  if (!name.value.trim() || !slug.value.trim()) {
    toast.warning('Vui lòng nhập tên và mã slug của Workspace');
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
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Tạo Workspace Mới</DialogTitle>
      </DialogHeader>

      <div class="space-y-5 py-2">
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            Tên Workspace <span class="text-destructive ml-0.5">*</span>
          </label>
          <Input
            v-model="name"
            placeholder="Ví dụ: Core Engineering"
            @input="handleNameChange"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            Mã định danh (Slug) <span class="text-destructive ml-0.5">*</span>
          </label>
          <Input v-model="slug" placeholder="Ví dụ: core-eng" />
          <p class="mt-1.5 text-xs text-muted-foreground">
            Dùng trong định danh URL. Chỉ gồm chữ thường, số và dấu gạch ngang.
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            Gói Dịch Vụ
          </label>
          <select
            v-model="plan"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="pro">Pro (Khuyên dùng)</option>
            <option value="free">Free Tier</option>
            <option value="enterprise">Enterprise Custom</option>
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
        <Button :disabled="props.loading" @click="handleOk">
          Tạo Workspace
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
