<script lang="ts" setup>
import type { WorkspaceMember, WorkspaceMemberRole } from '#/api';

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

import { VxeForm, VxeFormItem } from '#/adapter/vxe-table';

interface Props {
  loading?: boolean;
  member: null | WorkspaceMember;
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
  (
    e: 'submit',
    payload: {
      roleId: string;
      status: 'active' | 'invited' | 'suspended';
    },
  ): void;
  (e: 'update:open', val: boolean): void;
}>();

const selectedRoleId = ref('');
const status = ref<'active' | 'invited' | 'suspended'>('active');

watch(
  () => props.member,
  (m) => {
    if (m) {
      selectedRoleId.value = m.role?.id || '';
      status.value = m.status;
    }
  },
  { immediate: true },
);

function handleOk() {
  emit('submit', {
    roleId: selectedRoleId.value,
    status: status.value,
  });
}
</script>

<template>
  <Dialog :open="props.open" @update:open="(val) => emit('update:open', val)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Chỉnh sửa phân quyền thành viên</DialogTitle>
      </DialogHeader>

      <div class="py-2">
        <VxeForm
          :data="{ selectedRoleId, status }"
          custom-layout
          size="small"
          class="w-full space-y-3"
        >
          <VxeFormItem title="Email định danh" span="24">
            <template #default>
              <Input
                :model-value="props.member?.email"
                disabled
                class="bg-muted/40 font-mono text-xs h-10"
              />
            </template>
          </VxeFormItem>

          <VxeFormItem title="Họ và tên hiển thị" span="24">
            <template #default>
              <Input
                :model-value="props.member?.full_name || props.member?.email"
                disabled
                class="bg-muted/40 text-xs h-10"
              />
            </template>
          </VxeFormItem>

          <VxeFormItem title="Vai trò IAM" span="24">
            <template #default>
              <select
                v-model="selectedRoleId"
                :disabled="props.member?.role?.name === 'owner'"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option
                  v-if="props.member?.role?.name === 'owner'"
                  :value="props.member.role.id"
                >
                  Chủ sở hữu owner - Bất biến
                </option>
                <option
                  v-for="role in props.roles"
                  :key="role.id"
                  :value="role.id"
                >
                  {{ role.display_name }} · {{ role.name }}
                </option>
              </select>
            </template>
          </VxeFormItem>

          <VxeFormItem title="Trạng thái hoạt động" span="24">
            <template #default>
              <select
                v-model="status"
                :disabled="props.member?.role?.name === 'owner'"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="active">Hoạt động</option>
                <option value="suspended">Tạm khóa</option>
                <option value="invited">Chờ chấp thuận</option>
              </select>
            </template>
          </VxeFormItem>
        </VxeForm>
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
          Lưu thay đổi
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
