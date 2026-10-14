<script lang="ts" setup>
import type { AutomaWorkflowItem } from '#/api';

import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

import { GitBranch, RefreshCw } from '@lucide/vue';
import { Badge, Button } from '@tuquet/vue-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getWorkflowsApi } from '#/api';
import { useDateFormat } from '#/composables';
import { $t } from '#/locales';

defineOptions({ name: 'AutomationWorkflows' });

const route = useRoute();
const { formatDate } = useDateFormat();

const allWorkflows = ref<AutomaWorkflowItem[]>([]);

const publishedCount = computed(
  () => allWorkflows.value.filter((w) => w.status === 'published').length,
);
const draftCount = computed(
  () => allWorkflows.value.filter((w) => w.status === 'draft').length,
);
const archivedCount = computed(
  () => allWorkflows.value.filter((w) => w.status === 'archived').length,
);

const [Grid, gridApi] = useVbenVxeGrid<AutomaWorkflowItem>({
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
            { label: 'Đã xuất bản', value: 'published' },
            { label: 'Bản nháp', value: 'draft' },
            { label: 'Lưu trữ', value: 'archived' },
          ],
        },
      },
      {
        component: 'Input',
        fieldName: 'keyword',
        label: 'Tìm kiếm',
        componentProps: {
          placeholder: 'Tên hoặc mô tả quy trình...',
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
          const data = await getWorkflowsApi({ tenantId });
          allWorkflows.value = data;

          let filtered = data;
          if (formValues?.status && formValues.status !== 'all') {
            filtered = filtered.filter((w) => w.status === formValues.status);
          }

          if (formValues?.keyword) {
            const kw = String(formValues.keyword).toLowerCase().trim();
            filtered = filtered.filter(
              (w) =>
                w.name.toLowerCase().includes(kw) ||
                (w.description && w.description.toLowerCase().includes(kw)),
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
        title: 'Tên quy trình',
        minWidth: 260,
        slots: { default: 'name-cell' },
      },
      {
        field: 'version',
        title: 'Phiên bản',
        width: 140,
        slots: { default: 'version-cell' },
      },
      {
        field: 'status',
        title: 'Trạng thái',
        width: 150,
        slots: { default: 'status-cell' },
      },
      {
        field: 'created_at',
        title: 'Ngày tạo',
        minWidth: 150,
        slots: { default: 'created-cell' },
      },
      {
        field: 'updated_at',
        title: 'Cập nhật cuối',
        minWidth: 150,
        align: 'right',
        slots: { default: 'updated-cell' },
      },
    ],
  },
});

function refresh() {
  gridApi.reload();
}
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
          Quy trình
        </h1>
        <p class="text-xs text-muted-foreground">
          Quản lý quy trình và điều phối luồng tự động hóa
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

    <!-- Main Container -->
    <div
      class="overflow-hidden rounded-none sm:rounded-xl border-0 sm:border border-border/60 bg-card p-0 sm:p-5 shadow-none sm:shadow-xs space-y-4"
    >
      <!-- Stats Bar -->
      <div
        class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4 text-xs"
      >
        <div class="flex items-center gap-2">
          <GitBranch class="size-4 shrink-0 text-muted-foreground" />
          <span class="text-sm font-semibold text-foreground">
            Danh sách quy trình
          </span>
          <span class="text-muted-foreground">
            · {{ allWorkflows.length }} tổng số
          </span>
        </div>

        <div class="flex items-center gap-3 text-muted-foreground">
          <span>{{ publishedCount }} đã xuất bản</span>
          <span>&bull;</span>
          <span>{{ draftCount }} bản nháp</span>
          <span>&bull;</span>
          <span>{{ archivedCount }} lưu trữ</span>
        </div>
      </div>

      <!-- Table Grid -->
      <Grid class="workflow-vxe-grid">
        <template #name-cell="{ row }">
          <div class="flex items-center gap-2.5 py-1">
            <div
              class="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground"
            >
              <GitBranch class="size-4" />
            </div>
            <div class="text-left">
              <div class="font-medium text-foreground">
                {{ row.name }}
              </div>
              <div class="text-xs text-muted-foreground line-clamp-1 max-w-md">
                {{ row.description || 'Không có mô tả chi tiết' }}
              </div>
            </div>
          </div>
        </template>

        <template #version-cell="{ row }">
          <Badge variant="outline" class="font-mono text-xs">
            v{{ row.version }}
          </Badge>
        </template>

        <template #status-cell="{ row }">
          <Badge variant="outline" class="text-xs font-normal">
            <span
              class="mr-1.5 size-1.5 rounded-full"
              :class="{
                'bg-success': row.status === 'published',
                'bg-warning': row.status === 'draft',
                'bg-muted-foreground': row.status === 'archived',
              }"
            ></span>
            {{
              row.status === 'published'
                ? 'Đã xuất bản'
                : row.status === 'draft'
                  ? 'Bản nháp'
                  : 'Lưu trữ'
            }}
          </Badge>
        </template>

        <template #created-cell="{ row }">
          <span class="text-xs text-muted-foreground">
            {{ formatDate(row.created_at) }}
          </span>
        </template>

        <template #updated-cell="{ row }">
          <span class="text-xs text-muted-foreground">
            {{ formatDate(row.updated_at) }}
          </span>
        </template>

        <template #empty>
          <div
            class="flex flex-col items-center justify-center p-8 text-center text-muted-foreground"
          >
            <GitBranch
              class="size-10 stroke-[1.5] text-muted-foreground/60 mb-3"
            />
            <p class="text-sm font-medium text-foreground">
              Chưa có quy trình nào
            </p>
            <p class="text-xs text-muted-foreground max-w-sm mt-1">
              Tạo mới hoặc đồng bộ quy trình từ Automa Studio.
            </p>
          </div>
        </template>
      </Grid>
    </div>
  </div>
</template>
