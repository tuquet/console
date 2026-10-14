<script lang="ts" setup>
import type { GlobalAuditLogItem } from '#/api';

import { ref } from 'vue';

import { Eye, RefreshCw, ShieldCheck, User } from '@lucide/vue';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@tuquet/vue-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getGlobalAuditLogsApi } from '#/api';
import { useDateFormat } from '#/composables';
import { $t } from '#/locales';

defineOptions({ name: 'SystemAuditLogs' });

const { formatDate } = useDateFormat();

const selectedLog = ref<GlobalAuditLogItem | null>(null);
const detailOpen = ref(false);

const [Grid, gridApi] = useVbenVxeGrid<GlobalAuditLogItem>({
  formOptions: {
    schema: [
      {
        component: 'Input',
        fieldName: 'action',
        label: 'Hành động',
        componentProps: {
          placeholder: 'auth:login, member:invite...',
        },
      },
      {
        component: 'Input',
        fieldName: 'tenantId',
        label: 'Mã định danh tổ chức',
        componentProps: {
          placeholder: 'Tenant UUID...',
        },
      },
    ],
    layout: 'vertical',
    showCollapseButton: false,
    submitButtonOptions: {
      content: $t('common.filter'),
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
          const action = formValues?.action
            ? String(formValues.action).trim()
            : undefined;
          const tenantId = formValues?.tenantId
            ? String(formValues.tenantId).trim()
            : undefined;

          const data = await getGlobalAuditLogsApi({
            action: action || undefined,
            tenantId: tenantId || undefined,
            limit: 100,
          });

          const currentPage = page?.currentPage || 1;
          const pageSize = page?.pageSize || 15;
          const start = (currentPage - 1) * pageSize;
          const end = start + pageSize;

          return {
            items: data.slice(start, end),
            total: data.length,
          };
        },
      },
    },
    columns: [
      {
        field: 'created_at',
        title: 'Thời gian',
        width: 170,
        slots: { default: 'time-cell' },
      },
      {
        field: 'action',
        title: 'Hành động',
        width: 160,
        slots: { default: 'action-cell' },
      },
      {
        field: 'entity_type',
        title: 'Thực thể',
        minWidth: 160,
        slots: { default: 'entity-cell' },
      },
      {
        field: 'tenant_id',
        title: 'Tenant ID',
        width: 150,
        slots: { default: 'tenant-cell' },
      },
      {
        field: 'actor_id',
        title: 'Tác nhân',
        width: 140,
        slots: { default: 'actor-cell' },
      },
      {
        field: 'ip_address',
        title: 'IP',
        width: 140,
        slots: { default: 'ip-cell' },
      },
      {
        field: 'actions',
        title: 'Chi tiết',
        width: 100,
        align: 'right',
        slots: { default: 'detail-cell' },
      },
    ],
  },
});

function openDetail(log: GlobalAuditLogItem) {
  selectedLog.value = log;
  detailOpen.value = true;
}

function getActionBadgeVariant(
  action: string,
): 'default' | 'destructive' | 'outline' | 'secondary' {
  if (
    action.includes('delete') ||
    action.includes('destroy') ||
    action.includes('remove')
  ) {
    return 'destructive';
  }
  if (
    action.includes('create') ||
    action.includes('insert') ||
    action.includes('add')
  ) {
    return 'default';
  }
  if (action.includes('update') || action.includes('edit')) {
    return 'secondary';
  }
  return 'outline';
}

function refresh() {
  gridApi.reload();
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
          Nhật ký kiểm toán
        </h1>
        <p class="text-xs text-muted-foreground">
          Theo dõi lịch sử truy vết bảo mật, hành vi người dùng và nhật ký tác
          vụ hệ thống
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          class="size-8 shrink-0"
          :title="$t('common.refresh')"
          @click="refresh"
        >
          <RefreshCw class="size-3.5 shrink-0" />
        </Button>
      </div>
    </div>

    <!-- Table View (Desktop) -->
    <div
      class="overflow-hidden rounded-none sm:rounded-xl border-0 sm:border border-border/60 bg-card p-0 sm:p-5 shadow-none sm:shadow-xs space-y-4"
    >
      <Grid class="audit-logs-vxe-grid">
        <template #time-cell="{ row }">
          <span class="font-mono text-xs text-muted-foreground">
            {{ formatDate(row.created_at) }}
          </span>
        </template>

        <template #action-cell="{ row }">
          <Badge
            :variant="getActionBadgeVariant(row.action)"
            class="font-mono text-xs"
          >
            {{ row.action }}
          </Badge>
        </template>

        <template #entity-cell="{ row }">
          <div class="flex items-center gap-1.5 text-xs font-mono">
            <span class="text-foreground">{{ row.entity_type }}</span>
            <span class="text-muted-foreground/70"
              >#{{ row.entity_id.slice(0, 8) }}</span
            >
          </div>
        </template>

        <template #tenant-cell="{ row }">
          <code
            class="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
          >
            {{ row.tenant_id.slice(0, 8) }}...
          </code>
        </template>

        <template #actor-cell="{ row }">
          <div class="flex items-center gap-1 text-xs text-muted-foreground">
            <User class="size-3 text-muted-foreground/70" />
            <span class="font-mono">
              {{ row.actor_id ? row.actor_id.slice(0, 8) : 'Hệ thống' }}
            </span>
          </div>
        </template>

        <template #ip-cell="{ row }">
          <span class="font-mono text-xs text-muted-foreground">
            {{ row.ip_address || '—' }}
          </span>
        </template>

        <template #detail-cell="{ row }">
          <Button
            variant="ghost"
            size="icon"
            class="size-8"
            @click="openDetail(row as GlobalAuditLogItem)"
          >
            <Eye class="size-4" />
          </Button>
        </template>
      </Grid>
    </div>

    <!-- Detail Dialog -->
    <Dialog v-model:open="detailOpen">
      <DialogContent class="max-w-[calc(100vw-2rem)] sm:max-w-xl">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2 text-base">
            <ShieldCheck class="size-4 text-primary" />
            Chi tiết sự kiện kiểm toán #{{ selectedLog?.id }}
          </DialogTitle>
          <DialogDescription class="font-mono text-xs">
            Hành động: {{ selectedLog?.action }} | Tenant:
            {{ selectedLog?.tenant_id }}
          </DialogDescription>
        </DialogHeader>

        <div
          v-if="selectedLog"
          class="space-y-3 max-h-[60vh] overflow-y-auto text-xs"
        >
          <div>
            <h4 class="font-semibold text-foreground mb-1">Dữ liệu mới</h4>
            <pre
              class="rounded-lg bg-muted p-3 font-mono overflow-x-auto text-[11px]"
              >{{
                JSON.stringify(selectedLog.new_values, null, 2) || 'null'
              }}</pre>
          </div>

          <div>
            <h4 class="font-semibold text-foreground mb-1">Dữ liệu cũ</h4>
            <pre
              class="rounded-lg bg-muted p-3 font-mono overflow-x-auto text-[11px]"
              >{{
                JSON.stringify(selectedLog.old_values, null, 2) || 'null'
              }}</pre>
          </div>

          <div
            class="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-2 border-t border-border/40"
          >
            <div>
              <strong>Actor ID:</strong>
              {{ selectedLog.actor_id || 'Hệ thống' }}
            </div>
            <div>
              <strong>IP address:</strong> {{ selectedLog.ip_address || '—' }}
            </div>
            <div class="col-span-2 truncate">
              <strong>User agent:</strong> {{ selectedLog.user_agent || '—' }}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
