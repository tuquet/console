<script lang="ts" setup>
import type {
  PaymentGatewayItem,
  PaymentIntentItem,
  TenantItem,
  TenantWalletItem,
  WalletTransactionItem,
  WalletTxType,
} from '#/api';

import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  Coins,
  Copy,
  CreditCard,
  Plus,
  RefreshCw,
  ShoppingBag,
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
  toast,
} from '@tuquet/vue-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createPaymentIntentApi,
  filterWalletTransactions,
  getActivePaymentGatewaysApi,
  getActiveTenantId,
  getPaymentIntentStatusApi,
  getTenantsApi,
  getTenantWalletApi,
  getWalletTransactionsApi,
  setActiveTenantId,
} from '#/api';
import { useDateFormat } from '#/composables';
import { $t } from '#/locales';

defineOptions({ name: 'CommerceWallet' });

const router = useRouter();
const { formatDate } = useDateFormat();

const tenants = ref<TenantItem[]>([]);
const selectedTenantId = ref<string>(getActiveTenantId());
const wallet = ref<null | TenantWalletItem>(null);
const gateways = ref<PaymentGatewayItem[]>([]);
const allTransactions = ref<WalletTransactionItem[]>([]);

// Top-up Dialog State
const topupOpen = ref(false);
const topupCredits = ref<number>(100);
const selectedGatewayId = ref<string>('');
const creatingIntent = ref(false);
const activeIntent = ref<null | PaymentIntentItem>(null);
const checkingIntent = ref(false);
let pollTimer: null | ReturnType<typeof setInterval> = null;

const QUICK_TOPUP_PRESETS = [50, 100, 200, 500, 1000, 5000];

const TX_TYPE_MAP: Record<
  WalletTxType,
  {
    label: string;
    variant: 'default' | 'destructive' | 'outline' | 'secondary';
  }
> = {
  admin_adjustment: { label: 'Điều chỉnh hệ thống', variant: 'secondary' },
  bonus: { label: 'Thưởng / Khuyến mãi', variant: 'default' },
  purchase: { label: 'Thanh toán đơn hàng', variant: 'outline' },
  refund: { label: 'Hoàn Xu đơn hàng', variant: 'secondary' },
  topup: { label: 'Nạp Xu vào ví', variant: 'default' },
};

function getTxTypeBadge(type: WalletTxType) {
  return TX_TYPE_MAP[type] || { label: type, variant: 'outline' as const };
}

const topupGateways = computed(() =>
  gateways.value.filter((g) => g.is_active && g.channel !== 'internal_wallet'),
);

const selectedGateway = computed<null | PaymentGatewayItem>(
  () =>
    topupGateways.value.find((g) => g.id === selectedGatewayId.value) ||
    topupGateways.value[0] ||
    null,
);

const estimatedPayAmount = computed(() => {
  if (!selectedGateway.value) return 0;
  return (
    Math.max(1, topupCredits.value) * selectedGateway.value.rate_per_credit
  );
});

