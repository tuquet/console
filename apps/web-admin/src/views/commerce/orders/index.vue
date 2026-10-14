<script lang="ts" setup>
import type {
  CommerceOrderDeliveryItem,
  CommerceOrderRecord,
  CommerceOrderStatus,
  TenantItem,
} from '#/api';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  Building2,
  CheckCircle2,
  Coins,
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
  filterCommerceOrders,
  getActiveTenantId,
  getOrderDeliveriesApi,
  getTenantOrdersApi,
  getTenantsApi,
  setActiveTenantId,
} from '#/api';
import { useDateFormat } from '#/composables';
import { $t } from '#/locales';

defineOptions({ name: 'CommerceOrders' });

const router = useRouter();
const { formatDate } = useDateFormat();

const tenants = ref<TenantItem[]>([]);
const selectedTenantId = ref<string>(getActiveTenantId());
const allOrders = ref<CommerceOrderRecord[]>([]);

// Deliverables Inspector Dialog
const deliveryOpen = ref(false);
const loadingDeliveries = ref(false);
const selectedOrder = ref<CommerceOrderRecord | null>(null);
const orderDeliveries = ref<CommerceOrderDeliveryItem[]>([]);

const ORDER_STATUS_MAP: Record<
  CommerceOrderStatus,
  {
    label: string;
    variant: 'default' | 'destructive' | 'outline' | 'secondary';
  }
> = {
  cancelled: { label: 'Đã hủy', variant: 'outline' },
  completed: { label: 'Đã giao hàng', variant: 'default' },
  failed: { label: 'Thất bại', variant: 'destructive' },
  fulfilling: { label: 'Đang xuất kho', variant: 'secondary' },
  manual_review: { label: 'Chờ duyệt tay', variant: 'secondary' },
  paid: { label: 'Đã thanh toán', variant: 'default' },
  pending_payment: { label: 'Chờ thanh toán', variant: 'outline' },
  refunded: { label: 'Đã hoàn tiền', variant: 'outline' },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Chuyển khoản VietQR',
  card_intl: 'Thẻ quốc tế (Stripe)',
  crypto: 'Crypto (USDT)',
  e_wallet: 'Ví điện tử (MoMo)',
  internal_wallet: 'Ví Xu trả trước',
};

function getOrderStatusBadge(status: CommerceOrderStatus) {
  return (
    ORDER_STATUS_MAP[status] || { label: status, variant: 'outline' as const }
  );
}

function getPaymentMethodLabel(method: null | string) {
  if (!method) return 'Chưa chọn';
  return PAYMENT_METHOD_LABELS[method] || method;
}

const completedCount = computed(
  () => allOrders.value.filter((o) => o.status === 'completed').length,
);

const totalSpentCredits = computed(() =>
  allOrders.value
    .filter((o) => o.status === 'completed' || o.status === 'paid')
    .reduce((sum, o) => sum + (o.total_credits || 0), 0),
);

