<script setup lang="ts">
import type { Component } from 'vue';

import { computed } from 'vue';

import { Badge } from '@operon-core/shadcn-ui';

const props = withDefaults(
  defineProps<{
    emptyText?: string;
    icon?: Component;
    iconClass?: string;
    modelValue?: string[];
    prefix?: string;
  }>(),
  {
    emptyText: '—',
    icon: undefined,
    iconClass: 'size-3 text-emerald-500',
    modelValue: () => [],
    prefix: '',
  },
);

const items = computed(() =>
  Array.isArray(props.modelValue) ? props.modelValue.filter(Boolean) : [],
);
</script>

<template>
  <div v-if="items.length > 0" class="flex flex-wrap gap-1.5">
    <Badge v-for="item in items" :key="item" variant="outline" class="gap-1">
      <component :is="icon" v-if="icon" :class="iconClass" />
      <span>{{ prefix }}{{ item }}</span>
    </Badge>
  </div>
  <span v-else class="text-muted-foreground">{{ emptyText }}</span>
</template>
