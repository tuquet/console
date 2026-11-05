<script setup lang="ts">
import type { Component } from 'vue';

import { computed, ref } from 'vue';

import { Check, Plus, Search, X } from '@operon/icons';

import {
  Badge,
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  Separator,
} from '@operon-core/shadcn-ui';

export interface FacetedOption {
  icon?: Component;
  label: string;
  value: any;
}

interface Props {
  counts?: Record<number | string, number>;
  disabled?: boolean;
  modelValue?: any[];
  options: FacetedOption[];
  placeholder?: string;
  title: string;
}

const props = withDefaults(defineProps<Props>(), {
  counts: () => ({}),
  disabled: false,
  modelValue: () => [],
  placeholder: '',
});

const emit = defineEmits<{
  (e: 'change' | 'update:modelValue', value: any[]): void;
}>();

const open = ref(false);
const searchQuery = ref('');

const selectedValues = computed<Set<any>>({
  get() {
    return new Set(props.modelValue || []);
  },
  set(newVal) {
    const arr = [...newVal];
    emit('update:modelValue', arr);
    emit('change', arr);
  },
});

const filteredOptions = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return props.options;
  return props.options.filter((opt) => opt.label.toLowerCase().includes(query));
});

function toggleOption(value: any) {
  const next = new Set(selectedValues.value);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  selectedValues.value = next;
}

function clearFilters() {
  selectedValues.value = new Set();
  searchQuery.value = '';
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        :disabled="disabled"
        class="h-8 border-dashed text-xs font-normal"
        size="sm"
        variant="outline"
      >
        <Plus class="mr-1.5 size-3.5 text-muted-foreground" />
        <span>{{ title }}</span>

        <template v-if="selectedValues.size > 0">
          <Separator class="mx-2 h-4" orientation="vertical" />
          <Badge
            class="rounded-sm px-1.5 py-0 text-[11px] font-normal lg:hidden"
            variant="secondary"
          >
            {{ selectedValues.size }}
          </Badge>

          <div class="hidden items-center gap-1 lg:flex">
            <Badge
              v-if="selectedValues.size > 2"
              class="rounded-sm px-1.5 py-0 text-[11px] font-normal"
              variant="secondary"
            >
              {{ selectedValues.size }} đã chọn
            </Badge>

            <template v-else>
              <Badge
                v-for="opt in options.filter((o) =>
                  selectedValues.has(o.value),
                )"
                :key="String(opt.value)"
                class="rounded-sm px-1.5 py-0 text-[11px] font-normal"
                variant="secondary"
              >
                {{ opt.label }}
              </Badge>
            </template>
          </div>
        </template>
      </Button>
    </PopoverTrigger>

    <PopoverContent align="start" class="w-56 p-0 shadow-md">
      <div class="flex flex-col">
        <!-- Search bar within Popover -->
        <div class="flex items-center border-b px-2.5 py-1.5">
          <Search class="mr-2 size-3.5 shrink-0 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            :placeholder="placeholder || `Tìm ${title.toLowerCase()}...`"
            class="h-7 w-full border-none p-0 text-xs shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <button
            v-if="searchQuery"
            class="ml-1 text-muted-foreground hover:text-foreground"
            type="button"
            @click="searchQuery = ''"
          >
            <X class="size-3" />
          </button>
        </div>

        <!-- Options list -->
        <ScrollArea class="max-h-56 p-1">
          <div
            v-if="filteredOptions.length === 0"
            class="py-6 text-center text-xs text-muted-foreground"
          >
            Không tìm thấy kết quả
          </div>

          <div
            v-for="opt in filteredOptions"
            :key="String(opt.value)"
            class="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
            @click="toggleOption(opt.value)"
          >
            <div
              class="mr-2 flex size-3.5 items-center justify-center rounded-[3px] border border-primary transition-colors"
              :class="[
                selectedValues.has(opt.value)
                  ? 'bg-primary text-primary-foreground'
                  : 'opacity-40 [&_svg]:invisible',
              ]"
            >
              <Check class="size-3 text-current" />
            </div>

            <component
              :is="opt.icon"
              v-if="opt.icon"
              class="mr-2 size-3.5 text-muted-foreground"
            />
            <span class="truncate">{{ opt.label }}</span>

            <span
              v-if="counts[opt.value] !== undefined"
              class="ml-auto font-mono text-[11px] text-muted-foreground"
            >
              {{ counts[opt.value] }}
            </span>
          </div>
        </ScrollArea>

        <!-- Clear filters button -->
        <template v-if="selectedValues.size > 0">
          <Separator />
          <div class="p-1">
            <button
              class="w-full rounded-sm py-1.5 text-center text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              type="button"
              @click="clearFilters"
            >
              Xóa bộ lọc
            </button>
          </div>
        </template>
      </div>
    </PopoverContent>
  </Popover>
</template>
