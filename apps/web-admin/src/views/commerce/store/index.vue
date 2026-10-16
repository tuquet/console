<script lang="ts" setup>
import type {
  CommerceCategoryItem,
  CommerceOrderDeliveryItem,
  CommerceProductItem,
  CommerceProductType,
  CommerceProductVariantItem,
  PaymentChannelType,
  PaymentGatewayItem,
  PaymentIntentItem,
  TenantItem,
  TenantWalletItem,
} from '#/api';

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import {
  Building2,
  Check,
  Coins,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  FileDown,
  KeyRound,
  PackageCheck,
  QrCode,
  RefreshCw,
  Search,
  Server,
  ShoppingBag,
  Sparkles,
  Wallet,
} from '@lucide/vue';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  toast,
} from '@tuquet/vue-ui';

import {
  createCheckoutOrderApi,
  downloadTextFile,
  filterCommerceProducts,
  formatSerialDeliveriesText,
  getActivePaymentGatewaysApi,
  getActiveTenantId,
  getCommerceCategoriesApi,
  getCommerceProductsApi,
  getOrderDeliveriesApi,
  getPaymentIntentStatusApi,
  getTenantsApi,
  getTenantWalletApi,
  isVariantInStock,
  setActiveTenantId,
} from '#/api';
import { useClipboard } from '#/composables';
import { $t } from '#/locales';

defineOptions({ name: 'CommerceStore' });

const router = useRouter();
const { copyToClipboard } = useClipboard();

const loading = ref(false);
const tenants = ref<TenantItem[]>([]);
const selectedTenantId = ref<string>(getActiveTenantId());
const wallet = ref<null | TenantWalletItem>(null);
const categories = ref<CommerceCategoryItem[]>([]);
const products = ref<CommerceProductItem[]>([]);
const gateways = ref<PaymentGatewayItem[]>([]);

const selectedCategoryId = ref<string>('all');
const selectedProductType = ref<string>('all');
const searchKeyword = ref<string>('');

// Map product_id -> selected variant_id
const selectedVariantByProduct = ref<Record<string, string>>({});

// Checkout Dialog state
const checkoutOpen = ref(false);
const activeProduct = ref<CommerceProductItem | null>(null);
const activeVariant = ref<CommerceProductVariantItem | null>(null);
const checkoutQty = ref<number>(1);
const selectedGatewayId = ref<string>('internal_wallet');
const submittingOrder = ref(false);

// Active external payment intent waiting for payment
const pendingIntent = ref<null | PaymentIntentItem>(null);
const pendingOrderId = ref<null | string>(null);
const pendingOrderCode = ref<string>('');
const checkingStatus = ref(false);
let pollTimer: null | ReturnType<typeof setInterval> = null;

// Instant Deliverables Dialog state
const deliveryOpen = ref(false);
const deliveredOrderCode = ref<string>('');
const deliveredItems = ref<CommerceOrderDeliveryItem[]>([]);

const productTypeMap = computed<
  Record<
    CommerceProductType,
    {
      label: string;
      variant: 'default' | 'destructive' | 'outline' | 'secondary';
    }
  >
>(() => ({
  digital_file: {
    label: $t('page.commerce_view.type_digital_file'),
    variant: 'outline',
  },
  serial_stock: {
    label: $t('page.commerce_view.type_serial_stock'),
    variant: 'default',
  },
  specter_resource: {
    label: $t('page.commerce_view.type_specter_resource'),
    variant: 'secondary',
  },
  wallet_credit: {
    label: $t('page.commerce_view.type_wallet_credit'),
    variant: 'outline',
  },
}));

const filteredProducts = computed(() => {
  return filterCommerceProducts(products.value, {
    category_id: selectedCategoryId.value,
    product_type: selectedProductType.value,
    search: searchKeyword.value,
  });
});

const externalGateways = computed(() =>
  gateways.value.filter((g) => g.is_active && g.channel !== 'internal_wallet'),
);

