<script lang="ts" setup>
import type { TenantItem } from '#/api';

import { ref, watch } from 'vue';

import { Input, message, Modal, Select } from 'ant-design-vue';

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
    message.warning('Vui lòng điền đầy đủ tên và slug Workspace');
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
  <Modal
    :open="props.open"
    title="Cài Đặt & Cập Nhật Workspace"
    ok-text="Cập Nhật"
    cancel-text="Hủy"
    :confirm-loading="props.loading"
    @cancel="emit('update:open', false)"
    @ok="handleOk"
  >
    <div class="space-y-4 py-3">
      <div>
        <label class="block text-sm font-medium text-foreground mb-1.5">
          Tên Workspace / Tổ Chức
        </label>
        <Input
          v-model:value="name"
          placeholder="Ví dụ: Core Engineering"
          size="large"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-foreground mb-1.5">
          Mã Slug (Định danh URL)
        </label>
        <Input v-model:value="slug" placeholder="core-eng" size="large" />
      </div>

      <div>
        <label class="block text-sm font-medium text-foreground mb-1.5">
          Gói Dịch Vụ
        </label>
        <Select
          v-model:value="plan"
          size="large"
          class="w-full"
          :options="[
            {
              label: 'Pro (25 Nodes, 10 Thành viên, 10 GB Storage)',
              value: 'pro',
            },
            {
              label: 'Enterprise (100 Nodes, 50 Thành viên, 50 GB Storage)',
              value: 'enterprise',
            },
            {
              label: 'Free (3 Nodes, 3 Thành viên, 1 GB Storage)',
              value: 'free',
            },
          ]"
        />
      </div>
    </div>
  </Modal>
</template>
