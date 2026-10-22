<script lang="ts" setup>
import type { Workflow } from '#/api';

import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { usePreferences } from '@tuquet/preferences';

import { Badge, Button } from '@tuquet-core/shadcn-ui';

import { GitBranch, Plus, RefreshCw } from '@lucide/vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { listWorkflows } from '#/api';
import { useDateFormat } from '#/composables';
import {
  buildEnumFilterOptions,
  FILTER_ALL,
  getStatusToneMeta,
  WORKFLOW_STATUS,
  WORKFLOW_STATUS_META,
} from '#/constants';
import { $t } from '#/locales';

defineOptions({ name: 'AutomationWorkflows' });

const route = useRoute();
const { isMobile } = usePreferences();
const { formatDate } = useDateFormat();

const allWorkflows = ref<Workflow[]>([]);

function getStatusDotClass(status: string): string {
  return getStatusToneMeta(status, WORKFLOW_STATUS_META).dotClass;
}

function getStatusLabel(status: string): string {
  const meta = getStatusToneMeta(status, WORKFLOW_STATUS_META);
  return meta.labelKey ? $t(meta.labelKey) : (meta.fallbackLabel ?? status);
}

function getColumns() {
  return [
    {
      field: 'name',
      title: $t('page.workflows_view.col_name'),
      minWidth: 260,
      slots: { default: 'name-cell' },
    },
    {
      field: 'version',
      title: $t('page.workflows_view.col_version'),
      minWidth: 130,
      slots: { default: 'version-cell' },
    },
    {
      field: 'status',
      title: $t('page.workflows_view.col_status'),
      minWidth: 145,
      slots: { default: 'status-cell' },
    },
    {
      field: 'created_at',
      title: $t('page.workflows_view.col_created_at'),
      minWidth: 145,
      slots: { default: 'created-cell' },
    },
    {
      field: 'updated_at',
      title: $t('page.workflows_view.col_updated_at'),
      minWidth: 145,
      slots: { default: 'updated-cell' },
    },
  ];
}

const [Grid, gridApi] = useVbenVxeGrid<Workflow>({
  separator: false,
  gridClass: 'p-0',
  detailSheetOptions: {
    resource: 'automation.workflows',
    subtitleField: 'version',
    titleField: 'name',
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
        component: 'Select',
        fieldName: 'status',
        formItemClass: 'col-span-2 sm:col-span-1',
        label: () => $t('page.workflows_view.filter_status'),
        defaultValue: (route.query.status as string) || FILTER_ALL,
        componentProps: () => ({
          placeholder: $t('page.workflows_view.status_all'),
          options: buildEnumFilterOptions(WORKFLOW_STATUS_META, $t, {
            allLabelKey: 'page.workflows_view.status_all',
            order: [
              WORKFLOW_STATUS.PUBLISHED,
              WORKFLOW_STATUS.DRAFT,
              WORKFLOW_STATUS.ARCHIVED,
            ],
          }),
        }),
      },
      {
        component: 'Input',
        fieldName: 'keyword',
        formItemClass: 'col-span-2 sm:col-span-1',
        label: () => $t('page.workflows_view.filter_search'),
        componentProps: () => ({
          placeholder: $t('page.workflows_view.search_placeholder'),
          clearable: true,
        }),
      },
    ],
    layout: 'vertical',
    showCollapseButton: false,
    submitOnChange: true,
    submitOnEnter: true,
    submitButtonOptions: {
      content: computed(() => $t('common.filter')),
    },
    resetButtonOptions: {
      content: computed(() => $t('common.reset')),
    },
    actionWrapperClass:
      'hidden sm:flex sm:col-span-2 lg:col-span-2 items-center justify-end gap-2 pt-0.5 sm:pt-6',
    wrapperClass: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3',
  },
  gridOptions: {
    border: false,
    round: true,
    showOverflow: true,
    pagerConfig: {
      autoHidden: true,
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
          const data = await listWorkflows({ tenantId });
          allWorkflows.value = data;

          let filtered = data;
          if (formValues?.status && formValues.status !== FILTER_ALL) {
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
    columns: getColumns(),
  },
});

watch([() => $t('page.workflows_view.col_name'), isMobile], () => {
  gridApi.setGridOptions({ columns: getColumns() });
  gridApi.formApi?.setState({
    commonConfig: {
      componentProps: { class: 'w-full' },
      hideLabel: isMobile.value,
    },
  });
});

function refresh() {
  gridApi.reload();
}
</script>

<template>
  <div class="space-y-3 p-3 sm:space-y-4 sm:p-5">
    <!-- Compact Single-Row Header -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <h1
            class="truncate text-base font-semibold tracking-tight text-foreground sm:text-xl"
          >
            {{ $t('page.automation.workflows') }}
          </h1>
          <Badge variant="secondary" class="shrink-0 text-2xs">
            {{ allWorkflows.length }}
          </Badge>
        </div>
        <p class="hidden text-xs text-muted-foreground sm:block">
          {{ $t('page.automation.workflows_desc') }}
        </p>
      </div>

      <div class="flex shrink-0 flex-wrap items-center gap-1.5 sm:gap-2">
        <Button
          variant="outline"
          size="sm"
          class="h-8 gap-1.5 px-2.5 text-xs"
          :title="$t('common.refresh')"
          @click="refresh"
        >
          <RefreshCw class="size-3.5 shrink-0" />
          <span class="hidden sm:inline">{{ $t('common.refresh') }}</span>
        </Button>
        <Button
          size="sm"
          class="h-8 gap-1.5 px-2.5 text-xs font-medium sm:px-3"
          @click="() => gridApi.openCreateSheet()"
        >
          <Plus class="size-3.5 shrink-0" />
          <span>{{ $t('common.createRecord') }}</span>
        </Button>
      </div>
    </div>

    <!-- Main Container -->
    <div
      class="overflow-hidden rounded-xl border border-border/60 bg-card p-2.5 shadow-xs sm:p-4"
    >
      <!-- Table Grid -->
      <Grid class="workflow-vxe-grid">
        <template #name-cell="{ row }">
          <div class="flex items-center gap-2.5 py-1">
            <div
              class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground"
            >
              <GitBranch class="size-4" />
            </div>
            <div class="min-w-0 flex-1 text-left">
              <div class="truncate font-medium text-foreground">
                {{ row.name }}
              </div>
              <div class="line-clamp-1 max-w-md text-xs text-muted-foreground">
                {{
                  row.description || $t('page.workflows_view.no_description')
                }}
              </div>
            </div>
          </div>
        </template>

        <template #version-cell="{ row }">
          <Badge variant="outline" class="text-xs"> v{{ row.version }} </Badge>
        </template>

        <template #status-cell="{ row }">
          <Badge variant="outline" class="text-xs font-normal">
            <span
              class="mr-1.5 size-1.5 rounded-full"
              :class="getStatusDotClass(row.status)"
            ></span>
            {{ getStatusLabel(row.status) }}
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
            class="flex flex-col items-center justify-center px-4 py-8 text-center text-muted-foreground"
          >
            <GitBranch
              class="mb-3 size-10 stroke-[1.5] text-muted-foreground/60"
            />
            <p class="text-sm font-medium text-foreground">
              {{ $t('page.workflows_view.empty_title') }}
            </p>
            <p class="mt-1 max-w-md text-xs text-muted-foreground">
              {{ $t('page.workflows_view.empty_desc') }}
            </p>
          </div>
        </template>
      </Grid>
    </div>
  </div>
</template>