const currentGateway = computed<null | PaymentGatewayItem>(() => {
  if (selectedGatewayId.value === 'internal_wallet') {
    return null;
  }
  return (
    externalGateways.value.find((g) => g.id === selectedGatewayId.value) || null
  );
});

const totalCheckoutCredits = computed(() => {
  if (!activeVariant.value) return 0;
  return activeVariant.value.price_credits * Math.max(1, checkoutQty.value);
});

const walletBalance = computed(() => wallet.value?.balance_credits ?? 0);

const hasEnoughWalletCredits = computed(
  () => walletBalance.value >= totalCheckoutCredits.value,
);

const estimatedFiatAmount = computed(() => {
  if (!currentGateway.value) return 0;
  return totalCheckoutCredits.value * currentGateway.value.rate_per_credit;
});

function getProductTypeBadge(type: CommerceProductType) {
  return (
    productTypeMap.value[type] || { label: type, variant: 'outline' as const }
  );
}

function getSelectedVariant(
  product: CommerceProductItem,
): CommerceProductVariantItem | null {
  const variants = product.variants || [];
  if (variants.length === 0) return null;
  const chosenId = selectedVariantByProduct.value[product.id];
  return variants.find((v) => v.id === chosenId) || variants[0] || null;
}

function selectVariant(productId: string, variantId: string) {
  selectedVariantByProduct.value = {
    ...selectedVariantByProduct.value,
    [productId]: variantId,
  };
}

async function loadStoreData() {
  loading.value = true;
  try {
    const [tenantRows, categoryRows, productRows, gatewayRows] =
      await Promise.all([
        getTenantsApi().catch(() => [] as TenantItem[]),
        getCommerceCategoriesApi().catch(() => [] as CommerceCategoryItem[]),
        getCommerceProductsApi().catch(() => [] as CommerceProductItem[]),
        getActivePaymentGatewaysApi().catch(() => [] as PaymentGatewayItem[]),
      ]);

    tenants.value = tenantRows;
    categories.value = categoryRows;
    products.value = productRows;
    gateways.value = gatewayRows;

    const initialMap: Record<string, string> = {};
    for (const p of productRows) {
      if (p.variants && p.variants.length > 0 && p.variants[0]) {
        initialMap[p.id] = p.variants[0].id;
      }
    }
    selectedVariantByProduct.value = initialMap;

    if (
      (!selectedTenantId.value ||
        !tenantRows.some((t) => t.id === selectedTenantId.value)) &&
      tenantRows.length > 0 &&
      tenantRows[0]
    ) {
      selectedTenantId.value = tenantRows[0].id;
      setActiveTenantId(selectedTenantId.value);
    }

    if (selectedTenantId.value) {
      wallet.value = await getTenantWalletApi(selectedTenantId.value).catch(
        () => null,
      );
    }
  } finally {
    loading.value = false;
  }
}

async function handleTenantChange(value: unknown) {
  const nextId = String(value || '');
  if (!nextId) return;
  selectedTenantId.value = nextId;
  setActiveTenantId(nextId);
  wallet.value = await getTenantWalletApi(nextId).catch(() => null);
}

