<script lang="ts" setup>
import type { WorkspaceMember } from '#/api';

import { Edit3, UserPlus } from '@lucide/vue';
import { Avatar, Badge, Button, Popconfirm, Table } from 'ant-design-vue';

import RoleBadge from '#/components/iam/role-badge.vue';
import { useDateFormat } from '#/composables';

interface Props {
  loading?: boolean;
  members: WorkspaceMember[];
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  edit: [member: WorkspaceMember];
  invite: [];
  remove: [member: WorkspaceMember];
}>();

const { formatDate } = useDateFormat();

const memberColumns = [
  { key: 'user', title: 'Thành Viên' },
  { dataIndex: 'email', key: 'email', title: 'Email' },
  { key: 'role', title: 'Vai Trò IAM' },
  { key: 'status', title: 'Trạng Thái' },
  { key: 'joined_at', title: 'Ngày Tham Gia' },
  { key: 'action', title: 'Thao Tác', width: 140 },
];
</script>

<template>
  <div class="space-y-4 pt-2">
    <!-- Action bar inside tab -->
    <div
      class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"
    >
      <div>
        <h3 class="text-base font-semibold text-foreground">
          Danh Sách Thành Viên ({{ props.members.length }})
        </h3>
        <p class="text-xs text-muted-foreground">
          Quản lý quyền truy cập và vai trò của các kỹ sư trong Workspace này
        </p>
      </div>
      <Button
        type="primary"
        class="flex items-center justify-center gap-1.5"
        @click="emit('invite')"
      >
        <UserPlus class="size-4" />
        <span>Mời Thành Viên</span>
      </Button>
    </div>

    <!-- Desktop Table (md:block) -->
    <div class="hidden md:block">
      <Table
        :columns="memberColumns"
        :data-source="props.members"
        :loading="props.loading"
        row-key="id"
        :pagination="false"
      >
        <template #bodyCell="{ column, record }">
          <!-- User Column -->
          <template v-if="column.key === 'user'">
            <div class="flex items-center gap-2.5">
              <Avatar
                :src="record.avatar_url || undefined"
                class="bg-sky-600 text-xs font-semibold text-white uppercase"
              >
                {{ (record.full_name || record.email || 'U').slice(0, 2) }}
              </Avatar>
              <div>
                <div class="font-medium text-foreground">
                  {{ record.full_name || 'Kỹ Sư Tuquet' }}
                </div>
                <div
                  v-if="record.role === 'owner'"
                  class="text-xs text-purple-400 font-medium"
                >
                  Workspace Owner
                </div>
              </div>
            </div>
          </template>

          <!-- Email Column -->
          <template v-else-if="column.key === 'email'">
            <span class="font-mono text-xs text-muted-foreground">
              {{ record.email }}
            </span>
          </template>

          <!-- Role Column -->
          <template v-else-if="column.key === 'role'">
            <RoleBadge :role="record.role" />
          </template>

          <!-- Status Column -->
          <template v-else-if="column.key === 'status'">
            <Badge
              :status="
                record.status === 'active'
                  ? 'success'
                  : record.status === 'invited'
                    ? 'processing'
                    : 'error'
              "
              :text="
                record.status === 'active'
                  ? 'Hoạt động'
                  : record.status === 'invited'
                    ? 'Chờ chấp thuận'
                    : 'Tạm khóa'
              "
              class="text-xs"
            />
          </template>

          <!-- Joined At Column -->
          <template v-else-if="column.key === 'joined_at'">
            <span class="text-xs text-muted-foreground">
              {{ formatDate(record.joined_at) }}
            </span>
          </template>

          <!-- Action Column -->
          <template v-else-if="column.key === 'action'">
            <div class="flex items-center gap-2">
              <Button
                type="link"
                size="small"
                class="flex items-center gap-1 p-0 text-sky-400 hover:text-sky-300"
                @click="emit('edit', record as WorkspaceMember)"
              >
                <Edit3 class="size-3.5" />
                <span>Sửa</span>
              </Button>
              <span
                v-if="record.role !== 'owner'"
                class="text-muted-foreground/40"
                >•</span>
              <Popconfirm
                v-if="record.role !== 'owner'"
                title="Bạn có chắc chắn muốn xóa thành viên này?"
                ok-text="Xóa"
                cancel-text="Hủy"
                @confirm="emit('remove', record as WorkspaceMember)"
              >
                <Button danger type="link" size="small" class="p-0">
                  Xóa
                </Button>
              </Popconfirm>
            </div>
          </template>
        </template>
      </Table>
    </div>

    <!-- Mobile Card List (md:hidden) -->
    <div class="space-y-3 md:hidden">
      <div
        v-for="member in props.members"
        :key="member.id"
        class="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-3"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <Avatar
              :src="member.avatar_url || undefined"
              class="bg-sky-600 text-xs font-semibold text-white uppercase"
            >
              {{ (member.full_name || member.email || 'U').slice(0, 2) }}
            </Avatar>
            <div>
              <div class="font-medium text-foreground text-sm">
                {{ member.full_name || 'Kỹ Sư Tuquet' }}
              </div>
              <div class="font-mono text-xs text-muted-foreground">
                {{ member.email }}
              </div>
            </div>
          </div>
          <RoleBadge :role="member.role" />
        </div>

        <div
          class="flex items-center justify-between border-t border-border/40 pt-2 text-xs text-muted-foreground"
        >
          <Badge
            :status="
              member.status === 'active'
                ? 'success'
                : member.status === 'invited'
                  ? 'processing'
                  : 'error'
            "
            :text="
              member.status === 'active'
                ? 'Hoạt động'
                : member.status === 'invited'
                  ? 'Chờ chấp thuận'
                  : 'Tạm khóa'
            "
          />

          <div class="flex items-center gap-3">
            <Button
              type="link"
              size="small"
              class="flex items-center gap-1 p-0 text-sky-400 hover:text-sky-300"
              @click="emit('edit', member)"
            >
              <Edit3 class="size-3.5" />
              <span>Sửa</span>
            </Button>
            <Popconfirm
              v-if="member.role !== 'owner'"
              title="Xóa thành viên này?"
              ok-text="Xóa"
              cancel-text="Hủy"
              @confirm="emit('remove', member)"
            >
              <Button danger type="link" size="small" class="p-0"> Xóa </Button>
            </Popconfirm>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
