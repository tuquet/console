export {
  BUILTIN_SCHEMA_COMPONENTS,
  defineSchemaSheet,
  getResourceSchema,
  registerResourceSchema,
  registerSchemaComponents,
  resolveSchemaComponent,
} from './registry';
export { default as SchemaFieldRenderer } from './schema-field-renderer.vue';
export { default as SchemaSectionRenderer } from './schema-section-renderer.vue';
export { default as SchemaSheet } from './schema-sheet.vue';
export type {
  BuiltInSchemaComponentKey,
  SchemaActionDef,
  SchemaBadgeVariant,
  SchemaButtonVariant,
  SchemaComponentKey,
  SchemaFieldChangeContext,
  SchemaFieldContext,
  SchemaFieldDef,
  SchemaHeaderBadge,
  SchemaSectionDef,
  SchemaSelectOption,
  SchemaSheetDefinition,
  SchemaSheetMode,
} from './types';
export type { SchemaProgressStatusValue } from './widgets/schema-progress-status.vue';
