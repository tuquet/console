<script setup lang="ts">
import { computed } from 'vue';

import { CircleCheckBig, X } from '@operon/icons';

import { Badge, Button, Separator } from '@operon-core/shadcn-ui';

interface Props {
  clearText?: string;
  count?: number;
  selectedRows?: any[];
}

const props = withDefaults(defineProps<Props>(), {
  clearText: 'Bỏ chọn',
  count: undefined,
  selectedRows: () => [],
});

const emit = defineEmits<{
  (e: 'clear'): void;
}>();

const selectedCount = computed(() => {
  if (props.count !== undefined) return props.count;
  return props.selectedRows?.length || 0;
});

const isVisible = computed(() => selectedCount.value > 0);
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-8 opacity-0 scale-95"
    enter-to-class="translate-y-0 opacity-100 scale-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="translate-y-0 opacity-100 scale-100"
    leave-to-class="translate-y-8 opacity-0 scale-95"
  >
    <div
      v-if="isVisible"
      class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-border/80 bg-background/95 px-4 py-2 text-xs shadow-xl ring-1 ring-black/5 backdrop-blur-md dark:ring-white/10"
    >
      <!-- Selected count indicator -->
      <div class="flex items-center gap-2 font-medium">
        <CircleCheckBig class="size-4 text-primary" />
        <span>Đã chọn</span>
        <Badge
          class="rounded-full px-2 py-0 text-[11px] font-semibold"
          variant="secondary"
        >
          {{ selectedCount }}
        </Badge>
        <span>mục</span>
      </div>

      <Separator class="h-4" orientation="vertical" />

      <!-- Custom batch action buttons -->
      <div class="flex items-center gap-2">
        <slot
          :clear="() => emit('clear')"
          :count="selectedCount"
          :rows="selectedRows"
        ></slot>
      </div>

      <Separator class="h-4" orientation="vertical" />

      <!-- Clear selection button -->
      <Button
        class="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        size="sm"
        variant="ghost"
        @click="emit('clear')"
      >
        <X class="mr-1 size-3.5" />
        {{ clearText }}
      </Button>
    </div>
  </Transition>
</template>
