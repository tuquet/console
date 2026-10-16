<script lang="ts" setup>
import type {
  PaymentGatewayItem,
  PaymentIntentItem,
  TenantItem,
  TenantWalletItem,
  WalletTransactionItem,
  WalletTxType,
} from '#/api';

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { usePreferences } from '@vben/preferences';

import {
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
import { useClipboard, useDateFormat } from '#/composables';
import { $t } from '#/locales';

defineOptions({ name: 'CommerceWallet' });

const router = useRouter();
const { formatDate } = useDateFormat();
const { copyToClipboard } = useClipboard();
const { isMobile } = usePreferences();

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

const txTypeMap = computed<
  Record<
    WalletTxType,
    {
      label: string;
      variant: 'default' | 'destructive' | 'outline' | 'secondary';
    }
  >
>(() => ({
  admin_adjustment: {
    label: $t('page.commerce_view.tx_admin_adjustment'),
    variant: 'secondary',
  },
  bonus: { label: $t('page.commerce_view.tx_bonus'), variant: 'default' },
  purchase: {
    label: $t('page.commerce_view.tx_purchase'),
    variant: 'outline',
  },
  refund: {
    label: $t('page.commerce_view.tx_refund'),
    variant: 'secondary',
  },
  topup: { label: $t('page.commerce_view.tx_topup'), variant: 'default' },
}));

function getTxTypeBadge(type: WalletTxType) {
  return txTypeMap.value[type] || { label: type, variant: 'outline' as const };
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

function getColumns() {
  const mobile = isMobile.value;
  return [
    {
      field: 'tx_type',
      title: $t('page.commerce_view.tx_type_label'),
      width: mobile ? 105 : 175,
      slots: { default: 'type-cell' },
    },
    {
      field: 'description',
      title: $t('common.description'),
      minWidth: mobile ? 155 : 240,
      slots: { default: 'desc-cell' },
    },
    {
      field: 'amount_credits',
      title: $t('page.commerce_view.col_amount_change'),
      width: mobile ? 105 : 155,
      slots: { default: 'amount-cell' },
    },
    {
      field: 'balance_after_credits',
      title: $t('page.commerce_view.col_balance_after'),
      width: 155,
      visible: !mobile,
      slots: { default: 'balance-cell' },
    },
    {
      field: 'reference_id',
      title: $t('page.commerce_view.col_reference_id'),
      width: 175,
      visible: !mobile,
      slots: { default: 'ref-cell' },
    },
    {
      field: 'created_at',
      title: $t('page.commerce_view.col_created_time'),
      width: 165,
      visible: !mobile,
      slots: { default: 'date-cell' },
    },
  ];
}

const [Grid, gridApi] = useVbenVxeGrid<WalletTransactionItem>({
  separator: false,
  detailSheetOptions: {
    resource: 'billing.wallet_transactions',
    subtitleField: 'tx_type',
    titleField: 'description',
    actions: [
      {
        label: $t('common.copy'),
        onClick: (row) =>
          copyToClipboard(row.reference_id || row.id, 'Reference ID'),
        variant: 'outline',
      },
    ],
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
        fieldName: 'tx_type',
        label: () => $t('page.commerce_view.tx_type_label'),
        defaultValue: 'all',
        componentProps: () => ({
          placeholder: $t('page.commerce_view.all_transactions'),
          options: [
            { label: $t('page.commerce_view.all_transactions'), value: 'all' },
            { label: $t('page.commerce_view.tx_topup'), value: 'topup' },
            { label: $t('page.commerce_view.tx_purchase'), value: 'purchase' },
            { label: $t('page.commerce_view.tx_bonus'), value: 'bonus' },
            { label: $t('page.commerce_view.tx_refund'), value: 'refund' },
            {
              label: $t('page.commerce_view.tx_admin_adjustment'),
              value: 'admin_adjustment',
            },
          ],
        }),
      },
      {
        component: 'Input',
        fieldName: 'search',
        label: () => $t('common.search'),
        componentProps: () => ({
          placeholder: $t('page.commerce_view.search_tx_placeholder'),
          clearable: true,
        }),
      },
    ],
    layout: 'vertical',
    showCollapseButton: false,
    submitOnChange: true,
    submitOnEnter: true,
    submitButtonOptions: {
      content: computed(() => $t('common.filter')),
    },
    resetButtonOptions: {
      content: computed(() => $t('common.reset')),
    },
    actionWrapperClass:
      'col-span-2 sm:col-span-2 lg:col-span-2 flex items-center justify-end gap-2 pt-1 sm:pt-6',
    wrapperClass: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3',
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
    columns: getColumns(),
  },
});

