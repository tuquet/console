<script lang="ts" setup>
import type { BillingPlanItem } from '#/api';

import { onMounted, ref } from 'vue';

import { Cpu, CreditCard, HardDrive, RefreshCw, Users } from '@lucide/vue';
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

import { getBillingPlansApi } from '#/api';
import { useDateFormat } from '#/composables';

defineOptions({ name: 'SystemPlans' });

const { formatDate } = useDateFormat();

const loading = ref(true);
const plans = ref<BillingPlanItem[]>([]);

function formatStorage(mb: number): string {
  if (mb >= 1024) {
    return `${Number((mb / 1024).toFixed(1))} GB`;
  }
  return `${mb} MB`;
}

async function loadPlans() {
  loading.value = true;
  try {
    plans.value = await getBillingPlansApi();
  } catch (error: any) {
    toast.error(error.message || 'Không thể tải danh sách gói cước');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadPlans();
});
</script>

<template>
  <div class="space-y-4 p-4 sm:space-y-5 sm:p-5">
    <!-- Top Header -->
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex items-center gap-2.5">
        <h1
          class="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
        >
          Gói Cước & Hạn Mức Dịch Vụ
        </h1>
        <Badge variant="secondary" class="font-mono text-xs uppercase">
          SaaS Plans
        </Badge>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          :disabled="loading"
          class="size-8 shrink-0"
          title="Làm mới"
          @click="loadPlans"
        >
          <RefreshCw
            class="size-3.5 shrink-0"
            :class="{ 'animate-spin': loading }"
          />
        </Button>
      </div>
    </div>

    <!-- Main Container -->
    <div
      class="rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm space-y-4"
    >
      <!-- Stats Bar -->
      <div
        class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4 text-xs"
      >
        <div class="flex items-center gap-2">
          <CreditCard class="size-4 text-muted-foreground" />
          <span class="text-sm font-semibold text-foreground">
            Danh Sách Gói Dịch Vụ
          </span>
          <span class="text-muted-foreground">({{ plans.length }} gói)</span>
        </div>

        <div class="flex items-center gap-3 text-muted-foreground font-mono">
          <span
            >{{ plans.filter((p) => p.is_active).length }} Đang kích hoạt</span
          >
        </div>
      </div>

      <!-- Desktop Table -->
      <div
        v-if="plans.length > 0"
        class="hidden md:block overflow-x-auto rounded-lg border border-border/60"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên Gói</TableHead>
              <TableHead>Giá Cước</TableHead>
              <TableHead>Hạn Mức Thành Viên</TableHead>
              <TableHead>Dung Lượng</TableHead>
              <TableHead>Lượt Chạy / Tháng</TableHead>
              <TableHead>Trạng Thái</TableHead>
              <TableHead class="text-right">Ngày Tạo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="p in plans" :key="p.id">
              <TableCell>
                <div class="flex items-center gap-2.5">
                  <div
                    class="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground"
                  >
                    <CreditCard class="size-4" />
                  </div>
                  <div>
                    <div class="font-medium text-foreground">
                      {{ p.name }}
                    </div>
                    <div class="font-mono text-xs text-muted-foreground">
                      {{ p.id }}
                    </div>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <div v-if="p.price_monthly_usd === 0">
                  <Badge variant="secondary" class="text-xs font-normal">
                    Miễn Phí
                  </Badge>
                </div>
                <div
                  v-else
                  class="font-semibold text-foreground text-sm font-mono"
                >
                  ${{ p.price_monthly_usd }}
                  <span class="text-xs font-normal text-muted-foreground"
                    >/tháng</span
                  >
                </div>
              </TableCell>

              <TableCell>
                <div
                  class="inline-flex items-center gap-1.5 text-xs text-foreground font-mono"
                >
                  <Users class="size-3.5 text-muted-foreground shrink-0" />
                  <span>{{ p.max_members }} users</span>
                </div>
              </TableCell>

              <TableCell>
                <div
                  class="inline-flex items-center gap-1.5 text-xs text-foreground font-mono"
                >
                  <HardDrive class="size-3.5 text-muted-foreground shrink-0" />
                  <span>{{ formatStorage(p.max_storage_mb) }}</span>
                </div>
              </TableCell>

              <TableCell>
                <div
                  class="inline-flex items-center gap-1.5 text-xs text-foreground font-mono"
                >
                  <Cpu class="size-3.5 text-muted-foreground shrink-0" />
                  <span>{{ p.max_monthly_runs.toLocaleString() }} runs</span>
                </div>
              </TableCell>

              <TableCell>
                <Badge variant="outline" class="text-xs font-normal">
                  <span
                    class="mr-1.5 size-1.5 rounded-full"
                    :class="p.is_active ? 'bg-success' : 'bg-muted-foreground'"
                  ></span>
                  {{ p.is_active ? 'Kích Hoạt' : 'Tạm Dừng' }}
                </Badge>
              </TableCell>

              <TableCell class="text-right text-xs text-muted-foreground">
                {{ formatDate(p.created_at) }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <!-- Mobile Touch Cards -->
      <div v-if="plans.length > 0" class="block space-y-3 md:hidden">
        <div
          v-for="p in plans"
          :key="p.id"
          class="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-3"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <div
                class="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground"
              >
                <CreditCard class="size-4.5" />
              </div>
              <div>
                <div class="font-semibold text-foreground text-sm">
                  {{ p.name }}
                </div>
                <div class="font-mono text-xs text-muted-foreground">
                  {{ p.id }}
                </div>
              </div>
            </div>

            <Badge variant="outline" class="text-xs font-normal">
              <span
                class="mr-1.5 size-1.5 rounded-full"
                :class="p.is_active ? 'bg-success' : 'bg-muted-foreground'"
              ></span>
              {{ p.is_active ? 'Kích Hoạt' : 'Tạm Dừng' }}
            </Badge>
          </div>

          <div
            class="flex items-baseline gap-1 font-mono text-base font-bold text-foreground"
          >
            <span v-if="p.price_monthly_usd === 0">Miễn Phí</span>
            <span v-else>${{ p.price_monthly_usd }} / tháng</span>
          </div>

          <div
            class="grid grid-cols-2 gap-2 text-xs font-mono text-muted-foreground"
          >
            <div class="flex items-center gap-1.5">
              <Users class="size-3 shrink-0" />
              <span>{{ p.max_members }} users</span>
            </div>
            <div class="flex items-center gap-1.5">
              <HardDrive class="size-3 shrink-0" />
              <span>{{ formatStorage(p.max_storage_mb) }}</span>
            </div>
            <div class="col-span-2 flex items-center gap-1.5">
              <Cpu class="size-3 shrink-0" />
              <span
                >{{ p.max_monthly_runs.toLocaleString() }} runs / tháng</span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="plans.length === 0 && !loading"
        class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-12 text-center"
      >
        <div
          class="flex size-12 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground"
        >
          <CreditCard class="size-6" />
        </div>
        <h3 class="mt-3 text-sm font-semibold text-foreground">
          Chưa có gói cước nào được tạo
        </h3>
        <p class="mt-1 max-w-sm text-xs text-muted-foreground">
          Các gói dịch vụ được khởi tạo và cấu hình từ plugin subscriptions của
          Tuquet Cloud.
        </p>
      </div>
    </div>
  </div>
</template>
