import type { FormValues } from '@operon/common-ui';
import type { VxeTableGridOptions } from '@operon/plugins/vxe-table';

import type { ComponentPropsMap, ComponentType } from './component';

import type {
  VxeDetailSheetMode,
  VxeDetailSheetOptions,
} from '#/components/vxe-detail-sheet/types';

import { computed, defineComponent, Fragment, h, ref, watch } from 'vue';

import { i18n } from '@operon/locales';
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
} from '@operon/plugins/vxe-table';
import { usePreferences } from '@operon/preferences';

import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@operon-core/shadcn-ui';

import { MoreHorizontal } from '@lucide/vue';

import {
  isInteractiveCellClick,
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

let registeredVxeUI: any;
export const getVxeUI = () => registeredVxeUI;

setupVbenVxeTable({
  configVxeTable: (vxeUI) => {
    registeredVxeUI = vxeUI;
    vxeUI.setConfig({
      translate: resolveVxeTranslate,
      grid: {
        align: 'left',
        autoResize: true,
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
        scrollX: {
          enabled: false,
        },
        scrollY: {
          enabled: true,
          gt: 30,
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

    // Formatted date cell: cellRender: { name: 'CellDate' }
    vxeUI.renderer.add('CellDate', {
      renderTableDefault(renderOpts, params) {
        const { props } = renderOpts;
        const { column, row } = params;
        const raw = row[column.field];
        if (!raw) return h('span', { class: 'text-muted-foreground' }, '—');

        let text = String(raw);
        try {
          const opts: Intl.DateTimeFormatOptions = props?.options || {
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            month: '2-digit',
            year: 'numeric',
          };
          text = new Date(raw).toLocaleString('vi-VN', opts);
        } catch {
          // fallback to raw string
        }

        return h('span', { class: ' text-muted-foreground' }, text);
      },
    });

    // ID Shortener & Copy: cellRender: { name: 'CellIdCopy' }
    vxeUI.renderer.add('CellIdCopy', {
      renderTableDefault(_renderOpts, params) {
        const { column, row } = params;
        const id = String(row[column.field] || '');
        if (!id) return h('span', { class: 'text-muted-foreground' }, '—');

        const shortId =
          id.length > 12 ? `${id.slice(0, 8)}...${id.slice(-4)}` : id;

        return h('div', { class: 'inline-flex items-center gap-1.5' }, [
          h(
            Badge,
            {
              variant: 'secondary',
              class: '  text-muted-foreground px-1.5 py-0',
              title: id,
            },
            () => shortId,
          ),
          h(
            Button,
            {
              class:
                'size-6 shrink-0 text-muted-foreground hover:text-foreground',
              size: 'icon',
              title: 'Copy ID',
              variant: 'ghost',
              onClick(e: MouseEvent) {
                e.stopPropagation();
                if (navigator?.clipboard?.writeText) {
                  navigator.clipboard.writeText(id);
                }
              },
            },
            {
              default: () => [
                h(
                  'svg',
                  {
                    class: 'size-3.5',
                    fill: 'none',
                    height: '24',
                    stroke: 'currentColor',
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    strokeWidth: '2',
                    viewBox: '0 0 24 24',
                    width: '24',
                    xmlns: 'http://www.w3.org/2000/svg',
                  },
                  [
                    h('rect', {
                      height: '13',
                      rx: '2',
                      ry: '2',
                      width: '13',
                      x: '9',
                      y: '9',
                    }),
                    h('path', {
                      d: 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
                    }),
                  ],
                ),
              ],
            },
          ),
        ]);
      },
    });

    // Semantic Status Badge with dot: cellRender: { name: 'CellStatus', props: { statusMap } }
    vxeUI.renderer.add('CellStatus', {
      renderTableDefault(renderOpts, params) {
        const { props } = renderOpts;
        const { column, row } = params;
        const val = row[column.field];
        const statusMap = props?.statusMap || {};
        const config = statusMap[val] || {
          label: String(val ?? '—'),
          variant: 'muted',
        };

        const dotClassMap: Record<string, string> = {
          destructive: 'bg-destructive',
          muted: 'bg-muted-foreground',
          primary: 'bg-primary',
          secondary: 'bg-secondary-foreground',
          success: 'bg-success',
          warning: 'bg-warning',
        };
        const dotClasses = dotClassMap[config.variant] || 'bg-muted-foreground';
        const pulseClass = config.pulse ? ' animate-pulse' : '';

        return h(
          Badge,
          { class: '', variant: 'outline' },
          {
            default: () => [
              h('span', {
                class: `mr-1.5 size-1.5 rounded-full ${dotClasses}${pulseClass}`,
              }),
              config.label,
            ],
          },
        );
      },
    });

    // Tag / Badge Renderer: cellRender: { name: 'CellTag', props: { variant, prefix, suffix, uppercase, capitalize } }
    vxeUI.renderer.add('CellTag', {
      renderTableDefault(renderOpts, params) {
        const { props } = renderOpts;
        const { column, row } = params;
        const raw = row[column.field];
        if (raw === undefined || raw === null || raw === '') {
          return h('span', { class: 'text-muted-foreground' }, '—');
        }

        let text = String(raw);
        if (props?.uppercase) text = text.toUpperCase();
        if (props?.prefix) text = `${props.prefix}${text}`;
        if (props?.suffix) text = `${text}${props.suffix}`;

        const badgeClass = props?.capitalize ? 'capitalize' : '';
        const variant = props?.variant || 'secondary';

        return h(Badge, { class: badgeClass, variant }, () => text);
      },
    });

    // Row Action Menu: cellRender: { name: 'CellActions', props: { actions: [...] } }
    vxeUI.renderer.add('CellActions', {
      renderTableDefault(renderOpts, params) {
        const { props } = renderOpts;
        const rawActions =
          typeof props?.actions === 'function'
            ? props.actions(params)
            : props?.actions;
        if (!Array.isArray(rawActions) || rawActions.length === 0) {
          return [] as any;
        }

        const visibleActions = rawActions.filter((act) => {
          if (!act) return false;
          if (typeof act.show === 'function') return act.show(params);
          if (act.show === false) return false;
          return true;
        });

        if (visibleActions.length === 0) return [] as any;

        return h(
          DropdownMenu,
          {},
          {
            default: () => [
              h(
                DropdownMenuTrigger,
                { asChild: true },
                {
                  default: () =>
                    h(
                      Button,
                      {
                        class:
                          'size-7 p-0 text-muted-foreground hover:text-foreground data-[state=open]:bg-muted',
                        size: 'icon',
                        variant: 'ghost',
                        onClick(e: MouseEvent) {
                          e.stopPropagation();
                        },
                      },
                      {
                        default: () => h(MoreHorizontal, { class: 'size-4' }),
                      },
                    ),
                },
              ),
              h(
                DropdownMenuContent,
                { align: props?.align || 'end', class: 'w-44' },
                {
                  default: () =>
                    visibleActions.flatMap((act, idx) => {
                      const isDisabled =
                        typeof act.disabled === 'function'
                          ? act.disabled(params)
                          : Boolean(act.disabled);
                      const isDanger =
                        act.danger || act.variant === 'destructive';
                      const items = [];

                      if (act.separator && idx > 0) {
                        items.push(
                          h(DropdownMenuSeparator, { key: `sep-${idx}` }),
                        );
                      }

                      items.push(
                        h(
                          DropdownMenuItem,
                          {
                            key: act.code || `act-${idx}`,
                            class: [
                              'text-xs cursor-pointer',
                              isDanger &&
                                'text-destructive focus:text-destructive focus:bg-destructive/10',
                            ],
                            disabled: isDisabled,
                            onSelect(e: Event) {
                              e.stopPropagation();
                              if (typeof act.onClick === 'function') {
                                act.onClick(params);
                              }
                            },
                          },
                          {
                            default: () => [
                              act.icon &&
                                h(act.icon, {
                                  class: [
                                    'mr-2 size-3.5',
                                    isDanger
                                      ? 'text-destructive'
                                      : 'text-muted-foreground',
                                  ],
                                }),
                              h('span', { class: 'truncate' }, act.label),
                              act.shortcut &&
                                h(
                                  DropdownMenuShortcut,
                                  { class: 'ml-auto text-[10px]' },
                                  { default: () => act.shortcut },
                                ),
                            ],
                          },
                        ),
                      );
                      return items;
                    }),
                },
              ),
            ],
          },
        );
      },
    });

    // Progress Bar Cell: cellRender: { name: 'CellProgress', props: { max, showText, tone, toneField } }
    vxeUI.renderer.add('CellProgress', {
      renderTableDefault(renderOpts, params) {
        const { props } = renderOpts;
        const { column, row } = params;
        const val = Number(row[column.field] ?? 0);
        const max = Number(props?.max ?? 100);
        const pct = Math.min(100, Math.max(0, Math.round((val / max) * 100)));

        const tone =
          props?.tone || (props?.toneField ? row[props.toneField] : 'primary');
        const toneClassMap: Record<string, string> = {
          danger: 'bg-destructive',
          destructive: 'bg-destructive',
          info: 'bg-primary',
          primary: 'bg-primary',
          success: 'bg-success',
          warning: 'bg-warning',
        };
        const barColorClass = toneClassMap[tone] || 'bg-primary';

        return h('div', { class: 'flex w-full items-center gap-2' }, [
          h(
            'div',
            {
              class:
                'relative h-1.5 w-full min-w-16 overflow-hidden rounded-full bg-muted',
            },
            [
              h('div', {
                class: `h-full rounded-full transition-all duration-300 ${barColorClass}`,
                style: { width: `${pct}%` },
              }),
            ],
          ),
          props?.showText !== false &&
            h(
              'span',
              {
                class:
                  'w-9 shrink-0 text-right font-mono text-[11px] text-muted-foreground',
              },
              `${pct}%`,
            ),
        ]);
      },
    });

    // Formatted Duration Cell: cellRender: { name: 'CellDuration', props: { unit: 's' | 'ms' } }
    vxeUI.renderer.add('CellDuration', {
      renderTableDefault(renderOpts, params) {
        const { props } = renderOpts;
        const { column, row } = params;
        const raw = row[column.field];
        if (raw === undefined || raw === null || raw === '') {
          return h('span', { class: 'text-muted-foreground' }, '—');
        }

        const isMs = props?.unit === 'ms';
        const totalSeconds = Math.round(
          isMs ? Number(raw) / 1000 : Number(raw),
        );

        if (Number.isNaN(totalSeconds) || totalSeconds < 0) {
          return h('span', { class: 'text-muted-foreground' }, '—');
        }

        let formatted: string;
        if (totalSeconds < 1) {
          formatted = '< 1s';
        } else if (totalSeconds < 60) {
          formatted = `${totalSeconds}s`;
        } else if (totalSeconds < 3600) {
          const minutes = Math.floor(totalSeconds / 60);
          const seconds = totalSeconds % 60;
          formatted = seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
        } else {
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          formatted = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
        }

        return h(
          'span',
          { class: 'font-mono text-xs text-muted-foreground' },
          formatted,
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
> = Omit<
  BaseVbenVxeGridOptions<T, TFormValues, TSubmitValues>,
  'gridOptions'
> & {
  detailSheetOptions?: VxeDetailSheetOptions<T>;
  gridOptions?: Omit<
    NonNullable<
      BaseVbenVxeGridOptions<T, TFormValues, TSubmitValues>['gridOptions']
    >,
    'columns'
  > & {
    columns?: (() => any[]) | any[];
  };
};

export type AdminExtendedVxeGridApi<
  T extends Record<string, any> = any,
  TFormValues extends FormValues = FormValues,
  TSubmitValues extends FormValues = TFormValues,
> = BaseExtendedVxeGridApi<T, TFormValues, TSubmitValues> & {
  openCreateSheet: (initialValues?: Partial<T>) => void;
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
  const detailSheetMode = ref<VxeDetailSheetMode>('edit');
  const detailSheetRow = ref<null | T>(null);
  const detailSheetInitialValues = ref<null | Record<string, any>>(null);

  const openDetailSheet = (row: T) => {
    if (!row) return;
    detailSheetMode.value = 'edit';
    detailSheetInitialValues.value = null;
    detailSheetRow.value = row;
    detailSheetOpen.value = true;
  };

  const openCreateSheet = (initialValues?: Partial<T>) => {
    detailSheetMode.value = 'create';
    detailSheetRow.value = null;
    detailSheetInitialValues.value = initialValues
      ? { ...(initialValues as Record<string, any>) }
      : null;
    detailSheetOpen.value = true;
  };

  const originalCellClick = options.gridEvents?.cellClick;
  const initialColumns =
    typeof options.gridOptions?.columns === 'function'
      ? options.gridOptions.columns()
      : options.gridOptions?.columns;

  const defaultGridOptions = {
    border: false,
    round: true,
    showOverflow: true,
    pagerConfig: {
      pageSize: 15,
      pageSizes: [10, 15, 30, 50],
    },
  };

  const defaultFormOptions = {
    actionWrapperClass:
      'hidden sm:flex sm:col-span-1 items-center justify-end gap-2 pt-1 sm:pt-6',
    layout: 'vertical' as const,
    resetButtonOptions: {
      content: computed(() => i18n.global.t('common.reset')),
    },
    showCollapseButton: false,
    submitButtonOptions: {
      content: computed(() => i18n.global.t('common.filter')),
    },
    submitOnChange: true,
    submitOnEnter: true,
    wrapperClass: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3',
  };

  const enhancedOptions: any = {
    ...options,
    gridOptions: {
      ...defaultGridOptions,
      ...options.gridOptions,
      columns: initialColumns,
      pagerConfig: (() => {
        if (options.gridOptions?.pagerConfig === undefined) {
          return defaultGridOptions.pagerConfig;
        }
        if (typeof options.gridOptions.pagerConfig === 'object') {
          return {
            ...defaultGridOptions.pagerConfig,
            ...options.gridOptions.pagerConfig,
          };
        }
        return options.gridOptions.pagerConfig;
      })(),
    },
    ...(options.formOptions
      ? {
          formOptions: {
            ...defaultFormOptions,
            ...options.formOptions,
            resetButtonOptions: {
              ...defaultFormOptions.resetButtonOptions,
              ...options.formOptions.resetButtonOptions,
            },
            submitButtonOptions: {
              ...defaultFormOptions.submitButtonOptions,
              ...options.formOptions.submitButtonOptions,
            },
          },
        }
      : {}),
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
  extendedGridApi.openCreateSheet = openCreateSheet;

  // Auto-sync locale changes and responsive mobile label
  const { isMobile } = usePreferences();
  const columnGetter =
    typeof options.gridOptions?.columns === 'function'
      ? options.gridOptions.columns
      : null;

  watch(
    () => [i18n.global.locale.value, isMobile.value],
    ([, mobileVal]) => {
      if (columnGetter) {
        extendedGridApi.setGridOptions({ columns: columnGetter() });
      }
      if (options.formOptions && extendedGridApi.formApi) {
        extendedGridApi.formApi.setState({
          commonConfig: {
            componentProps: {
              class: 'w-full',
            },
            hideLabel: mobileVal as boolean,
          },
        });
      }
    },
    { flush: 'post' },
  );

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
              initialValues: detailSheetInitialValues.value,
              mode: detailSheetMode.value,
              open: detailSheetOpen.value,
              options: options.detailSheetOptions,
              row: detailSheetRow.value as null | Record<string, any>,
              onCreated: () => {
                void extendedGridApi.reload();
              },
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
                    actionSlotFn({ row } as any),
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
  VxeDetailSheetMode,
  VxeDetailSheetOptions,
} from '#/components/vxe-detail-sheet/types';

export {
  VxeBatchActionBar,
  VxeFacetedFilter,
  VxeInlineToolbar,
  VxeViewOptions,
} from '@operon/plugins/vxe-table';
export type { FacetedOption } from '@operon/plugins/vxe-table';
export type * from '@operon/plugins/vxe-table';