watch([() => $t('page.commerce_view.tx_type_label'), isMobile], () => {
  gridApi.setGridOptions({ columns: getColumns() });
  gridApi.formApi?.setState({
    commonConfig: {
      componentProps: { class: 'w-full' },
      hideLabel: isMobile.value,
    },
  });
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
        $t('page.commerce_view.topup_success_toast', {
          amount: updated.amount_credits.toLocaleString('en-US'),
        }),
      );
      topupOpen.value = false;
      await gridApi.reload();
    } else if (updated.status === 'manual_review' && !silent) {
      toast.info($t('page.commerce_view.payment_manual_review_pending'));
    } else if (!silent) {
      toast.info($t('page.commerce_view.payment_waiting_gateway'));
    }
  } finally {
    checkingIntent.value = false;
  }
}

async function handleCreateTopupIntent() {
  if (!selectedTenantId.value) {
    toast.error($t('page.commerce_view.select_workspace_before_topup'));
    return;
  }
  const gw = selectedGateway.value;
  if (!gw) {
    toast.error($t('page.commerce_view.select_payment_gateway'));
    return;
  }
  if (!topupCredits.value || topupCredits.value <= 0) {
    toast.error($t('page.commerce_view.topup_amount_must_be_positive'));
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
    toast.success(
      $t('page.commerce_view.topup_intent_created', {
        code: intent.transfer_code,
      }),
    );
  } catch (error: any) {
    toast.error(error?.message || $t('page.commerce_view.topup_create_failed'));
  } finally {
    creatingIntent.value = false;
  }
}

async function copyText(
  text: string,
  label = $t('page.commerce_view.copy_default_label'),
) {
  await copyToClipboard(text, $t('page.commerce_view.copied_label', { label }));
}

watch(topupOpen, (open) => {
  if (!open) {
    stopPolling();
  }
});

onMounted(() => {
  initData();
});

onBeforeUnmount(() => {
  stopPolling();
});
</script>

