<script lang="ts" setup>
import type {
  CommerceOrderRecord,
  CommerceOrderStatus,
  CommerceProductItem,
  CommerceProductType,
  CommerceProductVariantItem,
  CommerceProductVisibility,
  CommerceStockMode,
  PaymentGatewayItem,
  PaymentIntentItem,
} from '#/api';

import { computed, ref, watch } from 'vue';

import { usePreferences } from '@tuquet/preferences';

import {
  AlertTriangle,
  CheckCircle2,
  Layers,
  PackageCheck,
  Play,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Upload,
} from '@lucide/vue';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
  toast,
} from '@tuquet/vue-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  approveManualPaymentIntentAdminApi,
  filterCommerceOrders,
  filterCommerceProducts,
  fulfillOrderAdminApi,
  getAllOrdersAdminApi,
  getAllPaymentGatewaysAdminApi,
  getCommerceProductsApi,
  getManualReviewIntentsAdminApi,
  importStockBatchAdminApi,
  upsertCommerceProductAdminApi,
  upsertPaymentGatewayAdminApi,
  upsertProductVariantAdminApi,
} from '#/api';
import { useDateFormat } from '#/composables';
import {
  COMMERCE_PRODUCT_TYPE,
  COMMERCE_PRODUCT_VISIBILITY,
  COMMERCE_STOCK_MODE,
  FILTER_ALL,
} from '#/constants';
import { $t } from '#/locales';
import { captureError } from '#/utils/bugsink';

defineOptions({ name: 'CommerceAdmin' });

const { formatDate } = useDateFormat();
const { isMobile } = usePreferences();

type AdminTabMode = 'gateways' | 'manual_review' | 'orders' | 'products';
const activeTab = ref<AdminTabMode>('products');

const allProducts = ref<CommerceProductItem[]>([]);
const allOrders = ref<CommerceOrderRecord[]>([]);
const manualReviewIntents = ref<PaymentIntentItem[]>([]);
const allGateways = ref<PaymentGatewayItem[]>([]);

// Product + Variant Upsert Modal State
const productModalOpen = ref(false);
const savingProduct = ref(false);
const productForm = ref<{
  description: string;
  is_active: boolean;
  name: string;
  price_credits: number;
  product_type: CommerceProductType;
  short_description: string;
  sku: string;
  slug: string;
  stock_mode: CommerceStockMode;
  variant_name: string;
  visibility: CommerceProductVisibility;
}>({
  description: '',
  is_active: true,
  name: '',
  price_credits: 50,
  product_type: COMMERCE_PRODUCT_TYPE.SERIAL_STOCK,
  short_description: '',
  sku: '',
  slug: '',
  stock_mode: COMMERCE_STOCK_MODE.SERIALIZED,
  variant_name: $t('page.commerce_view.default_variant_name'),
  visibility: COMMERCE_PRODUCT_VISIBILITY.PUBLIC,
});

// Bulk Stock Import Modal State
const stockModalOpen = ref(false);
const importingStock = ref(false);
const selectedStockVariantId = ref<string>('');
const stockBatchCode = ref<string>('');
const stockLinesRaw = ref<string>('');

const serializedVariants = computed(() => {
  const list: Array<{
    productName: string;
    variant: CommerceProductVariantItem;
  }> = [];
  for (const p of allProducts.value) {
    for (const v of p.variants || []) {
      if (v.stock_mode === COMMERCE_STOCK_MODE.SERIALIZED) {
        list.push({ productName: p.name, variant: v });
      }
    }
  }
  return list;
});

function getProductColumns() {
  return [
    {
      field: 'name',
      title: $t('page.commerce_view.col_product'),
      minWidth: 230,
      slots: { default: 'name-cell' },
    },
    {
      field: 'product_type',
      title: $t('page.commerce_view.col_category'),
      minWidth: 170,
      slots: { default: 'type-cell' },
    },
    {
      field: 'visibility',
      title: $t('page.commerce_view.visibility_label'),
      minWidth: 130,
      slots: { default: 'vis-cell' },
    },
    {
      field: 'variants',
      title: $t('page.commerce_view.col_sku_and_price'),
      minWidth: 240,
      slots: { default: 'sku-cell' },
    },
    {
      field: 'actions',
      title: $t('common.actions'),
      minWidth: 160,
      align: 'right' as const,
      slots: { default: 'action-cell' },
    },
  ];
}

