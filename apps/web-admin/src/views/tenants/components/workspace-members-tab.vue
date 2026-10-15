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
    <div class="flex items-center justify-between gap-2">
      <h3 class="text-sm font-semibold text-foreground sm:text-base">
        {{ $t('page.tenants_view.members_list_title') }}
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
            <TableHead>{{ $t('term.member') }}</TableHead>
            <TableHead>{{ $t('common.email') }}</TableHead>
            <TableHead>{{ $t('term.role') }}</TableHead>
            <TableHead>{{ $t('common.status') }}</TableHead>
            <TableHead>{{ $t('page.tenants_view.col_joined_at') }}</TableHead>
            <TableHead class="text-right">{{ $t('common.actions') }}</TableHead>
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
                    class="bg-primary/10 text-primary text-xs font-semibold uppercase"
                  >
                    {{ (record.full_name || record.email || 'U').slice(0, 2) }}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div class="font-medium text-foreground">
                    {{
                      record.full_name ||
                      $t('page.tenants_view.default_member_name')
                    }}
                  </div>
                  <div
                    v-if="record.role?.name === 'owner'"
                    class="text-xs text-primary font-medium"
                  >
                    {{ $t('page.tenants_view.role_owner') }}
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
                    ? $t('common.active')
                    : record.status === 'invited'
                      ? $t('page.tenants_view.status_invited')
                      : $t('common.suspended')
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
                        <AlertDialogTitle>
                          {{
                            $t('page.tenants_view.remove_member_confirm_title')
                          }}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {{
                            $t('page.tenants_view.remove_member_confirm_desc', {
                              name: record.full_name || record.email,
                            })
                          }}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {{ $t('common.cancel') }}
                        </AlertDialogCancel>
                        <AlertDialogAction @click="emit('remove', record)">
                          {{ $t('common.delete') }}
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
              {{ $t('page.tenants_view.members_empty') }}
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
                class="bg-primary/10 text-primary text-xs font-semibold uppercase"
              >
                {{ (member.full_name || member.email || 'U').slice(0, 2) }}
              </AvatarFallback>
            </Avatar>
            <div>
              <div class="font-medium text-foreground text-sm">
                {{
                  member.full_name ||
                  $t('page.tenants_view.default_member_name')
                }}
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
                ? $t('common.active')
                : member.status === 'invited'
                  ? $t('page.tenants_view.status_invited')
                  : $t('common.suspended')
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
              <span>{{ $t('common.edit') }}</span>
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
                    {{ $t('common.delete') }}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {{ $t('page.tenants_view.remove_member_confirm_title') }}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {{
                        $t('page.tenants_view.remove_member_confirm_desc', {
                          name: member.full_name || member.email,
                        })
                      }}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {{ $t('common.cancel') }}
                    </AlertDialogCancel>
                    <AlertDialogAction @click="emit('remove', member)">
                      {{ $t('common.delete') }}
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
