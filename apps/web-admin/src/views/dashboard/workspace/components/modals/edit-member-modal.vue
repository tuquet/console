<script lang="ts" setup>
import type { WorkspaceMember } from '#/api';

import { ref, watch } from 'vue';

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '@tuquet/vue-ui';

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
  <Dialog :open="props.open" @update:open="(val) => emit('update:open', val)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Chỉnh Sửa Thông Tin Thành Viên</DialogTitle>
      </DialogHeader>

      <div class="space-y-5 py-2">
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            Email Định Danh
          </label>
          <Input
            :model-value="props.member?.email"
            disabled
            class="bg-muted/40 font-mono text-xs"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            Họ Và Tên Thành Viên
          </label>
          <Input v-model="fullName" placeholder="Nhập họ và tên hiển thị" />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            Vai Trò IAM (Quyền Hạn)
          </label>
          <select
            v-model="role"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="developer">
              Developer (Kỹ sư phát triển - Chạy Runner & Task)
            </option>
            <option value="admin">
              Admin (Quản trị viên - Quản trị thành viên & Quota)
            </option>
            <option value="member">
              Member (Thành viên - Xem và đọc dữ liệu)
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            Trạng Thái Tài Khoản
          </label>
          <select
            v-model="status"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="active">Hoạt động (Active)</option>
            <option value="suspended">Tạm khóa (Suspended)</option>
            <option value="invited">Chờ chấp thuận (Invited)</option>
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
          Lưu Thay Đổi
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
