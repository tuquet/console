<script lang="ts" setup>
import type { AutomaCampaignRunItem } from '#/api';

import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Eye, Laptop, PlayCircle, RefreshCw } from '@lucide/vue';
import { Badge, Button } from '@tuquet/vue-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { calculateProgressPercentage, getCampaignRunsApi } from '#/api';
import { useDateFormat } from '#/composables';
import { $t } from '#/locales';

defineOptions({ name: 'AutomationRuns' });

const route = useRoute();
const router = useRouter();
const { formatDate } = useDateFormat();

const allRuns = ref<AutomaCampaignRunItem[]>([]);

function handleViewDetail(id: string) {
  router.push(`/automation/runs/${id}`);
}

const [Grid, gridApi] = useVbenVxeGrid<AutomaCampaignRunItem>({
  formOptions: {
    schema: [
      {
        component: 'Select',
        fieldName: 'status',
        label: 'Trạng thái',
        defaultValue: (route.query.status as string) || 'all',
        componentProps: {
          placeholder: 'Tất cả trạng thái',
          options: [
            { label: 'Tất cả trạng thái', value: 'all' },
            { label: 'Đang chạy', value: 'running' },
            { label: 'Hoàn thành', value: 'completed' },
            { label: 'Thất bại', value: 'failed' },
            { label: 'Đang chờ', value: 'pending' },
            { label: 'Đã hủy', value: 'cancelled' },
          ],
        },
      },
      {
        component: 'Input',
        fieldName: 'search',
        label: 'Tìm kiếm',
        componentProps: {
          placeholder: 'Tên phiên chạy hoặc kịch bản...',
          clearable: true,
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
          const tenantId = (route.query.tenant as string) || undefined;
          const workflowId = (route.query.workflow as string) || undefined;
          const data = await getCampaignRunsApi({ tenantId, workflowId });
          allRuns.value = data;

          let filtered = data;
          if (formValues?.status && formValues.status !== 'all') {
            filtered =
              formValues.status === 'pending'
                ? filtered.filter(
                    (r) => r.status === 'pending' || r.status === 'queued',
                  )
                : filtered.filter((r) => r.status === formValues.status);
          }

          if (formValues?.search) {
            const kw = String(formValues.search).toLowerCase().trim();
            filtered = filtered.filter(
              (r) =>
                r.name.toLowerCase().includes(kw) ||
                (r.workflow && r.workflow.name.toLowerCase().includes(kw)),
            );
          }

          const currentPage = page?.currentPage || 1;
          const pageSize = page?.pageSize || 15;
          const start = (currentPage - 1) * pageSize;
          const end = start + pageSize;

          return {
            items: filtered.slice(start, end),
            total: filtered.length,
          };
        },
      },
    },
    columns: [
      {
        field: 'name',
        title: 'Phiên chạy & kịch bản',
        minWidth: 260,
        slots: { default: 'name-cell' },
      },
      {
        field: 'runner',
        title: 'Thiết bị thực thi',
        width: 170,
        slots: { default: 'runner-cell' },
      },
      {
        field: 'progress',
        title: 'Tiến độ thực thi',
        width: 190,
        slots: { default: 'progress-cell' },
      },
      {
        field: 'status',
        title: 'Trạng thái',
        width: 140,
        slots: { default: 'status-cell' },
      },
      {
        field: 'created_at',
        title: 'Thời gian tạo',
        width: 160,
        slots: { default: 'created-cell' },
      },
      {
        field: 'actions',
        title: 'Thao tác',
        width: 110,
        align: 'right',
        slots: { default: 'actions-cell' },
      },
    ],
  },
});

watch(
  () => [route.query.tenant, route.query.workflow],
  () => {
    gridApi.reload();
  },
);
</script>

