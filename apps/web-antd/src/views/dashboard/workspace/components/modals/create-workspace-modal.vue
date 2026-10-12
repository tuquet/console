<script lang="ts" setup>
import { ref, watch } from 'vue';

import { Form, Input, message, Modal, Select } from 'ant-design-vue';

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
    message.warning('Vui lòng nhập tên và mã slug của Workspace');
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
    title="Tạo Workspace Mới"
    ok-text="Tạo Workspace"
    cancel-text="Hủy"
    :confirm-loading="props.loading"
    class="max-w-[calc(100vw-2rem)] sm:max-w-lg"
    @cancel="emit('update:open', false)"
    @ok="handleOk"
  >
    <Form layout="vertical" class="mt-4">
      <Form.Item label="Tên Workspace" required>
        <Input
          v-model:value="name"
          size="large"
          placeholder="Ví dụ: Core Engineering"
          @input="handleNameChange"
        />
      </Form.Item>

      <Form.Item
        label="Mã định danh (Slug)"
        required
        extra="Dùng trong định danh URL. Chỉ gồm chữ thường, số và dấu gạch ngang."
      >
        <Input
          v-model:value="slug"
          size="large"
          placeholder="Ví dụ: core-eng"
        />
      </Form.Item>

      <Form.Item label="Gói Dịch Vụ">
        <Select
          v-model:value="plan"
          size="large"
          :options="[
            { label: 'Pro (Khuyên dùng)', value: 'pro' },
            { label: 'Free Tier', value: 'free' },
            { label: 'Enterprise Custom', value: 'enterprise' },
          ]"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>
