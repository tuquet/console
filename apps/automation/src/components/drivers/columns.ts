import type { VNode } from 'vue';

import type { DataTableFeatures } from '@operon/common-ui';

import type { DriverReleaseItem } from '../../api/browsers';
import type { DriverProgressState } from '../../stores/browser-drivers';
import type { DriverRowCallbacks } from './drivers-table-row-actions.vue';

import { h } from 'vue';

import { DataTableColumnHeader } from '@operon/common-ui';

import { Badge } from '@operon-core/shadcn-ui';

import { Check, Loader2 } from '@lucide/vue';
import { createColumnHelper } from '@tanstack/vue-table';

import { $t } from '../../locales';
import DriversTableRowActions from './drivers-table-row-actions.vue';

export type { DriverRowCallbacks };

export interface DriverColumnState {
  getProgress: (version: string) => DriverProgressState | undefined;
  hasRunningSessions: () => boolean;
  isBusy: (version: string) => boolean;
}

const columnHelper = createColumnHelper<DataTableFeatures, DriverReleaseItem>();

const includesFilterFn = (
  row: { getValue: (id: string) => unknown },
  id: string,
  value: string[],
) => value.includes(String(row.getValue(id)));

const searchDriverFilterFn = (
  row: { original: DriverReleaseItem },
  _id: string,
  value: string,
) => {
  const q = String(value ?? '')
    .trim()
    .toLowerCase();
  if (!q) return true;
  const item = row.original;
  return (
    item.version.toLowerCase().includes(q) ||
    item.tag.toLowerCase().includes(q) ||
    item.channel.toLowerCase().includes(q) ||
    item.status.toLowerCase().includes(q) ||
    item.notes.toLowerCase().includes(q)
  );
};

function isActiveProgressStage(stage?: string): boolean {
  return stage === 'downloading' || stage === 'extracting';
}

function formatProgressLabel(progress: DriverProgressState): string {
  const stageText =
    progress.stage === 'extracting'
      ? $t('automation.browsers.driver_stage_extracting')
      : $t('automation.browsers.driver_stage_downloading');

  if (
    typeof progress.totalBytes === 'number' &&
    progress.totalBytes > 0 &&
    typeof progress.downloadedBytes === 'number'
  ) {
    const dlMb = (progress.downloadedBytes / 1_048_576).toFixed(1);
    const totalMb = (progress.totalBytes / 1_048_576).toFixed(1);
    return `${stageText} (${dlMb} / ${totalMb} MB · ${progress.percent}%)`;
  }
  return `${stageText} (${progress.percent}%)`;
}

function releaseStatusVariant(
  status: string,
): 'default' | 'destructive' | 'outline' | 'secondary' {
  const lower = status.toLowerCase();
  if (lower === 'buggy' || lower === 'deprecated') return 'destructive';
  if (lower === 'recommended' || lower === 'stable') return 'secondary';
  return 'outline';
}

