<script lang="ts" setup>
import type { AutomaCampaignRunItem } from '#/api';

import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { usePreferences } from '@vben/preferences';

import { Eye, Laptop, PlayCircle, RefreshCw } from '@lucide/vue';
import { Badge, Button } from '@tuquet/vue-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { calculateProgressPercentage, getCampaignRunsApi } from '#/api';
import { useDateFormat } from '#/composables';
import {
  buildEnumFilterOptions,
  CAMPAIGN_STATUS,
  CAMPAIGN_STATUS_META,
  FILTER_ALL,
  getStatusToneMeta,
} from '#/constants';
import { $t } from '#/locales';

defineOptions({ name: 'AutomationRuns' });

const route = useRoute();
const router = useRouter();
const { isMobile } = usePreferences();
const { formatDate } = useDateFormat();

const allRuns = ref<AutomaCampaignRunItem[]>([]);

function handleViewDetail(id: string) {
  router.push(`/automation/runs/${id}`);
}

function getRunStatusDotClass(status: string): string {
  const meta = getStatusToneMeta(status, CAMPAIGN_STATUS_META);
  return `${meta.dotClass}${meta.pulse ? ' animate-pulse' : ''}`;
}

function getRunStatusBarClass(status: string): string {
  const meta = getStatusToneMeta(status, CAMPAIGN_STATUS_META);
  if (meta.tone === 'info') return 'bg-primary';
  if (meta.tone === 'success') return 'bg-success';
  if (meta.tone === 'danger') return 'bg-destructive';
  return 'bg-muted-foreground';
}

function getRunStatusLabel(status: string): string {
  const meta = getStatusToneMeta(status, CAMPAIGN_STATUS_META);
  return meta.labelKey ? $t(meta.labelKey) : (meta.fallbackLabel ?? status);
}

function getColumns() {
  const mobile = isMobile.value;
  return [
    {
      field: 'name',
      title: $t('page.runs_view.col_name'),
      minWidth: mobile ? 200 : 260,
      slots: { default: 'name-cell' },
    },
    {
      field: 'runner',
      title: $t('page.runs_view.col_runner'),
      width: 170,
      visible: !mobile,
      slots: { default: 'runner-cell' },
    },
    {
      field: 'progress',
      title: $t('page.runs_view.col_progress'),
      width: 190,
      visible: !mobile,
      slots: { default: 'progress-cell' },
    },
    {
      field: 'status',
      title: $t('page.runs_view.col_status'),
      width: 140,
      visible: !mobile,
      slots: { default: 'status-cell' },
    },
    {
      field: 'created_at',
      title: $t('page.runs_view.col_created_at'),
      width: 160,
      visible: !mobile,
      slots: { default: 'created-cell' },
    },
    {
      field: 'actions',
      title: $t('page.runs_view.col_actions'),
      width: mobile ? 56 : 110,
      align: 'right' as const,
      showOverflow: false,
      slots: { default: 'actions-cell' },
    },
  ];
}

