<script lang="ts" setup>
import { ref, watch } from 'vue';

import { Input, message, Modal, Select } from 'ant-design-vue';

interface Props {
  loading?: boolean;
  open: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  (
    e: 'submit',
    payload: {
      expiresInDays: number;
      name: string;
      role: 'admin' | 'read_only';
    },
  ): void;
  (e: 'update:open', val: boolean): void;
}>();

const name = ref('');
const role = ref<'admin' | 'read_only'>('admin');
const expiresInDays = ref<number>(0);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      name.value = '';
      role.value = 'admin';
      expiresInDays.value = 0;
    }
  },
);

function handleOk() {
  if (!name.value.trim()) {
    message.warning('Vui lòng nhập tên nhận diện cho khóa API');
    return;
  }
  emit('submit', {
    expiresInDays: expiresInDays.value,
    name: name.value.trim(),
    role: role.value,
  });
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Tạo Khóa API Headless Mới"
    ok-text="Tạo Khóa"
    cancel-text="Hủy"
    :confirm-loading="props.loading"
    @cancel="emit('update:open', false)"
    @ok="handleOk"
  >
    <div class="space-y-4 py-3">
      <div>
        <label class="block text-sm font-medium text-foreground mb-1.5">
          Tên Nhận Diện Khóa (Purpose)
        </label>
        <Input
          v-model:value="name"
          placeholder="Ví dụ: GitHub Actions Deploy, Production Worker"
          size="large"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-foreground mb-1.5">
          Quyền Hạn API (Scope)
        </label>
        <Select
          v-model:value="role"
          size="large"
          class="w-full"
          :options="[
            {
              label: 'Full Access (Toàn quyền quản trị và đẩy job chạy)',
              value: 'admin',
            },
            {
              label: 'Read Only (Chỉ đọc trạng thái và logs runner)',
              value: 'read_only',
            },
          ]"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-foreground mb-1.5">
          Thời Gian Hiệu Lực
        </label>
        <Select
          v-model:value="expiresInDays"
          size="large"
          class="w-full"
          :options="[
            { label: 'Không bao giờ hết hạn (Vĩnh viễn)', value: 0 },
            { label: '30 Ngày', value: 30 },
            { label: '60 Ngày', value: 60 },
            { label: '90 Ngày', value: 90 },
            { label: '365 Ngày (1 Năm)', value: 365 },
          ]"
        />
      </div>
    </div>
  </Modal>
</template>
