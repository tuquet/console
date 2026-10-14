<script lang="ts" setup>
import type {
  CommerceCategoryItem,
  CommerceOrderDeliveryItem,
  CommerceOrderRecord,
  CommerceProductItem,
  CommerceProductType,
  CommerceProductVariantItem,
  PaymentChannelType,
  PaymentGatewayItem,
  PaymentIntentItem,
  SavedGuestOrderItem,
} from '#/api';

import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  ArrowRight,
  CheckCircle2,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  History,
  KeyRound,
  Lock,
  PackageSearch,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Zap,
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

import {
  createCheckoutOrderApi,
  filterCommerceProducts,
  getActivePaymentGatewaysApi,
  getCommerceCategoriesApi,
  getCommerceProductsApi,
  getGuestOrderDeliveriesApi,
  getSavedGuestOrders,
  saveGuestOrderLocal,
} from '#/api';
import { useDateFormat } from '#/composables';

defineOptions({ name: 'PublicStorefront' });

const route = useRoute();
const router = useRouter();
const { formatDate } = useDateFormat();

type StorefrontMode = 'catalog' | 'lookup';
const activeMode = ref<StorefrontMode>('catalog');

const loadingCatalog = ref(false);
const categories = ref<CommerceCategoryItem[]>([]);
const products = ref<CommerceProductItem[]>([]);
const gateways = ref<PaymentGatewayItem[]>([]);

const selectedCategoryId = ref<string>('all');
const selectedProductType = ref<string>('all');
const searchKeyword = ref<string>('');
const selectedVariantByProduct = ref<Record<string, string>>({});

// Guest Checkout Modal State
const checkoutOpen = ref(false);
const activeProduct = ref<CommerceProductItem | null>(null);
const activeVariant = ref<CommerceProductVariantItem | null>(null);
const checkoutQty = ref<number>(1);
const buyerEmail = ref<string>('');
const selectedGatewayId = ref<string>('');
const submittingOrder = ref(false);

// Active Guest Order & Payment Intent
const createdOrder = ref<CommerceOrderRecord | null>(null);
const createdClaimToken = ref<string>('');
const createdIntent = ref<null | PaymentIntentItem>(null);
const checkingPayment = ref(false);
let pollTimer: null | ReturnType<typeof setInterval> = null;

// Order Lookup & Claim State
const savedOrders = ref<SavedGuestOrderItem[]>([]);
const lookupOrderCode = ref<string>('');
const lookupClaimToken = ref<string>('');
const lookingUp = ref(false);
const lookedUpOrder = ref<CommerceOrderRecord | null>(null);
const lookedUpDeliveries = ref<CommerceOrderDeliveryItem[]>([]);

const publicGateways = computed(() =>
  gateways.value.filter((g) => g.is_active && g.channel !== 'internal_wallet'),
);

const currentGateway = computed<null | PaymentGatewayItem>(
  () =>
    publicGateways.value.find((g) => g.id === selectedGatewayId.value) ||
    publicGateways.value[0] ||
    null,
);

const publicProducts = computed(() => {
  const onlyPublic = products.value.filter((p) => p.visibility === 'public');
  return filterCommerceProducts(onlyPublic, {
    category_id: selectedCategoryId.value,
    product_type: selectedProductType.value,
    search: searchKeyword.value,
  });
});

const totalCheckoutCredits = computed(() => {
  if (!activeVariant.value) return 0;
  return activeVariant.value.price_credits * Math.max(1, checkoutQty.value);
});

const estimatedFiatAmount = computed(() => {
  if (!currentGateway.value) return 0;
  return totalCheckoutCredits.value * currentGateway.value.rate_per_credit;
});

function getProductTypeLabel(type: CommerceProductType): string {
  if (type === 'serial_stock') return 'Tài khoản / License key';
  if (type === 'digital_file') return 'Tệp số / Source';
  if (type === 'specter_resource') return 'Tài nguyên Specter (Workspace)';
  return 'Gói nạp Xu (Workspace)';
}

