<script setup lang="ts">
import { cn } from '@operon-core/shared/utils';

withDefaults(
  defineProps<{
    class?: string;
    emptyText?: string;
    modelValue?: unknown;
    mono?: boolean;
    wrap?: boolean;
  }>(),
  {
    class: undefined,
    emptyText: '—',
    modelValue: undefined,
    mono: false,
    wrap: true,
  },
);
</script>

<template>
  <span
    :class="
      cn(
        'text-ui-body text-foreground',
        wrap ? 'break-words whitespace-pre-wrap' : 'truncate',
        $props.class,
      )
    "
  >
    {{
      modelValue !== undefined && modelValue !== null && modelValue !== ''
        ? String(modelValue)
        : emptyText
    }}
  </span>
</template>
