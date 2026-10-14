/**
 * Universal component adapter for Vben Form / Common UI
 * Powered by @tuquet/vue-ui
 */

/* eslint-disable vue/one-component-per-file */

import type { Component } from 'vue';

import type { BaseFormComponentType, IconPickerProps } from '@vben/common-ui';

import { defineComponent, h, ref } from 'vue';

import { globalShareState, IconPicker } from '@vben/common-ui';
import { $t } from '@vben/locales';

import {
  Button,
  Checkbox,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Switch,
  Textarea,
  toast,
} from '@tuquet/vue-ui';

const withDefaultPlaceholder = (
  component: Component,
  type: 'input' | 'select',
) => {
  return defineComponent({
    name: component.name,
    inheritAttrs: false,
    setup: (props: any, { attrs, expose, slots }) => {
      const placeholder =
        props?.placeholder ||
        attrs?.placeholder ||
        $t(`ui.placeholder.${type}`);
      const innerRef = ref();
      expose(
        new Proxy(
          {},
          {
            get: (_target, key) => innerRef.value?.[key],
            has: (_target, key) => key in (innerRef.value || {}),
          },
        ),
      );
      return () =>
        h(component, { placeholder, ...props, ...attrs, ref: innerRef }, slots);
    },
  });
};

const FallbackComponent = defineComponent({
  name: 'FallbackComponent',
  props: {
    modelValue: {
      default: undefined,
      type: [String, Number, Boolean, Object, Array],
    },
    value: {
      default: undefined,
      type: [String, Number, Boolean, Object, Array],
    },
  },
  setup(_props, { attrs, slots }) {
    return () => h('div', attrs, slots);
  },
});

export type ComponentType =
  | 'ApiCascader'
  | 'ApiSelect'
  | 'ApiTreeSelect'
  | 'AutoComplete'
  | 'Cascader'
  | 'Checkbox'
  | 'CheckboxGroup'
  | 'DatePicker'
  | 'DefaultButton'
  | 'Divider'
  | 'IconPicker'
  | 'Input'
  | 'InputNumber'
  | 'InputPassword'
  | 'Mentions'
  | 'PrimaryButton'
  | 'Radio'
  | 'RadioGroup'
  | 'RangePicker'
  | 'Rate'
  | 'Select'
  | 'Space'
  | 'Switch'
  | 'Textarea'
  | 'TimePicker'
  | 'TreeSelect'
  | 'Upload'
  | BaseFormComponentType;

export interface ComponentPropsMap {
  ApiCascader: Record<string, any>;
  ApiSelect: Record<string, any>;
  ApiTreeSelect: Record<string, any>;
  AutoComplete: Record<string, any>;
  Cascader: Record<string, any>;
  Checkbox: Record<string, any>;
  CheckboxGroup: Record<string, any>;
  DatePicker: Record<string, any>;
  DefaultButton: Record<string, any>;
  Divider: Record<string, any>;
  IconPicker: IconPickerProps;
  Input: Record<string, any>;
  InputNumber: Record<string, any>;
  InputPassword: Record<string, any>;
  Mentions: Record<string, any>;
  PrimaryButton: Record<string, any>;
  Radio: Record<string, any>;
  RadioGroup: Record<string, any>;
  RangePicker: Record<string, any>;
  Rate: Record<string, any>;
  Select: Record<string, any>;
  Space: Record<string, any>;
  Switch: Record<string, any>;
  Textarea: Record<string, any>;
  TimePicker: Record<string, any>;
  TreeSelect: Record<string, any>;
  Upload: Record<string, any>;
}