// 1. Products Grid
const [ProductsGrid, productsGridApi] = useVbenVxeGrid<CommerceProductItem>({
  separator: false,
  detailSheetOptions: {
    resource: 'commerce.products',
    subtitleField: 'slug',
    titleField: 'name',
  },
  formOptions: {
    commonConfig: {
      componentProps: {
        class: 'w-full',
      },
      hideLabel: isMobile.value,
    },
    schema: [
      {
        component: 'Select',
        fieldName: 'product_type',
        label: () => $t('page.commerce_view.product_type_label'),
        defaultValue: FILTER_ALL,
        componentProps: () => ({
          options: [
            {
              label: $t('page.commerce_view.all_types'),
              value: FILTER_ALL,
            },
            {
              label: $t('page.commerce_view.type_serial_stock_code'),
              value: COMMERCE_PRODUCT_TYPE.SERIAL_STOCK,
            },
            {
              label: $t('page.commerce_view.type_resource_code'),
              value: COMMERCE_PRODUCT_TYPE.SPECTER_RESOURCE,
            },
            {
              label: $t('page.commerce_view.type_digital_file_code'),
              value: COMMERCE_PRODUCT_TYPE.DIGITAL_FILE,
            },
            {
              label: $t('page.commerce_view.type_wallet_credit_code'),
              value: COMMERCE_PRODUCT_TYPE.WALLET_CREDIT,
            },
          ],
        }),
      },
      {
        component: 'Select',
        fieldName: 'visibility',
        label: () => $t('page.commerce_view.visibility_label'),
        defaultValue: FILTER_ALL,
        componentProps: () => ({
          options: [
            {
              label: $t('page.commerce_view.all_modes'),
              value: FILTER_ALL,
            },
            {
              label: $t('page.commerce_view.vis_public'),
              value: COMMERCE_PRODUCT_VISIBILITY.PUBLIC,
            },
            {
              label: $t('page.commerce_view.vis_tenant_only'),
              value: COMMERCE_PRODUCT_VISIBILITY.TENANT_ONLY,
            },
            {
              label: $t('page.commerce_view.vis_hidden'),
              value: COMMERCE_PRODUCT_VISIBILITY.HIDDEN,
            },
          ],
        }),
      },
      {
        component: 'Input',
        fieldName: 'search',
        formItemClass: 'col-span-2 sm:col-span-1',
        label: () => $t('common.search'),
        componentProps: () => ({
          placeholder: $t(
            'page.commerce_view.search_admin_product_placeholder',
          ),
          clearable: true,
        }),
      },
    ],
    layout: 'vertical',
    showCollapseButton: false,
    submitOnChange: true,
    submitOnEnter: true,
    submitButtonOptions: { content: () => $t('common.filter') },
    resetButtonOptions: { content: () => $t('common.reset') },
    actionWrapperClass:
      'hidden sm:flex sm:col-span-1 lg:col-span-1 items-end justify-end gap-2',
    wrapperClass: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3',
  },
  gridOptions: {
    border: false,
    round: true,
    showOverflow: true,
    cellConfig: { height: 56 },
    rowConfig: { isHover: true, keyField: 'id' },
    pagerConfig: { pageSize: 15, pageSizes: [10, 15, 30, 50] },
    proxyConfig: {
      autoLoad: true,
      ajax: {
        query: async (
          { page }: { page?: { currentPage?: number; pageSize?: number } },
          formValues: Record<string, any>,
        ) => {
          const data = await getCommerceProductsApi({ includeInactive: true });
          allProducts.value = data;
          const filtered = filterCommerceProducts(data, {
            product_type: formValues?.product_type,
            search: formValues?.search,
            visibility: formValues?.visibility,
          });
          const currentPage = page?.currentPage || 1;
          const pageSize = page?.pageSize || 15;
          const start = (currentPage - 1) * pageSize;
          return {
            items: filtered.slice(start, start + pageSize),
            total: filtered.length,
          };
        },
      },
    },
    columns: getProductColumns(),
  },
});

function getOrderColumns() {
  return [
    {
      field: 'order_code',
      title: $t('page.commerce_view.col_order_code'),
      minWidth: 185,
      slots: { default: 'code-cell' },
    },
    {
      field: 'buyer_email',
      title: $t('page.commerce_view.col_buyer_tenant'),
      minWidth: 210,
      slots: { default: 'buyer-cell' },
    },
    {
      field: 'payment_method',
      title: $t('page.commerce_view.col_payment_channel_short'),
      minWidth: 150,
    },
    {
      field: 'total_credits',
      title: $t('page.commerce_view.col_value'),
      minWidth: 140,
      slots: { default: 'total-cell' },
    },
    {
      field: 'status',
      title: $t('common.status'),
      minWidth: 145,
      slots: { default: 'status-cell' },
    },
    {
      field: 'created_at',
      title: $t('common.createdAt'),
      minWidth: 160,
      slots: { default: 'date-cell' },
    },
    {
      field: 'actions',
      title: $t('page.commerce_view.col_dispatch'),
      minWidth: 150,
      align: 'right' as const,
      slots: { default: 'action-cell' },
    },
  ];
}

