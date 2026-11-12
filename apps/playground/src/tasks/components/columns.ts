import type { Ref } from 'vue';

import type { DataTableFeatures } from '../../components/data-table';
import type { Task } from '../data/schema';
import type { RowActionCallbacks } from './TasksTableRowActions.vue';

import { h } from 'vue';

import {
  Avatar,
  AvatarFallback,
  Badge,
  Checkbox,
  Progress,
} from '@operon-core/shadcn-ui';
import { cn } from '@operon-core/shared/utils';

import { Check, Copy, Star } from '@lucide/vue';
import { createColumnHelper } from '@tanstack/vue-table';

import { DataTableColumnHeader } from '../../components/data-table';
import { assignees, labels, priorities, statuses } from '../data/data';
import TasksTableRowActions from './TasksTableRowActions.vue';

const columnHelper = createColumnHelper<DataTableFeatures, Task>();

const priorityRank = new Map(priorities.map((p) => [p.value, p.rank]));
const assigneeMap = new Map(assignees.map((a) => [a.value, a]));

export function createTaskColumns(
  actions: RowActionCallbacks,
  copiedId: Ref<null | string>,
) {
  return columnHelper.columns([
    columnHelper.display({
      id: 'select',
      meta: { class: 'w-10 pl-3.5 pr-1' },
      header: ({ table }) =>
        h(
          'div',
          {
            class: 'flex items-center',
            onClick: (e: MouseEvent) => e.stopPropagation(),
          },
          [
            h(Checkbox, {
              modelValue:
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && 'indeterminate'),
              'onUpdate:modelValue': (value: 'indeterminate' | boolean) =>
                table.toggleAllPageRowsSelected(!!value),
              ariaLabel: 'Select all',
            }),
          ],
        ),
      cell: ({ row }) =>
        h(
          'div',
          {
            class: 'flex items-center',
            onClick: (e: MouseEvent) => e.stopPropagation(),
          },
          [
            h(Checkbox, {
              modelValue: row.getIsSelected(),
              'onUpdate:modelValue': (value: 'indeterminate' | boolean) =>
                row.toggleSelected(!!value),
              ariaLabel: 'Select row',
            }),
          ],
        ),
      enableSorting: false,
      enableHiding: false,
    }),

    columnHelper.accessor('id', {
      meta: { class: 'w-[132px] whitespace-nowrap' },
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: 'Task' }),
      cell: ({ row }) => {
        const id = row.original.id;
        const isCopied = copiedId.value === id;
        const isFav = row.original.favorite;

        return h(
          'div',
          {
            class: 'flex items-center gap-1',
            onClick: (e: MouseEvent) => e.stopPropagation(),
          },
          [
            h(
              'button',
              {
                type: 'button',
                title: isFav ? 'Unpin favorite' : 'Pin favorite',
                class: cn(
                  'hover:bg-muted rounded-sm p-0.5 transition-opacity',
                  isFav
                    ? 'opacity-100'
                    : 'opacity-20 group-hover/row:opacity-80',
                ),
                onClick: () => actions.onToggleFavorite(id),
              },
              [
                h(Star, {
                  class: cn(
                    'size-3.5 transition-colors',
                    isFav
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-muted-foreground',
                  ),
                }),
              ],
            ),
            h(
              'button',
              {
                type: 'button',
                title: 'Copy task ID',
                class:
                  'group/id text-muted-foreground hover:bg-muted hover:text-foreground inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-mono text-xs transition-colors',
                onClick: () => actions.onCopyId(id),
              },
              [
                h('span', id),
                isCopied
                  ? h(Check, { class: 'size-3 text-emerald-500' })
                  : h(Copy, {
                      class:
                        'size-3 opacity-0 transition-opacity group-hover/id:opacity-70',
                    }),
              ],
            ),
          ],
        );
      },
      enableHiding: false,
    }),

    columnHelper.accessor('title', {
      meta: { class: 'min-w-[280px]' },
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: 'Title' }),
      cell: ({ row }) => {
        const label = labels.find((item) => item.value === row.original.label);

        return h('div', { class: 'flex items-center gap-2' }, [
          label
            ? h(
                Badge,
                {
                  variant: 'outline',
                  class: cn(
                    'shrink-0 rounded-sm px-1.5 py-0 text-[11px] font-medium',
                    label.badgeClass,
                  ),
                },
                () => label.label,
              )
            : null,
          h(
            'span',
            {
              class:
                'text-foreground group-hover/row:text-primary max-w-[460px] truncate text-[13px] font-medium transition-colors 2xl:max-w-[680px]',
            },
            row.original.title,
          ),
        ]);
      },
      filterFn: (row, _id, rawQuery) => {
        const q = String(rawQuery ?? '')
          .trim()
          .toLowerCase();
        if (!q) return true;
        const owner = assigneeMap.get(row.original.assignee)?.label ?? '';
        return (
          row.original.title.toLowerCase().includes(q) ||
          row.original.id.toLowerCase().includes(q) ||
          row.original.label.toLowerCase().includes(q) ||
          owner.toLowerCase().includes(q)
        );
      },
    }),

    columnHelper.accessor('label', {
      meta: { class: 'w-[100px]' },
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: 'Label' }),
      cell: ({ row }) => {
        const label = labels.find((item) => item.value === row.original.label);
        if (!label) return null;
        return h(
          Badge,
          {
            variant: 'outline',
            class: cn('rounded-sm text-xs', label.badgeClass),
          },
          () => label.label,
        );
      },
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    }),

    columnHelper.accessor('status', {
      meta: { class: 'w-[136px]' },
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: 'Status' }),
      cell: ({ row }) => {
        const status = statuses.find(
          (item) => item.value === row.getValue('status'),
        );
        if (!status) return null;

        return h(
          'div',
          {
            class: cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
              status.pillClass,
            ),
          },
          [
            h(status.icon, { class: 'size-3 shrink-0' }),
            h('span', status.label),
          ],
        );
      },
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    }),

    columnHelper.accessor('priority', {
      meta: { class: 'w-[110px]' },
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: 'Priority' }),
      cell: ({ row }) => {
        const priority = priorities.find(
          (item) => item.value === row.getValue('priority'),
        );
        if (!priority) return null;

        return h(
          'div',
          {
            class: cn(
              'inline-flex items-center gap-1.5 text-xs whitespace-nowrap',
              priority.textClass,
            ),
          },
          [
            h(priority.icon, { class: 'size-3.5 shrink-0' }),
            h('span', priority.label),
          ],
        );
      },
      sortFn: (rowA, rowB) => {
        const rankA = priorityRank.get(rowA.original.priority) ?? 0;
        const rankB = priorityRank.get(rowB.original.priority) ?? 0;
        return rankA - rankB;
      },
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    }),

    columnHelper.accessor('assignee', {
      meta: { class: 'w-[152px]' },
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: 'Assignee' }),
      cell: ({ row }) => {
        const person = assigneeMap.get(row.original.assignee);
        if (!person) return null;

        return h(
          'div',
          {
            title: `${person.label} — ${person.role}`,
            class: 'inline-flex items-center gap-2',
          },
          [
            h(Avatar, { class: 'size-5 text-[10px]' }, () =>
              h(
                AvatarFallback,
                { class: cn('font-semibold', person.avatarClass) },
                () => person.initials,
              ),
            ),
            h(
              'span',
              {
                class: 'text-foreground/85 truncate text-xs whitespace-nowrap',
              },
              person.label,
            ),
          ],
        );
      },
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    }),

    columnHelper.accessor('progress', {
      meta: { class: 'w-[128px]' },
      header: ({ column }) =>
        h(DataTableColumnHeader, { column, title: 'Progress' }),
      cell: ({ row }) => {
        const val = row.original.progress;
        return h('div', { class: 'flex items-center gap-2' }, [
          h(Progress, { modelValue: val, class: 'h-1.5 w-14' }),
          h(
            'span',
            {
              class: 'text-muted-foreground w-8 text-right font-mono text-xs',
            },
            `${val}%`,
          ),
        ]);
      },
    }),

    columnHelper.accessor('updatedAt', {
      meta: { class: 'w-[100px] text-right', label: 'Updated' },
      header: ({ column }) =>
        h(DataTableColumnHeader, {
          column,
          title: 'Updated',
          class: 'justify-end text-right',
        }),
      cell: ({ row }) =>
        h(
          'span',
          { class: 'text-muted-foreground text-xs whitespace-nowrap' },
          row.original.updatedAt,
        ),
      enableSorting: false,
    }),

    columnHelper.display({
      id: 'actions',
      meta: { class: 'w-11 pr-3 text-right' },
      cell: ({ row }) =>
        h(
          'div',
          {
            class: 'flex justify-end',
            onClick: (e: MouseEvent) => e.stopPropagation(),
          },
          [h(TasksTableRowActions, { row, actions })],
        ),
      enableHiding: false,
    }),
  ]);
}