export function createDriverColumns(
  actions: DriverRowCallbacks,
  state: DriverColumnState,
) {
  return columnHelper.columns([
    columnHelper.accessor('version', {
      meta: { label: $t('automation.browsers.drivers_col_version') },
      header: ({ column }) =>
        h(DataTableColumnHeader, {
          column,
          title: $t('automation.browsers.drivers_col_version'),
        }),
      filterFn: searchDriverFilterFn as any,
      cell: ({ row }) => {
        const item = row.original;
        return h('div', { class: 'flex min-w-0 flex-col gap-0.5' }, [
          h(
            'span',
            { class: 'text-ui-body font-semibold' },
            `v${item.version}`,
          ),
          h(
            'div',
            {
              class:
                'text-ui-caption text-muted-foreground flex flex-wrap items-center gap-1 md:hidden',
            },
            [
              h('span', { class: 'uppercase' }, item.channel),
              h('span', '·'),
              h('span', item.status),
              item.sizeMb
                ? h('span', {}, `· ${item.sizeMb.toFixed(0)} MB`)
                : null,
            ].filter(Boolean) as VNode[],
          ),
        ]);
      },
    }),

    columnHelper.accessor('channel', {
      meta: {
        class: 'hidden md:table-cell',
        label: $t('automation.browsers.drivers_col_channel'),
      },
      header: ({ column }) =>
        h(DataTableColumnHeader, {
          column,
          title: $t('automation.browsers.drivers_col_channel'),
        }),
      filterFn: includesFilterFn as any,
      cell: ({ row }) =>
        h(
          Badge,
          { variant: 'outline', class: 'uppercase' },
          () => row.original.channel,
        ),
    }),

    columnHelper.accessor('status', {
      meta: {
        class: 'hidden lg:table-cell',
        label: $t('automation.browsers.drivers_col_status'),
      },
      header: ({ column }) =>
        h(DataTableColumnHeader, {
          column,
          title: $t('automation.browsers.drivers_col_status'),
        }),
      filterFn: includesFilterFn as any,
      cell: ({ row }) =>
        h(
          Badge,
          { variant: releaseStatusVariant(row.original.status) },
          () => row.original.status,
        ),
    }),

    columnHelper.accessor(
      (row) => (row.installed ? 'installed' : 'available'),
      {
        id: 'installed',
        meta: {
          class: 'w-[92px] sm:w-[120px]',
          label: $t('automation.browsers.drivers_col_state'),
        },
        header: ({ column }) =>
          h(DataTableColumnHeader, {
            column,
            title: $t('automation.browsers.drivers_col_state'),
          }),
        filterFn: includesFilterFn as any,
        cell: ({ row }) => {
          const item = row.original;
          const progress = state.getProgress(item.version);

          if (progress && isActiveProgressStage(progress.stage)) {
            const shortLabel =
              progress.stage === 'extracting'
                ? $t('automation.browsers.driver_stage_extracting_short')
                : `${progress.percent}%`;
            return h(
              Badge,
              {
                variant: 'secondary',
                class: 'gap-1 tabular-nums',
                title: formatProgressLabel(progress),
              },
              () => [
                h(Loader2, { class: 'size-3 shrink-0 animate-spin' }),
                h('span', shortLabel),
              ],
            );
          }

          if (progress?.stage === 'error') {
            return h(
              Badge,
              {
                variant: 'destructive',
                title:
                  progress.error ||
                  $t('automation.overview.browser_action_failed'),
              },
              () => $t('automation.browsers.drivers_state_failed'),
            );
          }

          if (item.isActive) {
            return h(Badge, { variant: 'default', class: 'gap-1' }, () => [
              h(Check, { class: 'size-3' }),
              h('span', $t('automation.browsers.driver_selected')),
            ]);
          }

          return item.installed
            ? h(Badge, { variant: 'secondary' }, () =>
                $t('automation.browsers.drivers_state_installed'),
              )
            : h(
                Badge,
                { variant: 'outline', class: 'text-muted-foreground' },
                () => $t('automation.browsers.drivers_state_available'),
              );
        },
      },
    ),

    columnHelper.accessor('sizeMb', {
      meta: {
        class: 'hidden lg:table-cell',
        label: $t('automation.browsers.drivers_col_size'),
      },
      header: ({ column }) =>
        h(DataTableColumnHeader, {
          column,
          title: $t('automation.browsers.drivers_col_size'),
        }),
      cell: ({ row }) =>
        h(
          'span',
          { class: 'text-muted-foreground' },
          row.original.sizeMb ? `${row.original.sizeMb.toFixed(0)} MB` : '—',
        ),
    }),

    columnHelper.accessor('notes', {
      meta: {
        class: 'hidden xl:table-cell',
        label: $t('automation.browsers.drivers_col_notes'),
      },
      header: ({ column }) =>
        h(DataTableColumnHeader, {
          column,
          title: $t('automation.browsers.drivers_col_notes'),
        }),
      cell: ({ row }) =>
        h(
          'span',
          {
            class: 'text-muted-foreground block max-w-[340px] truncate',
            title: row.original.notes || undefined,
          },
          row.original.notes || '—',
        ),
    }),

    columnHelper.display({
      id: 'actions',
      meta: {
        class: 'w-[56px] text-right',
        label: $t('common.actions'),
      },
      header: () => h('div', { class: 'text-right' }, $t('common.actions')),
      cell: ({ row }) => {
        const driver = row.original;
        const progress = state.getProgress(driver.version);
        return h(DriversTableRowActions, {
          actions,
          busy: state.isBusy(driver.version),
          driver,
          hasRunningSessions: state.hasRunningSessions(),
          installing: isActiveProgressStage(progress?.stage),
        });
      },
      enableSorting: false,
      enableHiding: false,
    }),
  ]);
}
