import type { Ref, VNode } from 'vue';

import type { DataTableFeatures } from '@operon/common-ui';

import type { BrowserProfileRecord } from '../../api/browsers';
import type { ScopeMode } from '../../stores/browsers';
import type { BrowserRowCallbacks } from './browsers-table-row-actions.vue';

import { h } from 'vue';

import { DataTableColumnHeader } from '@operon/common-ui';

import { Badge, Checkbox } from '@operon-core/shadcn-ui';

import { CheckCircle2, Laptop } from '@lucide/vue';
import { createColumnHelper } from '@tanstack/vue-table';

import { $t } from '../../locales';
import BrowsersTableRowActions from './browsers-table-row-actions.vue';

const columnHelper = createColumnHelper<
  DataTableFeatures,
  BrowserProfileRecord
>();

const includesFilterFn = (
  row: { getValue: (id: string) => unknown },
  id: string,
  value: string[],
) => value.includes(String(row.getValue(id)));

const searchProfileFilterFn = (
  row: { original: BrowserProfileRecord },
  _id: string,
  value: string,
) => {
  const q = String(value ?? '')
    .trim()
    .toLowerCase();
  if (!q) return true;
  const b = row.original;
  return (
    b.name.toLowerCase().includes(q) ||
    b.id.toLowerCase().includes(q) ||
    (b.groupName || '').toLowerCase().includes(q) ||
    (b.proxy || '').toLowerCase().includes(q) ||
    b.tags.some((t) => t.toLowerCase().includes(q))
  );
};

function stopPropagationWrap(className: string, children: VNode[]) {
  return h(
    'div',
    {
      class: className,
      onClick: (e: MouseEvent) => e.stopPropagation(),
    },
    children,
  );
}

