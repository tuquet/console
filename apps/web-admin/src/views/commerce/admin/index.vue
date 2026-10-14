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

import { computed, ref } from 'vue';

import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Layers,
  PackageCheck,
  PackagePlus,
  Play,
  Plus,
  RefreshCw,
  Settings2,
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
import { $t } from '#/locales';

defineOptions({ name: 'CommerceAdmin' });

const { formatDate } = useDateFormat();

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
  product_type: 'serial_stock',
  short_description: '',
  sku: '',
  slug: '',
  stock_mode: 'serialized',
  variant_name: 'Gói tiêu chuẩn',
  visibility: 'public',
});

// Bulk Stock Import Modal State
const stockModalOpen = ref(false);
const importingStock = ref(false);
const selectedStockVariantId = ref<string>('');
const stockBatchCode = ref<string>('');
const stockLinesRaw = ref<string>('');

// Gateway Edit Modal State
const gatewayModalOpen = ref(false);
const savingGateway = ref(false);
const editingGateway = ref<null | PaymentGatewayItem>(null);
const gatewayPublicConfigText = ref<string>('{}');

const serializedVariants = computed(() => {
  const list: Array<{
    productName: string;
    variant: CommerceProductVariantItem;
  }> = [];
  for (const p of allProducts.value) {
    for (const v of p.variants || []) {
      if (v.stock_mode === 'serialized') {
        list.push({ productName: p.name, variant: v });
      }
    }
  }
  return list;
});

const totalAvailableStock = computed(() => {
  let sum = 0;
  for (const p of allProducts.value) {
    for (const v of p.variants || []) {
      if (v.stock_mode !== 'unlimited') {
        sum += v.available_stock || 0;
      }
    }
  }
  return sum;
});

// 1. Products Grid
const [ProductsGrid, productsGridApi] = useVbenVxeGrid<CommerceProductItem>({
  separator: false,
  formOptions: {
    schema: [
      {
        component: 'Select',
        fieldName: 'product_type',
        label: 'Loại sản phẩm',
        defaultValue: 'all',
        componentProps: {
          options: [
            { label: 'Tất cả loại', value: 'all' },
            { label: 'Tài khoản / Key (serial_stock)', value: 'serial_stock' },
            {
              label: 'Tài nguyên Specter (specter_resource)',
              value: 'specter_resource',
            },
            { label: 'Tệp số (digital_file)', value: 'digital_file' },
            { label: 'Gói nạp Xu (wallet_credit)', value: 'wallet_credit' },
          ],
        },
      },
      {
        component: 'Select',
        fieldName: 'visibility',
        label: 'Hiển thị',
        defaultValue: 'all',
        componentProps: {
          options: [
            { label: 'Tất cả chế độ', value: 'all' },
            { label: 'Public (Công khai)', value: 'public' },
            { label: 'Tenant only (Nội bộ)', value: 'tenant_only' },
            { label: 'Hidden (Ẩn)', value: 'hidden' },
          ],
        },
      },
      {
        component: 'Input',
        fieldName: 'search',
        label: 'Tìm kiếm',
        componentProps: {
          placeholder: 'Tìm theo tên sản phẩm, slug hoặc SKU...',
          clearable: true,
        },
      },
    ],
    layout: 'vertical',
    showCollapseButton: false,
    submitOnChange: true,
    submitOnEnter: true,
    submitButtonOptions: { content: $t('common.filter') },
    resetButtonOptions: { content: $t('common.reset') },
    actionWrapperClass: 'flex items-center justify-end gap-2',
    wrapperClass: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3',
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
    columns: [
      {
        field: 'name',
        title: 'Sản phẩm',
        minWidth: 230,
        slots: { default: 'name-cell' },
      },
      {
        field: 'product_type',
        title: 'Phân loại',
        width: 170,
        slots: { default: 'type-cell' },
      },
      {
        field: 'visibility',
        title: 'Hiển thị',
        width: 130,
        slots: { default: 'vis-cell' },
      },
      {
        field: 'variants',
        title: 'Biến thể SKU & Giá',
        minWidth: 240,
        slots: { default: 'sku-cell' },
      },
      {
        field: 'actions',
        title: 'Thao tác',
        width: 145,
        align: 'right',
        slots: { default: 'action-cell' },
      },
    ],
  },
});

