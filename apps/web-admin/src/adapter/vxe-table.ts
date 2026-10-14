import type { FormValues } from '@vben/common-ui';
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { ComponentPropsMap, ComponentType } from './component';

import { h } from 'vue';

import {
  setupVbenVxeTable,
  useVbenVxeGrid as useGrid,
} from '@vben/plugins/vxe-table';

import { Button } from '@tuquet/vue-ui';

import { useVbenForm } from './form';

setupVbenVxeTable({
  configVxeTable: (vxeUI) => {
    vxeUI.setConfig({
      grid: {
        align: 'center',
        border: false,
        columnConfig: {
          resizable: true,
        },
        minHeight: 180,
        formConfig: {
          // Globally disable vxe-table native form config; use formOptions instead
          enabled: false,
        },
        proxyConfig: {
          autoLoad: true,
          response: {
            result: 'items',
            total: 'total',
            list: 'items',
          },
          showActiveMsg: true,
          showResponseMsg: false,
        },
        round: true,
        showOverflow: true,
        size: 'small',
      } as VxeTableGridOptions,
    });

    // Column config can use cellRender: { name: 'CellImage' },
    vxeUI.renderer.add('CellImage', {
      renderTableDefault(renderOpts, params) {
        const { props } = renderOpts;
        const { column, row } = params;
        return h('img', {
          class: 'size-8 rounded object-cover',
          src: row[column.field],
          ...props,
        });
      },
    });

    // Column config can use cellRender: { name: 'CellLink' },
    vxeUI.renderer.add('CellLink', {
      renderTableDefault(renderOpts) {
        const { props } = renderOpts;
        return h(
          Button,
          { size: 'sm', variant: 'link' },
          { default: () => props?.text },
        );
      },
    });

    // Extend vxe-table global configurations here, e.g., custom formatters
    // vxeUI.formats.add
  },
  useVbenForm,
});

export const useVbenVxeGrid = <
  T extends Record<string, any>,
  TFormValues extends FormValues = FormValues,
  TSubmitValues extends FormValues = TFormValues,
>(
  ...rest: Parameters<
    typeof useGrid<
      T,
      ComponentType,
      ComponentPropsMap,
      TFormValues,
      TSubmitValues
    >
  >
) =>
  useGrid<T, ComponentType, ComponentPropsMap, TFormValues, TSubmitValues>(
    ...rest,
  );

import {
  VxeForm as _VxeForm,
  VxeFormGather as _VxeFormGather,
  VxeFormGroup as _VxeFormGroup,
  VxeFormItem as _VxeFormItem,
} from 'vxe-pc-ui';

export const VxeForm = _VxeForm;
export const VxeFormItem = _VxeFormItem;
export const VxeFormGroup = _VxeFormGroup;
export const VxeFormGather = _VxeFormGather;

export type * from '@vben/plugins/vxe-table';
export type * from 'vxe-pc-ui';