async function initComponentAdapter() {
  const components: Partial<Record<ComponentType, Component>> = {
    ApiCascader: FallbackComponent,
    ApiSelect: FallbackComponent,
    ApiTreeSelect: FallbackComponent,
    AutoComplete: FallbackComponent,
    Cascader: FallbackComponent,
    Checkbox: (props: any, { attrs, slots }: any) =>
      h(Checkbox, { ...props, ...attrs }, slots),
    CheckboxGroup: FallbackComponent,
    DatePicker: FallbackComponent,
    DefaultButton: (props, { attrs, slots }) => {
      return h(Button, { ...props, ...attrs, variant: 'outline' }, slots);
    },
    Divider: (props, { attrs }) =>
      h(Separator, { class: 'my-4', ...props, ...attrs }),
    IconPicker: withDefaultPlaceholder(IconPicker, 'select'),
    Input: withDefaultPlaceholder(Input, 'input'),
    InputNumber: withDefaultPlaceholder(
      (props: any, { attrs }: any) =>
        h(Input, { type: 'number', ...props, ...attrs }),
      'input',
    ),
    InputPassword: withDefaultPlaceholder(
      (props: any, { attrs }: any) =>
        h(Input, { type: 'password', ...props, ...attrs }),
      'input',
    ),
    Mentions: withDefaultPlaceholder(Input, 'input'),
    PrimaryButton: (props, { attrs, slots }) => {
      return h(Button, { ...props, ...attrs, variant: 'default' }, slots);
    },
    Radio: (props, { attrs }) =>
      h('input', {
        class: 'size-4 text-primary',
        type: 'radio',
        ...props,
        ...attrs,
      }),
    RadioGroup: FallbackComponent,
    RangePicker: FallbackComponent,
    Rate: FallbackComponent,
    Select: withDefaultPlaceholder((props: any, { attrs }: any) => {
      const options: Array<{
        disabled?: boolean;
        label?: string;
        title?: string;
        value: any;
      }> = props?.options || attrs?.options || [];
      const rawValue =
        props?.modelValue ?? attrs?.modelValue ?? props?.value ?? attrs?.value;
      const modelValue =
        rawValue !== undefined && rawValue !== null
          ? String(rawValue)
          : undefined;
      const placeholder =
        props?.placeholder || attrs?.placeholder || $t('ui.placeholder.select');
      const disabled = props?.disabled ?? attrs?.disabled ?? false;

      const handleUpdate = (val: any) => {
        if (attrs['onUpdate:modelValue']) attrs['onUpdate:modelValue'](val);
        if (attrs['onUpdate:value']) attrs['onUpdate:value'](val);
        if (props['onUpdate:modelValue']) props['onUpdate:modelValue'](val);
        if (props['onUpdate:value']) props['onUpdate:value'](val);
        if (attrs.onChange) attrs.onChange(val);
        if (props.onChange) props.onChange(val);
      };

      return h(
        Select,
        {
          disabled,
          modelValue,
          'onUpdate:modelValue': handleUpdate,
        },
        () => [
          h(
            SelectTrigger,
            {
              class:
                'h-9 w-full bg-background/90 text-xs shadow-2xs transition-colors hover:bg-accent/40',
            },
            () => h(SelectValue, { placeholder }),
          ),
          h(
            SelectContent,
            {
              class: 'z-popup min-w-[8rem]',
            },
            () =>
              options.map((opt) =>
                h(
                  SelectItem,
                  {
                    class: 'text-xs cursor-pointer',
                    disabled: opt.disabled,
                    key: String(opt.value),
                    value: String(opt.value),
                  },
                  () => opt.label ?? opt.title ?? String(opt.value),
                ),
              ),
          ),
        ],
      );
    }, 'select'),
    Space: (props, { attrs, slots }) =>
      h('div', { class: 'flex items-center gap-2', ...props, ...attrs }, slots),
    Switch,
    Textarea: withDefaultPlaceholder(Textarea, 'input'),
    TimePicker: FallbackComponent,
    TreeSelect: FallbackComponent,
    Upload: FallbackComponent,
  };

  globalShareState.setComponents(components);

  globalShareState.defineMessage({
    copyPreferencesSuccess: (title, content) => {
      toast.success(
        title ? `${title}: ${content ?? ''}` : (content ?? 'Copied'),
      );
    },
  });
}

export { initComponentAdapter };