// 2. All Orders Grid
const [OrdersGrid, ordersGridApi] = useVbenVxeGrid<CommerceOrderRecord>({
  separator: false,
  detailSheetOptions: {
    resource: 'commerce.orders',
    subtitleField: 'buyer_email',
    titleField: 'order_code',
  },
  formOptions: {
    commonConfig: {
      componentProps: {
        class: 'w-full',
      },
      hideLabel: isMobile.value,
    },
    schema: [
      {
        component: 'Select',
        fieldName: 'status',
        formItemClass: 'col-span-2 sm:col-span-1',
        label: () => $t('common.status'),
        defaultValue: 'all',
        componentProps: () => ({
          options: [
            { label: $t('page.runs_view.status_all'), value: 'all' },
            { label: 'completed', value: 'completed' },
            { label: 'pending_payment', value: 'pending_payment' },
            { label: 'manual_review', value: 'manual_review' },
            { label: 'failed', value: 'failed' },
          ],
        }),
      },
      {
        component: 'Input',
        fieldName: 'search',
        formItemClass: 'col-span-2 sm:col-span-1',
        label: () => $t('common.search'),
        componentProps: () => ({
          placeholder: $t('page.commerce_view.search_admin_order_placeholder'),
          clearable: true,
        }),
      },
    ],
    layout: 'vertical',
    showCollapseButton: false,
    submitOnChange: true,
    submitOnEnter: true,
    submitButtonOptions: { content: () => $t('common.filter') },
    resetButtonOptions: { content: () => $t('common.reset') },
    actionWrapperClass:
      'hidden sm:flex sm:col-span-2 lg:col-span-2 items-end justify-end gap-2',
    wrapperClass: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3',
  },
  gridOptions: {
    border: false,
    round: true,
    showOverflow: true,
    cellConfig: { height: 54 },
    rowConfig: { isHover: true, keyField: 'id' },
    pagerConfig: { pageSize: 15, pageSizes: [10, 15, 30, 50] },
    proxyConfig: {
      autoLoad: true,
      ajax: {
        query: async (
          { page }: { page?: { currentPage?: number; pageSize?: number } },
          formValues: Record<string, any>,
        ) => {
          const data = await getAllOrdersAdminApi();
          allOrders.value = data;
          const filtered = filterCommerceOrders(data, {
            search: formValues?.search,
            status: formValues?.status,
          });
          const currentPage = page?.currentPage || 1;
          const pageSize = page?.pageSize || 15;
          const start = (currentPage - 1) * pageSize;
          return {
            items: filtered.slice(start, start + pageSize),
            total: filtered.length,
          };
        },
      },
    },
    columns: getOrderColumns(),
  },
});

function getManualReviewColumns() {
  return [
    {
      field: 'transfer_code',
      title: $t('page.commerce_view.col_transfer_code'),
      minWidth: 165,
      slots: { default: 'code-cell' },
    },
    {
      field: 'gateway_id',
      title: $t('page.commerce_view.payment_gateway_label'),
      minWidth: 160,
    },
    {
      field: 'target_type',
      title: $t('page.commerce_view.col_target_type'),
      minWidth: 165,
    },
    {
      field: 'amount_credits',
      title: $t('page.commerce_view.col_requested_xu'),
      minWidth: 145,
      slots: { default: 'credits-cell' },
    },
    {
      field: 'pay_amount',
      title: $t('page.commerce_view.col_converted_amount'),
      minWidth: 165,
      slots: { default: 'pay-cell' },
    },
    {
      field: 'created_at',
      title: $t('page.commerce_view.col_created_time'),
      minWidth: 165,
      slots: { default: 'date-cell' },
    },
    {
      field: 'actions',
      title: $t('page.commerce_view.col_approval'),
      minWidth: 155,
      align: 'right' as const,
      slots: { default: 'action-cell' },
    },
  ];
}

// 3. Manual Review Intents Grid
const [ManualReviewGrid, manualReviewGridApi] =
  useVbenVxeGrid<PaymentIntentItem>({
    separator: false,
    detailSheetOptions: {
      resource: 'billing.payment_intents',
      subtitleField: 'gateway_id',
      titleField: 'transfer_code',
    },
    gridOptions: {
      border: false,
      round: true,
      showOverflow: true,
      cellConfig: { height: 56 },
      rowConfig: { isHover: true, keyField: 'id' },
      pagerConfig: { pageSize: 15, pageSizes: [10, 15, 30, 50] },
      proxyConfig: {
        autoLoad: true,
        ajax: {
          query: async ({
            page,
          }: {
            page?: { currentPage?: number; pageSize?: number };
          }) => {
            const data = await getManualReviewIntentsAdminApi();
            manualReviewIntents.value = data;
            const currentPage = page?.currentPage || 1;
            const pageSize = page?.pageSize || 15;
            const start = (currentPage - 1) * pageSize;
            return {
              items: data.slice(start, start + pageSize),
              total: data.length,
            };
          },
        },
      },
      columns: getManualReviewColumns(),
    },
  });

