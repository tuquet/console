<script lang="ts" setup>
import type { GlobalAuditLogItem } from '#/api';

import { computed, ref, watch } from 'vue';

import { usePreferences } from '@vben/preferences';

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
const { isMobile } = usePreferences();

const selectedLog = ref<GlobalAuditLogItem | null>(null);
const detailOpen = ref(false);
const totalLogs = ref(0);

function getColumns() {
  return [
    {
      field: 'created_at',
      title: $t('page.system_view.audit_col_time'),
      width: isMobile.value ? 125 : 170,
      slots: { default: 'time-cell' },
    },
    {
      field: 'action',
      title: $t('page.system_view.audit_col_action'),
      minWidth: isMobile.value ? 150 : 160,
      slots: { default: 'action-cell' },
    },
    {
      field: 'entity_type',
      title: $t('page.system_view.audit_col_entity'),
      minWidth: 160,
      visible: !isMobile.value,
      slots: { default: 'entity-cell' },
    },
    {
      field: 'tenant_id',
      title: $t('page.system_view.audit_col_tenant_id'),
      width: 150,
      visible: !isMobile.value,
      slots: { default: 'tenant-cell' },
    },
    {
      field: 'actor_id',
      title: $t('page.system_view.audit_col_actor'),
      width: 140,
      visible: !isMobile.value,
      slots: { default: 'actor-cell' },
    },
    {
      field: 'ip_address',
      title: $t('page.system_view.audit_col_ip'),
      width: 140,
      visible: !isMobile.value,
      slots: { default: 'ip-cell' },
    },
    {
      field: 'actions',
      title: $t('common.detail'),
      width: isMobile.value ? 56 : 100,
      align: 'right' as const,
      slots: { default: 'detail-cell' },
    },
  ];
}

const [Grid, gridApi] = useVbenVxeGrid<GlobalAuditLogItem>({
  detailSheetOptions: {
    forwardActionSlot: false,
    resource: 'public.audit_logs',
    subtitleField: 'entity_type',
    titleField: 'action',
  },
  formOptions: {
    commonConfig: {
      componentProps: {
        class: 'w-full',
      },
      hideLabel: isMobile.value,
    },
    schema: [
      {
        component: 'Input',
        fieldName: 'action',
        label: () => $t('page.system_view.audit_col_action'),
        componentProps: () => ({
          placeholder: $t('page.system_view.audit_action_placeholder'),
        }),
      },
      {
        component: 'Input',
        fieldName: 'tenantId',
        label: () => $t('page.system_view.audit_filter_tenant_id'),
        componentProps: () => ({
          placeholder: $t('page.system_view.audit_tenant_placeholder'),
        }),
      },
    ],
    layout: 'vertical',
    showCollapseButton: false,
    submitButtonOptions: {
      content: computed(() => $t('common.filter')),
    },
    resetButtonOptions: {
      content: computed(() => $t('common.reset')),
    },
    actionWrapperClass:
      'col-span-2 sm:col-span-2 lg:col-span-2 flex items-center justify-end gap-2 pt-1 sm:pt-6',
    wrapperClass: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3',
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
          totalLogs.value = data.length;

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
    columns: getColumns(),
  },
});

watch([() => $t('page.system_view.audit_col_time'), isMobile], () => {
  gridApi.setGridOptions({ columns: getColumns() });
  gridApi.formApi?.setState({
    commonConfig: {
      componentProps: {
        class: 'w-full',
      },
      hideLabel: isMobile.value,
    },
  });
});

function openDetail(log: GlobalAuditLogItem) {
  gridApi.openDetailSheet(log);
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
  <div class="space-y-3 p-3 sm:space-y-4 sm:p-5">
    <!-- Header -->
    <div class="flex items-center justify-between gap-2">
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <h1
            class="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl"
          >
            {{ $t('page.system.auditLogs') }}
          </h1>
          <Badge variant="secondary" class="font-mono text-xs font-normal">
            {{ totalLogs }}
          </Badge>
        </div>
        <p class="hidden text-xs text-muted-foreground sm:block">
          {{ $t('page.system.auditLogs_desc') }}
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-2">
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

    <!-- Table View -->
    <div
      class="overflow-hidden rounded-xl border border-border/60 bg-card p-3 sm:p-5 shadow-xs"
    >
      <Grid class="audit-logs-vxe-grid">
        <template #time-cell="{ row }">
          <span class="font-mono text-xs text-muted-foreground">
            {{ formatDate(row.created_at) }}
          </span>
        </template>

        <template #action-cell="{ row }">
          <div class="flex min-w-0 flex-col items-start gap-0.5 py-0.5">
            <Badge
              :variant="getActionBadgeVariant(row.action)"
              class="font-mono text-xs"
            >
              {{ row.action }}
            </Badge>
            <span
              class="truncate font-mono text-2xs text-muted-foreground sm:hidden"
            >
              {{ row.entity_type }} #{{ row.entity_id.slice(0, 6) }}
            </span>
          </div>
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
            class="rounded bg-muted px-1.5 py-0.5 font-mono text-2xs text-muted-foreground"
          >
            {{ row.tenant_id.slice(0, 8) }}...
          </code>
        </template>

        <template #actor-cell="{ row }">
          <div class="flex items-center gap-1 text-xs text-muted-foreground">
            <User class="size-3 text-muted-foreground/70" />
            <span class="font-mono">
              {{
                row.actor_id
                  ? row.actor_id.slice(0, 8)
                  : $t('page.system_view.audit_actor_system')
              }}
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
            {{ $t('page.system_view.audit_dialog_title', [selectedLog?.id]) }}
          </DialogTitle>
          <DialogDescription class="font-mono text-xs">
            {{
              $t('page.system_view.audit_dialog_desc', [
                selectedLog?.action,
                selectedLog?.tenant_id,
              ])
            }}
          </DialogDescription>
        </DialogHeader>

        <div
          v-if="selectedLog"
          class="space-y-3 max-h-[60vh] overflow-y-auto text-xs"
        >
          <div>
            <h4 class="font-semibold text-foreground mb-1">
              {{ $t('page.system_view.audit_new_values') }}
            </h4>
            <pre
              class="rounded-lg bg-muted p-3 font-mono overflow-x-auto text-2xs"
              >{{
                JSON.stringify(selectedLog.new_values, null, 2) || 'null'
              }}</pre>
          </div>

          <div>
            <h4 class="font-semibold text-foreground mb-1">
              {{ $t('page.system_view.audit_old_values') }}
            </h4>
            <pre
              class="rounded-lg bg-muted p-3 font-mono overflow-x-auto text-2xs"
              >{{
                JSON.stringify(selectedLog.old_values, null, 2) || 'null'
              }}</pre>
          </div>

          <div
            class="grid grid-cols-2 gap-2 text-2xs text-muted-foreground pt-2 border-t border-border/40"
          >
            <div>
              <strong>{{ $t('page.system_view.audit_actor_id_label') }}</strong>
              {{
                selectedLog.actor_id ||
                $t('page.system_view.audit_actor_system')
              }}
            </div>
            <div>
              <strong>{{ $t('page.system_view.audit_ip_label') }}</strong>
              {{ selectedLog.ip_address || '—' }}
            </div>
            <div class="col-span-2 truncate">
              <strong>{{ $t('page.system_view.audit_ua_label') }}</strong>
              {{ selectedLog.user_agent || '—' }}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