const [Grid, gridApi] = useVbenVxeGrid<WalletTransactionItem>({
  separator: false,
  formOptions: {
    schema: [
      {
        component: 'Select',
        fieldName: 'tx_type',
        label: 'Loại giao dịch',
        defaultValue: 'all',
        componentProps: {
          placeholder: 'Tất cả biến động',
          options: [
            { label: 'Tất cả biến động', value: 'all' },
            { label: 'Nạp Xu vào ví', value: 'topup' },
            { label: 'Thanh toán đơn hàng', value: 'purchase' },
            { label: 'Thưởng / Khuyến mãi', value: 'bonus' },
            { label: 'Hoàn Xu đơn hàng', value: 'refund' },
            { label: 'Điều chỉnh hệ thống', value: 'admin_adjustment' },
          ],
        },
      },
      {
        component: 'Input',
        fieldName: 'search',
        label: 'Tìm kiếm',
        componentProps: {
          placeholder: 'Tìm theo nội dung, mã đơn hoặc mã lệnh...',
          clearable: true,
        },
      },
    ],
    layout: 'vertical',
    showCollapseButton: false,
    submitOnChange: true,
    submitOnEnter: true,
    submitButtonOptions: {
      content: $t('common.filter'),
    },
    resetButtonOptions: {
      content: $t('common.reset'),
    },
    actionWrapperClass: 'flex items-center justify-end gap-2',
    wrapperClass: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3',
  },
  gridOptions: {
    border: false,
    round: true,
    showOverflow: true,
    cellConfig: {
      height: 54,
    },
    rowConfig: {
      isHover: true,
      keyField: 'id',
    },
    pagerConfig: {
      pageSize: 15,
      pageSizes: [10, 15, 30, 50],
    },
    proxyConfig: {
      autoLoad: false,
      ajax: {
        query: async (
          { page }: { page?: { currentPage?: number; pageSize?: number } },
          formValues: Record<string, any>,
        ) => {
          if (!selectedTenantId.value) {
            return { items: [], total: 0 };
          }
          const [walletData, txRows] = await Promise.all([
            getTenantWalletApi(selectedTenantId.value),
            getWalletTransactionsApi(selectedTenantId.value, 100),
          ]);
          wallet.value = walletData;
          allTransactions.value = txRows;

          const filtered = filterWalletTransactions(txRows, {
            search: formValues?.search,
            tx_type: formValues?.tx_type,
          });

          const currentPage = page?.currentPage || 1;
          const pageSize = page?.pageSize || 15;
          const start = (currentPage - 1) * pageSize;
          const end = start + pageSize;
          return {
            items: filtered.slice(start, end),
            total: filtered.length,
          };
        },
      },
    },
    columns: [
      {
        field: 'tx_type',
        title: 'Loại giao dịch',
        width: 175,
        slots: { default: 'type-cell' },
      },
      {
        field: 'description',
        title: 'Diễn giải',
        minWidth: 240,
        slots: { default: 'desc-cell' },
      },
      {
        field: 'amount_credits',
        title: 'Biến động Xu',
        width: 155,
        slots: { default: 'amount-cell' },
      },
      {
        field: 'balance_after_credits',
        title: 'Số dư sau GD',
        width: 155,
        slots: { default: 'balance-cell' },
      },
      {
        field: 'reference_id',
        title: 'Mã tham chiếu',
        width: 175,
        slots: { default: 'ref-cell' },
      },
      {
        field: 'created_at',
        title: 'Thời gian',
        width: 165,
        slots: { default: 'date-cell' },
      },
    ],
  },
});

async function initData() {
  const [tenantRows, gatewayRows] = await Promise.all([
    getTenantsApi().catch(() => [] as TenantItem[]),
    getActivePaymentGatewaysApi().catch(() => [] as PaymentGatewayItem[]),
  ]);
  tenants.value = tenantRows;
  gateways.value = gatewayRows;

  const firstExternal = gatewayRows.find(
    (g) => g.is_active && g.channel !== 'internal_wallet',
  );
  if (firstExternal) {
    selectedGatewayId.value = firstExternal.id;
  }

  if (
    (!selectedTenantId.value ||
      !tenantRows.some((t) => t.id === selectedTenantId.value)) &&
    tenantRows.length > 0 &&
    tenantRows[0]
  ) {
    selectedTenantId.value = tenantRows[0].id;
    setActiveTenantId(selectedTenantId.value);
  }
  await gridApi.reload();
}

async function handleTenantChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  selectedTenantId.value = target.value;
  setActiveTenantId(target.value);
  await gridApi.reload();
}

