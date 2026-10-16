<script lang="ts" setup>
import type {
  CommerceOrderDeliveryItem,
  CommerceOrderRecord,
  CommerceOrderStatus,
  TenantItem,
} from '#/api';

import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { usePreferences } from '@vben/preferences';

import {
  Building2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  KeyRound,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
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
  downloadTextFile,
  filterCommerceOrders,
  formatSerialDeliveriesText,
  getActiveTenantId,
  getOrderDeliveriesApi,
  getTenantOrdersApi,
  getTenantsApi,
  setActiveTenantId,
} from '#/api';
import { useClipboard, useDateFormat } from '#/composables';
import {
  buildEnumFilterOptions,
  COMMERCE_ORDER_STATUS,
  COMMERCE_ORDER_STATUS_META,
  FILTER_ALL,
  PAYMENT_CHANNEL,
  PAYMENT_CHANNEL_META,
} from '#/constants';
import { $t } from '#/locales';

defineOptions({ name: 'CommerceOrders' });

const router = useRouter();
const { formatDate } = useDateFormat();
const { copyToClipboard } = useClipboard();
const { isMobile } = usePreferences();

const tenants = ref<TenantItem[]>([]);
const selectedTenantId = ref<string>(getActiveTenantId());
const allOrders = ref<CommerceOrderRecord[]>([]);

// Deliverables Inspector Dialog
const deliveryOpen = ref(false);
const loadingDeliveries = ref(false);
const selectedOrder = ref<CommerceOrderRecord | null>(null);
const orderDeliveries = ref<CommerceOrderDeliveryItem[]>([]);

const orderStatusMap = computed<
  Record<
    CommerceOrderStatus,
    {
      label: string;
      variant: 'default' | 'destructive' | 'outline' | 'secondary';
    }
  >
>(() => ({
  [COMMERCE_ORDER_STATUS.CANCELLED]: {
    label: $t('common.cancelled'),
    variant: 'outline',
  },
  [COMMERCE_ORDER_STATUS.COMPLETED]: {
    label: $t('page.commerce_view.order_status_completed'),
    variant: 'default',
  },
  [COMMERCE_ORDER_STATUS.FAILED]: {
    label: $t('common.failed'),
    variant: 'destructive',
  },
  [COMMERCE_ORDER_STATUS.FULFILLING]: {
    label: $t('page.commerce_view.order_status_fulfilling'),
    variant: 'secondary',
  },
  [COMMERCE_ORDER_STATUS.MANUAL_REVIEW]: {
    label: $t('page.commerce_view.order_status_manual_review'),
    variant: 'secondary',
  },
  [COMMERCE_ORDER_STATUS.PAID]: {
    label: $t('page.commerce_view.order_status_paid'),
    variant: 'default',
  },
  [COMMERCE_ORDER_STATUS.PENDING_PAYMENT]: {
    label: $t('page.commerce_view.order_status_pending_payment'),
    variant: 'outline',
  },
  [COMMERCE_ORDER_STATUS.REFUNDED]: {
    label: $t('page.commerce_view.order_status_refunded'),
    variant: 'outline',
  },
}));

const paymentMethodLabels = computed<Record<string, string>>(() => ({
  [PAYMENT_CHANNEL.BANK_TRANSFER]: $t(
    'page.commerce_view.method_bank_transfer',
  ),
  [PAYMENT_CHANNEL.CARD_INTL]: $t('page.commerce_view.method_card_intl'),
  [PAYMENT_CHANNEL.CRYPTO]: $t('page.commerce_view.method_crypto'),
  [PAYMENT_CHANNEL.E_WALLET]: $t('page.commerce_view.method_e_wallet'),
  [PAYMENT_CHANNEL.INTERNAL_WALLET]: $t(
    'page.commerce_view.method_internal_wallet',
  ),
}));

function getOrderStatusBadge(status: CommerceOrderStatus) {
  return (
    orderStatusMap.value[status] || {
      label: status,
      variant: 'outline' as const,
    }
  );
}

function getPaymentMethodLabel(method: null | string) {
  if (!method) return $t('page.commerce_view.method_not_selected');
  return paymentMethodLabels.value[method] || method;
}

