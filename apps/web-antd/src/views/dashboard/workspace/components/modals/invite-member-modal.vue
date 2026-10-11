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
    payload: { email: string; role: 'admin' | 'developer' | 'member' },
  ): void;
  (e: 'update:open', val: boolean): void;
}>();

const email = ref('');
const role = ref<'admin' | 'developer' | 'member'>('developer');

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      email.value = '';
      role.value = 'developer';
    }
  },
);

function handleOk() {
  if (!email.value || !email.value.includes('@')) {
    message.warning('Vui lòng nhập địa chỉ email hợp lệ');
    return;
  }
  emit('submit', { email: email.value.trim(), role: role.value });
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Mời Thành Viên Vào Workspace"
    ok-text="Gửi Lời Mời"
    cancel-text="Hủy"
    :confirm-loading="props.loading"
    @cancel="emit('update:open', false)"
    @ok="handleOk"
  >
    <div class="space-y-4 py-3">
      <div>
        <label class="block text-sm font-medium text-foreground mb-1.5">
          Email Thành Viên
        </label>
        <Input
          v-model:value="email"
          placeholder="dev@tuquet.com"
          size="large"
          type="email"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-foreground mb-1.5">
          Vai Trò IAM (Phân Quyền)
        </label>
        <Select
          v-model:value="role"
          size="large"
          class="w-full"
          :options="[
            {
              label: 'Developer (Kỹ sư phát triển - Chạy Runner & Task)',
              value: 'developer',
            },
            {
              label: 'Admin (Quản trị viên - Quản lý thành viên & Quota)',
              value: 'admin',
            },
            {
              label: 'Member (Thành viên - Chỉ xem và đọc dữ liệu)',
              value: 'member',
            },
          ]"
        />
      </div>
    </div>
  </Modal>
</template>