// 2. All Orders Grid
const [OrdersGrid, ordersGridApi] = useVbenVxeGrid<CommerceOrderRecord>({
  separator: false,
  formOptions: {
    schema: [
      {
        component: 'Select',
        fieldName: 'status',
        label: 'Trạng thái',
        defaultValue: 'all',
        componentProps: {
          options: [
            { label: 'Tất cả trạng thái', value: 'all' },
            { label: 'completed', value: 'completed' },
            { label: 'pending_payment', value: 'pending_payment' },
            { label: 'manual_review', value: 'manual_review' },
            { label: 'failed', value: 'failed' },
          ],
        },
      },
      {
        component: 'Input',
        fieldName: 'search',
        label: 'Tìm kiếm',
        componentProps: {
          placeholder: 'Tìm mã đơn ORD-..., email khách hoặc tenant UUID...',
          clearable: true,
        },
      },
    ],
    layout: 'vertical',
    showCollapseButton: false,
    submitOnChange: true,
    submitOnEnter: true,
    submitButtonOptions: { content: $t('common.filter') },
    resetButtonOptions: { content: $t('common.reset') },
    actionWrapperClass: 'flex items-center justify-end gap-2',
    wrapperClass: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3',
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
    columns: [
      {
        field: 'order_code',
        title: 'Mã đơn hàng',
        minWidth: 185,
        slots: { default: 'code-cell' },
      },
      {
        field: 'buyer_email',
        title: 'Khách hàng / Tenant',
        minWidth: 210,
        slots: { default: 'buyer-cell' },
      },
      {
        field: 'payment_method',
        title: 'Kênh TT',
        width: 150,
      },
      {
        field: 'total_credits',
        title: 'Giá trị',
        width: 140,
        slots: { default: 'total-cell' },
      },
      {
        field: 'status',
        title: 'Trạng thái',
        width: 145,
        slots: { default: 'status-cell' },
      },
      {
        field: 'created_at',
        title: 'Ngày tạo',
        width: 160,
        slots: { default: 'date-cell' },
      },
      {
        field: 'actions',
        title: 'Điều phối',
        width: 150,
        align: 'right',
        slots: { default: 'action-cell' },
      },
    ],
  },
});

// 3. Manual Review Intents Grid
const [ManualReviewGrid, manualReviewGridApi] =
  useVbenVxeGrid<PaymentIntentItem>({
    separator: false,
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
      columns: [
        {
          field: 'transfer_code',
          title: 'Mã chuyển khoản',
          width: 165,
          slots: { default: 'code-cell' },
        },
        {
          field: 'gateway_id',
          title: 'Cổng thanh toán',
          width: 160,
        },
        {
          field: 'target_type',
          title: 'Mục đích',
          width: 165,
        },
        {
          field: 'amount_credits',
          title: 'Số Xu yêu cầu',
          width: 145,
          slots: { default: 'credits-cell' },
        },
        {
          field: 'pay_amount',
          title: 'Số tiền quy đổi',
          width: 165,
          slots: { default: 'pay-cell' },
        },
        {
          field: 'created_at',
          title: 'Thời gian tạo',
          width: 165,
          slots: { default: 'date-cell' },
        },
        {
          field: 'actions',
          title: 'Phê duyệt',
          width: 155,
          align: 'right',
          slots: { default: 'action-cell' },
        },
      ],
    },
  });

// 4. Payment Gateways Grid
const [GatewaysGrid, gatewaysGridApi] = useVbenVxeGrid<PaymentGatewayItem>({
  separator: false,
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
    columns: [
      {
        field: 'name',
        title: 'Tên cổng thanh toán',
        minWidth: 230,
        slots: { default: 'name-cell' },
      },
      {
        field: 'channel',
        title: 'Kênh (Channel)',
        width: 155,
      },
      {
        field: 'driver',
        title: 'Adapter Driver',
        width: 140,
      },
      {
        field: 'rate_per_credit',
        title: 'Tỷ giá (1 Xu)',
        width: 165,
        slots: { default: 'rate-cell' },
      },
      {
        field: 'is_active',
        title: 'Trạng thái',
        width: 135,
        slots: { default: 'status-cell' },
      },
      {
        field: 'actions',
        title: 'Cấu hình',
        width: 140,
        align: 'right',
        slots: { default: 'action-cell' },
      },
    ],
  },
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
      variant_name: firstVar?.name || 'Gói tiêu chuẩn',
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
      variant_name: 'Gói tiêu chuẩn',
      visibility: 'public',
    };
  }
  productModalOpen.value = true;
}

