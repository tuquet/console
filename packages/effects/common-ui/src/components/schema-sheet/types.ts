import type { Component } from 'vue';

export interface SchemaSafeParseLike {
  safeParse: (value: unknown) => {
    error?: { issues?: Array<{ message?: string }> };
    success: boolean;
  };
}

export type SchemaSheetMode = 'create' | 'edit' | 'view';

export type SchemaBadgeVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary';

export type SchemaButtonVariant =
  | 'default'
  | 'destructive'
  | 'ghost'
  | 'link'
  | 'outline'
  | 'secondary';

export type BuiltInSchemaComponentKey =
  | 'ActionSelect'
  | 'BadgeValue'
  | 'ByteSize'
  | 'Checkbox'
  | 'CopyableCode'
  | 'Input'
  | 'InputNumber'
  | 'OptionSelect'
  | 'ProgressStatus'
  | 'ProgressSteps'
  | 'Select'
  | 'Switch'
  | 'SwitchCard'
  | 'TagList'
  | 'Text'
  | 'Textarea'
  | 'ToggleGroup';

export type SchemaComponentKey =
  | BuiltInSchemaComponentKey
  | (Record<never, never> & string);

export interface SchemaFieldContext<
  TRecord = any,
  TForm extends Record<string, any> = Record<string, any>,
> {
  form: TForm;
  mode: SchemaSheetMode;
  record: null | TRecord;
}

export interface SchemaFieldChangeContext<
  TRecord = any,
  TForm extends Record<string, any> = Record<string, any>,
> extends SchemaFieldContext<TRecord, TForm> {
  setFieldValue: (fieldName: string, value: any) => void;
}

export interface SchemaSelectOption {
  avatarClass?: string;
  badge?: string;
  disabled?: boolean;
  icon?: Component;
  initials?: string;
  italic?: boolean;
  label: string;
  value: string;
}

export interface SchemaFieldDef<
  TRecord = any,
  TForm extends Record<string, any> = Record<string, any>,
> {
  /** 1 = half-width in 2-col grid, 2 = full-width */
  colSpan?: 1 | 2;
  component: Component | SchemaComponentKey;
  componentProps?:
    | ((ctx: SchemaFieldContext<TRecord, TForm>) => Record<string, any>)
    | Record<string, any>;
  defaultValue?: any;
  description?: ((ctx: SchemaFieldContext<TRecord, TForm>) => string) | string;
  disabledWhen?: (ctx: SchemaFieldContext<TRecord, TForm>) => boolean;
  formatValue?: (
    record: null | TRecord,
    ctx: SchemaFieldContext<TRecord, TForm>,
  ) => any;
  label: ((ctx: SchemaFieldContext<TRecord, TForm>) => string) | string;
  loadingWhen?: (ctx: SchemaFieldContext<TRecord, TForm>) => boolean;
  name: string;
  onEnterSubmit?: boolean;
  onValueChange?: (
    value: any,
    ctx: SchemaFieldChangeContext<TRecord, TForm>,
  ) => void;
  placeholder?: string;
  readOnly?: ((ctx: SchemaFieldContext<TRecord, TForm>) => boolean) | boolean;
  required?: boolean;
  rules?:
    | ((value: any, ctx: SchemaFieldContext<TRecord, TForm>) => string | true)
    | SchemaSafeParseLike;
  visibleWhen?: (ctx: SchemaFieldContext<TRecord, TForm>) => boolean;
}

export interface SchemaSectionDef<
  TRecord = any,
  TForm extends Record<string, any> = Record<string, any>,
> {
  bordered?: boolean;
  columns?: 1 | 2;
  fields: SchemaFieldDef<TRecord, TForm>[];
  id: string;
  kind: 'descriptions' | 'form' | 'grid';
  tab?: string;
  tabLabel?: string;
  title?: string;
  visibleWhen?: (ctx: SchemaFieldContext<TRecord, TForm>) => boolean;
}

export interface SchemaActionDef<
  TRecord = any,
  TForm extends Record<string, any> = Record<string, any>,
> {
  class?: string;
  closeOnSuccess?: boolean;
  confirmLabel?: ((ctx: SchemaFieldContext<TRecord, TForm>) => string) | string;
  disabledWhen?: (ctx: SchemaFieldContext<TRecord, TForm>) => boolean;
  icon?: Component;
  key: string;
  label: ((ctx: SchemaFieldContext<TRecord, TForm>) => string) | string;
  loadingWhen?: (ctx: SchemaFieldContext<TRecord, TForm>) => boolean;
  onClick?: (ctx: SchemaFieldContext<TRecord, TForm>) => Promise<void> | void;
  placement: 'footer-left' | 'footer-right' | 'header-bar' | 'section';
  sectionId?: string;
  submit?: boolean;
  variant?: SchemaButtonVariant;
  visibleWhen?: (ctx: SchemaFieldContext<TRecord, TForm>) => boolean;
}

export interface SchemaHeaderBadge {
  class?: string;
  label: string;
  variant?: SchemaBadgeVariant;
}

export interface SchemaSheetDefinition<
  TRecord = any,
  TForm extends Record<string, any> = Record<string, any>,
> {
  actions?: SchemaActionDef<TRecord, TForm>[];
  badges?: (ctx: SchemaFieldContext<TRecord, TForm>) => SchemaHeaderBadge[];
  copyableId?: (
    ctx: SchemaFieldContext<TRecord, TForm>,
  ) => null | string | undefined;
  copyableIdTitle?:
    | ((ctx: SchemaFieldContext<TRecord, TForm>) => string)
    | string;
  defaultTab?: string;
  description?: ((ctx: SchemaFieldContext<TRecord, TForm>) => string) | string;
  key?: string;
  metaText?: (
    ctx: SchemaFieldContext<TRecord, TForm>,
  ) => null | string | undefined;
  onSubmit?: (
    values: TForm,
    ctx: SchemaFieldContext<TRecord, TForm>,
  ) => Promise<void> | void;
  sections: SchemaSectionDef<TRecord, TForm>[];
  showCloseInFooter?: boolean;
  title: ((ctx: SchemaFieldContext<TRecord, TForm>) => string) | string;
  toInitialValues?: (record: null | TRecord, mode: SchemaSheetMode) => TForm;
  widthClass?: string;
}
