<script lang="ts" setup>
import type { WorkspaceMember } from '#/api';

import { Edit3, UserPlus } from '@lucide/vue';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@tuquet/vue-ui';

import RoleBadge from '#/components/iam/role-badge.vue';
import { useDateFormat } from '#/composables';
import { $t } from '#/locales';

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
</script>

<template>
  <div class="space-y-4 pt-1">
    <!-- Action bar inside tab -->
    <div
      class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"
    >
      <h3 class="text-base font-semibold text-foreground">
        Danh sách thành viên · {{ props.members.length }}
      </h3>
      <Button size="sm" class="h-8 gap-1.5 font-medium" @click="emit('invite')">
        <UserPlus class="size-3.5" />
        <span>{{ $t('common.add') }}</span>
      </Button>
    </div>

    <!-- Desktop Table (md:block) -->
    <div
      class="hidden md:block overflow-x-auto rounded-lg border border-border/60"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Thành viên</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Ngày tham gia</TableHead>
            <TableHead class="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="record in props.members" :key="record.id">
            <!-- User Column -->
            <TableCell>
              <div class="flex items-center gap-2.5">
                <Avatar class="size-8">
                  <AvatarImage
                    v-if="record.avatar_url"
                    :src="record.avatar_url"
                  />
                  <AvatarFallback
                    class="bg-muted text-muted-foreground text-xs font-semibold uppercase"
                  >
                    {{ (record.full_name || record.email || 'U').slice(0, 2) }}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div class="font-medium text-foreground">
                    {{ record.full_name || 'Kỹ sư Tuquet' }}
                  </div>
                  <div
                    v-if="record.role?.name === 'owner'"
                    class="text-xs text-primary font-medium"
                  >
                    Chủ sở hữu
                  </div>
                </div>
              </div>
            </TableCell>

            <!-- Email Column -->
            <TableCell>
              <span class="text-xs text-muted-foreground">
                {{ record.email }}
              </span>
            </TableCell>

            <!-- Role Column -->
            <TableCell>
              <RoleBadge :role="record.role?.name || 'member'" />
            </TableCell>

            <!-- Status Column -->
            <TableCell>
              <Badge variant="outline" class="text-xs font-normal">
                <span
                  class="mr-1.5 size-1.5 rounded-full"
                  :class="
                    record.status === 'active'
                      ? 'bg-success'
                      : record.status === 'invited'
                        ? 'bg-primary'
                        : 'bg-destructive'
                  "
                ></span>
                {{
                  record.status === 'active'
                    ? 'Hoạt động'
                    : record.status === 'invited'
                      ? 'Chờ chấp thuận'
                      : 'Tạm khóa'
                }}
              </Badge>
            </TableCell>

            <!-- Joined At Column -->
            <TableCell>
              <span class="text-xs text-muted-foreground">
                {{ formatDate(record.joined_at) }}
              </span>
            </TableCell>

            <!-- Action Column -->
            <TableCell class="text-right">
              <div class="flex items-center justify-end gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  class="flex items-center gap-1 p-0 h-auto text-foreground hover:text-primary text-xs"
                  @click="emit('edit', record)"
                >
                  <Edit3 class="size-3.5" />
                  <span>{{ $t('common.edit') }}</span>
                </Button>
                <template v-if="record.role?.name !== 'owner'">
                  <span class="text-muted-foreground/40">•</span>
                  <AlertDialog>
                    <AlertDialogTrigger as-child>
                      <Button
                        variant="ghost"
                        size="sm"
                        class="p-0 h-auto text-destructive hover:text-destructive text-xs"
                      >
                        {{ $t('common.delete') }}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xóa thành viên này?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Thành viên "{{ record.full_name || record.email }}" sẽ
                          mất quyền truy cập vào Workspace này.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction @click="emit('remove', record)">
                          Xóa
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </template>
              </div>
            </TableCell>
          </TableRow>

          <TableRow v-if="props.members.length === 0 && !props.loading">
            <TableCell
              colspan="6"
              class="h-24 text-center text-sm text-muted-foreground"
            >
              Không có thành viên nào trong Workspace.
            </TableCell>
          </TableRow>
        </TableBody>
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
            <Avatar class="size-8">
              <AvatarImage v-if="member.avatar_url" :src="member.avatar_url" />
              <AvatarFallback
                class="bg-muted text-muted-foreground text-xs font-semibold uppercase"
              >
                {{ (member.full_name || member.email || 'U').slice(0, 2) }}
              </AvatarFallback>
            </Avatar>
            <div>
              <div class="font-medium text-foreground text-sm">
                {{ member.full_name || 'Kỹ sư Tuquet' }}
              </div>
              <div class="text-xs text-muted-foreground">
                {{ member.email }}
              </div>
            </div>
          </div>
          <RoleBadge :role="member.role?.name || 'member'" />
        </div>

        <div
          class="flex items-center justify-between border-t border-border/40 pt-2 text-xs text-muted-foreground"
        >
          <Badge variant="outline" class="text-xs font-normal">
            <span
              class="mr-1.5 size-1.5 rounded-full"
              :class="
                member.status === 'active'
                  ? 'bg-success'
                  : member.status === 'invited'
                    ? 'bg-primary'
                    : 'bg-destructive'
              "
            ></span>
            {{
              member.status === 'active'
                ? 'Hoạt động'
                : member.status === 'invited'
                  ? 'Chờ chấp thuận'
                  : 'Tạm khóa'
            }}
          </Badge>

          <div class="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              class="flex items-center gap-1 p-0 h-auto text-foreground hover:text-primary text-xs"
              @click="emit('edit', member)"
            >
              <Edit3 class="size-3.5" />
              <span>Sửa</span>
            </Button>
            <template v-if="member.role?.name !== 'owner'">
              <span class="text-muted-foreground/40">•</span>
              <AlertDialog>
                <AlertDialogTrigger as-child>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="p-0 h-auto text-destructive hover:text-destructive text-xs"
                  >
                    Xóa
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xóa thành viên này?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Thành viên "{{ member.full_name || member.email }}" sẽ mất
                      quyền truy cập vào Workspace này.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction @click="emit('remove', member)">
                      Xóa
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