function openTopupModal() {
  stopPolling();
  activeIntent.value = null;
  topupCredits.value = 100;
  if (!selectedGatewayId.value && topupGateways.value[0]) {
    selectedGatewayId.value = topupGateways.value[0].id;
  }
  topupOpen.value = true;
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function startPolling(intentId: string) {
  stopPolling();
  pollTimer = setInterval(async () => {
    await checkTopupStatus(intentId, true);
  }, 3000);
}

async function checkTopupStatus(intentId: string, silent = false) {
  if (checkingIntent.value) return;
  checkingIntent.value = true;
  try {
    const updated = await getPaymentIntentStatusApi(intentId);
    if (!updated) return;
    activeIntent.value = updated;
    if (updated.status === 'succeeded') {
      stopPolling();
      toast.success(
        `Đã nạp thành công +${updated.amount_credits.toLocaleString('en-US')} Xu vào Ví!`,
      );
      topupOpen.value = false;
      await gridApi.reload();
    } else if (updated.status === 'manual_review' && !silent) {
      toast.info(
        'Giao dịch đang ở trạng thái chờ Quản trị viên duyệt tay (manual_review)',
      );
    } else if (!silent) {
      toast.info('Đang chờ xác nhận chuyển khoản từ cổng thanh toán...');
    }
  } finally {
    checkingIntent.value = false;
  }
}

async function handleCreateTopupIntent() {
  if (!selectedTenantId.value) {
    toast.error('Vui lòng chọn Workspace cần nạp Xu');
    return;
  }
  const gw = selectedGateway.value;
  if (!gw) {
    toast.error('Vui lòng chọn cổng thanh toán');
    return;
  }
  if (!topupCredits.value || topupCredits.value <= 0) {
    toast.error('Số Xu nạp phải lớn hơn 0');
    return;
  }

  creatingIntent.value = true;
  try {
    const intent = await createPaymentIntentApi({
      amount_credits: Math.trunc(topupCredits.value),
      gateway_id: gw.id,
      target_id: selectedTenantId.value,
      target_type: 'wallet_topup',
      tenant_id: selectedTenantId.value,
    });
    activeIntent.value = intent;
    startPolling(intent.id);
    toast.success(`Đã tạo mã nạp Xu: ${intent.transfer_code}`);
  } catch (error: any) {
    toast.error(error?.message || 'Không thể khởi tạo lệnh nạp Xu');
  } finally {
    creatingIntent.value = false;
  }
}

async function copyText(text: string, label = 'dữ liệu') {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}`);
  } catch {
    toast.error('Không thể sao chép');
  }
}

onMounted(() => {
  initData();
});

onBeforeUnmount(() => {
  stopPolling();
});
</script>

<template>
  <div class="space-y-4 p-4 sm:space-y-5 sm:p-5">
    <!-- Header -->
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex flex-col gap-1">
        <h1
          class="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
        >
          {{ $t('page.commerce.wallet') }}
        </h1>
        <p class="text-xs text-muted-foreground">
          {{ $t('page.commerce.wallet_desc') }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <div
          class="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-1.5"
        >
          <Building2 class="size-3.5 text-muted-foreground" />
          <select
            :value="selectedTenantId"
            class="bg-transparent text-xs font-medium text-foreground focus:outline-none"
            @change="handleTenantChange"
          >
            <option
              v-for="tenant in tenants"
              :key="tenant.id"
              :value="tenant.id"
            >
              {{ tenant.name }}
            </option>
          </select>
        </div>

        <Button size="sm" class="gap-1.5" @click="openTopupModal">
          <Plus class="size-3.5" />
          Nạp thêm Xu
        </Button>

        <Button
          variant="outline"
          size="sm"
          class="gap-1.5"
          @click="router.push('/commerce/store')"
        >
          <ShoppingBag class="size-3.5 text-muted-foreground" />
          Cửa hàng số
        </Button>

        <Button
          variant="outline"
          size="sm"
          class="gap-1.5"
          @click="() => gridApi.reload()"
        >
          <RefreshCw class="size-3.5 text-muted-foreground" />
          {{ $t('common.refresh') }}
        </Button>
      </div>
    </div>

    <!-- Wallet KPI Metric Cards -->
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div class="rounded-xl border border-primary/30 bg-card p-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-muted-foreground">
            Số dư khả dụng
          </span>
          <Wallet class="size-4 text-primary" />
        </div>
        <p
          class="mt-2 font-mono text-2xl font-bold tracking-tight text-foreground"
        >
          {{ (wallet?.balance_credits ?? 0).toLocaleString('en-US') }} Xu
        </p>
      </div>

      <div class="rounded-xl border border-border/60 bg-card p-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-muted-foreground">
            Tổng Xu đã nạp
          </span>
          <ArrowDownLeft class="size-4 text-success" />
        </div>
        <p
          class="mt-2 font-mono text-2xl font-bold tracking-tight text-foreground"
        >
          +{{ (wallet?.total_topped_up_credits ?? 0).toLocaleString('en-US') }}
          Xu
        </p>
      </div>

      <div class="rounded-xl border border-border/60 bg-card p-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-muted-foreground">
            Tổng Xu đã chi tiêu
          </span>
          <ArrowUpRight class="size-4 text-primary" />
        </div>
        <p
          class="mt-2 font-mono text-2xl font-bold tracking-tight text-foreground"
        >
          {{ (wallet?.total_spent_credits ?? 0).toLocaleString('en-US') }} Xu
        </p>
      </div>
    </div>

    <!-- Ledger VXE Grid -->
    <div
      class="overflow-hidden rounded-none border-0 border-border/60 bg-card p-0 shadow-none sm:rounded-xl sm:border sm:p-5 sm:shadow-xs"
    >
      <Grid>
        <template #type-cell="{ row }">
          <Badge :variant="getTxTypeBadge(row.tx_type).variant">
            {{ getTxTypeBadge(row.tx_type).label }}
          </Badge>
        </template>

        <template #desc-cell="{ row }">
          <span class="text-xs text-foreground">
            {{ row.description || 'Giao dịch Ví Xu' }}
          </span>
        </template>

        <template #amount-cell="{ row }">
          <span
            class="font-mono text-sm font-bold"
            :class="
              row.amount_credits >= 0 ? 'text-success' : 'text-destructive'
            "
          >
            {{ row.amount_credits >= 0 ? '+' : ''
            }}{{ row.amount_credits.toLocaleString('en-US') }} Xu
          </span>
        </template>

        <template #balance-cell="{ row }">
          <span class="font-mono text-xs font-semibold text-foreground">
            {{ row.balance_after_credits.toLocaleString('en-US') }} Xu
          </span>
        </template>

        <template #ref-cell="{ row }">
          <span class="font-mono text-xs text-muted-foreground">
            {{ row.reference_id ? row.reference_id.slice(0, 12) : '—' }}
          </span>
        </template>

        <template #date-cell="{ row }">
          <span class="text-xs text-muted-foreground">
            {{ formatDate(row.created_at) }}
          </span>
        </template>
      </Grid>
    </div>

    <!-- Top-up Xu Multi-Channel Dialog -->
    <Dialog v-model:open="topupOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2 text-base font-semibold">
            <Coins class="size-4 text-primary" />
            {{
              activeIntent
                ? `Chuyển khoản nạp Xu (${activeIntent.transfer_code})`
                : 'Nạp thêm Xu vào Ví Workspace'
            }}
          </DialogTitle>
          <DialogDescription class="text-xs text-muted-foreground">
            {{
              activeIntent
                ? 'Hệ thống tự động cộng Xu vào Ví ngay khi nhận được Webhook xác nhận giao dịch.'
                : 'Chọn số lượng Xu muốn nạp và cổng thanh toán (VietQR 24/7, MoMo, Stripe, hoặc Crypto USDT).'
            }}
          </DialogDescription>
        </DialogHeader>

        <!-- Step 1: Select Amount & Gateway -->
        <div v-if="!activeIntent" class="space-y-4 py-2">
          <div class="space-y-2">
            <label
              class="text-2xs font-semibold tracking-wider text-muted-foreground uppercase"
            >
              Chọn nhanh gói Xu
            </label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="preset in QUICK_TOPUP_PRESETS"
                :key="preset"
                type="button"
                class="rounded-lg border py-2 text-center font-mono text-xs font-semibold transition-colors"
                :class="
                  topupCredits === preset
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/60 bg-background text-foreground hover:border-primary/40'
                "
                @click="topupCredits = preset"
              >
                +{{ preset.toLocaleString('en-US') }} Xu
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <label class="text-xs font-medium text-foreground">
              Hoặc nhập số Xu tùy chỉnh
            </label>
            <input
              v-model.number="topupCredits"
              type="number"
              min="10"
              step="10"
              class="h-8 w-32 rounded-md border border-border bg-background px-2.5 text-right font-mono text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div class="space-y-2">
            <label
              class="text-2xs font-semibold tracking-wider text-muted-foreground uppercase"
            >
              Cổng thanh toán
            </label>
            <button
              v-for="gw in topupGateways"
              :key="gw.id"
              type="button"
              class="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors"
              :class="
                selectedGateway?.id === gw.id
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
              Số tiền thanh toán dự kiến
            </span>
            <div class="text-right">
              <p class="font-mono text-lg font-bold text-foreground">
                {{ estimatedPayAmount.toLocaleString('en-US') }}
                {{ selectedGateway?.currency || 'VND' }}
              </p>
              <p class="font-mono text-xs text-primary">
                Nhận ngay +{{ topupCredits.toLocaleString('en-US') }} Xu
              </p>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" @click="topupOpen = false">
              {{ $t('common.cancel') }}
            </Button>
            <Button
              size="sm"
              :disabled="creatingIntent || topupGateways.length === 0"
              class="gap-1.5"
              @click="handleCreateTopupIntent"
            >
              <Plus class="size-3.5" />
              Tạo mã nạp Xu
            </Button>
          </div>
        </div>

        <!-- Step 2: Display QR & Transfer Code -->
        <div v-else class="space-y-4 py-2">
          <div
            v-if="activeIntent.checkout_payload?.qr_image_url"
            class="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-white p-4"
          >
            <img
              :src="activeIntent.checkout_payload.qr_image_url"
              alt="VietQR Topup"
              class="h-52 w-52 object-contain"
            />
            <span class="mt-2 text-2xs font-medium text-slate-600">
              Quét mã QR bằng ứng dụng Ngân hàng / Ví điện tử
            </span>
          </div>

          <div
            class="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3.5 text-xs"
          >
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Số Xu nhận được:</span>
              <span class="font-mono text-sm font-bold text-primary">
                +{{ activeIntent.amount_credits.toLocaleString('en-US') }} Xu
              </span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Số tiền cần chuyển:</span>
              <span class="font-mono text-sm font-bold text-foreground">
                {{ activeIntent.pay_amount.toLocaleString('en-US') }}
                {{ activeIntent.pay_currency }}
              </span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Nội dung chuyển khoản:</span>
              <div class="flex items-center gap-1.5">
                <code
                  class="rounded bg-primary/15 px-2 py-0.5 font-mono text-sm font-bold text-primary"
                >
                  {{ activeIntent.transfer_code }}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  class="h-6 px-2 text-2xs"
                  @click="
                    copyText(activeIntent.transfer_code, 'mã chuyển khoản')
                  "
                >
                  <Copy class="size-3" />
                </Button>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Trạng thái lệnh:</span>
              <Badge variant="secondary" class="text-2xs">
                {{ activeIntent.status }}
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
                  topupOpen = false;
                }
              "
            >
              Đóng
            </Button>
            <Button
              size="sm"
              class="gap-1.5"
              :disabled="checkingIntent"
              @click="() => activeIntent && checkTopupStatus(activeIntent.id)"
            >
              <RefreshCw
                class="size-3.5"
                :class="{ 'animate-spin': checkingIntent }"
              />
              Kiểm tra đã nhận Xu
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