function getColumns() {
  const mobile = isMobile.value;
  return [
    {
      field: 'order_code',
      title: $t('page.commerce_view.col_order_code'),
      minWidth: mobile ? 145 : 190,
      slots: { default: 'code-cell' },
    },
    {
      field: 'payment_method',
      title: $t('page.commerce_view.col_payment_method'),
      minWidth: 170,
      visible: !mobile,
      slots: { default: 'method-cell' },
    },
    {
      field: 'total_credits',
      title: $t('page.commerce_view.total_payment'),
      width: mobile ? 105 : 150,
      slots: { default: 'total-cell' },
    },
    {
      field: 'status',
      title: $t('common.status'),
      width: mobile ? 110 : 155,
      visible: !mobile,
      slots: { default: 'status-cell' },
    },
    {
      field: 'created_at',
      title: $t('page.commerce_view.col_created_time'),
      width: 165,
      visible: !mobile,
      slots: { default: 'date-cell' },
    },
    {
      field: 'actions',
      title: $t('page.commerce_view.col_delivery'),
      width: mobile ? 95 : 150,
      align: 'right' as const,
      slots: { default: 'action-cell' },
    },
  ];
}

const [Grid, gridApi] = useVbenVxeGrid<CommerceOrderRecord>({
  separator: false,
  detailSheetOptions: {
    resource: 'commerce.orders',
    subtitleField: 'payment_method',
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
        label: () => $t('page.commerce_view.order_status_label'),
        defaultValue: FILTER_ALL,
        componentProps: () => ({
          placeholder: $t('page.runs_view.status_all'),
          options: buildEnumFilterOptions(COMMERCE_ORDER_STATUS_META, $t, {
            allLabelText: $t('page.runs_view.status_all'),
            order: [
              COMMERCE_ORDER_STATUS.COMPLETED,
              COMMERCE_ORDER_STATUS.PENDING_PAYMENT,
              COMMERCE_ORDER_STATUS.MANUAL_REVIEW,
              COMMERCE_ORDER_STATUS.FAILED,
            ],
          }),
        }),
      },
      {
        component: 'Select',
        fieldName: 'payment_method',
        label: () => $t('page.commerce_view.payment_channel_label'),
        defaultValue: FILTER_ALL,
        componentProps: () => ({
          placeholder: $t('page.commerce_view.all_channels'),
          options: buildEnumFilterOptions(PAYMENT_CHANNEL_META, $t, {
            allLabelText: $t('page.commerce_view.all_channels'),
            order: [
              PAYMENT_CHANNEL.INTERNAL_WALLET,
              PAYMENT_CHANNEL.BANK_TRANSFER,
              PAYMENT_CHANNEL.E_WALLET,
              PAYMENT_CHANNEL.CARD_INTL,
              PAYMENT_CHANNEL.CRYPTO,
            ],
          }),
        }),
      },
      {
        component: 'Input',
        fieldName: 'search',
        label: () => $t('common.search'),
        componentProps: () => ({
          placeholder: $t('page.commerce_view.search_order_placeholder'),
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
      'col-span-2 sm:col-span-1 flex items-center justify-end gap-2 pt-1 sm:pt-6',
    wrapperClass: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3',
  },
  gridOptions: {
    border: false,
    round: true,
    showOverflow: true,
    cellConfig: {
      height: 56,
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
          const data = await getTenantOrdersApi(selectedTenantId.value);
          allOrders.value = data;

          const filtered = filterCommerceOrders(data, {
            payment_method: formValues?.payment_method,
            search: formValues?.search,
            status: formValues?.status,
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

watch([() => $t('page.commerce_view.col_order_code'), isMobile], () => {
  gridApi.setGridOptions({ columns: getColumns() });
  gridApi.formApi?.setState({
    commonConfig: {
      componentProps: { class: 'w-full' },
      hideLabel: isMobile.value,
    },
  });
});

async function initTenantsAndLoad() {
  const tenantRows = await getTenantsApi().catch(() => [] as TenantItem[]);
  tenants.value = tenantRows;
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

async function openDeliveriesModal(order: CommerceOrderRecord) {
  selectedOrder.value = order;
  orderDeliveries.value = [];
  deliveryOpen.value = true;
  loadingDeliveries.value = true;
  try {
    orderDeliveries.value = await getOrderDeliveriesApi(order.id);
  } catch (error: any) {
    toast.error(
      error?.message || $t('page.commerce_view.load_deliveries_failed'),
    );
  } finally {
    loadingDeliveries.value = false;
  }
}

const serialLinesText = computed(() =>
  formatSerialDeliveriesText(orderDeliveries.value),
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
    `${selectedOrder.value?.order_code || 'order'}.txt`,
    serialLinesText.value,
  );
}

onMounted(() => {
  initTenantsAndLoad();
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
            {{ $t('page.commerce.orders') }}
          </h1>
          <Badge variant="secondary" class="text-xs font-normal">
            {{ allOrders.length }}
          </Badge>
        </div>
        <p class="hidden text-xs text-muted-foreground sm:block">
          {{ $t('page.commerce.orders_desc') }}
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <div
          class="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-2.5 py-1.5"
        >
          <Building2 class="size-3.5 shrink-0 text-muted-foreground" />
          <select
            :value="selectedTenantId"
            class="max-w-[110px] sm:max-w-[160px] truncate bg-transparent text-xs font-medium text-foreground focus:outline-none"
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
          variant="default"
          size="sm"
          class="h-8 gap-1.5 px-2.5 text-xs sm:px-3"
          @click="router.push('/commerce/store')"
        >
          <ShoppingBag class="size-3.5" />
          <span class="hidden sm:inline">{{
            $t('page.commerce_view.buy_more_resources')
          }}</span>
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

    <!-- VXE Grid Container -->
    <div
      class="overflow-hidden rounded-xl border border-border/60 bg-card p-3 sm:p-5 shadow-xs"
    >
      <Grid>
        <template #code-cell="{ row }">
          <div class="flex items-center gap-2 py-1">
            <span class="text-xs font-semibold text-foreground">
              {{ row.order_code }}
            </span>
            <button
              type="button"
              class="text-muted-foreground hover:text-foreground"
              @click="
                copyText(
                  row.order_code,
                  $t('page.commerce_view.order_code_label'),
                )
              "
            >
              <Copy class="size-3" />
            </button>
          </div>
        </template>

        <template #method-cell="{ row }">
          <span class="text-xs text-foreground">
            {{ getPaymentMethodLabel(row.payment_method) }}
          </span>
        </template>

        <template #total-cell="{ row }">
          <span class="text-sm font-semibold text-foreground">
            {{ row.total_credits.toLocaleString('en-US') }} Xu
          </span>
        </template>

        <template #status-cell="{ row }">
          <Badge :variant="getOrderStatusBadge(row.status).variant">
            {{ getOrderStatusBadge(row.status).label }}
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
            class="h-7 gap-1 px-2.5 text-xs"
            @click="openDeliveriesModal(row)"
          >
            <Eye class="size-3.5" />
            {{ $t('page.commerce_view.claim_delivery_btn') }}
          </Button>
        </template>
      </Grid>
    </div>

    <!-- Deliverables Inspector Dialog -->
    <Dialog v-model:open="deliveryOpen">
      <DialogContent class="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2 text-base font-semibold">
            <PackageCheck class="size-4 text-primary" />
            {{
              $t('page.commerce_view.delivery_detail_title', {
                code: selectedOrder?.order_code || '',
              })
            }}
          </DialogTitle>
          <DialogDescription class="text-xs text-muted-foreground">
            {{ $t('page.commerce_view.delivery_detail_desc') }}
          </DialogDescription>
        </DialogHeader>

        <div
          v-if="loadingDeliveries"
          class="py-8 text-center text-xs text-muted-foreground"
        >
          {{ $t('page.commerce_view.loading_deliveries') }}
        </div>

        <div
          v-else-if="orderDeliveries.length === 0"
          class="rounded-lg border border-dashed border-border/60 py-8 text-center text-xs text-muted-foreground"
        >
          {{ $t('page.commerce_view.no_deliveries_yet') }} ({{
            $t('page.commerce_view.current_status_label')
          }}:
          <span class="font-semibold text-foreground">{{
            selectedOrder?.status
          }}</span
          >).
        </div>

        <div v-else class="space-y-4 py-2">
          <div v-if="serialLinesText" class="space-y-2">
            <div class="flex items-center justify-between">
              <span
                class="flex items-center gap-1.5 text-xs font-semibold text-foreground"
              >
                <KeyRound class="size-3.5 text-primary" />
                {{
                  $t('page.commerce_view.serial_data_lines', {
                    count: orderDeliveries.filter(
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
                      $t('page.commerce_view.account_list_label'),
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
            <textarea
              readonly
              :value="serialLinesText"
              rows="6"
              class="w-full rounded-lg border border-border bg-muted/40 p-3 text-xs text-foreground focus:outline-none"
            ></textarea>
          </div>

          <div
            v-for="item in orderDeliveries.filter(
              (d) => d.delivery_type !== 'serial_stock',
            )"
            :key="item.id"
            class="rounded-lg border border-border/60 bg-muted/20 p-3.5 text-xs"
          >
            <div class="flex items-center justify-between">
              <span class="font-semibold text-foreground">
                {{
                  $t('page.commerce_view.delivery_type_prefix', {
                    type: item.delivery_type,
                  })
                }}
              </span>
              <Badge variant="default" class="text-2xs">
                {{ $t('page.commerce_view.provisioned_badge') }}
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