<template>
  <div class="space-y-4 p-4 sm:space-y-5 sm:p-5">
    <!-- Top Header -->
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex flex-col gap-1">
        <h1
          class="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
        >
          {{ $t('page.automation.runs') }}
        </h1>
        <p class="text-xs text-muted-foreground">
          {{ $t('page.automation.runs_desc') }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          class="gap-1.5"
          :title="$t('common.refresh')"
          @click="() => gridApi.reload()"
        >
          <RefreshCw class="size-3.5" />
          {{ $t('common.refresh') }}
        </Button>
      </div>
    </div>

    <!-- Main Container -->
    <div
      class="overflow-hidden rounded-none sm:rounded-xl border-0 sm:border border-border/60 bg-card p-0 sm:p-5 shadow-none sm:shadow-sm space-y-4"
    >
      <div
        class="flex items-center gap-2 border-b border-border/40 pb-3 px-3 sm:px-0 pt-2 sm:pt-0"
      >
        <PlayCircle class="size-4 shrink-0 text-muted-foreground" />
        <span class="text-sm font-semibold text-foreground">
          Danh sách phiên chạy
        </span>
        <span class="text-xs text-muted-foreground">
          · {{ allRuns.length }} tổng số
        </span>
      </div>

      <Grid class="runs-vxe-grid">
        <template #name-cell="{ row }">
          <div class="flex items-center gap-2.5">
            <div
              class="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground shrink-0"
            >
              <PlayCircle class="size-4" />
            </div>
            <div class="min-w-0">
              <div class="font-medium text-foreground truncate">
                {{ row.name }}
              </div>
              <div class="text-xs text-muted-foreground truncate">
                {{ row.workflow ? row.workflow.name : 'Chưa gắn quy trình' }}
              </div>
            </div>
          </div>
        </template>

        <template #runner-cell="{ row }">
          <div
            v-if="row.runner"
            class="inline-flex items-center gap-1.5 text-xs text-foreground font-medium"
          >
            <Laptop class="size-3.5 text-muted-foreground shrink-0" />
            <span>{{ row.runner.name }}</span>
          </div>
          <span v-else class="text-xs text-muted-foreground">
            Điều phối tự động
          </span>
        </template>

        <template #progress-cell="{ row }">
          <div class="w-full max-w-[170px] space-y-1">
            <div class="flex items-center justify-between text-xs font-mono">
              <span class="text-foreground">
                {{ row.completed_tasks }} / {{ row.total_tasks }} tasks
              </span>
              <span class="text-muted-foreground font-semibold">
                {{
                  calculateProgressPercentage(
                    row.completed_tasks,
                    row.total_tasks,
                  )
                }}%
              </span>
            </div>
            <div class="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="{
                  'bg-primary': row.status === 'running',
                  'bg-success': row.status === 'completed',
                  'bg-destructive': row.status === 'failed',
                  'bg-muted-foreground':
                    row.status === 'cancelled' ||
                    row.status === 'pending' ||
                    row.status === 'queued',
                }"
                :style="{
                  width: `${calculateProgressPercentage(row.completed_tasks, row.total_tasks)}%`,
                }"
              ></div>
            </div>
          </div>
        </template>

        <template #status-cell="{ row }">
          <Badge variant="outline" class="text-xs font-normal">
            <span
              class="mr-1.5 size-1.5 rounded-full"
              :class="{
                'bg-primary animate-pulse': row.status === 'running',
                'bg-success': row.status === 'completed',
                'bg-destructive': row.status === 'failed',
                'bg-muted-foreground': row.status === 'cancelled',
                'bg-warning animate-pulse':
                  row.status === 'pending' || row.status === 'queued',
              }"
            ></span>
            {{
              row.status === 'running'
                ? 'Đang chạy'
                : row.status === 'completed'
                  ? 'Hoàn thành'
                  : row.status === 'failed'
                    ? 'Thất bại'
                    : row.status === 'cancelled'
                      ? 'Đã hủy'
                      : 'Đang chờ'
            }}
          </Badge>
        </template>

        <template #created-cell="{ row }">
          <span class="text-xs text-muted-foreground">
            {{ formatDate(row.created_at) }}
          </span>
        </template>

        <template #actions-cell="{ row }">
          <Button
            variant="outline"
            size="sm"
            class="h-7 text-xs flex items-center gap-1 inline-flex"
            @click="handleViewDetail(row.id)"
          >
            <Eye class="size-3 shrink-0" />
            <span>Chi tiết</span>
          </Button>
        </template>

        <template #empty>
          <div
            class="flex flex-col items-center justify-center p-8 text-center text-muted-foreground"
          >
            <PlayCircle
              class="size-10 stroke-[1.5] text-muted-foreground/60 mb-3"
            />
            <p class="text-sm font-medium text-foreground">
              Chưa có phiên chạy nào
            </p>
            <p class="text-xs text-muted-foreground max-w-sm mt-1">
              Các phiên chạy workflow được phân phối và thực thi tự động qua
              runner nodes.
            </p>
          </div>
        </template>
      </Grid>
    </div>
  </div>
</template>
