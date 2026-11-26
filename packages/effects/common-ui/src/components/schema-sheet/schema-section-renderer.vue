<script setup lang="ts">
import type {
  SchemaActionDef,
  SchemaFieldContext,
  SchemaFieldDef,
  SchemaSectionDef,
} from './types';

import { computed } from 'vue';

import { Button } from '@operon-core/shadcn-ui';
import { cn } from '@operon-core/shared/utils';

import { Loader2 } from '@lucide/vue';

import SchemaFieldRenderer from './schema-field-renderer.vue';

const props = defineProps<{
  actionLoadingKey?: null | string;
  context: SchemaFieldContext;
  errors: Record<string, string>;
  section: SchemaSectionDef;
  sectionActions?: SchemaActionDef[];
  submitting?: boolean;
}>();

const emit = defineEmits<{
  action: [action: SchemaActionDef];
  blurField: [fieldName: string];
  submit: [];
  updateField: [field: SchemaFieldDef, value: unknown];
}>();

const visibleFields = computed(() =>
  props.section.fields.filter((f) =>
    f.visibleWhen ? f.visibleWhen(props.context) : true,
  ),
);

const visibleActions = computed(() =>
  (props.sectionActions ?? []).filter((a) =>
    a.visibleWhen ? a.visibleWhen(props.context) : true,
  ),
);

function actionLabel(action: SchemaActionDef): string {
  return typeof action.label === 'function'
    ? action.label(props.context)
    : action.label;
}
</script>

<template>
  <section
    v-if="visibleFields.length > 0 || visibleActions.length > 0"
    class="flex flex-col gap-3"
  >
    <h3
      v-if="section.title"
      class="text-muted-foreground font-medium tracking-wide"
    >
      {{ section.title }}
    </h3>

    <!-- Descriptions Box / Rows -->
    <div
      v-if="section.kind === 'descriptions'"
      :class="
        cn(
          'flex flex-col gap-2',
          section.bordered !== false && 'border-border rounded-lg border p-3',
        )
      "
    >
      <SchemaFieldRenderer
        v-for="field in visibleFields"
        :key="field.name"
        layout="descriptions"
        :context="context"
        :disabled="submitting"
        :error="errors[field.name]"
        :field="field"
        :model-value="context.form[field.name]"
        @blur="emit('blurField', field.name)"
        @submit="emit('submit')"
        @update:model-value="(val) => emit('updateField', field, val)"
      />
    </div>

    <!-- Compact 2-Column Metadata Grid -->
    <div
      v-else-if="section.kind === 'grid'"
      :class="
        cn(
          'grid grid-cols-2 gap-3',
          section.bordered !== false && 'border-border rounded-lg border p-3',
        )
      "
    >
      <SchemaFieldRenderer
        v-for="field in visibleFields"
        :key="field.name"
        layout="grid"
        :context="context"
        :disabled="submitting"
        :error="errors[field.name]"
        :field="field"
        :model-value="context.form[field.name]"
        @blur="emit('blurField', field.name)"
        @submit="emit('submit')"
        @update:model-value="(val) => emit('updateField', field, val)"
      />
    </div>

    <!-- Form Fields Grid -->
    <div
      v-else
      :class="
        cn(
          'grid gap-3.5',
          section.columns === 2 ? 'grid-cols-2' : 'grid-cols-1',
          section.bordered && 'border-border rounded-lg border p-3',
        )
      "
    >
      <SchemaFieldRenderer
        v-for="field in visibleFields"
        :key="field.name"
        layout="form"
        :context="context"
        :disabled="submitting"
        :error="errors[field.name]"
        :field="field"
        :model-value="context.form[field.name]"
        @blur="emit('blurField', field.name)"
        @submit="emit('submit')"
        @update:model-value="(val) => emit('updateField', field, val)"
      />
    </div>

    <!-- Section-scoped Actions -->
    <div v-if="visibleActions.length > 0" class="flex flex-wrap gap-2">
      <Button
        v-for="act in visibleActions"
        :key="act.key"
        type="button"
        size="sm"
        :variant="act.variant ?? 'default'"
        :class="cn('h-8 gap-1.5', act.class)"
        :disabled="
          submitting ||
          actionLoadingKey === act.key ||
          act.disabledWhen?.(context)
        "
        @click="emit('action', act)"
      >
        <Loader2
          v-if="actionLoadingKey === act.key || act.loadingWhen?.(context)"
          class="size-3.5 animate-spin"
        />
        <component :is="act.icon" v-else-if="act.icon" class="size-3.5" />
        <span>{{ actionLabel(act) }}</span>
      </Button>
    </div>
  </section>
</template>
