import type { FormValues } from '@vben/common-ui';
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { ComponentPropsMap, ComponentType } from './component';

import type { VxeDetailSheetOptions } from '#/components/vxe-detail-sheet/types';

import { computed, defineComponent, Fragment, h, ref } from 'vue';

import { i18n } from '@vben/locales';
import {
  VxeForm as _VxeForm,
  VxeFormGather as _VxeFormGather,
  VxeFormGroup as _VxeFormGroup,
  VxeFormItem as _VxeFormItem,
  VxeInput as _VxeInput,
  VxeNumberInput as _VxeNumberInput,
  VxeSelect as _VxeSelect,
  VxeSwitch as _VxeSwitch,
  VxeTextarea as _VxeTextarea,
  setupVbenVxeTable,
  useVbenVxeGrid as useGrid,
} from '@vben/plugins/vxe-table';

import { Button } from '@tuquet/vue-ui';

import {
  isInteractiveCellClick,
  stripRedundantDetailTriggerVNodes,
  VxeRowDetailSheet,
} from '#/components/vxe-detail-sheet';

import { useVbenForm } from './form';

const reverseI18nCache = new Map<string, string>();
let cachedLocaleCount = 0;

function collectLeafKeys(
  obj: Record<string, any>,
  prefix = '',
  out: Map<string, string> = reverseI18nCache,
) {
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') {
      if (
        !out.has(v) ||
        path.startsWith('common.') ||
        path.startsWith('term.')
      ) {
        out.set(v, path);
      }
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      collectLeafKeys(v, path, out);
    }
  }
}

function resolveVxeTranslate(content: string, args?: any): string {
  if (!content || typeof content !== 'string') {
    return content;
  }
  // Touch reactive locale so Vue/VxeTable tracks language switches
  const currentLocale = i18n.global.locale.value;
  if (content.includes('.') && i18n.global.te(content)) {
    return String(i18n.global.t(content, args ?? {}));
  }
  const messages = i18n.global.messages.value as Record<
    string,
    Record<string, any>
  >;
  const localeKeys = Object.keys(messages);
  if (localeKeys.length !== cachedLocaleCount) {
    reverseI18nCache.clear();
    for (const loc of localeKeys) {
      if (messages[loc]) {
        collectLeafKeys(messages[loc]);
      }
    }
    cachedLocaleCount = localeKeys.length;
  }
  const matchedKey = reverseI18nCache.get(content);
  if (matchedKey && i18n.global.te(matchedKey, currentLocale)) {
    return String(i18n.global.t(matchedKey, args ?? {}));
  }
  return content;
}