function openCheckoutModal(product: CommerceProductItem) {
  const variant = getSelectedVariant(product);
  if (!variant) {
    toast.error($t('page.commerce_view.no_sku_available'));
    return;
  }
  stopPolling();
  activeProduct.value = product;
  activeVariant.value = variant;
  checkoutQty.value = Math.max(1, variant.min_qty || 1);
  selectedGatewayId.value = 'internal_wallet';
  pendingIntent.value = null;
  pendingOrderId.value = null;
  pendingOrderCode.value = '';
  checkoutOpen.value = true;
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function startPollingIntent(intentId: string, orderId: string) {
  stopPolling();
  pollTimer = setInterval(async () => {
    await checkPendingPaymentStatus(intentId, orderId, true);
  }, 3000);
}

async function checkPendingPaymentStatus(
  intentId: string,
  orderId: string,
  silent = false,
) {
  if (checkingStatus.value) return;
  checkingStatus.value = true;
  try {
    const updated = await getPaymentIntentStatusApi(intentId);
    if (!updated) return;
    pendingIntent.value = updated;

    if (updated.status === 'succeeded') {
      stopPolling();
      toast.success($t('page.commerce_view.payment_success_opening'));
      const deliveries = await getOrderDeliveriesApi(orderId).catch(() => []);
      deliveredOrderCode.value = pendingOrderCode.value;
      deliveredItems.value = deliveries;
      checkoutOpen.value = false;
      deliveryOpen.value = true;
      await loadStoreData();
    } else if (updated.status === 'manual_review' && !silent) {
      toast.info($t('page.commerce_view.payment_manual_review_pending'));
    } else if (!silent) {
      toast.info($t('page.commerce_view.payment_waiting_gateway'));
    }
  } finally {
    checkingStatus.value = false;
  }
}

async function handleCreateOrder() {
  if (!activeProduct.value || !activeVariant.value) return;
  if (!selectedTenantId.value) {
    toast.error($t('page.commerce_view.select_workspace_before_buy'));
    return;
  }

  const isInternalWallet = selectedGatewayId.value === 'internal_wallet';
  if (isInternalWallet && !hasEnoughWalletCredits.value) {
    toast.error($t('page.commerce_view.insufficient_wallet_balance'));
    return;
  }

  const chosenGw = currentGateway.value;
  const paymentMethod: PaymentChannelType = isInternalWallet
    ? 'internal_wallet'
    : chosenGw?.channel || 'bank_transfer';

  submittingOrder.value = true;
  try {
    const res = await createCheckoutOrderApi({
      buyer_tenant_id: selectedTenantId.value,
      gateway_code: isInternalWallet ? 'internal_wallet' : chosenGw?.id || null,
      items: [
        {
          quantity: checkoutQty.value,
          variant_id: activeVariant.value.id,
        },
      ],
      payment_method: paymentMethod,
    });

    if (res.order.status === 'completed' || isInternalWallet) {
      toast.success(
        $t('page.commerce_view.order_paid_and_delivered', {
          code: res.order.order_code,
        }),
      );
      deliveredOrderCode.value = res.order.order_code;
      deliveredItems.value = res.fulfillment?.deliveries || [];
      checkoutOpen.value = false;
      deliveryOpen.value = true;
      await loadStoreData();
    } else {
      pendingOrderId.value = res.order.id;
      pendingOrderCode.value = res.order.order_code;
      pendingIntent.value = res.payment_intent;
      startPollingIntent(res.payment_intent.id, res.order.id);
      toast.success(
        $t('page.commerce_view.payment_intent_created', {
          code: res.payment_intent.transfer_code,
        }),
      );
    }
  } catch (error: any) {
    toast.error(error?.message || $t('page.commerce_view.order_create_failed'));
  } finally {
    submittingOrder.value = false;
  }
}

const serialLinesText = computed(() =>
  formatSerialDeliveriesText(deliveredItems.value),
);

async function copyText(
  text: string,
  label = $t('page.commerce_view.copy_default_label'),
) {
  await copyToClipboard(text, $t('page.commerce_view.copied_label', { label }));
}

function downloadSerialTxt() {
  if (!serialLinesText.value) return;
  downloadTextFile(
    `${deliveredOrderCode.value || 'deliveries'}.txt`,
    serialLinesText.value,
  );
}

watch(checkoutOpen, (open) => {
  if (!open) {
    stopPolling();
  }
});

onMounted(() => {
  loadStoreData();
});

onBeforeUnmount(() => {
  stopPolling();
});
</script>

<template>
  <div class="space-y-3 p-3 sm:space-y-4 sm:p-5">
    <!-- Top Header & Workspace Wallet Banner -->
    <div class="flex items-center justify-between gap-2">
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <h1
            class="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl"
          >
            {{ $t('page.commerce.store') }}
          </h1>
          <Badge variant="secondary" class="text-xs font-normal">
            {{ filteredProducts.length }}
          </Badge>
        </div>
        <p class="hidden text-xs text-muted-foreground sm:block">
          {{ $t('page.commerce.store_desc') }}
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <!-- Workspace Selector -->
        <div
          class="hidden sm:flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-2.5 py-1"
        >
          <Building2 class="size-3.5 shrink-0 text-muted-foreground" />
          <Select
            :model-value="selectedTenantId"
            @update:model-value="handleTenantChange"
          >
            <SelectTrigger
              class="h-6 max-w-[150px] border-0 bg-transparent px-1 py-0 text-xs font-medium text-foreground shadow-none focus:ring-0"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="tenant in tenants"
                :key="tenant.id"
                :value="tenant.id"
              >
                {{ tenant.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Xu Wallet Pill -->
        <div
          class="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1"
        >
          <Coins class="size-3.5 text-primary" />
          <span class="hidden sm:inline text-xs text-muted-foreground">
            {{ $t('page.commerce_view.balance_label') }}:
          </span>
          <span class="text-xs sm:text-sm font-bold text-foreground">
            {{ walletBalance.toLocaleString('en-US') }} Xu
          </span>
          <Button
            size="sm"
            variant="default"
            class="h-6 px-2 text-2xs"
            @click="router.push('/commerce/wallet')"
          >
            + {{ $t('page.commerce_view.topup_xu') }}
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          class="hidden md:inline-flex h-8 gap-1.5 text-xs"
          @click="router.push('/commerce/orders')"
        >
          <PackageCheck class="size-3.5 text-muted-foreground" />
          {{ $t('page.commerce_view.purchased_orders') }}
        </Button>

        <Button
          variant="outline"
          size="sm"
          class="hidden lg:inline-flex h-8 gap-1.5 text-xs"
          @click="router.push('/store')"
        >
          <ExternalLink class="size-3.5 text-muted-foreground" />
          {{ $t('page.commerce_view.public_storefront') }}
        </Button>

        <Button
          variant="outline"
          size="icon"
          class="size-8 shrink-0"
          :title="$t('common.refresh')"
          @click="loadStoreData"
        >
          <RefreshCw
            class="size-3.5 shrink-0"
            :class="{ 'animate-spin': loading }"
          />
        </Button>
      </div>
    </div>

    <!-- Filter & Search Bar -->
    <div
      class="flex flex-col gap-2.5 rounded-xl border border-border/60 bg-card p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4"
    >
      <div
        class="flex items-center gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap"
      >
        <Button
          size="sm"
          :variant="selectedCategoryId === 'all' ? 'default' : 'outline'"
          class="h-8 shrink-0 text-xs"
          @click="selectedCategoryId = 'all'"
        >
          {{ $t('page.commerce_view.all_categories') }}
        </Button>
        <Button
          v-for="cat in categories"
          :key="cat.id"
          size="sm"
          :variant="selectedCategoryId === cat.id ? 'default' : 'outline'"
          class="h-8 shrink-0 text-xs"
          @click="selectedCategoryId = cat.id"
        >
          {{ cat.name }}
        </Button>
      </div>

      <div class="grid grid-cols-2 gap-2 sm:flex sm:items-center">
        <Select v-model="selectedProductType">
          <SelectTrigger class="h-8 w-full text-xs sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {{ $t('page.commerce_view.all_resource_types') }}
            </SelectItem>
            <SelectItem value="serial_stock">
              {{ $t('page.commerce_view.type_serial_stock') }}
            </SelectItem>
            <SelectItem value="specter_resource">
              {{ $t('page.commerce_view.type_specter_resource') }}
            </SelectItem>
            <SelectItem value="digital_file">
              {{ $t('page.commerce_view.type_digital_file') }}
            </SelectItem>
            <SelectItem value="wallet_credit">
              {{ $t('page.commerce_view.type_wallet_credit') }}
            </SelectItem>
          </SelectContent>
        </Select>

        <div class="relative w-full sm:w-64">
          <Search
            class="pointer-events-none absolute top-2.5 left-2.5 size-3.5 text-muted-foreground"
          />
          <Input
            v-model="searchKeyword"
            type="text"
            :placeholder="
              $t('page.commerce_view.search_product_sku_placeholder')
            "
            class="h-8 w-full pr-3 pl-8 text-xs"
          />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="!loading && filteredProducts.length === 0"
      class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/50 py-14 text-center"
    >
      <ShoppingBag class="size-10 text-muted-foreground/50" />
      <h3 class="mt-3 text-base font-semibold text-foreground">
        {{ $t('page.commerce_view.empty_products_title') }}
      </h3>
      <p class="mt-1 max-w-md text-xs text-muted-foreground">
        {{ $t('page.commerce_view.empty_products_desc') }}
      </p>
    </div>

    <!-- Product Grid -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="flex flex-col justify-between rounded-xl border border-border/60 bg-card p-5 transition-all hover:border-primary/40 hover:shadow-sm"
      >
        <div class="space-y-3">
          <!-- Type & Visibility Row -->
          <div class="flex items-center justify-between gap-2">
            <Badge
              :variant="getProductTypeBadge(product.product_type).variant"
              class="text-2xs"
            >
              {{ getProductTypeBadge(product.product_type).label }}
            </Badge>
            <span
              v-if="getSelectedVariant(product)"
              class="text-2xs text-muted-foreground"
            >
              SKU: {{ getSelectedVariant(product)?.sku }}
            </span>
          </div>

          <!-- Product Title & Description -->
          <div>
            <h3 class="text-base font-semibold text-foreground">
              {{ product.name }}
            </h3>
            <p class="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {{
                product.short_description ||
                product.description ||
                $t('page.commerce_view.default_product_desc')
              }}
            </p>
          </div>

          <!-- Variant Selector Pills -->
          <div
            v-if="product.variants && product.variants.length > 0"
            class="space-y-1.5 pt-1"
          >
            <span
              class="text-2xs font-semibold tracking-wider text-muted-foreground uppercase"
            >
              {{ $t('page.commerce_view.select_sku_label') }}
            </span>
            <div class="flex flex-wrap gap-1.5">
              <Button
                v-for="variant in product.variants"
                :key="variant.id"
                type="button"
                variant="outline"
                size="sm"
                class="h-auto rounded-lg px-2.5 py-1 text-left text-xs transition-colors"
                :class="
                  getSelectedVariant(product)?.id === variant.id
                    ? 'border-primary bg-primary/10 font-semibold text-primary'
                    : 'border-border/70 bg-background text-foreground hover:border-primary/40'
                "
                @click="selectVariant(product.id, variant.id)"
              >
                {{ variant.name }}
              </Button>
            </div>
          </div>
        </div>

        <!-- Price, Stock & Buy CTA -->
        <div
          class="mt-5 flex items-end justify-between border-t border-border/50 pt-4"
        >
          <div class="space-y-0.5">
            <div class="flex items-baseline gap-1.5">
              <span class="text-xl font-bold text-foreground">
                {{
                  (
                    getSelectedVariant(product)?.price_credits ?? 0
                  ).toLocaleString('en-US')
                }}
                Xu
              </span>
              <span
                v-if="
                  getSelectedVariant(product)?.compare_at_credits &&
                  (getSelectedVariant(product)?.compare_at_credits ?? 0) >
                    (getSelectedVariant(product)?.price_credits ?? 0)
                "
                class="text-xs text-muted-foreground line-through"
              >
                {{
                  getSelectedVariant(
                    product,
                  )?.compare_at_credits?.toLocaleString('en-US')
                }}
                Xu
              </span>
            </div>
            <div class="flex items-center gap-1.5 text-xs">
              <span
                v-if="getSelectedVariant(product)?.stock_mode === 'unlimited'"
                class="font-medium text-success"
              >
                ● {{ $t('page.commerce_view.in_stock_unlimited') }}
              </span>
              <span
                v-else-if="
                  (getSelectedVariant(product)?.available_stock ?? 0) > 0
                "
                class="font-medium text-success"
              >
                ●
                {{
                  $t('page.commerce_view.stock_count', {
                    count: getSelectedVariant(product)?.available_stock,
                  })
                }}
              </span>
              <span v-else class="font-medium text-destructive">
                ● {{ $t('page.commerce_view.out_of_stock') }}
              </span>
            </div>
          </div>

          <Button
            size="sm"
            :disabled="!isVariantInStock(getSelectedVariant(product))"
            class="gap-1.5"
            @click="openCheckoutModal(product)"
          >
            <ShoppingBag class="size-3.5" />
            {{ $t('page.commerce_view.buy_now') }}
          </Button>
        </div>
      </div>
    </div>

    <!-- Multi-Channel Checkout Dialog -->
    <Dialog v-model:open="checkoutOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2 text-base font-semibold">
            <ShoppingBag class="size-4 text-primary" />
            {{
              pendingIntent
                ? $t('page.commerce_view.pay_order_title', {
                    code: pendingOrderCode,
                  })
                : $t('page.commerce_view.confirm_buy_title', {
                    name: activeProduct?.name || '',
                  })
            }}
          </DialogTitle>
          <DialogDescription class="text-xs text-muted-foreground">
            {{
              pendingIntent
                ? $t('page.commerce_view.pay_order_desc')
                : $t('page.commerce_view.confirm_buy_desc')
            }}
          </DialogDescription>
        </DialogHeader>

        <!-- Step 1: Configure Quantity & Payment Gateway -->
        <div v-if="!pendingIntent && activeVariant" class="space-y-4 py-2">
          <div
            class="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-3"
          >
            <div>
              <p class="text-sm font-semibold text-foreground">
                {{ activeVariant.name }}
              </p>
              <p class="text-xs text-muted-foreground">
                SKU: {{ activeVariant.sku }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-base font-bold text-primary">
                {{ activeVariant.price_credits.toLocaleString('en-US') }} Xu
              </p>
              <p class="text-2xs text-muted-foreground">
                {{ $t('page.commerce_view.unit_price_label') }}
              </p>
            </div>
          </div>

          <!-- Quantity Input -->
          <div class="flex items-center justify-between">
            <label class="text-xs font-medium text-foreground">
              {{ $t('page.commerce_view.quantity_to_buy') }}
            </label>
            <Input
              v-model.number="checkoutQty"
              type="number"
              :min="activeVariant.min_qty || 1"
              :max="activeVariant.max_qty || 100"
              class="h-8 w-24 px-2.5 text-right text-sm"
            />
          </div>

          <!-- Payment Method Selection -->
          <div class="space-y-2">
            <label
              class="text-2xs font-semibold tracking-wider text-muted-foreground uppercase"
            >
              {{ $t('page.commerce_view.payment_method_label') }}
            </label>

            <!-- Option 1: Instant Xu Wallet -->
            <Button
              type="button"
              variant="outline"
              class="flex h-auto w-full items-center justify-between rounded-lg p-3 text-left font-normal transition-colors"
              :class="
                selectedGatewayId === 'internal_wallet'
                  ? 'border-primary bg-primary/10'
                  : 'border-border/60 bg-card hover:border-primary/40'
              "
              @click="selectedGatewayId = 'internal_wallet'"
            >
              <div class="flex items-center gap-2.5">
                <Wallet class="size-4 text-primary" />
                <div>
                  <p class="text-sm font-semibold text-foreground">
                    {{ $t('page.commerce_view.prepaid_wallet_instant') }}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    {{ $t('page.commerce_view.current_balance_label') }}:
                    <span class="font-semibold text-foreground">
                      {{ walletBalance.toLocaleString('en-US') }} Xu
                    </span>
                  </p>
                </div>
              </div>
              <Badge
                :variant="hasEnoughWalletCredits ? 'default' : 'destructive'"
                class="text-2xs"
              >
                {{
                  hasEnoughWalletCredits
                    ? $t('page.commerce_view.enough_xu')
                    : $t('page.commerce_view.insufficient_xu')
                }}
              </Badge>
            </Button>

            <!-- External Payment Gateways -->
            <Button
              v-for="gw in externalGateways"
              :key="gw.id"
              type="button"
              variant="outline"
              class="flex h-auto w-full items-center justify-between rounded-lg p-3 text-left font-normal transition-colors"
              :class="
                selectedGatewayId === gw.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border/60 bg-card hover:border-primary/40'
              "
              @click="selectedGatewayId = gw.id"
            >
              <div class="flex items-center gap-2.5">
                <CreditCard class="size-4 text-primary" />
                <div>
                  <p class="text-sm font-semibold text-foreground">
                    {{ gw.name }}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    {{ $t('page.commerce_view.exchange_rate_label') }}: 1 Xu =
                    {{ gw.rate_per_credit.toLocaleString('en-US') }}
                    {{ gw.currency }}
                  </p>
                </div>
              </div>
              <Badge variant="outline" class="text-2xs">
                {{ gw.currency }}
              </Badge>
            </Button>
          </div>

          <!-- Total Summary -->
          <div
            class="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3"
          >
            <span class="text-xs font-medium text-muted-foreground">
              {{ $t('page.commerce_view.total_payment') }}
            </span>
            <div class="text-right">
              <p class="text-lg font-bold text-foreground">
                {{ totalCheckoutCredits.toLocaleString('en-US') }} Xu
              </p>
              <p v-if="currentGateway" class="text-xs text-muted-foreground">
                ≈ {{ estimatedFiatAmount.toLocaleString('en-US') }}
                {{ currentGateway.currency }}
              </p>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" @click="checkoutOpen = false">
              {{ $t('common.cancel') }}
            </Button>
            <Button
              size="sm"
              :disabled="
                submittingOrder ||
                (selectedGatewayId === 'internal_wallet' &&
                  !hasEnoughWalletCredits)
              "
              class="gap-1.5"
              @click="handleCreateOrder"
            >
              <Sparkles class="size-3.5" />
              {{
                selectedGatewayId === 'internal_wallet'
                  ? $t('page.commerce_view.pay_with_xu_instant')
                  : $t('page.commerce_view.create_payment_code')
              }}
            </Button>
          </div>
        </div>

        <!-- Step 2: External Gateway QR & Transfer Code Instructions -->
        <div v-else-if="pendingIntent" class="space-y-4 py-2">
          <div
            v-if="pendingIntent.checkout_payload?.qr_image_url"
            class="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-white p-4"
          >
            <img
              :src="pendingIntent.checkout_payload.qr_image_url"
              :alt="$t('page.commerce_view.payment_qr_alt')"
              class="h-52 w-52 object-contain"
            />
            <span class="mt-2 text-2xs font-medium text-slate-600">
              {{ $t('page.commerce_view.scan_vietqr_hint') }}
            </span>
          </div>

          <div
            class="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3.5 text-xs"
          >
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">
                {{ $t('page.commerce_view.transfer_amount_label') }}:
              </span>
              <span class="text-sm font-bold text-foreground">
                {{ pendingIntent.pay_amount.toLocaleString('en-US') }}
                {{ pendingIntent.pay_currency }}
              </span>
            </div>

            <div
              v-if="pendingIntent.checkout_payload?.bank_name"
              class="flex items-center justify-between"
            >
              <span class="text-muted-foreground">
                {{ $t('page.commerce_view.bank_or_wallet_label') }}:
              </span>
              <span class="font-medium text-foreground">
                {{ pendingIntent.checkout_payload.bank_name }} —
                {{ pendingIntent.checkout_payload.account_no }}
              </span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">
                {{ $t('page.commerce_view.transfer_memo_label') }}:
              </span>
              <div class="flex items-center gap-1.5">
                <code
                  class="rounded bg-primary/15 px-2 py-0.5 text-sm font-bold text-primary"
                >
                  {{ pendingIntent.transfer_code }}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  class="h-6 px-2 text-2xs"
                  @click="
                    copyText(
                      pendingIntent.transfer_code,
                      $t('page.commerce_view.transfer_code_label'),
                    )
                  "
                >
                  <Copy class="size-3" />
                </Button>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">
                {{ $t('common.status') }}:
              </span>
              <Badge variant="secondary" class="text-2xs">
                {{ pendingIntent.status }} ({{
                  $t('page.commerce_view.auto_check_3s')
                }})
              </Badge>
            </div>
          </div>

          <div class="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              @click="
                () => {
                  stopPolling();
                  checkoutOpen = false;
                }
              "
            >
              {{ $t('common.close') }}
            </Button>
            <Button
              size="sm"
              class="gap-1.5"
              :disabled="checkingStatus"
              @click="
                () =>
                  pendingIntent &&
                  pendingOrderId &&
                  checkPendingPaymentStatus(
                    pendingIntent.id,
                    pendingOrderId,
                    false,
                  )
              "
            >
              <RefreshCw
                class="size-3.5"
                :class="{ 'animate-spin': checkingStatus }"
              />
              {{ $t('page.commerce_view.check_payment_btn') }}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Instant Fulfillment Deliverables Dialog -->
    <Dialog v-model:open="deliveryOpen">
      <DialogContent class="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2 text-base font-semibold">
            <Check class="size-4 text-success" />
            {{
              $t('page.commerce_view.delivery_dialog_title', {
                code: deliveredOrderCode,
              })
            }}
          </DialogTitle>
          <DialogDescription class="text-xs text-muted-foreground">
            {{ $t('page.commerce_view.delivery_dialog_desc') }}
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-2">
          <!-- Serialized Stock Block -->
          <div v-if="serialLinesText" class="space-y-2">
            <div class="flex items-center justify-between">
              <span
                class="flex items-center gap-1.5 text-xs font-semibold text-foreground"
              >
                <KeyRound class="size-3.5 text-primary" />
                {{
                  $t('page.commerce_view.serial_data_lines', {
                    count: deliveredItems.filter(
                      (d) => d.delivery_type === 'serial_stock',
                    ).length,
                  })
                }}
              </span>
              <div class="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  class="h-7 gap-1 text-xs"
                  @click="
                    copyText(
                      serialLinesText,
                      $t('page.commerce_view.all_items_label'),
                    )
                  "
                >
                  <Copy class="size-3" />
                  {{ $t('page.commerce_view.copy_all') }}
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  class="h-7 gap-1 text-xs"
                  @click="downloadSerialTxt"
                >
                  <Download class="size-3" />
                  {{ $t('page.commerce_view.download_txt') }}
                </Button>
              </div>
            </div>
            <Textarea
              readonly
              :model-value="serialLinesText"
              :rows="6"
              class="w-full rounded-lg bg-muted/40 p-3 text-xs"
            />
          </div>

          <!-- Other Deliverable Items (Specter Resource / Digital File / Wallet Credit) -->
          <div
            v-for="item in deliveredItems.filter(
              (d) => d.delivery_type !== 'serial_stock',
            )"
            :key="item.id"
            class="rounded-lg border border-border/60 bg-muted/20 p-3.5 text-xs"
          >
            <div class="flex items-center justify-between">
              <span
                class="flex items-center gap-1.5 font-semibold text-foreground"
              >
                <Server
                  v-if="item.delivery_type === 'specter_resource'"
                  class="size-3.5 text-primary"
                />
                <FileDown
                  v-else-if="item.delivery_type === 'digital_file'"
                  class="size-3.5 text-primary"
                />
                <QrCode v-else class="size-3.5 text-primary" />
                {{ getProductTypeBadge(item.delivery_type).label }}
              </span>
              <Badge variant="default" class="text-2xs">
                {{ $t('page.commerce_view.activated_badge') }}
              </Badge>
            </div>
            <pre
              class="mt-2 overflow-x-auto rounded bg-background p-2 text-2xs text-muted-foreground"
              >{{ JSON.stringify(item.delivered_payload, null, 2) }}</pre>
            <div
              v-if="item.delivered_payload?.download_url"
              class="mt-2 flex justify-end"
            >
              <a
                :href="item.delivered_payload.download_url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <ExternalLink class="size-3" />
                {{ $t('page.commerce_view.download_file') }}
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
