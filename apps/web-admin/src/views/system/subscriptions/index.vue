<script lang="ts" setup>
import type { PlatformSubscriptionItem } from '#/api';

import { computed, onMounted, ref } from 'vue';

import {
  Building2,
  Calendar,
  CreditCard,
  DollarSign,
  Receipt,
  RefreshCw,
} from '@lucide/vue';
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@tuquet/vue-ui';

import { getPlatformSubscriptionsApi } from '#/api';
import { useDateFormat } from '#/composables';

defineOptions({ name: 'SystemSubscriptions' });

const { formatDate } = useDateFormat();

const loading = ref(true);
const subscriptions = ref<PlatformSubscriptionItem[]>([]);
const statusFilter = ref<'active' | 'all' | 'canceled' | 'trialing'>('all');

async function loadSubscriptions() {
  loading.value = true;
  try {
    subscriptions.value = await getPlatformSubscriptionsApi();
  } catch (error: any) {
    toast.error(error.message || 'Không thể tải danh sách thuê bao nền tảng');
  } finally {
    loading.value = false;
  }
}

const filteredSubscriptions = computed(() => {
  if (statusFilter.value === 'all') return subscriptions.value;
  return subscriptions.value.filter((s) => s.status === statusFilter.value);
});

const totalMRR = computed(() => {
  return subscriptions.value
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + (s.price_monthly_usd || 0), 0);
});

const activeCount = computed(() => {
  return subscriptions.value.filter((s) => s.status === 'active').length;
});

const STATUS_MAP: Record<
  string,
  {
    label: string;
    variant: 'default' | 'destructive' | 'outline' | 'secondary';
  }
> = {
  active: { label: 'Đang hoạt động', variant: 'default' },
  canceled: { label: 'Đã hủy', variant: 'outline' },
  past_due: { label: 'Quá hạn', variant: 'destructive' },
  trialing: { label: 'Dùng thử', variant: 'secondary' },
};

function getStatusBadge(status: string): {
  label: string;
  variant: 'default' | 'destructive' | 'outline' | 'secondary';
} {
  return STATUS_MAP[status] || { label: status, variant: 'outline' };
}

onMounted(() => {
  loadSubscriptions();
});
</script>

