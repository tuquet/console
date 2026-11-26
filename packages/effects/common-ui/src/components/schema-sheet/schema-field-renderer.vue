<script setup lang="ts">
import type { SchemaFieldContext, SchemaFieldDef } from './types';

import { computed } from 'vue';

import { Label, Skeleton } from '@operon-core/shadcn-ui';
import { cn } from '@operon-core/shared/utils';

import { resolveSchemaComponent } from './registry';

const props = defineProps<{
  context: SchemaFieldContext;
  disabled?: boolean;
  error?: string;
  field: SchemaFieldDef;
  layout?: 'descriptions' | 'form' | 'grid';
  modelValue?: unknown;
}>();

const emit = defineEmits<{
  blur: [];
  submit: [];
  'update:modelValue': [value: unknown];
}>();

const resolvedLabel = computed(() =>
  typeof props.field.label === 'function'
    ? props.field.label(props.context)
    : props.field.label,
);

const resolvedDescription = computed(() => {
  if (!props.field.description) return undefined;
  return typeof props.field.description === 'function'
    ? props.field.description(props.context)
    : props.field.description;
});

const isReadOnly = computed(() =>
  typeof props.field.readOnly === 'function'
    ? props.field.readOnly(props.context)
    : Boolean(props.field.readOnly),
);

const isDisabled = computed(
  () =>
    Boolean(props.disabled) ||
    Boolean(props.field.disabledWhen?.(props.context)),
);

const isLoading = computed(() =>
  Boolean(props.field.loadingWhen?.(props.context)),
);

const resolvedValue = computed(() => {
  if (props.field.formatValue) {
    return props.field.formatValue(props.context.record, props.context);
  }
  return props.modelValue;
});

const resolvedComponent = computed(() =>
  resolveSchemaComponent(props.field.component),
);

const resolvedComponentProps = computed(() => {
  const extra =
    typeof props.field.componentProps === 'function'
      ? props.field.componentProps(props.context)
      : (props.field.componentProps ?? {});

  return {
    ...extra,
    ...(props.field.placeholder
      ? { placeholder: props.field.placeholder }
      : {}),
    ...(isDisabled.value ? { disabled: true } : {}),
    ...(props.error ? { 'aria-invalid': true } : {}),
  };
});

function handleUpdate(value: unknown) {
  emit('update:modelValue', value);
}

function handleKeydown(event: KeyboardEvent) {
  if (props.field.onEnterSubmit && event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    emit('submit');
  }
}
</script>

<template>
  <!-- Compact Key-Value Row for Descriptions -->
  <div
    v-if="layout === 'descriptions'"
    class="text-ui-body flex items-start justify-between gap-3 py-0.5"
  >
    <span class="text-ui-label text-muted-foreground shrink-0 pt-0.5">
      {{ resolvedLabel }}
    </span>
    <div class="flex min-w-0 flex-1 justify-end text-right">
      <Skeleton v-if="isLoading" class="h-4 w-16" />
      <component
        :is="resolvedComponent"
        v-else
        v-bind="resolvedComponentProps"
        :model-value="resolvedValue"
        @update:model-value="handleUpdate"
      />
    </div>
  </div>

  <!-- 2-Column Metadata Grid Cell -->
  <div
    v-else-if="layout === 'grid'"
    :class="
      cn(
        'text-ui-body flex min-w-0 flex-col gap-0.5',
        field.colSpan === 2 && 'col-span-2',
      )
    "
  >
    <span class="text-ui-caption text-muted-foreground">{{
      resolvedLabel
    }}</span>
    <Skeleton v-if="isLoading" class="h-4 w-20" />
    <component
      :is="resolvedComponent"
      v-else
      v-bind="resolvedComponentProps"
      :model-value="resolvedValue"
      @update:model-value="handleUpdate"
    />
  </div>

  <!-- Standard Form Field -->
  <div
    v-else
    :class="
      cn('flex min-w-0 flex-col gap-1.5', field.colSpan === 2 && 'col-span-2')
    "
  >
    <div v-if="resolvedLabel" class="flex items-center justify-between gap-2">
      <Label class="text-ui-label font-medium">
        {{ resolvedLabel }}
        <span v-if="field.required && !isReadOnly" class="text-destructive">
          *
        </span>
      </Label>
      <span
        v-if="resolvedDescription"
        class="text-ui-caption text-muted-foreground truncate"
      >
        {{ resolvedDescription }}
      </span>
    </div>

    <Skeleton v-if="isLoading" class="h-9 w-full" />
    <component
      :is="resolvedComponent"
      v-else
      v-bind="resolvedComponentProps"
      :model-value="resolvedValue"
      @blur="emit('blur')"
      @keydown="handleKeydown"
      @update:model-value="handleUpdate"
    />

    <p v-if="error" class="text-ui-caption text-destructive">
      {{ error }}
    </p>
  </div>
</template>
