<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    emptyText?: string;
    modelValue?: null | number;
    unit?: 'bytes' | 'mb';
  }>(),
  {
    emptyText: '—',
    modelValue: undefined,
    unit: 'bytes',
  },
);

const formatted = computed(() => {
  const val = props.modelValue;
  if (typeof val !== 'number' || Number.isNaN(val)) return null;
  if (props.unit === 'mb') {
    if (val <= 0) return null;
    return `${val.toFixed(0)} MB`;
  }
  if (val <= 0) return '0 B';
  if (val < 1024) return `${val} B`;
  if (val < 1024 * 1024) return `${(val / 1024).toFixed(1)} KB`;
  return `${(val / (1024 * 1024)).toFixed(2)} MB`;
});
</script>

<template>
  <span class="text-ui-body font-medium tabular-nums">
    {{ formatted ?? emptyText }}
  </span>
</template>
