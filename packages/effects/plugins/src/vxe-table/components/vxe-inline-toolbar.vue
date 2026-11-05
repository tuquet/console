<script setup lang="ts">
import type { VxeGridInstance } from 'vxe-table';

import { computed } from 'vue';

import { RotateCw, Search, X } from '@operon/icons';

import { Button, Input } from '@operon-core/shadcn-ui';

import VxeViewOptions from './vxe-view-options.vue';

interface Props {
  columns?: any[];
  grid?: null | VxeGridInstance;
  isFiltered?: boolean;
  placeholder?: string;
  searchField?: string;
  searchValue?: string;
  showSearch?: boolean;
  showViewOptions?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  columns: () => [],
  grid: null,
  isFiltered: false,
  placeholder: 'Tìm kiếm nhanh...',
  searchField: '',
  searchValue: '',
  showSearch: true,
  showViewOptions: true,
});

const emit = defineEmits<{
  (e: 'search' | 'update:searchValue', val: string): void;
  (e: 'reset'): void;
}>();

const query = computed({
  get: () => props.searchValue,
  set: (val: string) => {
    emit('update:searchValue', val);
    emit('search', val);
  },
});

const hasActiveFilter = computed(() => {
  return props.isFiltered || Boolean(query.value.trim());
});

function handleReset() {
  query.value = '';
  emit('reset');
}
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-2.5 py-1">
    <!-- Left: Search input + Faceted Filters -->
    <div class="flex flex-1 flex-wrap items-center gap-2">
      <div v-if="showSearch" class="relative">
        <Search
          class="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          v-model="query"
          :placeholder="placeholder"
          class="h-8 w-44 pl-8 text-xs sm:w-60 focus-visible:ring-1"
        />
        <button
          v-if="query"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          type="button"
          @click="query = ''"
        >
          <X class="size-3" />
        </button>
      </div>

      <!-- Faceted filter slots -->
      <slot name="filters"></slot>

      <!-- Reset button -->
      <Button
        v-if="hasActiveFilter"
        class="h-8 px-2.5 text-xs font-normal"
        size="sm"
        variant="ghost"
        @click="handleReset"
      >
        <span>Đặt lại</span>
        <RotateCw class="ml-1.5 size-3.5" />
      </Button>
    </div>

    <!-- Right: Custom tools + View Options -->
    <div class="flex items-center gap-2">
      <slot name="tools"></slot>
      <VxeViewOptions v-if="showViewOptions" :columns="columns" :grid="grid" />
    </div>
  </div>
</template>
