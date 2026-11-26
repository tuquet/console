<script setup lang="ts">
import type { SchemaSelectOption } from '../types';

import { computed } from 'vue';

import { ToggleGroup, ToggleGroupItem } from '@operon-core/shadcn-ui';
import { cn } from '@operon-core/shared/utils';

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    modelValue?: number | string;
    mono?: boolean;
    options?: SchemaSelectOption[];
  }>(),
  {
    disabled: false,
    modelValue: undefined,
    mono: false,
    options: () => [],
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const current = computed(() =>
  props.modelValue === undefined || props.modelValue === null
    ? ''
    : String(props.modelValue),
);

function handleUpdate(val: unknown) {
  if (typeof val !== 'string' || !val) return;
  emit('update:modelValue', val);
}
</script>

<template>
  <ToggleGroup
    type="single"
    variant="outline"
    size="sm"
    class="w-full"
    :disabled="disabled"
    :model-value="current"
    @update:model-value="handleUpdate"
  >
    <ToggleGroupItem
      v-for="opt in options"
      :key="opt.value"
      :value="opt.value"
      :disabled="opt.disabled || disabled"
      :class="
        cn(
          'data-[state=on]:border-foreground/25 data-[state=on]:bg-accent flex-1 data-[state=on]:font-medium',
          mono && 'data-[state=on]:font-semibold',
        )
      "
    >
      <component :is="opt.icon" v-if="opt.icon" class="mr-1.5 size-3.5" />
      <span>{{ opt.label }}</span>
    </ToggleGroupItem>
  </ToggleGroup>
</template>