setupVbenVxeTable({
  configVxeTable: (vxeUI) => {
    vxeUI.setConfig({
      translate: resolveVxeTranslate,
      zIndex: 2050,
      grid: {
        align: 'left',
        border: false,
        cellConfig: {
          height: 54,
        },
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
        rowConfig: {
          isHover: true,
        },
        showOverflow: true,
        size: 'medium',
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
  },
  useVbenForm,
});

type BaseVbenVxeGridOptions<
  T extends Record<string, any> = any,
  TFormValues extends FormValues = FormValues,
  TSubmitValues extends FormValues = TFormValues,
> = Parameters<
  typeof useGrid<
    T,
    ComponentType,
    ComponentPropsMap,
    TFormValues,
    TSubmitValues
  >
>[0];

type BaseExtendedVxeGridApi<
  T extends Record<string, any> = any,
  TFormValues extends FormValues = FormValues,
  TSubmitValues extends FormValues = TFormValues,
> = ReturnType<
  typeof useGrid<
    T,
    ComponentType,
    ComponentPropsMap,
    TFormValues,
    TSubmitValues
  >
>[1];

type BaseGridComponentType = ReturnType<
  typeof useGrid<any, ComponentType, ComponentPropsMap, any, any>
>[0];

export type AdminVxeGridProps<
  T extends Record<string, any> = any,
  TFormValues extends FormValues = FormValues,
  TSubmitValues extends FormValues = TFormValues,
> = BaseVbenVxeGridOptions<T, TFormValues, TSubmitValues> & {
  detailSheetOptions?: VxeDetailSheetOptions<T>;
};

export type AdminExtendedVxeGridApi<
  T extends Record<string, any> = any,
  TFormValues extends FormValues = FormValues,
  TSubmitValues extends FormValues = TFormValues,
> = BaseExtendedVxeGridApi<T, TFormValues, TSubmitValues> & {
  openDetailSheet: (row: T) => void;
};

const ACTION_SLOT_CANDIDATES = [
  'actions-cell',
  'action-cell',
  'role-actions-cell',
  'perm-actions-cell',
  'detail-cell',
] as const;

export const useVbenVxeGrid = <
  T extends Record<string, any> = Record<string, any>,
  TFormValues extends FormValues = FormValues,
  TSubmitValues extends FormValues = TFormValues,
>(
  options: AdminVxeGridProps<T, TFormValues, TSubmitValues>,
): readonly [
  BaseGridComponentType,
  AdminExtendedVxeGridApi<T, TFormValues, TSubmitValues>,
] => {
  const detailSheetOpen = ref(false);
  const detailSheetRow = ref<null | T>(null);

  const openDetailSheet = (row: T) => {
    if (!row) return;
    detailSheetRow.value = row;
    detailSheetOpen.value = true;
  };

  const originalCellClick = options.gridEvents?.cellClick;
  const isSheetEnabled = options.detailSheetOptions?.enabled !== false;
  const baseGridClass = options.gridClass ?? '';
  const mergedGridClass = isSheetEnabled
    ? [baseGridClass, 'tuquet-vxe-clickable-rows'].filter(Boolean).join(' ')
    : baseGridClass;

  const enhancedOptions: AdminVxeGridProps<T, TFormValues, TSubmitValues> = {
    ...options,
    gridClass: mergedGridClass,
    gridEvents: {
      ...options.gridEvents,
      cellClick(params: any) {
        if (typeof originalCellClick === 'function') {
          originalCellClick(params);
        }
        const sheetOpts = options.detailSheetOptions;
        if (sheetOpts?.enabled === false) {
          return;
        }
        if (!params?.row) {
          return;
        }
        if (isInteractiveCellClick(params.$event)) {
          return;
        }
        openDetailSheet(params.row as T);
      },
    },
  };

  const [BaseGrid, gridApi] = useGrid<
    T,
    ComponentType,
    ComponentPropsMap,
    TFormValues,
    TSubmitValues
  >(enhancedOptions);

  const extendedGridApi = gridApi as AdminExtendedVxeGridApi<
    T,
    TFormValues,
    TSubmitValues
  >;
  extendedGridApi.openDetailSheet = openDetailSheet;

  const gridStoreState = extendedGridApi.useStore();

  const resolvedColumns = computed(() => {
    const cols =
      gridStoreState.value?.gridOptions?.columns ??
      options.gridOptions?.columns ??
      [];
    return (cols as Array<{ field?: string; slots?: any; title?: string }>).map(
      (col) => ({
        field: col?.field,
        slots: col?.slots,
        title: col?.title,
      }),
    );
  });

  const EnhancedGrid = defineComponent({
    name: 'AdminVbenVxeGridWithSheet',
    inheritAttrs: false,
    setup(props, { attrs, slots }) {
      const resolveActionSlot = () => {
        if (options.detailSheetOptions?.forwardActionSlot === false) {
          return undefined;
        }
        const explicitName = options.detailSheetOptions?.actionSlotName;
        if (explicitName && slots[explicitName]) {
          return slots[explicitName];
        }
        for (const col of resolvedColumns.value) {
          const defaultSlotName = col?.slots?.default;
          if (
            typeof defaultSlotName === 'string' &&
            (col.field === 'actions' ||
              defaultSlotName.includes('action') ||
              defaultSlotName.includes('detail')) &&
            slots[defaultSlotName]
          ) {
            return slots[defaultSlotName];
          }
        }
        for (const candidate of ACTION_SLOT_CANDIDATES) {
          if (slots[candidate]) {
            return slots[candidate];
          }
        }
        return undefined;
      };

      return () => {
        const actionSlotFn = resolveActionSlot();
        return h(Fragment, null, [
          h(BaseGrid as any, { ...props, ...attrs }, slots),
          h(
            VxeRowDetailSheet,
            {
              gridColumns: resolvedColumns.value,
              open: detailSheetOpen.value,
              options: options.detailSheetOptions,
              row: detailSheetRow.value as null | Record<string, any>,
              onSaved: (updatedRow: Record<string, any>) => {
                if (detailSheetRow.value && updatedRow) {
                  Object.assign(detailSheetRow.value, updatedRow);
                }
                void extendedGridApi.reload();
              },
              'onUpdate:open': (val: boolean) => {
                detailSheetOpen.value = val;
              },
            },
            actionSlotFn
              ? {
                  'row-actions': ({ row }: { row: Record<string, any> }) =>
                    stripRedundantDetailTriggerVNodes(
                      actionSlotFn({ row } as any),
                    ),
                }
              : {},
          ),
        ]);
      };
    },
  });

  return [
    EnhancedGrid as unknown as BaseGridComponentType,
    extendedGridApi,
  ] as const;
};

export const VxeForm = _VxeForm;
export const VxeFormGather = _VxeFormGather;
export const VxeFormGroup = _VxeFormGroup;
export const VxeFormItem = _VxeFormItem;
export const VxeInput = _VxeInput;
export const VxeNumberInput = _VxeNumberInput;
export const VxeSelect = _VxeSelect;
export const VxeSwitch = _VxeSwitch;
export const VxeTextarea = _VxeTextarea;

export type {
  VxeDetailSheetAction,
  VxeDetailSheetOptions,
} from '#/components/vxe-detail-sheet/types';
export type * from '@vben/plugins/vxe-table';