<template>
  <div class="space-y-4 p-4 sm:space-y-5 sm:p-5">
    <!-- Header -->
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex items-center gap-2.5">
        <h1
          class="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
        >
          Quản Lý Thuê Bao
        </h1>
        <Badge variant="secondary" class="font-mono text-xs uppercase">
          SaaS Billing
        </Badge>
        <span v-if="!loading" class="text-xs font-medium text-muted-foreground">
          ({{ subscriptions.length }} hợp đồng)
        </span>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="loading"
          @click="loadSubscriptions"
          class="gap-1.5"
        >
          <RefreshCw
            class="size-3.5 text-muted-foreground"
            :class="{ 'animate-spin': loading }"
          />
          Làm mới
        </Button>
      </div>
    </div>

    <!-- Metric Cards -->
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div class="rounded-xl border border-border/60 bg-card p-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-muted-foreground"
            >Doanh thu định kỳ (MRR)</span
          >
          <DollarSign class="size-4 text-primary" />
        </div>
        <p class="mt-2 text-2xl font-bold tracking-tight text-foreground">
          ${{ totalMRR.toLocaleString('en-US') }}
        </p>
      </div>

      <div class="rounded-xl border border-border/60 bg-card p-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-muted-foreground"
            >Thuê bao kích hoạt</span
          >
          <CreditCard class="size-4 text-success" />
        </div>
        <p class="mt-2 text-2xl font-bold tracking-tight text-foreground">
          {{ activeCount }}
        </p>
      </div>

      <div class="rounded-xl border border-border/60 bg-card p-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-muted-foreground"
            >Tổng workspace ký kết</span
          >
          <Building2 class="size-4 text-primary" />
        </div>
        <p class="mt-2 text-2xl font-bold tracking-tight text-foreground">
          {{ subscriptions.length }}
        </p>
      </div>
    </div>

    <!-- Filter Buttons -->
    <div class="flex flex-wrap items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        :class="{ 'bg-muted': statusFilter === 'all' }"
        @click="statusFilter = 'all'"
      >
        Tất cả ({{ subscriptions.length }})
      </Button>
      <Button
        variant="ghost"
        size="sm"
        :class="{ 'bg-muted': statusFilter === 'active' }"
        @click="statusFilter = 'active'"
      >
        Đang hoạt động ({{ activeCount }})
      </Button>
      <Button
        variant="ghost"
        size="sm"
        :class="{ 'bg-muted': statusFilter === 'canceled' }"
        @click="statusFilter = 'canceled'"
      >
        Đã hủy
      </Button>
    </div>

    <!-- Desktop Table View -->
    <div
      class="hidden overflow-hidden rounded-xl border border-border/60 bg-card md:block"
    >
      <Table>
        <TableHeader>
          <TableRow class="hover:bg-transparent">
            <TableHead class="w-[260px]">Workspace</TableHead>
            <TableHead>Gói cước</TableHead>
            <TableHead>Đơn giá</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Kỳ gia hạn tiếp theo</TableHead>
            <TableHead class="text-right">Tự động gia hạn</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="loading">
            <TableRow v-for="i in 4" :key="i">
              <TableCell colspan="6" class="h-12 text-center">
                <div
                  class="mx-auto h-4 w-48 animate-pulse rounded bg-muted"
                ></div>
              </TableCell>
            </TableRow>
          </template>

          <template v-else-if="filteredSubscriptions.length === 0">
            <TableRow>
              <TableCell colspan="6" class="h-44 text-center">
                <div
                  class="flex flex-col items-center justify-center gap-2 text-muted-foreground"
                >
                  <Receipt class="size-8 stroke-[1.5]" />
                  <p class="text-sm font-medium">
                    Không có hợp đồng thuê bao nào
                  </p>
                  <p class="text-xs text-muted-foreground/80">
                    Chưa có workspace nào ký kết gói thuê bao với tiêu chí này.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          </template>

          <template v-else>
            <TableRow
              v-for="sub in filteredSubscriptions"
              :key="sub.id"
              class="transition-colors hover:bg-muted/40"
            >
              <TableCell>
                <div class="flex flex-col">
                  <span class="font-medium text-foreground">
                    {{ sub.tenant_name }}
                  </span>
                  <span class="font-mono text-xs text-muted-foreground">
                    /{{ sub.tenant_slug || sub.tenant_id.slice(0, 8) }}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" class="font-semibold">
                  {{ sub.plan_name }}
                </Badge>
              </TableCell>
              <TableCell class="font-medium text-foreground">
                ${{ sub.price_monthly_usd }}/tháng
              </TableCell>
              <TableCell>
                <Badge :variant="getStatusBadge(sub.status).variant">
                  {{ getStatusBadge(sub.status).label }}
                </Badge>
              </TableCell>
              <TableCell class="text-xs text-muted-foreground">
                {{ formatDate(sub.current_period_end) }}
              </TableCell>
              <TableCell class="text-right">
                <Badge
                  :variant="sub.cancel_at_period_end ? 'outline' : 'secondary'"
                  class="text-xs"
                >
                  {{ sub.cancel_at_period_end ? 'Hủy cuối kỳ' : 'Tự động' }}
                </Badge>
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>

    <!-- Mobile Card View -->
    <div class="block space-y-3 md:hidden">
      <template v-if="loading">
        <div
          v-for="i in 3"
          :key="i"
          class="h-32 animate-pulse rounded-xl border border-border/60 bg-card p-4"
        ></div>
      </template>

      <template v-else-if="filteredSubscriptions.length === 0">
        <div
          class="flex flex-col items-center justify-center gap-2 rounded-xl border border-border/60 bg-card p-8 text-center text-muted-foreground"
        >
          <Receipt class="size-8 stroke-[1.5]" />
          <p class="text-sm font-medium">Không tìm thấy hợp đồng nào</p>
        </div>
      </template>

      <template v-else>
        <div
          v-for="sub in filteredSubscriptions"
          :key="sub.id"
          class="rounded-xl border border-border/60 bg-card p-4 space-y-3"
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <h3 class="font-medium text-foreground">
                {{ sub.tenant_name }}
              </h3>
              <p class="font-mono text-xs text-muted-foreground">
                /{{ sub.tenant_slug || sub.tenant_id.slice(0, 8) }}
              </p>
            </div>
            <Badge :variant="getStatusBadge(sub.status).variant">
              {{ getStatusBadge(sub.status).label }}
            </Badge>
          </div>

          <div
            class="flex items-center justify-between text-xs pt-1 border-t border-border/40"
          >
            <span class="font-semibold text-foreground">
              {{ sub.plan_name }} (${{ sub.price_monthly_usd }}/tháng)
            </span>
            <span
              class="flex items-center gap-1 font-mono text-[11px] text-muted-foreground"
            >
              <Calendar class="size-3" />
              {{ formatDate(sub.current_period_end) }}
            </span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