async function handleSaveProductAndVariant() {
  const f = productForm.value;
  if (!f.name.trim() || !f.slug.trim() || !f.sku.trim()) {
    toast.error('Vui lòng nhập đầy đủ Tên sản phẩm, Slug và Mã SKU');
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
      name: f.variant_name.trim() || 'Gói tiêu chuẩn',
      price_credits: Math.max(0, Math.trunc(f.price_credits)),
      product_id: savedProduct.id,
      sku: f.sku.trim(),
      stock_mode: f.stock_mode,
    });

    toast.success(`Đã lưu sản phẩm ${savedProduct.name} & SKU ${f.sku}`);
    productModalOpen.value = false;
    await productsGridApi.reload();
  } catch (error: any) {
    toast.error(error?.message || 'Không thể lưu sản phẩm');
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
    toast.error('Vui lòng chọn biến thể SKU cần nạp kho');
    return;
  }
  const lines = stockLinesRaw.value
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    toast.error('Vui lòng dán ít nhất 1 dòng dữ liệu kho');
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
      `Đã nạp +${res.imported_count} dòng mới (Bỏ qua ${res.skipped_duplicates} dòng trùng). Tồn kho mới: ${res.available_stock}`,
    );
    stockModalOpen.value = false;
    await productsGridApi.reload();
  } catch (error: any) {
    toast.error(error?.message || 'Nạp kho thất bại');
  } finally {
    importingStock.value = false;
  }
}

async function handleManualFulfillOrder(order: CommerceOrderRecord) {
  try {
    const res = await fulfillOrderAdminApi(order.id);
    if (res.fulfilled) {
      toast.success(
        `Đã kích hoạt xuất kho thành công cho đơn ${order.order_code}`,
      );
    } else {
      toast.info(`Đơn ${order.order_code} chưa đủ điều kiện hoặc hết tồn kho`);
    }
    await ordersGridApi.reload();
  } catch (error: any) {
    toast.error(error?.message || 'Không thể xuất kho đơn hàng');
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
        `Đã duyệt lệnh ${intent.transfer_code} (+${intent.amount_credits} Xu)`,
      );
      await manualReviewGridApi.reload();
    } else {
      toast.error(res.reason || 'Không thể duyệt lệnh thanh toán');
    }
  } catch (error: any) {
    toast.error(error?.message || 'Lỗi khi duyệt lệnh thanh toán');
  }
}

function openGatewayModal(gw: PaymentGatewayItem) {
  editingGateway.value = { ...gw };
  gatewayPublicConfigText.value = JSON.stringify(
    gw.public_config || {},
    null,
    2,
  );
  gatewayModalOpen.value = true;
}

