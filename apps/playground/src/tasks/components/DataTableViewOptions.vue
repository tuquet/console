<script setup lang="ts">
import type { VueTable } from '@tanstack/vue-table';

import type { Task } from '../data/schema';
import type { TasksTableFeatures } from './features';

import { computed } from 'vue';

import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@operon-core/shadcn-ui';

import { Settings2 } from '@lucide/vue';

interface DataTableViewOptionsProps {
  table: VueTable<TasksTableFeatures, Task>;
}

const props = defineProps<DataTableViewOptionsProps>();

const columns = computed(() =>
  props.table
    .getAllColumns()
    .filter((column) => column.accessorFn !== undefined && column.getCanHide()),
);
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="outline"
        size="sm"
        class="text-muted-foreground hover:text-foreground hidden h-8 text-xs font-normal lg:flex"
      >
        <Settings2 class="mr-1.5 size-3.5 opacity-70" />
        Columns
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-[160px]">
      <DropdownMenuLabel class="text-xs">Toggle columns</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuCheckboxItem
          v-for="column in columns"
          :key="column.id"
          class="capitalize"
          :model-value="column.getIsVisible()"
          @update:model-value="(value) => column.toggleVisibility(!!value)"
        >
          {{ column.id === 'updatedAt' ? 'updated' : column.id }}
        </DropdownMenuCheckboxItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