function getGatewayColumns() {
  return [
    {
      field: 'name',
      title: $t('page.commerce_view.col_gateway_name'),
      minWidth: 230,
      slots: { default: 'name-cell' },
    },
    {
      field: 'channel',
      title: $t('page.commerce_view.col_channel'),
      minWidth: 155,
    },
    {
      field: 'driver',
      title: $t('page.commerce_view.col_adapter_driver'),
      minWidth: 140,
    },
    {
      field: 'rate_per_credit',
      title: $t('page.commerce_view.col_rate_per_xu'),
      minWidth: 165,
      slots: { default: 'rate-cell' },
    },
    {
      field: 'is_active',
      title: $t('common.status'),
      minWidth: 135,
      slots: { default: 'status-cell' },
    },
  ];
}

// 4. Payment Gateways Grid
const [GatewaysGrid, gatewaysGridApi] = useVbenVxeGrid<PaymentGatewayItem>({
  separator: false,
  detailSheetOptions: {
    resource: 'billing.payment_gateways',
    subtitleField: 'channel',
    titleField: 'name',
    onCreate: async ({ insertPayload }) => {
      return await upsertPaymentGatewayAdminApi(insertPayload as any);
    },
    onSave: async ({ dirtyPayload, row }) => {
      await upsertPaymentGatewayAdminApi({
        ...row,
        ...dirtyPayload,
      } as any);
    },
  },
  gridOptions: {
    border: false,
    round: true,
    showOverflow: true,
    cellConfig: { height: 56 },
    rowConfig: { isHover: true, keyField: 'id' },
    pagerConfig: { enabled: false },
    proxyConfig: {
      autoLoad: true,
      ajax: {
        query: async () => {
          const data = await getAllPaymentGatewaysAdminApi();
          allGateways.value = data;
          return { items: data, total: data.length };
        },
      },
    },
    columns: getGatewayColumns(),
  },
});

watch([() => $t('common.actions'), isMobile], () => {
  productsGridApi.setGridOptions({ columns: getProductColumns() });
  ordersGridApi.setGridOptions({ columns: getOrderColumns() });
  manualReviewGridApi.setGridOptions({ columns: getManualReviewColumns() });
  gatewaysGridApi.setGridOptions({ columns: getGatewayColumns() });
  const commonConfig = {
    componentProps: { class: 'w-full' },
    hideLabel: isMobile.value,
  };
  productsGridApi.formApi?.setState({ commonConfig });
  ordersGridApi.formApi?.setState({ commonConfig });
});

function reloadCurrentTab() {
  if (activeTab.value === 'products') productsGridApi.reload();
  else if (activeTab.value === 'orders') ordersGridApi.reload();
  else if (activeTab.value === 'manual_review') manualReviewGridApi.reload();
  else gatewaysGridApi.reload();
}

function openCreateProductModal(existing?: CommerceProductItem) {
  if (existing) {
    const firstVar = existing.variants?.[0];
    productForm.value = {
      description: existing.description || '',
      is_active: existing.is_active,
      name: existing.name,
      price_credits: firstVar?.price_credits ?? 50,
      product_type: existing.product_type,
      short_description: existing.short_description || '',
      sku: firstVar?.sku || `${existing.slug.toUpperCase()}-STD`,
      slug: existing.slug,
      stock_mode: firstVar?.stock_mode || 'serialized',
      variant_name:
        firstVar?.name || $t('page.commerce_view.default_variant_name'),
      visibility: existing.visibility,
    };
  } else {
    productForm.value = {
      description: '',
      is_active: true,
      name: '',
      price_credits: 50,
      product_type: 'serial_stock',
      short_description: '',
      sku: '',
      slug: '',
      stock_mode: 'serialized',
      variant_name: $t('page.commerce_view.default_variant_name'),
      visibility: 'public',
    };
  }
  productModalOpen.value = true;
}

async function handleSaveProductAndVariant() {
  const f = productForm.value;
  if (!f.name.trim() || !f.slug.trim() || !f.sku.trim()) {
    toast.error($t('page.commerce_view.product_form_required'));
    return;
  }
  savingProduct.value = true;
  try {
    const savedProduct = await upsertCommerceProductAdminApi({
      description: f.description.trim() || null,
      is_active: f.is_active,
      name: f.name.trim(),
      product_type: f.product_type,
      short_description: f.short_description.trim() || null,
      slug: f.slug.trim(),
      visibility: f.visibility,
    });

    await upsertProductVariantAdminApi({
      is_active: true,
      name:
        f.variant_name.trim() || $t('page.commerce_view.default_variant_name'),
      price_credits: Math.max(0, Math.trunc(f.price_credits)),
      product_id: savedProduct.id,
      sku: f.sku.trim(),
      stock_mode: f.stock_mode,
    });

    toast.success(
      $t('page.commerce_view.product_saved_toast', {
        name: savedProduct.name,
        sku: f.sku,
      }),
    );
    productModalOpen.value = false;
    await productsGridApi.reload();
  } catch (error: any) {
    captureError(error, {
      action: 'handleSaveProduct',
      view: 'CommerceAdmin',
    });
    toast.error(error?.message || $t('page.commerce_view.product_save_failed'));
  } finally {
    savingProduct.value = false;
  }
}

