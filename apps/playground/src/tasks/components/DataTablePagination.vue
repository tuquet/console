<script setup lang="ts">
import type { VueTable } from '@tanstack/vue-table';

import type { Task } from '../data/schema';
import type { TasksTableFeatures } from './features';

import {
  Button,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@operon-core/shadcn-ui';

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from '@lucide/vue';

interface DataTablePaginationProps {
  table: VueTable<TasksTableFeatures, Task>;
}
defineProps<DataTablePaginationProps>();
</script>

<template>
  <div
    class="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between"
  >
    <div class="flex-1 text-xs text-muted-foreground">
      <span class="font-mono font-medium text-foreground">
        {{ table.getFilteredSelectedRowModel().rows.length }}
      </span>
      of
      <span class="font-mono font-medium text-foreground">
        {{ table.getFilteredRowModel().rows.length }}
      </span>
      row(s) selected.
    </div>

    <div class="flex flex-wrap items-center gap-4 lg:gap-6">
      <div class="flex items-center gap-2">
        <p class="text-xs font-medium text-muted-foreground">Rows per page</p>
        <Select
          :model-value="`${table.atoms.pagination.get().pageSize}`"
          @update:model-value="(val) => table.setPageSize(Number(val))"
        >
          <SelectTrigger class="h-8 w-[70px] font-mono text-xs">
            <SelectValue
              :placeholder="`${table.atoms.pagination.get().pageSize}`"
            />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectGroup>
              <SelectItem
                v-for="pageSize in [10, 20, 30, 40, 50]"
                :key="pageSize"
                :value="`${pageSize}`"
                class="font-mono text-xs"
              >
                {{ pageSize }}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div
        class="flex min-w-[96px] items-center justify-center font-mono text-xs font-medium"
      >
        Page {{ table.atoms.pagination.get().pageIndex + 1 }} of
        {{ Math.max(1, table.getPageCount()) }}
      </div>

      <div class="flex items-center gap-1.5">
        <Button
          variant="outline"
          class="hidden size-8 p-0 lg:flex"
          :disabled="!table.getCanPreviousPage()"
          @click="table.setPageIndex(0)"
        >
          <span class="sr-only">Go to first page</span>
          <ChevronsLeft class="size-4" />
        </Button>
        <Button
          variant="outline"
          class="size-8 p-0"
          :disabled="!table.getCanPreviousPage()"
          @click="table.previousPage()"
        >
          <span class="sr-only">Go to previous page</span>
          <ChevronLeft class="size-4" />
        </Button>
        <Button
          variant="outline"
          class="size-8 p-0"
          :disabled="!table.getCanNextPage()"
          @click="table.nextPage()"
        >
          <span class="sr-only">Go to next page</span>
          <ChevronRight class="size-4" />
        </Button>
        <Button
          variant="outline"
          class="hidden size-8 p-0 lg:flex"
          :disabled="!table.getCanNextPage()"
          @click="table.setPageIndex(table.getPageCount() - 1)"
        >
          <span class="sr-only">Go to last page</span>
          <ChevronsRight class="size-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
