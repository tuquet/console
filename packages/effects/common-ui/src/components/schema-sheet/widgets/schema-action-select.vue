<script setup lang="ts">
import type { Component } from 'vue';

import type { SchemaSelectOption } from '../types';

import { Button } from '@operon-core/shadcn-ui';

import { Loader2 } from '@lucide/vue';

import SchemaOptionSelect from './schema-option-select.vue';

const props = withDefaults(
  defineProps<{
    actionDisabled?: boolean;
    actionIcon?: Component;
    actionLabel?: string;
    actionLoading?: boolean;
    disabled?: boolean;
    modelValue?: string;
    onAction?: (value: string) => Promise<void> | void;
    options?: SchemaSelectOption[];
    placeholder?: string;
  }>(),
  {
    actionDisabled: false,
    actionIcon: undefined,
    actionLabel: 'Apply',
    actionLoading: false,
    disabled: false,
    modelValue: undefined,
    onAction: undefined,
    options: () => [],
    placeholder: 'Select...',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

function handleSelect(val: null | string) {
  if (val !== null) {
    emit('update:modelValue', val);
  }
}

async function handleAction() {
  if (!props.onAction || !props.modelValue) return;
  await props.onAction(props.modelValue);
}
</script>

<template>
  <div class="flex items-center gap-2">
    <div class="min-w-0 flex-1">
      <SchemaOptionSelect
        :disabled="disabled"
        :model-value="modelValue"
        :options="options"
        :placeholder="placeholder"
        @update:model-value="handleSelect"
      />
    </div>
    <Button
      type="button"
      size="sm"
      variant="outline"
      class="h-9 shrink-0 gap-1.5"
      :disabled="actionDisabled || actionLoading || !modelValue"
      @click="handleAction"
    >
      <Loader2 v-if="actionLoading" class="size-3.5 animate-spin" />
      <component :is="actionIcon" v-else-if="actionIcon" class="size-3.5" />
      <span>{{ actionLabel }}</span>
    </Button>
  </div>
</template>