function openBulkStockModal(variantId?: string) {
  if (variantId) {
    selectedStockVariantId.value = variantId;
  } else if (
    !selectedStockVariantId.value &&
    serializedVariants.value.length > 0 &&
    serializedVariants.value[0]
  ) {
    selectedStockVariantId.value = serializedVariants.value[0].variant.id;
  }
  stockBatchCode.value = `BATCH-${new Date().toISOString().slice(0, 10)}`;
  stockLinesRaw.value = '';
  stockModalOpen.value = true;
}

async function handleBulkImportStock() {
  if (!selectedStockVariantId.value) {
    toast.error($t('page.commerce_view.select_sku_for_stock'));
    return;
  }
  const lines = stockLinesRaw.value
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    toast.error($t('page.commerce_view.paste_at_least_one_stock_line'));
    return;
  }

  importingStock.value = true;
  try {
    const res = await importStockBatchAdminApi({
      batch_code: stockBatchCode.value.trim() || null,
      lines,
      variant_id: selectedStockVariantId.value,
    });
    toast.success(
      $t('page.commerce_view.stock_imported_toast', {
        imported: res.imported_count,
        skipped: res.skipped_duplicates,
        available: res.available_stock,
      }),
    );
    stockModalOpen.value = false;
    await productsGridApi.reload();
  } catch (error: any) {
    captureError(error, {
      action: 'handleBulkImportStock',
      view: 'CommerceAdmin',
    });
    toast.error(error?.message || $t('page.commerce_view.stock_import_failed'));
  } finally {
    importingStock.value = false;
  }
}

async function handleManualFulfillOrder(order: CommerceOrderRecord) {
  try {
    const res = await fulfillOrderAdminApi(order.id);
    if (res.fulfilled) {
      toast.success(
        $t('page.commerce_view.order_fulfilled_toast', {
          code: order.order_code,
        }),
      );
    } else {
      toast.info(
        $t('page.commerce_view.order_not_eligible_or_out_of_stock', {
          code: order.order_code,
        }),
      );
    }
    await ordersGridApi.reload();
  } catch (error: any) {
    captureError(error, {
      action: 'handleManualFulfillOrder',
      orderId: order.id,
      view: 'CommerceAdmin',
    });
    toast.error(
      error?.message || $t('page.commerce_view.order_fulfill_failed'),
    );
  }
}

async function handleForceApproveIntent(intent: PaymentIntentItem) {
  try {
    const res = await approveManualPaymentIntentAdminApi(
      intent.id,
      `Force approved by Superadmin for transfer ${intent.transfer_code}`,
    );
    if (res.settled) {
      toast.success(
        $t('page.commerce_view.intent_approved_toast', {
          code: intent.transfer_code,
          amount: intent.amount_credits,
        }),
      );
      await manualReviewGridApi.reload();
    } else {
      toast.error(res.reason || $t('page.commerce_view.intent_approve_failed'));
    }
  } catch (error: any) {
    captureError(error, {
      action: 'handleForceApproveIntent',
      intentId: intent.id,
      view: 'CommerceAdmin',
    });
    toast.error(
      error?.message || $t('page.commerce_view.intent_approve_error'),
    );
  }
}

function getOrderStatusVariant(status: CommerceOrderStatus) {
  if (status === 'completed' || status === 'paid') return 'default';
  if (status === 'failed') return 'destructive';
  if (status === 'manual_review') return 'secondary';
  return 'outline';
}
</script>

