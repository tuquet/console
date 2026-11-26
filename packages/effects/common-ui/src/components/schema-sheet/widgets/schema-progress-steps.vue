<script setup lang="ts">
import { computed } from 'vue';

import { Progress, ToggleGroup, ToggleGroupItem } from '@operon-core/shadcn-ui';

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    modelValue?: number;
    steps?: readonly number[];
  }>(),
  {
    disabled: false,
    modelValue: 0,
    steps: () => [0, 25, 50, 75, 100],
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: number];
}>();

const percent = computed(() =>
  typeof props.modelValue === 'number' && !Number.isNaN(props.modelValue)
    ? props.modelValue
    : 0,
);

function handleUpdate(raw: unknown) {
  if (raw === undefined || raw === null || raw === '') return;
  const next = Number(raw);
  if (!Number.isNaN(next)) {
    emit('update:modelValue', next);
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <Progress :model-value="percent" class="h-1.5" />
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      class="w-full"
      :disabled="disabled"
      :model-value="String(percent)"
      @update:model-value="handleUpdate"
    >
      <ToggleGroupItem
        v-for="step in steps"
        :key="step"
        :value="String(step)"
        class="data-[state=on]:border-foreground/25 data-[state=on]:bg-accent flex-1 data-[state=on]:font-semibold"
      >
        {{ step }}%
      </ToggleGroupItem>
    </ToggleGroup>
  </div>
</template>
