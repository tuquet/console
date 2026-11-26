import type { Component } from 'vue';

import type { SchemaComponentKey, SchemaSheetDefinition } from './types';

import { defineComponent, h } from 'vue';

import { Checkbox, Input, Switch, Textarea } from '@operon-core/shadcn-ui';
import { globalShareState } from '@operon-core/shared/global-state';

import SchemaActionSelect from './widgets/schema-action-select.vue';
import SchemaBadgeValue from './widgets/schema-badge-value.vue';
import SchemaByteSize from './widgets/schema-byte-size.vue';
import SchemaCopyableCode from './widgets/schema-copyable-code.vue';
import SchemaOptionSelect from './widgets/schema-option-select.vue';
import SchemaProgressStatus from './widgets/schema-progress-status.vue';
import SchemaProgressSteps from './widgets/schema-progress-steps.vue';
import SchemaSwitchCard from './widgets/schema-switch-card.vue';
import SchemaTagList from './widgets/schema-tag-list.vue';
import SchemaText from './widgets/schema-text.vue';
import SchemaToggleGroup from './widgets/schema-toggle-group.vue';

const InputNumberAdapter = defineComponent({
  name: 'SchemaInputNumberAdapter',
  setup(props, { attrs }) {
    return () => h(Input, { type: 'number', ...props, ...attrs });
  },
});

export const BUILTIN_SCHEMA_COMPONENTS: Record<string, Component> = {
  ActionSelect: SchemaActionSelect,
  BadgeValue: SchemaBadgeValue,
  ByteSize: SchemaByteSize,
  Checkbox,
  CopyableCode: SchemaCopyableCode,
  Input,
  InputNumber: InputNumberAdapter,
  OptionSelect: SchemaOptionSelect,
  ProgressStatus: SchemaProgressStatus,
  ProgressSteps: SchemaProgressSteps,
  Select: SchemaOptionSelect,
  Switch,
  SwitchCard: SchemaSwitchCard,
  TagList: SchemaTagList,
  Text: SchemaText,
  Textarea,
  ToggleGroup: SchemaToggleGroup,
};

const customComponents = new Map<string, Component>();
const resourceSchemas = new Map<string, SchemaSheetDefinition<any, any>>();

export function defineSchemaSheet<
  TRecord = any,
  TForm extends Record<string, any> = Record<string, any>,
>(definition: SchemaSheetDefinition<TRecord, TForm>) {
  if (definition.key) {
    resourceSchemas.set(definition.key, definition);
  }
  return definition;
}

export function registerResourceSchema<
  TRecord = any,
  TForm extends Record<string, any> = Record<string, any>,
>(key: string, definition: SchemaSheetDefinition<TRecord, TForm>) {
  resourceSchemas.set(key, definition);
  return definition;
}

export function getResourceSchema<
  TRecord = any,
  TForm extends Record<string, any> = Record<string, any>,
>(key: string): SchemaSheetDefinition<TRecord, TForm> | undefined {
  return resourceSchemas.get(key);
}

export function registerSchemaComponents(
  components: Record<string, Component>,
) {
  for (const [key, comp] of Object.entries(components)) {
    customComponents.set(key, comp);
  }
}

export function resolveSchemaComponent(
  component: Component | SchemaComponentKey,
): Component {
  if (typeof component !== 'string') {
    return component;
  }
  const registered = customComponents.get(component);
  if (registered) return registered;

  const builtIn = BUILTIN_SCHEMA_COMPONENTS[component];
  if (builtIn) return builtIn;

  const shared = globalShareState.getComponents()?.[component] as
    | Component
    | undefined;
  if (shared) return shared;

  return SchemaText;
}
