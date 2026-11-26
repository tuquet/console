<script setup lang="ts">
import type { Component } from 'vue';

import { useId } from 'vue';

import { Label, Switch } from '@operon-core/shadcn-ui';
import { cn } from '@operon-core/shared/utils';

withDefaults(
  defineProps<{
    activeIconClass?: string;
    description?: string;
    disabled?: boolean;
    icon?: Component;
    idleIconClass?: string;
    modelValue?: boolean;
    title?: string;
  }>(),
  {
    activeIconClass: 'fill-amber-400 text-amber-400',
    description: undefined,
    disabled: false,
    icon: undefined,
    idleIconClass: 'text-muted-foreground',
    modelValue: false,
    title: '',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const switchId = useId();
</script>

<template>
  <div
    class="border-border/70 bg-muted/20 flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5"
  >
    <div class="flex items-center gap-2.5">
      <component
        :is="icon"
        v-if="icon"
        :class="
          cn(
            'size-4 shrink-0 transition-colors',
            modelValue ? activeIconClass : idleIconClass,
          )
        "
      />
      <div class="flex flex-col">
        <Label :for="switchId" class="text-ui-label cursor-pointer font-medium">
          {{ title }}
        </Label>
        <span v-if="description" class="text-ui-caption text-muted-foreground">
          {{ description }}
        </span>
      </div>
    </div>
    <Switch
      :id="switchId"
      :disabled="disabled"
      :model-value="Boolean(modelValue)"
      @update:model-value="emit('update:modelValue', Boolean($event))"
    />
  </div>
</template>