const [Grid, gridApi] = useVbenVxeGrid<AutomaCampaignRunItem>({
  separator: false,
  gridClass: 'p-0',
  detailSheetOptions: {
    resource: 'automa.campaign_runs',
    subtitleField: 'status',
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
        label: () => $t('page.runs_view.filter_status'),
        defaultValue: (route.query.status as string) || FILTER_ALL,
        componentProps: () => ({
          placeholder: $t('page.runs_view.status_all'),
          options: buildEnumFilterOptions(CAMPAIGN_STATUS_META, $t, {
            allLabelKey: 'page.runs_view.status_all',
            order: [
              CAMPAIGN_STATUS.RUNNING,
              CAMPAIGN_STATUS.COMPLETED,
              CAMPAIGN_STATUS.FAILED,
              CAMPAIGN_STATUS.PENDING,
              CAMPAIGN_STATUS.CANCELLED,
            ],
          }),
        }),
      },
      {
        component: 'Input',
        fieldName: 'search',
        label: () => $t('page.runs_view.filter_search'),
        componentProps: () => ({
          placeholder: $t('page.runs_view.search_placeholder'),
          clearable: true,
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
      'col-span-2 lg:col-span-2 flex items-center justify-end gap-2 pt-0.5 sm:pt-6',
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
          const workflowId = (route.query.workflow as string) || undefined;
          const data = await getCampaignRunsApi({ tenantId, workflowId });
          allRuns.value = data;

          let filtered = data;
          if (formValues?.status && formValues.status !== FILTER_ALL) {
            filtered =
              formValues.status === CAMPAIGN_STATUS.PENDING
                ? filtered.filter(
                    (r) =>
                      r.status === CAMPAIGN_STATUS.PENDING ||
                      r.status === CAMPAIGN_STATUS.QUEUED,
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
    columns: getColumns(),
  },
});

watch([() => $t('page.runs_view.col_name'), isMobile], () => {
  gridApi.setGridOptions({ columns: getColumns() });
  gridApi.formApi?.setState({
    commonConfig: {
      componentProps: { class: 'w-full' },
      hideLabel: isMobile.value,
    },
  });
});

watch(
  () => [route.query.tenant, route.query.workflow],
  () => {
    gridApi.reload();
  },
);
</script>

<template>
  <div class="space-y-3 p-3 sm:space-y-4 sm:p-5">
    <!-- Compact Single-Row Header -->
    <div class="flex items-center justify-between gap-2">
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <h1
            class="truncate text-base font-semibold tracking-tight text-foreground sm:text-xl"
          >
            {{ $t('page.automation.runs') }}
          </h1>
          <Badge variant="secondary" class="shrink-0 text-2xs">
            {{ allRuns.length }}
          </Badge>
        </div>
        <p class="hidden text-xs text-muted-foreground sm:block">
          {{ $t('page.automation.runs_desc') }}
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <Button
          variant="outline"
          size="sm"
          class="h-8 gap-1.5 px-2.5 text-xs"
          :title="$t('common.refresh')"
          @click="() => gridApi.reload()"
        >
          <RefreshCw class="size-3.5" />
          <span class="hidden sm:inline">{{ $t('common.refresh') }}</span>
        </Button>
      </div>
    </div>

    <!-- Main Container -->
    <div
      class="overflow-hidden rounded-xl border border-border/60 bg-card p-2.5 shadow-xs sm:p-4"
    >
      <Grid class="runs-vxe-grid">
        <template #name-cell="{ row }">
          <div
            class="flex items-start gap-2.5 py-1 sm:items-center"
            :class="{ 'cursor-pointer': isMobile }"
            @click="isMobile && handleViewDetail(row.id)"
          >
            <div
              class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground sm:mt-0"
            >
              <PlayCircle class="size-4" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="truncate font-medium text-foreground">
                {{ row.name }}
              </div>
              <div class="truncate text-xs text-muted-foreground">
                {{
                  row.workflow
                    ? row.workflow.name
                    : $t('page.runs_view.unassigned_workflow')
                }}
              </div>

              <!-- Mobile-only stacked status, runner & mini progress bar -->
              <div v-if="isMobile" class="mt-1.5 space-y-1.5">
                <div class="flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant="outline"
                    class="px-1.5 py-0 text-2xs font-normal"
                  >
                    <span
                      class="mr-1 size-1.5 rounded-full"
                      :class="getRunStatusDotClass(row.status)"
                    ></span>
                    {{ getRunStatusLabel(row.status) }}
                  </Badge>
                  <span
                    class="inline-flex items-center gap-1 truncate text-2xs text-muted-foreground"
                  >
                    <Laptop class="size-3 shrink-0" />
                    <span class="truncate">
                      {{
                        row.runner
                          ? row.runner.name
                          : $t('page.runs_view.auto_dispatch')
                      }}
                    </span>
                  </span>
                </div>

                <div class="flex items-center gap-2">
                  <div
                    class="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      class="h-full rounded-full transition-all"
                      :class="getRunStatusBarClass(row.status)"
                      :style="{
                        width: `${calculateProgressPercentage(row.completed_tasks, row.total_tasks)}%`,
                      }"
                    ></div>
                  </div>
                  <span class="shrink-0 text-2xs text-muted-foreground">
                    {{ row.completed_tasks }}/{{ row.total_tasks }} ({{
                      calculateProgressPercentage(
                        row.completed_tasks,
                        row.total_tasks,
                      )
                    }}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template #runner-cell="{ row }">
          <div
            v-if="row.runner"
            class="inline-flex items-center gap-1.5 text-xs font-medium text-foreground"
          >
            <Laptop class="size-3.5 shrink-0 text-muted-foreground" />
            <span>{{ row.runner.name }}</span>
          </div>
          <span v-else class="text-xs text-muted-foreground">
            {{ $t('page.runs_view.auto_dispatch') }}
          </span>
        </template>

        <template #progress-cell="{ row }">
          <div class="w-full max-w-[170px] space-y-1">
            <div class="flex items-center justify-between text-xs">
              <span class="text-foreground">
                {{ row.completed_tasks }} / {{ row.total_tasks }}
              </span>
              <span class="font-semibold text-muted-foreground">
                {{
                  calculateProgressPercentage(
                    row.completed_tasks,
                    row.total_tasks,
                  )
                }}%
              </span>
            </div>
            <div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                class="h-full rounded-full transition-all"
                :class="getRunStatusBarClass(row.status)"
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
              :class="getRunStatusDotClass(row.status)"
            ></span>
            {{ getRunStatusLabel(row.status) }}
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
            class="inline-flex h-7 items-center gap-1 px-2 text-xs sm:px-2.5"
            :title="$t('common.detail')"
            @click="handleViewDetail(row.id)"
          >
            <Eye class="size-3.5 shrink-0" />
            <span class="hidden sm:inline">{{ $t('common.detail') }}</span>
          </Button>
        </template>

        <template #empty>
          <div
            class="flex flex-col items-center justify-center px-4 py-8 text-center text-muted-foreground"
          >
            <PlayCircle
              class="mb-3 size-10 stroke-[1.5] text-muted-foreground/60"
            />
            <p class="text-sm font-medium text-foreground">
              {{ $t('page.runs_view.empty_title') }}
            </p>
            <p class="mt-1 max-w-md text-xs text-muted-foreground">
              {{ $t('page.runs_view.empty_desc') }}
            </p>
          </div>
        </template>
      </Grid>
    </div>
  </div>
</template>
