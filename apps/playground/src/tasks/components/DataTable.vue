<script setup lang="ts">
import type { ColumnDef, RowSelectionState } from '@tanstack/vue-table';

import type { TableDensity } from '../data/data';
import type { Task } from '../data/schema';
import type { TasksTableFeatures } from './features';

import { computed, ref, watch } from 'vue';

import {
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@operon-core/shadcn-ui';
import { cn } from '@operon-core/shared/utils';

import { SearchX } from '@lucide/vue';
import { FlexRender, useTable } from '@tanstack/vue-table';

import { densityCellClasses } from '../data/data';
import DataTableBulkBar from './DataTableBulkBar.vue';
import DataTableMetrics from './DataTableMetrics.vue';
import DataTablePagination from './DataTablePagination.vue';
import DataTableToolbar from './DataTableToolbar.vue';
import { features } from './features';

interface DataTableProps {
  columns: ColumnDef<TasksTableFeatures, Task, any>[];
  data: Task[];
  metrics: {
    completionRate: number;
    done: number;
    highPriority: number;
    inProgress: number;
    total: number;
  };
}

const props = defineProps<DataTableProps>();

const emit = defineEmits<{
  bulkDelete: [ids: string[]];
  bulkUpdate: [
    ids: string[],
    patch: Partial<Pick<Task, 'assignee' | 'label' | 'priority' | 'status'>>,
  ];
  create: [];
  exportCsv: [rows: Task[]];
  exportJson: [rows: Task[]];
  inspect: [task: Task];
}>();

const rowSelection = ref<RowSelectionState>({});
const density = ref<TableDensity>('normal');
const favoritesOnly = ref(false);

const visibleSourceData = computed(() =>
  favoritesOnly.value ? props.data.filter((task) => task.favorite) : props.data,
);

// Prune stale selected IDs when rows are deleted
watch(
  () => props.data,
  (nextRows) => {
    const validIds = new Set(nextRows.map((t) => t.id));
    let changed = false;
    const cleaned: RowSelectionState = {};
    for (const [id, selected] of Object.entries(rowSelection.value)) {
      if (selected && validIds.has(id)) {
        cleaned[id] = true;
      } else if (selected) {
        changed = true;
      }
    }
    if (changed) rowSelection.value = cleaned;
  },
);

const table = useTable({
  features,
  get data() {
    return visibleSourceData.value;
  },
  get columns() {
    return props.columns;
  },
  getRowId: (row: Task) => row.id,
  initialState: {
    columnVisibility: {
      label: false,
    },
  },
  state: {
    get rowSelection() {
      return rowSelection.value;
    },
  },
  enableRowSelection: true,
  onRowSelectionChange: (updater) => {
    rowSelection.value =
      typeof updater === 'function' ? updater(rowSelection.value) : updater;
  },
});

const selectedTasks = computed(() =>
  table.getFilteredSelectedRowModel().rows.map((row) => row.original),
);

interface ColumnMeta {
  class?: string;
}

function getColumnClass(meta: unknown): string | undefined {
  return (meta as ColumnMeta | undefined)?.class;
}

function clearSelection() {
  rowSelection.value = {};
}

function handleBulkUpdate(
  patch: Partial<Pick<Task, 'assignee' | 'label' | 'priority' | 'status'>>,
) {
  const ids = selectedTasks.value.map((t) => t.id);
  if (ids.length === 0) return;
  emit('bulkUpdate', ids, patch);
}

function handleBulkDelete() {
  const ids = selectedTasks.value.map((t) => t.id);
  if (ids.length === 0) return;
  emit('bulkDelete', ids);
  clearSelection();
}

function resetFilters() {
  table.resetColumnFilters();
  favoritesOnly.value = false;
}
</script>

<template>
  <div class="flex flex-col gap-3.5">
    <!-- Compact Interactive Metric Strip -->
    <DataTableMetrics :table="table" :metrics="metrics" />

    <!-- Flat Toolbar Aligned Directly to Grid Edge -->
    <DataTableToolbar
      :table="table"
      v-model:density="density"
      v-model:favorites-only="favoritesOnly"
      @create="emit('create')"
    />

    <!-- Single Clean Table Surface -->
    <div
      class="bg-card border-border overflow-hidden rounded-lg border shadow-2xs"
    >
      <Table>
        <TableHeader class="bg-muted/35">
          <TableRow
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
            class="hover:bg-transparent"
          >
            <TableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              :class="
                cn('h-9 text-xs', getColumnClass(header.column.columnDef.meta))
              "
            >
              <FlexRender v-if="!header.isPlaceholder" :header="header" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :data-state="row.getIsSelected() && 'selected'"
              class="group/row cursor-pointer transition-colors"
              @click="emit('inspect', row.original)"
            >
              <TableCell
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                :class="
                  cn(
                    densityCellClasses[density],
                    getColumnClass(cell.column.columnDef.meta),
                  )
                "
              >
                <FlexRender :cell="cell" />
              </TableCell>
            </TableRow>
          </template>

          <TableRow v-else class="hover:bg-transparent">
            <TableCell
              :colspan="table.getVisibleLeafColumns().length"
              class="p-0"
            >
              <Empty class="min-h-[240px]">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <SearchX class="text-muted-foreground size-5" />
                  </EmptyMedia>
                  <EmptyTitle>No matching tasks</EmptyTitle>
                  <EmptyDescription>
                    No tasks match your current search or filter criteria.
                  </EmptyDescription>
                </EmptyHeader>
                <Button
                  variant="outline"
                  size="sm"
                  class="mt-4"
                  @click="resetFilters"
                >
                  Clear all filters
                </Button>
              </Empty>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <DataTablePagination :table="table" />

    <!-- Floating Linear-style Bulk Command Bar -->
    <DataTableBulkBar
      :selected-tasks="selectedTasks"
      @bulk-update="handleBulkUpdate"
      @bulk-delete="handleBulkDelete"
      @export-csv="emit('exportCsv', selectedTasks)"
      @export-json="emit('exportJson', selectedTasks)"
      @clear="clearSelection"
    />
  </div>
</template>
