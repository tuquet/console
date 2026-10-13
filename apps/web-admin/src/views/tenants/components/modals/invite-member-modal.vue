<script lang="ts" setup>
import type { WorkspaceMemberRole } from '#/api';

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
  roles?: WorkspaceMemberRole[];
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  roles: () => [
    {
      display_name: 'Quản trị viên',
      id: '00000000-0000-0000-0000-000000000002',
      name: 'admin',
    },
    {
      display_name: 'Thành viên',
      id: '00000000-0000-0000-0000-000000000003',
      name: 'member',
    },
    {
      display_name: 'Người xem',
      id: '00000000-0000-0000-0000-000000000004',
      name: 'viewer',
    },
  ],
});

const emit = defineEmits<{
  (e: 'submit', payload: { email: string; roleId: string }): void;
  (e: 'update:open', val: boolean): void;
}>();

const email = ref('');
const selectedRoleId = ref('00000000-0000-0000-0000-000000000003');

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      email.value = '';
      const defaultRole =
        props.roles.find((r) => r.name === 'member')?.id ||
        props.roles[0]?.id ||
        '';
      selectedRoleId.value = defaultRole;
    }
  },
);

function handleOk() {
  if (!email.value || !email.value.includes('@')) {
    toast.warning('Vui lòng nhập địa chỉ email hợp lệ');
    return;
  }
  emit('submit', { email: email.value.trim(), roleId: selectedRoleId.value });
}
</script>

<template>
  <Dialog :open="props.open" @update:open="(val) => emit('update:open', val)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Mời Thành Viên Vào Workspace</DialogTitle>
      </DialogHeader>

      <div class="space-y-5 py-2">
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            Email Thành Viên
          </label>
          <Input v-model="email" placeholder="dev@tuquet.com" type="email" />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            Vai Trò IAM (Phân Quyền)
          </label>
          <select
            v-model="selectedRoleId"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option v-for="role in props.roles" :key="role.id" :value="role.id">
              {{ role.display_name }} ({{ role.name }})
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
