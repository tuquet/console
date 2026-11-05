<script setup lang="ts">
import type { VxeGridInstance } from 'vxe-table';

import { computed } from 'vue';

import { SlidersHorizontal } from '@operon/icons';

import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@operon-core/shadcn-ui';

interface Props {
  columns?: any[];
  disabled?: boolean;
  grid?: null | VxeGridInstance;
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  columns: () => [],
  disabled: false,
  grid: null,
  title: 'Hiển thị',
});

const emit = defineEmits<{
  (e: 'toggleColumn', column: any, visible: boolean): void;
}>();

// Filter only hideable columns (columns with a title and not special selection columns)
const hideableColumns = computed(() => {
  const source = props.columns?.length
    ? props.columns
    : props.grid?.getTableColumn?.().fullColumn || [];

  return source.filter((col: any) => {
    if (!col) return false;
    // Exclude checkbox, seq, radio, expand unless explicitly allowed
    if (col.type && ['checkbox', 'expand', 'radio', 'seq'].includes(col.type)) {
      return false;
    }
    // Exclude actions column if specified
    if (col.field === 'actions' || col.field === 'action') {
      return false;
    }
    // Exclude columns with canHide: false
    if (col.canHide === false) {
      return false;
    }
    return Boolean(col.title || col.field);
  });
});

function isColumnVisible(col: any): boolean {
  if (col.visible === false) return false;
  return true;
}

function handleToggle(col: any, nextVisible: boolean) {
  col.visible = nextVisible;
  if (props.grid) {
    const table = props.grid as any;
    if (typeof table.setColumnVisible === 'function') {
      table.setColumnVisible(col, nextVisible);
      if (typeof table.refreshColumn === 'function') {
        table.refreshColumn();
      }
    }
  }
  emit('toggleColumn', col, nextVisible);
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        :disabled="disabled || hideableColumns.length === 0"
        class="h-8 text-xs font-normal"
        size="sm"
        variant="outline"
      >
        <SlidersHorizontal class="mr-1.5 size-3.5 text-muted-foreground" />
        <span>{{ title }}</span>
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="end" class="w-44">
      <DropdownMenuLabel class="text-xs font-medium">
        Tùy chọn hiển thị cột
      </DropdownMenuLabel>
      <DropdownMenuSeparator />

      <DropdownMenuCheckboxItem
        v-for="col in hideableColumns"
        :key="col.field || col.id || col.title"
        :checked="isColumnVisible(col)"
        class="text-xs capitalize"
        @select.prevent
        @update:checked="(val: boolean) => handleToggle(col, val)"
      >
        {{ col.title || col.field }}
      </DropdownMenuCheckboxItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
