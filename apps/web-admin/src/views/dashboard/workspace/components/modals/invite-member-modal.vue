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
    toast.warning('Vui lòng nhập địa chỉ email hợp lệ');
    return;
  }
  emit('submit', { email: email.value.trim(), role: role.value });
}
</script>

<template>
  <Dialog :open="props.open" @update:open="(val) => emit('update:open', val)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Mời Thành Viên Vào Workspace</DialogTitle>
      </DialogHeader>

      <div class="space-y-4 py-2">
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">
            Email Thành Viên
          </label>
          <Input v-model="email" placeholder="dev@tuquet.com" type="email" />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">
            Vai Trò IAM (Phân Quyền)
          </label>
          <select
            v-model="role"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="developer">
              Developer (Kỹ sư phát triển - Chạy Runner & Task)
            </option>
            <option value="admin">
              Admin (Quản trị viên - Quản lý thành viên & Quota)
            </option>
            <option value="member">
              Member (Thành viên - Chỉ xem và đọc dữ liệu)
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
        <Button :disabled="props.loading" @click="handleOk">
          Gửi Lời Mời
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
