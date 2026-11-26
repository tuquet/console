<script setup lang="ts">
import type { Component } from 'vue';

import type { SchemaSelectOption } from '../types';

import { computed } from 'vue';

import {
  Avatar,
  AvatarFallback,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@operon-core/shadcn-ui';
import { cn } from '@operon-core/shared/utils';

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    fallbackIcon?: Component;
    modelValue?: null | string;
    nullableSentinel?: string;
    options?: SchemaSelectOption[];
    placeholder?: string;
    triggerClass?: string;
  }>(),
  {
    disabled: false,
    fallbackIcon: undefined,
    modelValue: undefined,
    nullableSentinel: undefined,
    options: () => [],
    placeholder: 'Select...',
    triggerClass: 'text-ui-input h-10 w-full sm:h-9',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: null | string];
}>();

const normalizedValue = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined) {
    return props.nullableSentinel ?? undefined;
  }
  return String(props.modelValue);
});

const selectedOption = computed(() =>
  props.options.find((opt) => opt.value === normalizedValue.value),
);

function handleUpdate(val: unknown) {
  const str = val === undefined || val === null ? '' : String(val);
  if (props.nullableSentinel && str === props.nullableSentinel) {
    emit('update:modelValue', null);
    return;
  }
  emit('update:modelValue', str);
}
</script>

<template>
  <Select
    :disabled="disabled"
    :model-value="normalizedValue"
    @update:model-value="handleUpdate"
  >
    <SelectTrigger :class="triggerClass">
      <SelectValue :placeholder="placeholder">
        <div v-if="selectedOption" class="flex items-center gap-2 truncate">
          <Avatar
            v-if="selectedOption.initials"
            class="size-4 shrink-0 text-[9px]"
          >
            <AvatarFallback
              :class="cn('font-semibold', selectedOption.avatarClass)"
            >
              {{ selectedOption.initials }}
            </AvatarFallback>
          </Avatar>
          <component
            :is="selectedOption.icon || fallbackIcon"
            v-else-if="selectedOption.icon || fallbackIcon"
            class="text-muted-foreground size-3.5 shrink-0"
          />
          <span
            :class="
              cn(
                'truncate',
                selectedOption.italic && 'text-muted-foreground italic',
              )
            "
          >
            {{ selectedOption.label }}
          </span>
        </div>
        <div
          v-else-if="fallbackIcon && modelValue"
          class="flex items-center gap-2 truncate"
        >
          <component
            :is="fallbackIcon"
            class="text-muted-foreground size-3.5 shrink-0"
          />
          <span class="truncate">{{ modelValue }}</span>
        </div>
      </SelectValue>
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectItem
          v-for="opt in options"
          :key="opt.value"
          :value="opt.value"
          :disabled="opt.disabled"
          class="text-ui-body"
        >
          <div class="flex w-full items-center gap-2">
            <Avatar v-if="opt.initials" class="size-5 shrink-0 text-xs">
              <AvatarFallback :class="cn('font-semibold', opt.avatarClass)">
                {{ opt.initials }}
              </AvatarFallback>
            </Avatar>
            <component
              :is="opt.icon"
              v-else-if="opt.icon"
              class="text-muted-foreground size-3.5 shrink-0"
            />
            <span
              :class="
                cn('truncate', opt.italic && 'text-muted-foreground italic')
              "
            >
              {{ opt.label }}
            </span>
            <span
              v-if="opt.badge"
              class="text-ui-caption text-muted-foreground ml-auto"
            >
              {{ opt.badge }}
            </span>
          </div>
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>
