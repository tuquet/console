<script setup lang="ts">
import type { SchemaBadgeVariant } from '../types';

import { computed } from 'vue';

import { Badge } from '@operon-core/shadcn-ui';
import { cn } from '@operon-core/shared/utils';

const props = withDefaults(
  defineProps<{
    badgeClass?: string;
    emptyText?: string;
    modelValue?: unknown;
    mono?: boolean;
    uppercase?: boolean;
    variant?: SchemaBadgeVariant;
    variantMap?: Record<string, SchemaBadgeVariant>;
  }>(),
  {
    badgeClass: undefined,
    emptyText: '—',
    modelValue: undefined,
    mono: false,
    uppercase: false,
    variant: 'secondary',
    variantMap: undefined,
  },
);

const text = computed(() => {
  if (props.modelValue === undefined || props.modelValue === null) return '';
  return String(props.modelValue);
});

const resolvedVariant = computed<SchemaBadgeVariant>(() => {
  if (!text.value) return props.variant;
  const key = text.value.toLowerCase();
  return (
    props.variantMap?.[key] ?? props.variantMap?.[text.value] ?? props.variant
  );
});
</script>

<template>
  <Badge
    v-if="text"
    :variant="resolvedVariant"
    :class="cn(uppercase && 'uppercase', badgeClass)"
  >
    {{ text }}
  </Badge>
  <span v-else class="text-ui-body text-muted-foreground">{{ emptyText }}</span>
</template>