<template>
  <div class="space-y-3 p-3 sm:space-y-5 sm:p-5">
    <!-- Top Header -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex min-w-0 flex-col gap-0.5">
        <h1
          class="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl"
        >
          {{ $t('page.commerce.admin') }}
        </h1>
        <p class="hidden text-xs text-muted-foreground sm:block">
          {{ $t('page.commerce.admin_desc') }}
        </p>
      </div>

      <div class="flex shrink-0 flex-wrap items-center gap-1.5 sm:gap-2">
        <Button
          size="sm"
          variant="outline"
          class="gap-1.5"
          @click="() => openBulkStockModal()"
        >
          <Upload class="size-3.5 text-primary" />
          <span class="hidden sm:inline">{{
            $t('page.commerce_view.bulk_import_stock_btn')
          }}</span>
        </Button>

        <Button
          v-if="activeTab === 'gateways'"
          size="sm"
          class="gap-1.5"
          @click="() => gatewaysGridApi.openCreateSheet()"
        >
          <Plus class="size-3.5" />
          <span>{{ $t('common.createRecord') }}</span>
        </Button>

        <Button
          v-else
          size="sm"
          class="gap-1.5"
          @click="() => openCreateProductModal()"
        >
          <Plus class="size-3.5" />
          <span class="hidden sm:inline">{{
            $t('page.commerce_view.add_product_sku_btn')
          }}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          class="gap-1.5"
          :title="$t('common.refresh')"
          @click="reloadCurrentTab"
        >
          <RefreshCw class="size-3.5 text-muted-foreground" />
          <span class="hidden sm:inline">{{ $t('common.refresh') }}</span>
        </Button>
      </div>
    </div>

    <!-- Mode Selector Tabs -->
    <div class="border-b border-border/60 pb-2">
      <Tabs v-model="activeTab" class="w-full">
        <TabsList
          class="h-8 w-full justify-start overflow-x-auto no-scrollbar sm:w-fit"
        >
          <TabsTrigger
            value="products"
            class="h-7 shrink-0 gap-1.5 px-3 whitespace-nowrap text-xs"
          >
            <Layers class="size-3.5" />
            {{
              $t('page.commerce_view.tab_products_stock', {
                count: allProducts.length,
              })
            }}
          </TabsTrigger>

          <TabsTrigger
            value="orders"
            class="h-7 shrink-0 gap-1.5 px-3 whitespace-nowrap text-xs"
          >
            <PackageCheck class="size-3.5" />
            {{
              $t('page.commerce_view.tab_all_orders', {
                count: allOrders.length,
              })
            }}
          </TabsTrigger>

          <TabsTrigger
            value="manual_review"
            class="h-7 shrink-0 gap-1.5 px-3 whitespace-nowrap text-xs"
          >
            <AlertTriangle class="size-3.5" />
            {{
              $t('page.commerce_view.tab_manual_review', {
                count: manualReviewIntents.length,
              })
            }}
          </TabsTrigger>

          <TabsTrigger
            value="gateways"
            class="h-7 shrink-0 gap-1.5 px-3 whitespace-nowrap text-xs"
          >
            <SlidersHorizontal class="size-3.5" />
            {{
              $t('page.commerce_view.tab_gateways', {
                count: allGateways.length,
              })
            }}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>

    <!-- Tab 1: Products & Stock VXE Grid -->
    <div
      v-show="activeTab === 'products'"
      class="overflow-hidden rounded-none border-0 border-border/60 bg-card p-0 shadow-none sm:rounded-xl sm:border sm:p-5 sm:shadow-xs"
    >
      <ProductsGrid>
        <template #name-cell="{ row }">
          <div class="flex flex-col py-1 text-left">
            <span class="font-medium text-foreground">{{ row.name }}</span>
            <span class="text-xs text-muted-foreground"> /{{ row.slug }} </span>
          </div>
        </template>

        <template #type-cell="{ row }">
          <Badge variant="outline" class="text-2xs">
            {{ row.product_type }}
          </Badge>
        </template>

        <template #vis-cell="{ row }">
          <Badge
            :variant="row.visibility === 'public' ? 'default' : 'secondary'"
            class="text-2xs"
          >
            {{ row.visibility }}
          </Badge>
        </template>

        <template #sku-cell="{ row }">
          <div class="flex flex-wrap items-center gap-1.5 py-1">
            <Badge
              v-for="v in row.variants || []"
              :key="v.id"
              variant="outline"
              class="text-2xs"
            >
              {{ v.sku }}: {{ v.price_credits }} Xu ({{
                v.stock_mode === 'unlimited'
                  ? '∞'
                  : $t('page.commerce_view.stock_short', {
                      count: v.available_stock,
                    })
              }})
            </Badge>
          </div>
        </template>

        <template #action-cell="{ row }">
          <div class="flex items-center justify-end gap-1.5">
            <Button
              v-if="
                row.variants?.some(
                  (v: CommerceProductVariantItem) =>
                    v.stock_mode === 'serialized',
                )
              "
              size="sm"
              variant="outline"
              class="h-7 px-2 text-xs"
              @click="openBulkStockModal(row.variants?.[0]?.id)"
            >
              {{ $t('page.commerce_view.import_stock_btn') }}
            </Button>
            <Button
              size="sm"
              variant="outline"
              class="h-7 px-2 text-xs"
              @click="openCreateProductModal(row)"
            >
              {{ $t('common.edit') }}
            </Button>
          </div>
        </template>
      </ProductsGrid>
    </div>

    <!-- Tab 2: All Orders VXE Grid -->
    <div
      v-show="activeTab === 'orders'"
      class="overflow-hidden rounded-none border-0 border-border/60 bg-card p-0 shadow-none sm:rounded-xl sm:border sm:p-5 sm:shadow-xs"
    >
      <OrdersGrid>
        <template #code-cell="{ row }">
          <span class="text-xs font-semibold text-foreground">
            {{ row.order_code }}
          </span>
        </template>

        <template #buyer-cell="{ row }">
          <div class="flex flex-col py-1 text-left">
            <span class="text-xs font-medium text-foreground">
              {{ row.buyer_email || $t('page.commerce_view.tenant_member') }}
            </span>
            <span class="text-2xs text-muted-foreground">
              {{
                row.buyer_tenant_id
                  ? `Tenant: ${row.buyer_tenant_id.slice(0, 8)}`
                  : $t('page.commerce_view.guest_checkout')
              }}
            </span>
          </div>
        </template>

        <template #total-cell="{ row }">
          <span class="text-xs font-bold text-foreground">
            {{ row.total_credits.toLocaleString('en-US') }} Xu
          </span>
        </template>

        <template #status-cell="{ row }">
          <Badge :variant="getOrderStatusVariant(row.status)" class="text-2xs">
            {{ row.status }}
          </Badge>
        </template>

        <template #date-cell="{ row }">
          <span class="text-xs text-muted-foreground">
            {{ formatDate(row.created_at) }}
          </span>
        </template>

        <template #action-cell="{ row }">
          <Button
            size="sm"
            variant="outline"
            class="h-7 gap-1 px-2 text-xs"
            @click="handleManualFulfillOrder(row)"
          >
            <Play class="size-3" />
            {{ $t('page.commerce_view.redeliver_btn') }}
          </Button>
        </template>
      </OrdersGrid>
    </div>

    <!-- Tab 3: Manual Review Queue VXE Grid -->
    <div
      v-show="activeTab === 'manual_review'"
      class="overflow-hidden rounded-none border-0 border-border/60 bg-card p-0 shadow-none sm:rounded-xl sm:border sm:p-5 sm:shadow-xs"
    >
      <ManualReviewGrid>
        <template #code-cell="{ row }">
          <code
            class="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary"
          >
            {{ row.transfer_code }}
          </code>
        </template>

        <template #credits-cell="{ row }">
          <span class="text-xs font-bold text-foreground">
            {{ row.amount_credits.toLocaleString('en-US') }} Xu
          </span>
        </template>

        <template #pay-cell="{ row }">
          <span class="text-xs text-foreground">
            {{ row.pay_amount.toLocaleString('en-US') }} {{ row.pay_currency }}
          </span>
        </template>

        <template #date-cell="{ row }">
          <span class="text-xs text-muted-foreground">
            {{ formatDate(row.created_at) }}
          </span>
        </template>

        <template #action-cell="{ row }">
          <Button
            size="sm"
            variant="default"
            class="h-7 gap-1 px-2.5 text-xs"
            @click="handleForceApproveIntent(row)"
          >
            <CheckCircle2 class="size-3.5" />
            {{ $t('page.commerce_view.approve_intent_btn') }}
          </Button>
        </template>
      </ManualReviewGrid>
    </div>

    <!-- Tab 4: Payment Gateways VXE Grid -->
    <div
      v-show="activeTab === 'gateways'"
      class="overflow-hidden rounded-none border-0 border-border/60 bg-card p-0 shadow-none sm:rounded-xl sm:border sm:p-5 sm:shadow-xs"
    >
      <GatewaysGrid>
        <template #name-cell="{ row }">
          <div class="flex flex-col py-1 text-left">
            <span class="font-medium text-foreground">{{ row.name }}</span>
            <span class="text-2xs text-muted-foreground">
              ID: {{ row.id }}
            </span>
          </div>
        </template>

        <template #rate-cell="{ row }">
          <span class="text-xs font-semibold text-foreground">
            1 Xu = {{ row.rate_per_credit.toLocaleString('en-US') }}
            {{ row.currency }}
          </span>
        </template>

        <template #status-cell="{ row }">
          <Badge :variant="row.is_active ? 'default' : 'outline'">
            {{
              row.is_active
                ? $t('page.commerce_view.gateway_enabled')
                : $t('page.commerce_view.gateway_disabled')
            }}
          </Badge>
        </template>
      </GatewaysGrid>
    </div>

    <!-- Modal 1: Upsert Product & SKU Variant -->
    <Dialog v-model:open="productModalOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle class="text-base font-semibold">
            {{ $t('page.commerce_view.upsert_product_modal_title') }}
          </DialogTitle>
          <DialogDescription class="text-xs text-muted-foreground">
            {{ $t('page.commerce_view.upsert_product_modal_desc') }}
          </DialogDescription>
        </DialogHeader>

        <div class="grid grid-cols-1 gap-3 py-2 sm:grid-cols-2">
          <div class="space-y-1 sm:col-span-2">
            <Label class="text-xs font-medium text-foreground">
              {{ $t('page.commerce_view.product_name_label') }}
            </Label>
            <Input
              v-model="productForm.name"
              type="text"
              :placeholder="$t('page.commerce_view.product_name_placeholder')"
              class="h-8 text-xs"
            />
          </div>

          <div class="space-y-1">
            <Label class="text-xs font-medium text-foreground">
              {{ $t('page.commerce_view.product_slug_label') }}
            </Label>
            <Input
              v-model="productForm.slug"
              type="text"
              placeholder="via-co-2fa"
              class="h-8 text-xs"
            />
          </div>

          <div class="space-y-1">
            <Label class="text-xs font-medium text-foreground">
              {{ $t('page.commerce_view.product_type_label') }}
            </Label>
            <Select v-model="productForm.product_type">
              <SelectTrigger class="h-8 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="serial_stock">
                  {{ $t('page.commerce_view.opt_serial_stock') }}
                </SelectItem>
                <SelectItem value="resource">
                  {{ $t('page.commerce_view.opt_resource') }}
                </SelectItem>
                <SelectItem value="digital_file">
                  {{ $t('page.commerce_view.opt_digital_file') }}
                </SelectItem>
                <SelectItem value="wallet_credit">
                  {{ $t('page.commerce_view.opt_wallet_credit') }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1">
            <Label class="text-xs font-medium text-foreground">
              {{ $t('page.commerce_view.visibility_mode_label') }}
            </Label>
            <Select v-model="productForm.visibility">
              <SelectTrigger class="h-8 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  {{ $t('page.commerce_view.opt_vis_public') }}
                </SelectItem>
                <SelectItem value="tenant_only">
                  {{ $t('page.commerce_view.opt_vis_tenant_only') }}
                </SelectItem>
                <SelectItem value="hidden">
                  {{ $t('page.commerce_view.opt_vis_hidden') }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1">
            <Label class="text-xs font-medium text-foreground">
              {{ $t('page.commerce_view.stock_mode_label') }}
            </Label>
            <Select v-model="productForm.stock_mode">
              <SelectTrigger class="h-8 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="serialized">
                  {{ $t('page.commerce_view.opt_stock_serialized') }}
                </SelectItem>
                <SelectItem value="unlimited">
                  {{ $t('page.commerce_view.opt_stock_unlimited') }}
                </SelectItem>
                <SelectItem value="finite_counter">
                  {{ $t('page.commerce_view.opt_stock_finite') }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1">
            <Label class="text-xs font-medium text-foreground">
              {{ $t('page.commerce_view.sku_code_label') }}
            </Label>
            <Input
              v-model="productForm.sku"
              type="text"
              placeholder="VIA-2FA-01"
              class="h-8 text-xs"
            />
          </div>

          <div class="space-y-1">
            <Label class="text-xs font-medium text-foreground">
              {{ $t('page.commerce_view.unit_price_xu_label') }}
            </Label>
            <Input
              v-model.number="productForm.price_credits"
              type="number"
              min="0"
              class="h-8 text-xs"
            />
          </div>

          <div class="space-y-1 sm:col-span-2">
            <Label class="text-xs font-medium text-foreground">
              {{ $t('page.commerce_view.short_desc_label') }}
            </Label>
            <Input
              v-model="productForm.short_description"
              type="text"
              :placeholder="$t('page.commerce_view.short_desc_placeholder')"
              class="h-8 text-xs"
            />
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" @click="productModalOpen = false">
            {{ $t('common.cancel') }}
          </Button>
          <Button
            size="sm"
            :disabled="savingProduct"
            @click="handleSaveProductAndVariant"
          >
            {{ $t('common.save') }}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Modal 2: Bulk Stock Import -->
    <Dialog v-model:open="stockModalOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle class="text-base font-semibold">
            {{ $t('page.commerce_view.bulk_stock_modal_title') }}
          </DialogTitle>
          <DialogDescription class="text-xs text-muted-foreground">
            {{ $t('page.commerce_view.bulk_stock_modal_desc') }}
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-3 py-2">
          <div class="space-y-1">
            <Label class="text-xs font-medium text-foreground">
              {{ $t('page.commerce_view.select_serialized_sku_label') }}
            </Label>
            <Select v-model="selectedStockVariantId">
              <SelectTrigger class="h-8 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="item in serializedVariants"
                  :key="item.variant.id"
                  :value="item.variant.id"
                >
                  {{ item.productName }} — {{ item.variant.sku }} ({{
                    $t('page.commerce_view.stock_short', {
                      count: item.variant.available_stock,
                    })
                  }})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1">
            <Label class="text-xs font-medium text-foreground">
              {{ $t('page.commerce_view.batch_code_label') }}
            </Label>
            <Input v-model="stockBatchCode" type="text" class="h-8 text-xs" />
          </div>

          <div class="space-y-1">
            <Label class="text-xs font-medium text-foreground">
              {{ $t('page.commerce_view.stock_lines_label') }}
            </Label>
            <Textarea
              v-model="stockLinesRaw"
              :rows="7"
              placeholder="1000881122|matkhau123|JBSWY3DPEHPK3PXP&#10;1000881123|matkhau456|KRSXG5CTMVRXEZLU"
              class="w-full rounded-lg border border-border bg-background p-3 text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" @click="stockModalOpen = false">
            {{ $t('common.cancel') }}
          </Button>
          <Button
            size="sm"
            :disabled="importingStock"
            @click="handleBulkImportStock"
          >
            {{ $t('page.commerce_view.submit_import_stock_btn') }}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