async function handleSaveGateway() {
  if (!editingGateway.value) return;
  let parsedConfig: Record<string, any>;
  try {
    parsedConfig = JSON.parse(gatewayPublicConfigText.value || '{}');
  } catch {
    toast.error('Cấu hình public_config không đúng định dạng JSON');
    return;
  }

  savingGateway.value = true;
  try {
    await upsertPaymentGatewayAdminApi({
      channel: editingGateway.value.channel,
      currency: editingGateway.value.currency,
      driver: editingGateway.value.driver,
      id: editingGateway.value.id,
      is_active: editingGateway.value.is_active,
      name: editingGateway.value.name,
      public_config: parsedConfig,
      rate_per_credit: Number(editingGateway.value.rate_per_credit),
      sort_order: Number(editingGateway.value.sort_order),
    });
    toast.success(`Đã cập nhật cổng thanh toán ${editingGateway.value.name}`);
    gatewayModalOpen.value = false;
    await gatewaysGridApi.reload();
  } catch (error: any) {
    toast.error(error?.message || 'Không thể cập nhật cổng thanh toán');
  } finally {
    savingGateway.value = false;
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
  <div class="space-y-4 p-4 sm:space-y-5 sm:p-5">
    <!-- Top Header -->
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex flex-col gap-1">
        <h1
          class="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
        >
          {{ $t('page.commerce.admin') }}
        </h1>
        <p class="text-xs text-muted-foreground">
          {{ $t('page.commerce.admin_desc') }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          class="gap-1.5"
          @click="() => openBulkStockModal()"
        >
          <Upload class="size-3.5 text-primary" />
          Nạp kho hàng loạt
        </Button>

        <Button
          size="sm"
          class="gap-1.5"
          @click="() => openCreateProductModal()"
        >
          <Plus class="size-3.5" />
          Thêm sản phẩm / SKU
        </Button>

        <Button
          variant="outline"
          size="sm"
          class="gap-1.5"
          @click="reloadCurrentTab"
        >
          <RefreshCw class="size-3.5 text-muted-foreground" />
          {{ $t('common.refresh') }}
        </Button>
      </div>
    </div>

    <!-- Summary KPI Cards -->
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-4">
      <div class="rounded-xl border border-border/60 bg-card p-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-muted-foreground">
            Sản phẩm đang bán
          </span>
          <Layers class="size-4 text-primary" />
        </div>
        <p class="mt-2 font-mono text-2xl font-bold text-foreground">
          {{ allProducts.length }}
        </p>
      </div>

      <div class="rounded-xl border border-border/60 bg-card p-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-muted-foreground">
            Tổng tồn kho khả dụng
          </span>
          <PackagePlus class="size-4 text-success" />
        </div>
        <p class="mt-2 font-mono text-2xl font-bold text-foreground">
          {{ totalAvailableStock.toLocaleString('en-US') }}
        </p>
      </div>

      <div class="rounded-xl border border-border/60 bg-card p-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-muted-foreground">
            Lệnh chờ duyệt tay
          </span>
          <AlertTriangle class="size-4 text-warning" />
        </div>
        <p class="mt-2 font-mono text-2xl font-bold text-foreground">
          {{ manualReviewIntents.length }}
        </p>
      </div>

      <div class="rounded-xl border border-border/60 bg-card p-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-muted-foreground">
            Cổng thanh toán kích hoạt
          </span>
          <CreditCard class="size-4 text-primary" />
        </div>
        <p class="mt-2 font-mono text-2xl font-bold text-foreground">
          {{ allGateways.filter((g) => g.is_active).length }} /
          {{ allGateways.length }}
        </p>
      </div>
    </div>

    <!-- Mode Selector Tabs -->
    <div
      class="flex flex-wrap items-center gap-2 border-b border-border/60 pb-2"
    >
      <Button
        size="sm"
        :variant="activeTab === 'products' ? 'default' : 'outline'"
        class="gap-1.5 text-xs"
        @click="activeTab = 'products'"
      >
        <Layers class="size-3.5" />
        Sản phẩm & Kho hàng ({{ allProducts.length }})
      </Button>

      <Button
        size="sm"
        :variant="activeTab === 'orders' ? 'default' : 'outline'"
        class="gap-1.5 text-xs"
        @click="activeTab = 'orders'"
      >
        <PackageCheck class="size-3.5" />
        Đơn hàng toàn hệ thống ({{ allOrders.length }})
      </Button>

      <Button
        size="sm"
        :variant="activeTab === 'manual_review' ? 'default' : 'outline'"
        class="gap-1.5 text-xs"
        @click="activeTab = 'manual_review'"
      >
        <AlertTriangle class="size-3.5" />
        Duyệt thanh toán thủ công ({{ manualReviewIntents.length }})
      </Button>

      <Button
        size="sm"
        :variant="activeTab === 'gateways' ? 'default' : 'outline'"
        class="gap-1.5 text-xs"
        @click="activeTab = 'gateways'"
      >
        <SlidersHorizontal class="size-3.5" />
        Cổng thanh toán ({{ allGateways.length }})
      </Button>
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
            <span class="font-mono text-xs text-muted-foreground">
              /{{ row.slug }}
            </span>
          </div>
        </template>

        <template #type-cell="{ row }">
          <Badge variant="outline" class="font-mono text-2xs">
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
              class="font-mono text-2xs"
            >
              {{ v.sku }}: {{ v.price_credits }} Xu ({{
                v.stock_mode === 'unlimited'
                  ? '∞'
                  : `Kho: ${v.available_stock}`
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
              Nạp kho
            </Button>
            <Button
              size="sm"
              variant="outline"
              class="h-7 px-2 text-xs"
              @click="openCreateProductModal(row)"
            >
              Sửa
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
          <span class="font-mono text-xs font-semibold text-foreground">
            {{ row.order_code }}
          </span>
        </template>

        <template #buyer-cell="{ row }">
          <div class="flex flex-col py-1 text-left">
            <span class="text-xs font-medium text-foreground">
              {{ row.buyer_email || 'Tenant Member' }}
            </span>
            <span class="font-mono text-2xs text-muted-foreground">
              {{
                row.buyer_tenant_id
                  ? `Tenant: ${row.buyer_tenant_id.slice(0, 8)}`
                  : 'Guest Checkout'
              }}
            </span>
          </div>
        </template>

        <template #total-cell="{ row }">
          <span class="font-mono text-xs font-bold text-foreground">
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
            Giao hàng lại
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
            class="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary"
          >
            {{ row.transfer_code }}
          </code>
        </template>

        <template #credits-cell="{ row }">
          <span class="font-mono text-xs font-bold text-foreground">
            {{ row.amount_credits.toLocaleString('en-US') }} Xu
          </span>
        </template>

        <template #pay-cell="{ row }">
          <span class="font-mono text-xs text-foreground">
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
            Duyệt lệnh
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
            <span class="font-mono text-2xs text-muted-foreground">
              ID: {{ row.id }}
            </span>
          </div>
        </template>

        <template #rate-cell="{ row }">
          <span class="font-mono text-xs font-semibold text-foreground">
            1 Xu = {{ row.rate_per_credit.toLocaleString('en-US') }}
            {{ row.currency }}
          </span>
        </template>

        <template #status-cell="{ row }">
          <Badge :variant="row.is_active ? 'default' : 'outline'">
            {{ row.is_active ? 'Đang bật' : 'Đang tắt' }}
          </Badge>
        </template>

        <template #action-cell="{ row }">
          <Button
            size="sm"
            variant="outline"
            class="h-7 gap-1 px-2.5 text-xs"
            @click="openGatewayModal(row)"
          >
            <Settings2 class="size-3.5" />
            Cấu hình
          </Button>
        </template>
      </GatewaysGrid>
    </div>

    <!-- Modal 1: Upsert Product & SKU Variant -->
    <Dialog v-model:open="productModalOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle class="text-base font-semibold">
            Thiết lập Sản phẩm số & Biến thể SKU
          </DialogTitle>
          <DialogDescription class="text-xs text-muted-foreground">
            Tạo mới hoặc cập nhật sản phẩm theo `slug` và biến thể theo `sku`.
          </DialogDescription>
        </DialogHeader>

        <div class="grid grid-cols-1 gap-3 py-2 sm:grid-cols-2">
          <div class="space-y-1 sm:col-span-2">
            <label class="text-xs font-medium text-foreground">
              Tên sản phẩm
            </label>
            <input
              v-model="productForm.name"
              type="text"
              placeholder="VD: Tài khoản Via cổ 2FA"
              class="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium text-foreground">
              Định danh Slug
            </label>
            <input
              v-model="productForm.slug"
              type="text"
              placeholder="via-co-2fa"
              class="h-8 w-full rounded-md border border-border bg-background px-2.5 font-mono text-xs text-foreground"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium text-foreground">
              Loại sản phẩm
            </label>
            <select
              v-model="productForm.product_type"
              class="h-8 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground"
            >
              <option value="serial_stock">serial_stock (Tài khoản/Key)</option>
              <option value="specter_resource">
                specter_resource (Proxy/Workflow)
              </option>
              <option value="digital_file">digital_file (Tệp tải về)</option>
              <option value="wallet_credit">wallet_credit (Nạp Xu)</option>
            </select>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium text-foreground">
              Chế độ hiển thị
            </label>
            <select
              v-model="productForm.visibility"
              class="h-8 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground"
            >
              <option value="public">public (Công khai & Storefront)</option>
              <option value="tenant_only">tenant_only (Chỉ Tenant)</option>
              <option value="hidden">hidden (Ẩn)</option>
            </select>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium text-foreground">
              Chế độ quản lý tồn kho
            </label>
            <select
              v-model="productForm.stock_mode"
              class="h-8 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground"
            >
              <option value="serialized">serialized (Kho từng dòng)</option>
              <option value="unlimited">unlimited (Không giới hạn)</option>
              <option value="finite_counter">finite_counter (Bộ đếm)</option>
            </select>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium text-foreground">Mã SKU</label>
            <input
              v-model="productForm.sku"
              type="text"
              placeholder="VIA-2FA-01"
              class="h-8 w-full rounded-md border border-border bg-background px-2.5 font-mono text-xs text-foreground"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium text-foreground">
              Đơn giá (Xu)
            </label>
            <input
              v-model.number="productForm.price_credits"
              type="number"
              min="0"
              class="h-8 w-full rounded-md border border-border bg-background px-2.5 font-mono text-xs text-foreground"
            />
          </div>

          <div class="space-y-1 sm:col-span-2">
            <label class="text-xs font-medium text-foreground">
              Mô tả ngắn
            </label>
            <input
              v-model="productForm.short_description"
              type="text"
              placeholder="Mô tả hiển thị trên thẻ sản phẩm..."
              class="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground"
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
            Nạp kho hàng loạt (Chống trùng lặp SHA-256)
          </DialogTitle>
          <DialogDescription class="text-xs text-muted-foreground">
            Dán mỗi tài khoản (`uid|pass|2fa`), license key hoặc proxy
            (`ip:port:user:pass`) trên 1 dòng. Các dòng trùng lặp sẽ tự động bị
            bỏ qua.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-3 py-2">
          <div class="space-y-1">
            <label class="text-xs font-medium text-foreground">
              Chọn biến thể SKU (`serialized`)
            </label>
            <select
              v-model="selectedStockVariantId"
              class="h-8 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground"
            >
              <option
                v-for="item in serializedVariants"
                :key="item.variant.id"
                :value="item.variant.id"
              >
                {{ item.productName }} — {{ item.variant.sku }} (Tồn:
                {{ item.variant.available_stock }})
              </option>
            </select>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium text-foreground">
              Mã lô nhập (`batch_code`)
            </label>
            <input
              v-model="stockBatchCode"
              type="text"
              class="h-8 w-full rounded-md border border-border bg-background px-2.5 font-mono text-xs text-foreground"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium text-foreground">
              Danh sách dữ liệu kho (Mỗi dòng 1 mục)
            </label>
            <textarea
              v-model="stockLinesRaw"
              rows="7"
              placeholder="1000881122|matkhau123|JBSWY3DPEHPK3PXP&#10;1000881123|matkhau456|KRSXG5CTMVRXEZLU"
              class="w-full rounded-lg border border-border bg-background p-3 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
            ></textarea>
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
            Nạp vào kho
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Modal 3: Edit Payment Gateway -->
    <Dialog v-model:open="gatewayModalOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle class="text-base font-semibold">
            Cấu hình cổng thanh toán: {{ editingGateway?.id }}
          </DialogTitle>
          <DialogDescription class="text-xs text-muted-foreground">
            Điều chỉnh tỷ giá quy đổi 1 Xu, trạng thái kích hoạt và thông tin
            nhận thanh toán (`public_config`).
          </DialogDescription>
        </DialogHeader>

        <div v-if="editingGateway" class="space-y-3 py-2">
          <div class="space-y-1">
            <label class="text-xs font-medium text-foreground">
              Tên hiển thị
            </label>
            <input
              v-model="editingGateway.name"
              type="text"
              class="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-xs font-medium text-foreground">
                Tỷ giá 1 Xu ({{ editingGateway.currency }})
              </label>
              <input
                v-model.number="editingGateway.rate_per_credit"
                type="number"
                step="0.01"
                class="h-8 w-full rounded-md border border-border bg-background px-2.5 font-mono text-xs text-foreground"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-medium text-foreground">
                Trạng thái cổng
              </label>
              <select
                v-model="editingGateway.is_active"
                class="h-8 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground"
              >
                <option :value="true">Đang bật (Active)</option>
                <option :value="false">Tạm tắt (Disabled)</option>
              </select>
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium text-foreground">
              Cấu hình công khai (`public_config` JSON)
            </label>
            <textarea
              v-model="gatewayPublicConfigText"
              rows="6"
              class="w-full rounded-lg border border-border bg-background p-3 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
            ></textarea>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" @click="gatewayModalOpen = false">
            {{ $t('common.cancel') }}
          </Button>
          <Button
            size="sm"
            :disabled="savingGateway"
            @click="handleSaveGateway"
          >
            {{ $t('common.save') }}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