export function createBrowserColumns(
  actions: BrowserRowCallbacks,
  options: {
    isMutating: (id: string) => boolean;
    scopeMode: Ref<ScopeMode>;
  },
) {
  return columnHelper.columns([
    columnHelper.display({
      id: 'select',
      meta: { class: 'w-10 pl-3.5 pr-1' },
      header: ({ table }) =>
        stopPropagationWrap('flex items-center', [
          h(Checkbox, {
            modelValue:
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate'),
            'onUpdate:modelValue': (value: 'indeterminate' | boolean) =>
              table.toggleAllPageRowsSelected(!!value),
            ariaLabel: 'Select all',
          }),
        ]),
      cell: ({ row }) =>
        stopPropagationWrap('flex items-center', [
          h(Checkbox, {
            modelValue: row.getIsSelected(),
            'onUpdate:modelValue': (value: 'indeterminate' | boolean) =>
              row.toggleSelected(!!value),
            ariaLabel: 'Select row',
          }),
        ]),
      enableSorting: false,
      enableHiding: false,
    }),

    columnHelper.accessor('name', {
      meta: { label: $t('automation.browsers.col_profile') },
      header: ({ column }) =>
        h(DataTableColumnHeader, {
          column,
          title: $t('automation.browsers.col_profile'),
        }),
      filterFn: searchProfileFilterFn as any,
      cell: ({ row }) => {
        const profile = row.original;
        return h('div', { class: 'flex flex-col gap-0.5' }, [
          h('div', { class: 'flex items-center gap-1.5' }, [
            h(
              'button',
              {
                type: 'button',
                class: 'text-foreground font-medium hover:underline',
                onClick: (e: MouseEvent) => {
                  e.stopPropagation();
                  actions.onInspect(profile);
                },
              },
              profile.name,
            ),
            profile.isDefault
              ? h(
                  Badge,
                  { variant: 'secondary', class: 'px-1.5 py-0 text-[10px]' },
                  () => $t('automation.browsers.default_badge'),
                )
              : null,
          ]),
          h(
            'div',
            {
              class:
                'text-muted-foreground flex flex-wrap items-center gap-1.5 font-mono text-[11px]',
            },
            [
              h('span', profile.id),
              profile.groupName && profile.groupName.toLowerCase() !== 'default'
                ? h('span', `• ${profile.groupName}`)
                : null,
              ...profile.tags.slice(0, 3).map((tag) =>
                h(
                  Badge,
                  {
                    variant: 'outline',
                    class: 'px-1 py-0 text-[10px] font-normal',
                  },
                  () => `#${tag}`,
                ),
              ),
              profile.tags.length > 3
                ? h(
                    'span',
                    { class: 'text-[10px]' },
                    `+${profile.tags.length - 3}`,
                  )
                : null,
            ],
          ),
        ]);
      },
    }),

    columnHelper.accessor((row) => (row.isOnline ? 'online' : 'offline'), {
      id: 'status',
      meta: { label: $t('automation.browsers.col_status') },
      header: ({ column }) =>
        h(DataTableColumnHeader, {
          column,
          title: $t('automation.browsers.col_status'),
        }),
      filterFn: includesFilterFn as any,
      cell: ({ row }) => {
        const profile = row.original;
        return h('div', { class: 'flex items-center gap-1.5' }, [
          profile.isOnline
            ? h(
                Badge,
                {
                  variant: 'outline',
                  class:
                    'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
                },
                () => [
                  h(CheckCircle2, { class: 'mr-1 size-3' }),
                  $t('automation.browsers.running_badge'),
                ],
              )
            : h(
                'span',
                {
                  class:
                    'text-muted-foreground inline-flex items-center gap-1.5 text-xs',
                },
                [
                  h('span', {
                    class: 'bg-muted-foreground/50 size-1.5 rounded-full',
                  }),
                  $t('automation.browsers.idle_badge'),
                ],
              ),
          profile.debuggingPort
            ? h(
                'span',
                { class: 'text-muted-foreground font-mono text-[11px]' },
                `:${profile.debuggingPort}`,
              )
            : null,
        ]);
      },
    }),

    columnHelper.accessor(
      (row) => (row.fingerprintConfig?.osPlatform || 'windows').toLowerCase(),
      {
        id: 'platform',
        meta: { label: $t('automation.browsers.col_fingerprint') },
        header: ({ column }) =>
          h(DataTableColumnHeader, {
            column,
            title: $t('automation.browsers.col_fingerprint'),
          }),
        filterFn: includesFilterFn as any,
        cell: ({ row }) => {
          const fp = row.original.fingerprintConfig;
          return h(
            'div',
            {
              class: 'text-muted-foreground flex items-center gap-1.5 text-xs',
            },
            [
              h(Laptop, { class: 'size-3.5 shrink-0' }),
              h('span', { class: 'capitalize' }, fp?.osPlatform || 'windows'),
              h('span', '·'),
              h(
                'span',
                `${fp?.hardwareConcurrency || 8}c / ${fp?.deviceMemoryGb || 16}GB`,
              ),
            ],
          );
        },
      },
    ),

    columnHelper.accessor((row) => (row.proxy?.trim() ? 'proxied' : 'direct'), {
      id: 'proxy',
      meta: { label: $t('automation.browsers.col_proxy') },
      header: ({ column }) =>
        h(DataTableColumnHeader, {
          column,
          title: $t('automation.browsers.col_proxy'),
        }),
      filterFn: includesFilterFn as any,
      cell: ({ row }) => {
        const proxy = row.original.proxy;
        return proxy
          ? h('span', { class: 'text-foreground font-mono text-xs' }, proxy)
          : h(
              'span',
              { class: 'text-muted-foreground text-xs' },
              $t('automation.browsers.direct_badge'),
            );
      },
    }),

    columnHelper.accessor((row) => row.extensions.length, {
      id: 'extensions',
      meta: { label: $t('automation.browsers.col_extensions') },
      header: ({ column }) =>
        h(DataTableColumnHeader, {
          column,
          title: $t('automation.browsers.col_extensions'),
        }),
      cell: ({ row }) => {
        const count = row.original.extensions.length;
        return count > 1
          ? h(
              Badge,
              { variant: 'outline', class: 'font-mono text-[11px]' },
              () => String(count),
            )
          : h(
              'span',
              { class: 'text-muted-foreground font-mono text-xs' },
              String(count),
            );
      },
    }),

    columnHelper.display({
      id: 'actions',
      meta: { class: 'w-[140px] pr-3 text-right' },
      header: () =>
        h('span', { class: 'sr-only' }, $t('automation.browsers.col_actions')),
      cell: ({ row }) =>
        h(BrowsersTableRowActions, {
          actions,
          mutating: options.isMutating(row.original.id),
          profile: row.original,
        }),
      enableSorting: false,
      enableHiding: false,
    }),
  ]);
}