const [Grid, gridApi] = useVbenVxeGrid<CommerceOrderRecord>({
  separator: false,
  formOptions: {
    schema: [
      {
        component: 'Select',
        fieldName: 'status',
        label: 'Trạng thái đơn',
        defaultValue: 'all',
        componentProps: {
          placeholder: 'Tất cả trạng thái',
          options: [
            { label: 'Tất cả trạng thái', value: 'all' },
            { label: 'Đã giao hàng', value: 'completed' },
            { label: 'Chờ thanh toán', value: 'pending_payment' },
            { label: 'Chờ duyệt tay', value: 'manual_review' },
            { label: 'Thất bại', value: 'failed' },
          ],
        },
      },
      {
        component: 'Select',
        fieldName: 'payment_method',
        label: 'Kênh thanh toán',
        defaultValue: 'all',
        componentProps: {
          placeholder: 'Tất cả kênh',
          options: [
            { label: 'Tất cả kênh', value: 'all' },
            { label: 'Ví Xu trả trước', value: 'internal_wallet' },
            { label: 'Chuyển khoản VietQR', value: 'bank_transfer' },
            { label: 'Ví điện tử MoMo', value: 'e_wallet' },
            { label: 'Thẻ quốc tế Stripe', value: 'card_intl' },
            { label: 'Crypto USDT', value: 'crypto' },
          ],
        },
      },
      {
        component: 'Input',
        fieldName: 'search',
        label: 'Tìm kiếm',
        componentProps: {
          placeholder: 'Tìm theo mã đơn ORD-... hoặc UUID...',
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
    wrapperClass: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3',
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
    columns: [
      {
        field: 'order_code',
        title: 'Mã đơn hàng',
        minWidth: 190,
        slots: { default: 'code-cell' },
      },
      {
        field: 'payment_method',
        title: 'Phương thức',
        minWidth: 170,
        slots: { default: 'method-cell' },
      },
      {
        field: 'total_credits',
        title: 'Tổng thanh toán',
        width: 150,
        slots: { default: 'total-cell' },
      },
      {
        field: 'status',
        title: 'Trạng thái',
        width: 155,
        slots: { default: 'status-cell' },
      },
      {
        field: 'created_at',
        title: 'Thời gian tạo',
        width: 165,
        slots: { default: 'date-cell' },
      },
      {
        field: 'actions',
        title: 'Bàn giao',
        width: 150,
        align: 'right',
        slots: { default: 'action-cell' },
      },
    ],
  },
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
    toast.error(error?.message || 'Không thể tải dữ liệu bàn giao');
  } finally {
    loadingDeliveries.value = false;
  }
}

const serialLinesText = computed(() =>
  orderDeliveries.value
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
  link.download = `${selectedOrder.value?.order_code || 'order'}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

onMounted(() => {
  initTenantsAndLoad();
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
          {{ $t('page.commerce.orders') }}
        </h1>
        <p class="text-xs text-muted-foreground">
          {{ $t('page.commerce.orders_desc') }}
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

        <Button
          variant="default"
          size="sm"
          class="gap-1.5"
          @click="router.push('/commerce/store')"
        >
          <ShoppingBag class="size-3.5" />
          Mua thêm tài nguyên
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

    <!-- Metric Cards -->
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div class="rounded-xl border border-border/60 bg-card p-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-muted-foreground">
            Tổng đơn hàng
          </span>
          <PackageCheck class="size-4 text-primary" />
        </div>
        <p
          class="mt-2 font-mono text-2xl font-bold tracking-tight text-foreground"
        >
          {{ allOrders.length }}
        </p>
      </div>

      <div class="rounded-xl border border-border/60 bg-card p-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-muted-foreground">
            Đã giao hàng hoàn tất
          </span>
          <CheckCircle2 class="size-4 text-success" />
        </div>
        <p
          class="mt-2 font-mono text-2xl font-bold tracking-tight text-foreground"
        >
          {{ completedCount }}
        </p>
      </div>

      <div class="rounded-xl border border-border/60 bg-card p-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-muted-foreground">
            Tổng giá trị đơn đã mua
          </span>
          <Coins class="size-4 text-primary" />
        </div>
        <p
          class="mt-2 font-mono text-2xl font-bold tracking-tight text-foreground"
        >
          {{ totalSpentCredits.toLocaleString('en-US') }} Xu
        </p>
      </div>
    </div>

    <!-- VXE Grid Container -->
    <div
      class="overflow-hidden rounded-none border-0 border-border/60 bg-card p-0 shadow-none sm:rounded-xl sm:border sm:p-5 sm:shadow-xs"
    >
      <Grid>
        <template #code-cell="{ row }">
          <div class="flex items-center gap-2 py-1">
            <span class="font-mono text-xs font-semibold text-foreground">
              {{ row.order_code }}
            </span>
            <button
              type="button"
              class="text-muted-foreground hover:text-foreground"
              @click="copyText(row.order_code, 'mã đơn hàng')"
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
          <span class="font-mono text-sm font-semibold text-foreground">
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
            Nhận hàng
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
            Chi tiết bàn giao — {{ selectedOrder?.order_code }}
          </DialogTitle>
          <DialogDescription class="text-xs text-muted-foreground">
            Danh sách tài khoản, license key, proxy hoặc tệp số đã xuất kho cho
            đơn hàng này.
          </DialogDescription>
        </DialogHeader>

        <div
          v-if="loadingDeliveries"
          class="py-8 text-center text-xs text-muted-foreground"
        >
          Đang tải dữ liệu bàn giao...
        </div>

        <div
          v-else-if="orderDeliveries.length === 0"
          class="rounded-lg border border-dashed border-border/60 py-8 text-center text-xs text-muted-foreground"
        >
          Đơn hàng này chưa có bản ghi bàn giao (Trạng thái hiện tại:
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
                Tài khoản / License key đã xuất ({{
                  orderDeliveries.filter(
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
                  Tải .txt
                </Button>
              </div>
            </div>
            <textarea
              readonly
              :value="serialLinesText"
              rows="6"
              class="w-full rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs text-foreground focus:outline-none"
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
                Loại bàn giao: {{ item.delivery_type }}
              </span>
              <Badge variant="default" class="text-2xs">Đã cấp phát</Badge>
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
      </DialogContent>
    </Dialog>
  </div>
</template>
