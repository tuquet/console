import type {
  BaseFormComponentType,
  ExtendedFormApi,
  FormValues,
  OperonFormComponent,
  OperonFormProps,
} from './types';

import { defineComponent, h, isReactive, onBeforeUnmount, watch } from 'vue';

import { useSelector } from '@operon-core/shared/store';

import { FormApi } from './form-api';
import OperonUseForm from './operon-use-form.vue';

type UseOperonFormReturn<
  TValues extends FormValues,
  T extends BaseFormComponentType,
  P extends Record<string, any>,
  TSubmitValues extends FormValues = TValues,
> = readonly [
  OperonFormComponent<TValues, T, P, TSubmitValues>,
  ExtendedFormApi<TValues, T, P, TSubmitValues>,
];

export function useOperonForm<
  T extends BaseFormComponentType = BaseFormComponentType,
  P extends Record<string, any> = Record<never, never>,
>(options: OperonFormProps<T, P>): UseOperonFormReturn<FormValues, T, P>;

export function useOperonForm<
  TValues extends FormValues,
  T extends BaseFormComponentType = BaseFormComponentType,
  P extends Record<string, any> = Record<never, never>,
  TSubmitValues extends FormValues = TValues,
>(
  options: OperonFormProps<T, P, TValues, TSubmitValues>,
): UseOperonFormReturn<TValues, T, P, TSubmitValues>;

export function useOperonForm(
  options: OperonFormProps<any, any, any, any>,
): UseOperonFormReturn<any, any, any, any> {
  const IS_REACTIVE = isReactive(options);
  const api = new FormApi<any, any, any, any>(options);
  const extendedApi = api as ExtendedFormApi<any, any, any, any>;
  extendedApi.useStore = (selector: any) => {
    return useSelector(api.store, selector);
  };

  const Form = defineComponent(
    (props: OperonFormProps, { attrs, slots }) => {
      onBeforeUnmount(() => {
        api.unmount();
      });
      api.setState({ ...props, ...attrs });
      return () =>
        h(OperonUseForm, { ...props, ...attrs, formApi: extendedApi }, slots);
    },
    {
      name: 'OperonUseForm',
      inheritAttrs: false,
    },
  );
  // Add reactivity support
  if (IS_REACTIVE) {
    watch(
      () => options.schema,
      () => {
        api.setState({ schema: options.schema });
      },
      { immediate: true },
    );
  }

  return [Form, extendedApi] as unknown as UseOperonFormReturn<
    any,
    any,
    any,
    any
  >;
}