<template>
  <div class="space-y-3 p-3 sm:space-y-4 sm:p-5">
    <!-- Header -->
    <div class="flex items-center justify-between gap-2">
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <h1
            class="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl"
          >
            {{ $t('page.commerce.wallet') }}
          </h1>
          <Badge variant="secondary" class="text-xs font-normal">
            {{ allTransactions.length }}
          </Badge>
        </div>
        <p class="hidden text-xs text-muted-foreground sm:block">
          {{ $t('page.commerce.wallet_desc') }}
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <div
          class="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-2.5 py-1.5"
        >
          <Building2 class="size-3.5 shrink-0 text-muted-foreground" />
          <select
            :value="selectedTenantId"
            class="max-w-[100px] sm:max-w-[160px] truncate bg-transparent text-xs font-medium text-foreground focus:outline-none"
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

        <Button
          size="sm"
          class="h-8 gap-1.5 px-2.5 text-xs sm:px-3"
          @click="openTopupModal"
        >
          <Plus class="size-3.5" />
          <span>{{ $t('page.commerce_view.topup_more_xu') }}</span>
        </Button>

        <Button
          variant="outline"
          size="icon"
          class="size-8 shrink-0"
          :title="$t('common.refresh')"
          @click="() => gridApi.reload()"
        >
          <RefreshCw class="size-3.5 shrink-0" />
        </Button>
      </div>
    </div>

    <!-- Compact Wallet Balance Strip -->
    <div
      class="flex items-center justify-between gap-2.5 rounded-xl border border-primary/30 bg-primary/5 px-3.5 py-2.5 sm:px-4 sm:py-3"
    >
      <div class="flex items-center gap-2.5">
        <div
          class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
        >
          <Wallet class="size-4" />
        </div>
        <div>
          <span class="text-xs text-muted-foreground">
            {{ $t('page.commerce_view.available_balance_kpi') }}
          </span>
          <p class="text-base sm:text-lg font-bold text-foreground">
            {{ (wallet?.balance_credits ?? 0).toLocaleString('en-US') }} Xu
          </p>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        class="h-7 gap-1.5 px-2.5 text-xs"
        @click="router.push('/commerce/store')"
      >
        <ShoppingBag class="size-3.5 text-muted-foreground" />
        <span>{{ $t('page.commerce.store') }}</span>
      </Button>
    </div>

    <!-- Ledger VXE Grid -->
    <div
      class="overflow-hidden rounded-xl border border-border/60 bg-card p-3 sm:p-5 shadow-xs"
    >
      <Grid>
        <template #type-cell="{ row }">
          <Badge :variant="getTxTypeBadge(row.tx_type).variant">
            {{ getTxTypeBadge(row.tx_type).label }}
          </Badge>
        </template>

        <template #desc-cell="{ row }">
          <span class="text-xs text-foreground">
            {{
              row.description || $t('page.commerce_view.default_wallet_tx_desc')
            }}
          </span>
        </template>

        <template #amount-cell="{ row }">
          <span
            class="text-sm font-bold"
            :class="
              row.amount_credits >= 0 ? 'text-success' : 'text-destructive'
            "
          >
            {{ row.amount_credits >= 0 ? '+' : ''
            }}{{ row.amount_credits.toLocaleString('en-US') }} Xu
          </span>
        </template>

        <template #balance-cell="{ row }">
          <span class="text-xs font-semibold text-foreground">
            {{ row.balance_after_credits.toLocaleString('en-US') }} Xu
          </span>
        </template>

        <template #ref-cell="{ row }">
          <span class="text-xs text-muted-foreground">
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
                ? $t('page.commerce_view.topup_transfer_title', {
                    code: activeIntent.transfer_code,
                  })
                : $t('page.commerce_view.wallet_topup_title')
            }}
          </DialogTitle>
          <DialogDescription class="text-xs text-muted-foreground">
            {{
              activeIntent
                ? $t('page.commerce_view.topup_transfer_desc')
                : $t('page.commerce_view.wallet_topup_desc')
            }}
          </DialogDescription>
        </DialogHeader>

        <!-- Step 1: Select Amount & Gateway -->
        <div v-if="!activeIntent" class="space-y-4 py-2">
          <div class="space-y-2">
            <label
              class="text-2xs font-semibold tracking-wider text-muted-foreground uppercase"
            >
              {{ $t('page.commerce_view.quick_select_xu_pack') }}
            </label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="preset in QUICK_TOPUP_PRESETS"
                :key="preset"
                type="button"
                class="rounded-lg border py-2 text-center text-xs font-semibold transition-colors"
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
              {{ $t('page.commerce_view.custom_xu_amount_label') }}
            </label>
            <input
              v-model.number="topupCredits"
              type="number"
              min="10"
              step="10"
              class="h-8 w-32 rounded-md border border-border bg-background px-2.5 text-right text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div class="space-y-2">
            <label
              class="text-2xs font-semibold tracking-wider text-muted-foreground uppercase"
            >
              {{ $t('page.commerce_view.payment_gateway_label') }}
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
              <Badge variant="outline" class="text-2xs">
                {{ gw.currency }}
              </Badge>
            </button>
          </div>

          <div
            class="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3"
          >
            <span class="text-xs font-medium text-muted-foreground">
              {{ $t('page.commerce_view.estimated_pay_amount') }}
            </span>
            <div class="text-right">
              <p class="text-lg font-bold text-foreground">
                {{ estimatedPayAmount.toLocaleString('en-US') }}
                {{ selectedGateway?.currency || 'VND' }}
              </p>
              <p class="text-xs text-primary">
                {{
                  $t('page.commerce_view.receive_immediately_xu', {
                    amount: topupCredits.toLocaleString('en-US'),
                  })
                }}
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
              {{ $t('page.commerce_view.create_topup_code_btn') }}
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
              :alt="$t('page.commerce_view.payment_qr_alt')"
              class="h-52 w-52 object-contain"
            />
            <span class="mt-2 text-2xs font-medium text-slate-600">
              {{ $t('page.commerce_view.scan_qr_bank_wallet_hint') }}
            </span>
          </div>

          <div
            class="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3.5 text-xs"
          >
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">
                {{ $t('page.commerce_view.xu_to_receive_label') }}
              </span>
              <span class="text-sm font-bold text-primary">
                +{{ activeIntent.amount_credits.toLocaleString('en-US') }} Xu
              </span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">
                {{ $t('page.commerce_view.transfer_amount_label') }}
              </span>
              <span class="text-sm font-bold text-foreground">
                {{ activeIntent.pay_amount.toLocaleString('en-US') }}
                {{ activeIntent.pay_currency }}
              </span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">
                {{ $t('page.commerce_view.transfer_memo_label') }}
              </span>
              <div class="flex items-center gap-1.5">
                <code
                  class="rounded bg-primary/15 px-2 py-0.5 text-sm font-bold text-primary"
                >
                  {{ activeIntent.transfer_code }}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  class="h-6 px-2 text-2xs"
                  @click="
                    copyText(
                      activeIntent.transfer_code,
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
                {{ $t('page.commerce_view.intent_status_label') }}
              </span>
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
              {{ $t('common.close') }}
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
              {{ $t('page.commerce_view.check_xu_received_btn') }}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
