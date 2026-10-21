<script lang="ts" setup>
import type { SystemPluginItem } from '#/api';

import { computed, ref, watch } from 'vue';

import {
  FILTER_ALL,
  SYSTEM_PLUGIN_CATEGORY,
  SYSTEM_PLUGIN_STATUS,
} from '@tuquet/constants';
import { usePreferences } from '@tuquet/preferences';
import { Badge, Button } from '@tuquet/vue-ui';

import {
  CreditCard,
  Database,
  HardDrive,
  Plus,
  RefreshCw,
  ShieldCheck,
  Webhook,
  Workflow,
  Zap,
} from '@lucide/vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSystemPluginsApi } from '#/api';
import { $t } from '#/locales';

defineOptions({ name: 'SystemPlugins' });

const { isMobile } = usePreferences();

const allPlugins = ref<SystemPluginItem[]>([]);

function getColumns() {
  return [
    {
      field: 'name',
      title: $t('term.plugin'),
      minWidth: 220,
      slots: { default: 'plugin-cell' },
    },
    {
      field: 'is_core',
      title: $t('page.system_view.plugins_col_type'),
      minWidth: 150,
      slots: { default: 'type-cell' },
    },
    {
      field: 'version',
      title: $t('page.system_view.plugins_col_version_schema'),
      minWidth: 200,
      slots: { default: 'version-cell' },
    },
    {
      field: 'status',
      title: $t('common.status'),
      minWidth: 140,
      slots: { default: 'status-cell' },
    },
    {
      field: 'installed_at',
      title: $t('page.system_view.plugins_col_installed_at'),
      minWidth: 150,
      align: 'right' as const,
      cellRender: { name: 'CellDate' },
    },
  ];
}

const [Grid, gridApi] = useVbenVxeGrid<SystemPluginItem>({
  detailSheetOptions: {
    resource: 'public.system_plugins',
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
        fieldName: 'is_core',
        formItemClass: 'col-span-2 sm:col-span-1',
        label: () => $t('page.system_view.plugins_filter_type'),
        defaultValue: FILTER_ALL,
        componentProps: () => ({
          placeholder: $t('page.system_view.plugins_type_all'),
          options: [
            {
              label: $t('page.system_view.plugins_type_all'),
              value: FILTER_ALL,
            },
            {
              label: $t('page.system_view.plugins_type_core'),
              value: SYSTEM_PLUGIN_CATEGORY.CORE,
            },
            {
              label: $t('page.system_view.plugins_type_extension'),
              value: SYSTEM_PLUGIN_CATEGORY.EXTENSION,
            },
          ],
        }),
      },
      {
        component: 'Input',
        fieldName: 'keyword',
        formItemClass: 'col-span-2 sm:col-span-1',
        label: () => $t('common.search'),
        componentProps: () => ({
          placeholder: $t('page.system_view.plugins_search_placeholder'),
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
      'hidden sm:flex sm:col-span-2 lg:col-span-2 items-center justify-end gap-2 pt-1 sm:pt-6',
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
          const data = await getSystemPluginsApi();
          allPlugins.value = data;

          let filtered = data;
          if (formValues?.is_core === SYSTEM_PLUGIN_CATEGORY.CORE) {
            filtered = filtered.filter((p) => p.is_core);
          } else if (formValues?.is_core === SYSTEM_PLUGIN_CATEGORY.EXTENSION) {
            filtered = filtered.filter((p) => !p.is_core);
          }

          if (formValues?.keyword) {
            const kw = formValues.keyword.toLowerCase().trim();
            filtered = filtered.filter(
              (p) =>
                p.name.toLowerCase().includes(kw) ||
                p.id.toLowerCase().includes(kw),
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

watch([() => $t('page.system_view.plugins_col_type'), isMobile], () => {
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

function getPluginIcon(pluginId: string) {
  switch (pluginId?.toLowerCase()) {
    case 'automa': {
      return Workflow;
    }
    case 'core-iam': {
      return ShieldCheck;
    }
    case 'workers': {
      return Zap;
    }
    case 'storage': {
      return HardDrive;
    }
    case 'subscriptions': {
      return CreditCard;
    }
    case 'webhooks': {
      return Webhook;
    }
    default: {
      return Database;
    }
  }
}

function refresh() {
  gridApi.reload();
}
</script>

<template>
  <div class="space-y-3 p-3 sm:space-y-4 sm:p-5">
    <!-- Top Header -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <h1
            class="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl"
          >
            {{ $t('page.system.plugins') }}
          </h1>
          <Badge variant="secondary" class="shrink-0 text-xs font-normal">
            {{ allPlugins.length }}
          </Badge>
        </div>
        <p class="hidden text-xs text-muted-foreground sm:block">
          {{ $t('page.system.plugins_desc') }}
        </p>
      </div>

      <div class="flex shrink-0 flex-wrap items-center gap-1.5 sm:gap-2">
        <Button
          variant="outline"
          size="icon"
          class="size-8 shrink-0"
          :title="$t('common.refresh')"
          @click="refresh"
        >
          <RefreshCw class="size-3.5 shrink-0" />
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
      class="overflow-hidden rounded-xl border border-border/60 bg-card p-3 sm:p-5 shadow-xs"
    >
      <!-- Table Grid -->
      <Grid class="plugins-vxe-grid">
        <template #plugin-cell="{ row }">
          <div class="flex items-center gap-2.5 py-1">
            <div
              class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground"
            >
              <component :is="getPluginIcon(row.id)" class="size-4" />
            </div>
            <div class="min-w-0 text-left">
              <div class="truncate font-medium text-foreground">
                {{ row.name }}
              </div>
              <div
                class="flex items-center gap-1.5 text-2xs text-muted-foreground sm:text-xs"
              >
                <span class="truncate">{{ row.id }}</span>
              </div>
            </div>
          </div>
        </template>

        <template #type-cell="{ row }">
          <Badge
            :variant="row.is_core ? 'default' : 'secondary'"
            class="text-xs font-normal"
          >
            {{
              row.is_core
                ? $t('page.system_view.plugins_type_core')
                : $t('page.system_view.plugins_type_extension')
            }}
          </Badge>
        </template>

        <template #version-cell="{ row }">
          <div class="flex items-center gap-2 text-xs font-mono">
            <Badge variant="outline" class="text-xs">
              v{{ row.version }}
            </Badge>
            <span v-if="row.schema_name" class="text-muted-foreground">
              {{
                $t('page.system_view.plugins_schema_prefix', [row.schema_name])
              }}
            </span>
          </div>
        </template>

        <template #status-cell="{ row }">
          <Badge variant="outline" class="text-xs font-normal">
            <span
              class="mr-1.5 size-1.5 rounded-full"
              :class="{
                'bg-success': row.status === SYSTEM_PLUGIN_STATUS.INSTALLED,
                'bg-muted-foreground':
                  row.status === SYSTEM_PLUGIN_STATUS.DISABLED,
                'bg-warning': row.status === SYSTEM_PLUGIN_STATUS.PENDING,
              }"
            ></span>
            {{
              row.status === SYSTEM_PLUGIN_STATUS.INSTALLED
                ? $t('page.system_view.plugins_status_installed')
                : row.status === SYSTEM_PLUGIN_STATUS.DISABLED
                  ? $t('page.system_view.status_paused')
                  : $t('common.pending')
            }}
          </Badge>
        </template>
      </Grid>
    </div>
  </div>
</template>