function isGuestPurchasableProduct(product: CommerceProductItem): boolean {
  return (
    product.product_type === 'serial_stock' ||
    product.product_type === 'digital_file'
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

function isVariantInStock(variant: CommerceProductVariantItem | null): boolean {
  if (!variant || !variant.is_active) return false;
  if (variant.stock_mode === 'unlimited') return true;
  return variant.available_stock > 0;
}

async function loadPublicCatalog() {
  loadingCatalog.value = true;
  try {
    const [catRows, prodRows, gwRows] = await Promise.all([
      getCommerceCategoriesApi({ skipAuth: true }).catch(
        () => [] as CommerceCategoryItem[],
      ),
      getCommerceProductsApi({ skipAuth: true }).catch(
        () => [] as CommerceProductItem[],
      ),
      getActivePaymentGatewaysApi({ skipAuth: true }).catch(
        () => [] as PaymentGatewayItem[],
      ),
    ]);

    categories.value = catRows;
    products.value = prodRows;
    gateways.value = gwRows;

    const initialMap: Record<string, string> = {};
    for (const p of prodRows) {
      if (p.variants && p.variants.length > 0 && p.variants[0]) {
        initialMap[p.id] = p.variants[0].id;
      }
    }
    selectedVariantByProduct.value = initialMap;

    const firstGw = gwRows.find(
      (g) => g.is_active && g.channel !== 'internal_wallet',
    );
    if (firstGw && !selectedGatewayId.value) {
      selectedGatewayId.value = firstGw.id;
    }
  } finally {
    loadingCatalog.value = false;
  }
}

function openGuestCheckout(product: CommerceProductItem) {
  if (!isGuestPurchasableProduct(product)) {
    router.push('/commerce/store');
    return;
  }
  const variant = getSelectedVariant(product);
  if (!variant) {
    toast.error('Sản phẩm này chưa có biến thể SKU khả dụng');
    return;
  }
  stopPolling();
  activeProduct.value = product;
  activeVariant.value = variant;
  checkoutQty.value = Math.max(1, variant.min_qty || 1);
  createdOrder.value = null;
  createdClaimToken.value = '';
  createdIntent.value = null;
  if (!selectedGatewayId.value && publicGateways.value[0]) {
    selectedGatewayId.value = publicGateways.value[0].id;
  }
  checkoutOpen.value = true;
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function startPollingGuestOrder(orderCode: string, claimToken: string) {
  stopPolling();
  pollTimer = setInterval(async () => {
    await checkGuestOrderStatus(orderCode, claimToken, true);
  }, 3000);
}

async function checkGuestOrderStatus(
  orderCode: string,
  claimToken: string,
  silent = false,
) {
  if (checkingPayment.value) return;
  checkingPayment.value = true;
  try {
    const res = await getGuestOrderDeliveriesApi(orderCode, claimToken);
    createdOrder.value = res.order;

    if (res.order.status === 'completed') {
      stopPolling();
      toast.success(
        `Đơn hàng ${orderCode} đã thanh toán thành công! Đang mở tài nguyên...`,
      );
      lookedUpOrder.value = res.order;
      lookedUpDeliveries.value = res.deliveries;
      lookupOrderCode.value = orderCode;
      lookupClaimToken.value = claimToken;
      checkoutOpen.value = false;
      activeMode.value = 'lookup';
      await loadPublicCatalog();
    } else if (res.order.status === 'manual_review' && !silent) {
      toast.info(
        'Đơn hàng đang ở trạng thái chờ Quản trị viên đối soát thủ công (manual_review)',
      );
    } else if (!silent) {
      toast.info(
        'Hệ thống đang chờ nhận xác nhận thanh toán từ ngân hàng/ví...',
      );
    }
  } catch (error: any) {
    if (!silent) {
      toast.error(error?.message || 'Không thể kiểm tra trạng thái đơn hàng');
    }
  } finally {
    checkingPayment.value = false;
  }
}

async function handleCreateGuestOrder() {
  if (!activeProduct.value || !activeVariant.value) return;
  const gw = currentGateway.value;
  if (!gw) {
    toast.error('Hiện chưa có cổng thanh toán ngoại vi nào khả dụng');
    return;
  }

  submittingOrder.value = true;
  try {
    const res = await createCheckoutOrderApi(
      {
        buyer_email: buyerEmail.value.trim() || null,
        buyer_tenant_id: null,
        gateway_code: gw.id,
        items: [
          {
            quantity: checkoutQty.value,
            variant_id: activeVariant.value.id,
          },
        ],
        payment_method: gw.channel as PaymentChannelType,
      },
      { skipAuth: true },
    );

    createdOrder.value = res.order;
    createdClaimToken.value = res.claim_token || '';
    createdIntent.value = res.payment_intent;

    if (res.claim_token) {
      savedOrders.value = saveGuestOrderLocal({
        buyer_email: buyerEmail.value.trim() || null,
        claim_token: res.claim_token,
        created_at: res.order.created_at || new Date().toISOString(),
        order_code: res.order.order_code,
        total_credits: res.order.total_credits,
      });
      startPollingGuestOrder(res.order.order_code, res.claim_token);
    }

    toast.success(`Đã tạo đơn hàng ${res.order.order_code}`);
  } catch (error: any) {
    toast.error(error?.message || 'Không thể khởi tạo đơn hàng');
  } finally {
    submittingOrder.value = false;
  }
}

async function handleLookupGuestOrder(
  customCode?: string,
  customToken?: string,
) {
  const code = (customCode ?? lookupOrderCode.value).trim();
  const token = (customToken ?? lookupClaimToken.value).trim();

  if (!code || !token) {
    toast.error(
      'Vui lòng nhập đầy đủ Mã đơn hàng (ORD-...) và Mã nhận hàng (CLM_...)',
    );
    return;
  }

  lookupOrderCode.value = code;
  lookupClaimToken.value = token;
  lookingUp.value = true;
  try {
    const res = await getGuestOrderDeliveriesApi(code, token);
    lookedUpOrder.value = res.order;
    lookedUpDeliveries.value = res.deliveries;
    toast.success(`Đã tải thông tin đơn hàng ${res.order.order_code}`);
  } catch (error: any) {
    toast.error(
      error?.message ||
        'Không tìm thấy đơn hàng hoặc mã nhận hàng không hợp lệ',
    );
  } finally {
    lookingUp.value = false;
  }
}

const serialLinesText = computed(() =>
  lookedUpDeliveries.value
    .filter((d) => d.delivery_type === 'serial_stock')
    .map(
      (d) =>
        d.delivered_payload?.serial ||
        d.delivered_payload?.secret_line ||
        JSON.stringify(d.delivered_payload),
    )
    .join('\n'),
);

async function copyText(text: string, label = 'dữ liệu') {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}`);
  } catch {
    toast.error('Không thể sao chép');
  }
}

function downloadSerialTxt() {
  if (!serialLinesText.value) return;
  const blob = new Blob([serialLinesText.value], {
    type: 'text/plain;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${lookedUpOrder.value?.order_code || 'guest-order'}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

onMounted(async () => {
  savedOrders.value = getSavedGuestOrders();
  await loadPublicCatalog();

  const queryOrder = (route.query.order as string) || '';
  const queryToken = (route.query.token as string) || '';
  if (queryOrder && queryToken) {
    activeMode.value = 'lookup';
    await handleLookupGuestOrder(queryOrder, queryToken);
  }
});

onBeforeUnmount(() => {
  stopPolling();
});
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <!-- Top Storefront Navbar -->
    <header
      class="sticky top-0 z-30 border-b border-border/60 bg-card/90 backdrop-blur-md"
    >
      <div
        class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6"
      >
        <div class="flex items-center gap-2.5">
          <div
            class="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <Store class="size-5" />
          </div>
          <div>
            <span class="text-base font-bold tracking-tight text-foreground">
              Tuquet Digital Store
            </span>
            <p class="text-2xs text-muted-foreground">
              Giao tài nguyên tự động 24/7 • Chống bán trùng
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            :variant="activeMode === 'catalog' ? 'default' : 'outline'"
            class="gap-1.5 text-xs"
            @click="activeMode = 'catalog'"
          >
            <ShoppingBag class="size-3.5" />
            Danh mục sản phẩm
          </Button>

          <Button
            size="sm"
            :variant="activeMode === 'lookup' ? 'default' : 'outline'"
            class="gap-1.5 text-xs"
            @click="activeMode = 'lookup'"
          >
            <PackageSearch class="size-3.5" />
            Tra cứu & Nhận hàng
            <Badge
              v-if="savedOrders.length > 0"
              variant="secondary"
              class="ml-0.5 text-2xs"
            >
              {{ savedOrders.length }}
            </Badge>
          </Button>

          <Button
            size="sm"
            variant="outline"
            class="gap-1.5 text-xs"
            @click="router.push('/commerce/store')"
          >
            Workspace Portal
            <ArrowRight class="size-3.5" />
          </Button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <!-- Hero Trust Banner -->
      <div
        class="flex flex-col justify-between gap-4 rounded-2xl border border-primary/25 bg-card p-5 sm:flex-row sm:items-center sm:p-6"
      >
        <div class="space-y-1.5">
          <div class="flex items-center gap-2">
            <Badge variant="default" class="text-2xs">
              Instant Auto-Fulfillment
            </Badge>
            <span class="text-xs text-muted-foreground">
              Không cần tạo tài khoản — Thanh toán & nhận ngay
            </span>
          </div>
          <h1
            class="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
          >
            Cửa hàng Tài khoản, License Key & Tài nguyên số
          </h1>
          <p class="max-w-2xl text-xs text-muted-foreground">
            Hệ thống khóa tồn kho nguyên tử (`FOR UPDATE SKIP LOCKED`) đảm bảo
            tuyệt đối không bán trùng. Hỗ trợ thanh toán tự động 24/7 qua
            VietQR, MoMo, Stripe và Crypto USDT.
          </p>
        </div>

        <div class="flex flex-wrap gap-2.5 text-xs">
          <div
            class="flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-3 py-2"
          >
            <Zap class="size-4 text-primary" />
            <span class="font-medium">Giao tự động 3 giây</span>
          </div>
          <div
            class="flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-3 py-2"
          >
            <ShieldCheck class="size-4 text-success" />
            <span class="font-medium">Bảo mật `claim_token`</span>
          </div>
        </div>
      </div>

      <!-- MODE 1: PUBLIC CATALOG -->
      <div v-if="activeMode === 'catalog'" class="space-y-5">
        <!-- Filter Bar -->
        <div
          class="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex flex-wrap items-center gap-1.5">
            <Button
              size="sm"
              :variant="selectedCategoryId === 'all' ? 'default' : 'outline'"
              class="h-8 text-xs"
              @click="selectedCategoryId = 'all'"
            >
              Tất cả
            </Button>
            <Button
              v-for="cat in categories"
              :key="cat.id"
              size="sm"
              :variant="selectedCategoryId === cat.id ? 'default' : 'outline'"
              class="h-8 text-xs"
              @click="selectedCategoryId = cat.id"
            >
              {{ cat.name }}
            </Button>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <select
              v-model="selectedProductType"
              class="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground"
            >
              <option value="all">Mọi loại sản phẩm</option>
              <option value="serial_stock">Tài khoản / License key</option>
              <option value="digital_file">Tệp số / Source</option>
            </select>

            <div class="relative w-full sm:w-64">
              <Search
                class="pointer-events-none absolute top-2.5 left-2.5 size-3.5 text-muted-foreground"
              />
              <input
                v-model="searchKeyword"
                type="text"
                placeholder="Tìm tên sản phẩm, mã SKU..."
                class="h-8 w-full rounded-md border border-border bg-background pr-3 pl-8 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              class="h-8 gap-1.5 text-xs"
              @click="loadPublicCatalog"
            >
              <RefreshCw
                class="size-3.5"
                :class="{ 'animate-spin': loadingCatalog }"
              />
              Làm mới
            </Button>
          </div>
        </div>

        <!-- Product Cards Grid -->
        <div
          v-if="!loadingCatalog && publicProducts.length === 0"
          class="rounded-xl border border-dashed border-border/60 bg-card/50 py-14 text-center"
        >
          <ShoppingBag class="mx-auto size-10 text-muted-foreground/50" />
          <p class="mt-3 text-base font-semibold text-foreground">
            Chưa có sản phẩm công khai phù hợp
          </p>
          <p class="mt-1 text-xs text-muted-foreground">
            Vui lòng thử lại với từ khóa hoặc danh mục khác.
          </p>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="product in publicProducts"
            :key="product.id"
            class="flex flex-col justify-between rounded-xl border border-border/60 bg-card p-5 transition-all hover:border-primary/40 hover:shadow-sm"
          >
            <div class="space-y-3">
              <div class="flex items-center justify-between gap-2">
                <Badge variant="secondary" class="text-2xs">
                  {{ getProductTypeLabel(product.product_type) }}
                </Badge>
                <span
                  v-if="getSelectedVariant(product)"
                  class="font-mono text-2xs text-muted-foreground"
                >
                  {{ getSelectedVariant(product)?.sku }}
                </span>
              </div>

              <div>
                <h3 class="text-base font-semibold text-foreground">
                  {{ product.name }}
                </h3>
                <p class="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {{
                    product.short_description ||
                    product.description ||
                    'Bàn giao tự động ngay sau khi thanh toán thành công.'
                  }}
                </p>
              </div>

              <!-- SKU Pills -->
              <div
                v-if="product.variants && product.variants.length > 0"
                class="space-y-1.5 pt-1"
              >
                <span
                  class="text-2xs font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  Phân loại (SKU)
                </span>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="variant in product.variants"
                    :key="variant.id"
                    type="button"
                    class="rounded-lg border px-2.5 py-1 text-xs transition-colors"
                    :class="
                      getSelectedVariant(product)?.id === variant.id
                        ? 'border-primary bg-primary/10 font-semibold text-primary'
                        : 'border-border/70 bg-background text-foreground hover:border-primary/40'
                    "
                    @click="selectVariant(product.id, variant.id)"
                  >
                    {{ variant.name }}
                  </button>
                </div>
              </div>
            </div>

            <div
              class="mt-5 flex items-end justify-between border-t border-border/50 pt-4"
            >
              <div class="space-y-0.5">
                <p class="font-mono text-xl font-bold text-foreground">
                  {{
                    (
                      getSelectedVariant(product)?.price_credits ?? 0
                    ).toLocaleString('en-US')
                  }}
                  Xu
                </p>
                <p class="text-xs">
                  <span
                    v-if="
                      getSelectedVariant(product)?.stock_mode === 'unlimited'
                    "
                    class="font-medium text-success"
                  >
                    ● Luôn sẵn hàng
                  </span>
                  <span
                    v-else-if="
                      (getSelectedVariant(product)?.available_stock ?? 0) > 0
                    "
                    class="font-medium text-success"
                  >
                    ● Còn {{ getSelectedVariant(product)?.available_stock }} sản
                    phẩm
                  </span>
                  <span v-else class="font-medium text-destructive">
                    ● Tạm hết hàng
                  </span>
                </p>
              </div>

              <Button
                v-if="isGuestPurchasableProduct(product)"
                size="sm"
                :disabled="!isVariantInStock(getSelectedVariant(product))"
                class="gap-1.5"
                @click="openGuestCheckout(product)"
              >
                <ShoppingBag class="size-3.5" />
                Mua ngay
              </Button>
              <Button
                v-else
                size="sm"
                variant="outline"
                class="gap-1.5"
                @click="router.push('/commerce/store')"
              >
                Mở trong Workspace
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- MODE 2: GUEST ORDER LOOKUP & DELIVERABLES -->
      <div v-else class="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <!-- Lookup Form & Saved Browser Orders -->
        <div class="space-y-4 lg:col-span-1">
          <div class="rounded-xl border border-border/60 bg-card p-5 space-y-4">
            <div>
              <h2 class="text-base font-semibold text-foreground">
                Tra cứu đơn hàng khách vãng lai
              </h2>
              <p class="mt-0.5 text-xs text-muted-foreground">
                Nhập Mã đơn hàng (`ORD-...`) và Mã bảo mật nhận hàng (`CLM_...`)
                được cấp khi tạo đơn.
              </p>
            </div>

            <div class="space-y-3">
              <div class="space-y-1">
                <label class="text-xs font-medium text-foreground">
                  Mã đơn hàng (`order_code`)
                </label>
                <input
                  v-model="lookupOrderCode"
                  type="text"
                  placeholder="ORD-261014-XXXXXX"
                  class="h-9 w-full rounded-md border border-border bg-background px-3 font-mono text-xs text-foreground"
                />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-medium text-foreground">
                  Mã bảo mật nhận hàng (`claim_token`)
                </label>
                <input
                  v-model="lookupClaimToken"
                  type="text"
                  placeholder="CLM_..."
                  class="h-9 w-full rounded-md border border-border bg-background px-3 font-mono text-xs text-foreground"
                />
              </div>

              <Button
                class="w-full gap-1.5"
                size="sm"
                :disabled="lookingUp"
                @click="() => handleLookupGuestOrder()"
              >
                <PackageSearch class="size-4" />
                Tra cứu & Nhận tài nguyên
              </Button>
            </div>
          </div>

          <!-- Saved Orders in LocalStorage -->
          <div
            v-if="savedOrders.length > 0"
            class="rounded-xl border border-border/60 bg-card p-5 space-y-3"
          >
            <div class="flex items-center gap-2">
              <History class="size-4 text-primary" />
              <h3 class="text-sm font-semibold text-foreground">
                Đơn gần đây trên trình duyệt này
              </h3>
            </div>

            <div class="space-y-2">
              <button
                v-for="saved in savedOrders"
                :key="saved.order_code"
                type="button"
                class="flex w-full items-center justify-between rounded-lg border border-border/60 bg-background p-3 text-left transition-colors hover:border-primary/50"
                @click="
                  handleLookupGuestOrder(saved.order_code, saved.claim_token)
                "
              >
                <div>
                  <p class="font-mono text-xs font-bold text-foreground">
                    {{ saved.order_code }}
                  </p>
                  <p class="text-2xs text-muted-foreground">
                    {{ formatDate(saved.created_at) }}
                  </p>
                </div>
                <Badge variant="outline" class="font-mono text-2xs">
                  {{ saved.total_credits }} Xu
                </Badge>
              </button>
            </div>
          </div>
        </div>

        <!-- Deliverables Output Panel -->
        <div class="lg:col-span-2">
          <div
            v-if="!lookedUpOrder"
            class="flex h-full min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/50 p-8 text-center"
          >
            <Lock class="size-9 text-muted-foreground/50" />
            <p class="mt-3 text-sm font-semibold text-foreground">
              Chưa chọn đơn hàng cần tra cứu
            </p>
            <p class="mt-1 max-w-md text-xs text-muted-foreground">
              Nhập mã đơn hàng cùng `claim_token` ở cột bên trái (hoặc nhấn vào
              đơn hàng đã lưu trên trình duyệt) để xem và tải xuống tài nguyên.
            </p>
          </div>

          <div
            v-else
            class="rounded-xl border border-border/60 bg-card p-5 space-y-4"
          >
            <div
              class="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-4"
            >
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="font-mono text-base font-bold text-foreground">
                    {{ lookedUpOrder.order_code }}
                  </h3>
                  <Badge
                    :variant="
                      lookedUpOrder.status === 'completed'
                        ? 'default'
                        : 'secondary'
                    "
                  >
                    {{ lookedUpOrder.status }}
                  </Badge>
                </div>
                <p class="mt-1 text-xs text-muted-foreground">
                  Tổng giá trị:
                  <span class="font-mono font-semibold text-foreground">
                    {{ lookedUpOrder.total_credits.toLocaleString('en-US') }} Xu
                  </span>
                  • Ngày tạo: {{ formatDate(lookedUpOrder.created_at) }}
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                class="gap-1.5"
                @click="
                  () =>
                    handleLookupGuestOrder(
                      lookedUpOrder?.order_code,
                      lookupClaimToken,
                    )
                "
              >
                <RefreshCw class="size-3.5" />
                Làm mới trạng thái
              </Button>
            </div>

            <div
              v-if="lookedUpDeliveries.length === 0"
              class="rounded-lg border border-dashed border-border/60 py-10 text-center text-xs text-muted-foreground"
            >
              Đơn hàng này đang ở trạng thái
              <span class="font-semibold text-foreground">{{
                lookedUpOrder.status
              }}</span>
              và chưa phát sinh bản ghi bàn giao tài nguyên.
            </div>

            <div v-else class="space-y-4">
              <div v-if="serialLinesText" class="space-y-2">
                <div class="flex items-center justify-between">
                  <span
                    class="flex items-center gap-1.5 text-xs font-semibold text-foreground"
                  >
                    <KeyRound class="size-3.5 text-primary" />
                    Dữ liệu Tài khoản / License Key ({{
                      lookedUpDeliveries.filter(
                        (d) => d.delivery_type === 'serial_stock',
                      ).length
                    }}
                    dòng)
                  </span>
                  <div class="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      class="h-7 gap-1 text-xs"
                      @click="copyText(serialLinesText, 'danh sách tài khoản')"
                    >
                      <Copy class="size-3" />
                      Sao chép tất cả
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      class="h-7 gap-1 text-xs"
                      @click="downloadSerialTxt"
                    >
                      <Download class="size-3" />
                      Tải tệp .txt
                    </Button>
                  </div>
                </div>
                <textarea
                  readonly
                  :value="serialLinesText"
                  rows="8"
                  class="w-full rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs text-foreground focus:outline-none"
                ></textarea>
              </div>

              <div
                v-for="item in lookedUpDeliveries.filter(
                  (d) => d.delivery_type !== 'serial_stock',
                )"
                :key="item.id"
                class="rounded-lg border border-border/60 bg-muted/20 p-3.5 text-xs"
              >
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-foreground">
                    Tài nguyên bàn giao ({{ item.delivery_type }})
                  </span>
                  <Badge variant="default" class="text-2xs">Đã hoàn tất</Badge>
                </div>
                <pre
                  class="mt-2 overflow-x-auto rounded bg-background p-2 font-mono text-2xs text-muted-foreground"
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
                    Tải tệp xuống
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Guest Multi-Channel Checkout Dialog -->
    <Dialog v-model:open="checkoutOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2 text-base font-semibold">
            <ShoppingBag class="size-4 text-primary" />
            {{
              createdIntent
                ? `Thanh toán đơn hàng ${createdOrder?.order_code}`
                : `Mua nhanh: ${activeProduct?.name || ''}`
            }}
          </DialogTitle>
          <DialogDescription class="text-xs text-muted-foreground">
            {{
              createdIntent
                ? 'Lưu lại mã nhận hàng (claim_token) và quét mã QR bên dưới để nhận sản phẩm tự động.'
                : 'Chọn số lượng, nhập email (tùy chọn) và chọn kênh thanh toán.'
            }}
          </DialogDescription>
        </DialogHeader>

        <!-- Step 1: Configure Order -->
        <div v-if="!createdIntent && activeVariant" class="space-y-4 py-2">
          <div
            class="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-3"
          >
            <div>
              <p class="text-sm font-semibold text-foreground">
                {{ activeVariant.name }}
              </p>
              <p class="font-mono text-xs text-muted-foreground">
                SKU: {{ activeVariant.sku }}
              </p>
            </div>
            <p class="font-mono text-base font-bold text-primary">
              {{ activeVariant.price_credits.toLocaleString('en-US') }} Xu
            </p>
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div class="space-y-1">
              <label class="text-xs font-medium text-foreground">
                Số lượng
              </label>
              <input
                v-model.number="checkoutQty"
                type="number"
                :min="activeVariant.min_qty || 1"
                :max="activeVariant.max_qty || 100"
                class="h-8 w-full rounded-md border border-border bg-background px-2.5 font-mono text-xs text-foreground"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-medium text-foreground">
                Email nhận biên lai (Tùy chọn)
              </label>
              <input
                v-model="buyerEmail"
                type="email"
                placeholder="guest@example.com"
                class="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground"
              />
            </div>
          </div>

          <div class="space-y-2">
            <label
              class="text-2xs font-semibold tracking-wider text-muted-foreground uppercase"
            >
              Chọn kênh thanh toán
            </label>
            <button
              v-for="gw in publicGateways"
              :key="gw.id"
              type="button"
              class="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors"
              :class="
                currentGateway?.id === gw.id
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
                    1 Xu = {{ gw.rate_per_credit.toLocaleString('en-US') }}
                    {{ gw.currency }}
                  </p>
                </div>
              </div>
              <Badge variant="outline" class="font-mono text-2xs">
                {{ gw.currency }}
              </Badge>
            </button>
          </div>

          <div
            class="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3"
          >
            <span class="text-xs font-medium text-muted-foreground">
              Tổng thanh toán
            </span>
            <div class="text-right">
              <p class="font-mono text-lg font-bold text-foreground">
                {{ estimatedFiatAmount.toLocaleString('en-US') }}
                {{ currentGateway?.currency || 'VND' }}
              </p>
              <p class="font-mono text-xs text-muted-foreground">
                ({{ totalCheckoutCredits.toLocaleString('en-US') }} Xu)
              </p>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" @click="checkoutOpen = false">
              Hủy
            </Button>
            <Button
              size="sm"
              :disabled="submittingOrder || publicGateways.length === 0"
              class="gap-1.5"
              @click="handleCreateGuestOrder"
            >
              <Sparkles class="size-3.5" />
              Tạo đơn & Lấy mã QR
            </Button>
          </div>
        </div>

        <!-- Step 2: Claim Token Banner + QR Code + Auto-Polling -->
        <div v-else-if="createdIntent && createdOrder" class="space-y-4 py-2">
          <!-- Claim Token Security Box -->
          <div
            class="rounded-lg border border-primary/40 bg-primary/5 p-3 text-xs space-y-1.5"
          >
            <div class="flex items-center justify-between">
              <span class="font-semibold text-foreground">
                Mã bảo mật nhận hàng (`claim_token` — Đã tự động lưu):
              </span>
              <Button
                size="sm"
                variant="outline"
                class="h-6 gap-1 px-2 text-2xs"
                @click="copyText(createdClaimToken, 'mã bảo mật claim_token')"
              >
                <Copy class="size-3" />
                Sao chép
              </Button>
            </div>
            <code
              class="block truncate rounded bg-background px-2 py-1 font-mono text-xs text-primary"
            >
              {{ createdClaimToken }}
            </code>
          </div>

          <div
            v-if="createdIntent.checkout_payload?.qr_image_url"
            class="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-white p-4"
          >
            <img
              :src="createdIntent.checkout_payload.qr_image_url"
              alt="Guest Checkout QR"
              class="h-52 w-52 object-contain"
            />
            <span class="mt-2 text-2xs font-medium text-slate-600">
              Quét mã QR để thanh toán chính xác số tiền và nội dung
            </span>
          </div>

          <div
            class="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3.5 text-xs"
          >
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Số tiền cần chuyển:</span>
              <span class="font-mono text-sm font-bold text-foreground">
                {{ createdIntent.pay_amount.toLocaleString('en-US') }}
                {{ createdIntent.pay_currency }}
              </span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Nội dung chuyển khoản:</span>
              <div class="flex items-center gap-1.5">
                <code
                  class="rounded bg-primary/15 px-2 py-0.5 font-mono text-sm font-bold text-primary"
                >
                  {{ createdIntent.transfer_code }}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  class="h-6 px-2 text-2xs"
                  @click="
                    copyText(createdIntent.transfer_code, 'mã chuyển khoản')
                  "
                >
                  <Copy class="size-3" />
                </Button>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Trạng thái đơn:</span>
              <Badge variant="secondary" class="text-2xs">
                {{ createdOrder.status }} (Tự động kiểm tra 3s/lần)
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
              Đóng
            </Button>
            <Button
              size="sm"
              class="gap-1.5"
              :disabled="checkingPayment"
              @click="
                () =>
                  createdOrder &&
                  checkGuestOrderStatus(
                    createdOrder.order_code,
                    createdClaimToken,
                    false,
                  )
              "
            >
              <CheckCircle2 class="size-3.5" />
              Kiểm tra & Nhận hàng ngay
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
