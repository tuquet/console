<script lang="ts" setup>
import type { PlatformUserItem } from '#/api';

import { Building2, RefreshCw } from '@lucide/vue';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
} from '@tuquet/vue-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getPlatformUsersApi } from '#/api';
import { useDateFormat } from '#/composables';
import { $t } from '#/locales';

defineOptions({ name: 'SystemUsers' });

const { formatDate } = useDateFormat();

const [Grid, gridApi] = useVbenVxeGrid<PlatformUserItem>({
  formOptions: {
    schema: [
      {
        component: 'Select',
        fieldName: 'tenant_filter',
        label: 'Tổ chức',
        defaultValue: 'all',
        componentProps: {
          placeholder: 'Tất cả tổ chức',
          options: [
            { label: 'Tất cả người dùng', value: 'all' },
            { label: 'Đã tham gia tổ chức', value: 'has_tenants' },
            { label: 'Chưa có tổ chức', value: 'no_tenants' },
          ],
        },
      },
      {
        component: 'Input',
        fieldName: 'search',
        label: 'Tìm kiếm',
        componentProps: {
          placeholder: 'Tìm theo họ tên hoặc định danh UUID...',
          clearable: true,
        },
      },
    ],
    layout: 'vertical',
    showCollapseButton: false,
    submitButtonOptions: {
      content: $t('common.search'),
    },
    resetButtonOptions: {
      content: $t('common.reset'),
    },
    actionWrapperClass: 'flex items-center justify-end gap-2 pt-2 sm:pt-6',
    wrapperClass: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3',
  },
  gridOptions: {
    border: false,
    round: true,
    showOverflow: true,
    pagerConfig: {
      pageSize: 15,
      pageSizes: [10, 15, 30, 50],
    },
    proxyConfig: {
      autoLoad: true,
      ajax: {
        query: async (
          { page }: { page?: { currentPage?: number; pageSize?: number } },
          formValues: Record<string, any>,
        ) => {
          const allUsers = await getPlatformUsersApi({
            search: formValues?.search?.trim() || undefined,
          });

          let users = allUsers;
          if (formValues?.tenant_filter === 'has_tenants') {
            users = users.filter((u) => u.tenant_count > 0);
          } else if (formValues?.tenant_filter === 'no_tenants') {
            users = users.filter((u) => u.tenant_count === 0);
          }

          const currentPage = page?.currentPage || 1;
          const pageSize = page?.pageSize || 15;
          const start = (currentPage - 1) * pageSize;
          const end = start + pageSize;
          return {
            items: users.slice(start, end),
            total: users.length,
          };
        },
      },
    },
    columns: [
      {
        field: 'full_name',
        title: 'Người dùng',
        minWidth: 260,
        slots: { default: 'user-cell' },
      },
      {
        field: 'id',
        title: 'Định danh UUID',
        minWidth: 260,
        slots: { default: 'id-cell' },
      },
      {
        field: 'tenant_count',
        title: 'Workspaces',
        width: 160,
        slots: { default: 'tenant-cell' },
      },
      {
        field: 'created_at',
        title: 'Ngày tham gia',
        minWidth: 160,
        slots: { default: 'date-cell' },
      },
    ],
  },
});

function getInitials(name: null | string): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
</script>

<template>
  <div class="space-y-4 p-4 sm:space-y-5 sm:p-5">
    <!-- Header -->
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex flex-col gap-1">
        <h1
          class="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
        >
          Người dùng nền tảng
        </h1>
        <p class="text-xs text-muted-foreground">
          Danh bạ quản trị viên cấp cao và phân quyền vận hành toàn hệ thống
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          :title="$t('common.refresh')"
          @click="() => gridApi.reload()"
          class="gap-1.5"
        >
          <RefreshCw class="size-3.5 text-muted-foreground" />
          {{ $t('common.refresh') }}
        </Button>
      </div>
    </div>

    <!-- VXE Grid Table Container with Integrated Form & Pagination -->
    <div
      class="overflow-hidden rounded-none sm:rounded-xl border-0 sm:border border-border/60 bg-card p-0 sm:p-5 shadow-none sm:shadow-xs space-y-4"
    >
      <Grid class="users-vxe-grid">
        <template #user-cell="{ row }">
          <div class="flex items-center gap-3 py-1">
            <Avatar class="size-8 rounded-lg border border-border/40">
              <AvatarImage
                v-if="row.avatar_url"
                :src="row.avatar_url"
                :alt="row.full_name || ''"
              />
              <AvatarFallback class="rounded-lg text-xs font-semibold">
                {{ getInitials(row.full_name) }}
              </AvatarFallback>
            </Avatar>
            <div class="flex flex-col text-left min-w-0">
              <span class="font-medium text-foreground truncate">
                {{ row.full_name || 'Người dùng ẩn danh' }}
              </span>
              <span
                v-if="row.email"
                class="text-xs text-muted-foreground truncate"
              >
                {{ row.email }}
              </span>
            </div>
          </div>
        </template>

        <template #id-cell="{ row }">
          <code
            class="rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground"
          >
            {{ row.id }}
          </code>
        </template>

        <template #tenant-cell="{ row }">
          <Badge variant="outline" class="gap-1 font-normal text-xs">
            <Building2 class="size-3 text-muted-foreground" />
            {{ row.tenant_count }} tổ chức
          </Badge>
        </template>

        <template #date-cell="{ row }">
          <span class="text-xs text-muted-foreground">
            {{ formatDate(row.created_at) }}
          </span>
        </template>
      </Grid>
    </div>
  </div>
</template>
