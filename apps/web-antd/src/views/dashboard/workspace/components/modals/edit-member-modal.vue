<script lang="ts" setup>
import type { WorkspaceMember } from '#/api';

import { ref, watch } from 'vue';

import { Input, Modal, Select } from 'ant-design-vue';

interface Props {
  loading?: boolean;
  member: null | WorkspaceMember;
  open: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  (
    e: 'submit',
    payload: {
      full_name: string;
      role: 'admin' | 'developer' | 'member' | 'owner' | 'viewer';
      status: 'active' | 'invited' | 'suspended';
    },
  ): void;
  (e: 'update:open', val: boolean): void;
}>();

const fullName = ref('');
const role = ref<'admin' | 'developer' | 'member' | 'owner' | 'viewer'>(
  'developer',
);
const status = ref<'active' | 'invited' | 'suspended'>('active');

watch(
  () => props.member,
  (m) => {
    if (m) {
      fullName.value = m.full_name || '';
      role.value = m.role;
      status.value = m.status;
    }
  },
  { immediate: true },
);

function handleOk() {
  emit('submit', {
    full_name: fullName.value.trim(),
    role: role.value,
    status: status.value,
  });
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Chỉnh Sửa Thông Tin Thành Viên"
    ok-text="Lưu Thay Đổi"
    cancel-text="Hủy"
    :confirm-loading="props.loading"
    @cancel="emit('update:open', false)"
    @ok="handleOk"
  >
    <div class="space-y-4 py-3">
      <div>
        <label class="block text-sm font-medium text-foreground mb-1.5">
          Email Định Danh
        </label>
        <Input
          :value="props.member?.email"
          disabled
          size="large"
          class="bg-muted/40 font-mono text-xs"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-foreground mb-1.5">
          Họ Và Tên Thành Viên
        </label>
        <Input
          v-model:value="fullName"
          placeholder="Nhập họ và tên hiển thị"
          size="large"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-foreground mb-1.5">
          Vai Trò IAM (Quyền Hạn)
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
              label: 'Admin (Quản trị viên - Quản trị thành viên & Quota)',
              value: 'admin',
            },
            {
              label: 'Member (Thành viên - Xem và đọc dữ liệu)',
              value: 'member',
            },
          ]"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-foreground mb-1.5">
          Trạng Thái Tài Khoản
        </label>
        <Select
          v-model:value="status"
          size="large"
          class="w-full"
          :options="[
            { label: 'Hoạt động (Active)', value: 'active' },
            { label: 'Tạm khóa (Suspended)', value: 'suspended' },
            { label: 'Chờ chấp thuận (Invited)', value: 'invited' },
          ]"
        />
      </div>
    </div>
  </Modal>
</template>
