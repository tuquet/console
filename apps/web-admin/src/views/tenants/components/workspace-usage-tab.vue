<script lang="ts" setup>
import type { WorkspaceSubscription, WorkspaceUsageQuota } from '#/api';

import { computed } from 'vue';

import {
  Calendar,
  Cpu,
  CreditCard,
  HardDrive,
  PlayCircle,
  Users,
} from '@lucide/vue';
import { Badge } from '@tuquet/vue-ui';

import { useDateFormat } from '#/composables';

interface Props {
  quota: WorkspaceUsageQuota;
  subscription: null | WorkspaceSubscription;
}

const props = defineProps<Props>();
const { formatDateOnly } = useDateFormat();

function calculatePercent(used: number, max: number): number {
  if (!max || max <= 0) return 0;
  return Math.min(100, Math.round((used / max) * 100));
}

const membersPercent = computed(() =>
  calculatePercent(props.quota.used_members, props.quota.max_members),
);

const devicesPercent = computed(() =>
  calculatePercent(props.quota.used_devices, props.quota.max_devices),
);

const storagePercent = computed(() =>
  calculatePercent(props.quota.used_storage_mb, props.quota.max_storage_mb),
);

const runsPercent = computed(() =>
  calculatePercent(props.quota.used_monthly_runs, props.quota.max_monthly_runs),
);
</script>

<template>
  <div class="space-y-4">
    <!-- Plan Summary Card -->
    <div
      class="rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm"
    >
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div class="flex items-center gap-3">
          <div
            class="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <CreditCard class="size-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-base font-semibold text-foreground">
                {{ quota.plan_name }}
              </span>
              <Badge variant="secondary" class="text-xs uppercase font-medium">
                ${{ subscription?.plan?.price_monthly_usd || 0 }}/tháng
              </Badge>
            </div>
            <p class="text-xs text-muted-foreground mt-0.5">
              {{
                subscription?.plan?.description ||
                'Hạn mức tài nguyên được phân bổ tự động theo gói thuê bao Cloud'
              }}
            </p>
          </div>
        </div>

        <div
          v-if="subscription?.current_period_end"
          class="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg self-start sm:self-auto"
        >
          <Calendar class="size-3.5" />
          <span
            >Hết hạn chu kỳ:
            <strong class="text-foreground">{{
              formatDateOnly(subscription.current_period_end)
            }}</strong></span
          >
        </div>
      </div>
    </div>

    <!-- Resource Quotas Progress Grid -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <!-- Metric 1: Members -->
      <div
        class="rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm space-y-3"
      >
        <div class="flex items-center justify-between">
          <div
            class="flex items-center gap-2 text-sm font-medium text-foreground"
          >
            <Users class="size-4 text-muted-foreground" />
            <span>Thành Viên Workspace</span>
          </div>
          <span class="text-xs font-medium text-foreground">
            {{ quota.used_members }} / {{ quota.max_members }}
          </span>
        </div>

        <div class="h-2 w-full overflow-hidden rounded-full bg-muted/60">
          <div
            class="h-full rounded-full transition-all"
            :class="membersPercent >= 90 ? 'bg-destructive' : 'bg-primary'"
            :style="{ width: `${membersPercent}%` }"
          ></div>
        </div>
        <div class="text-[11px] text-muted-foreground">
          Đã sử dụng {{ membersPercent }}% hạn mức thành viên được phân bổ
        </div>
      </div>

      <!-- Metric 2: Runner Devices -->
      <div
        class="rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm space-y-3"
      >
        <div class="flex items-center justify-between">
          <div
            class="flex items-center gap-2 text-sm font-medium text-foreground"
          >
            <Cpu class="size-4 text-muted-foreground" />
            <span>Runner Devices Kết Nối</span>
          </div>
          <span class="text-xs font-medium text-foreground">
            {{ quota.used_devices }} / {{ quota.max_devices }}
          </span>
        </div>

        <div class="h-2 w-full overflow-hidden rounded-full bg-muted/60">
          <div
            class="h-full rounded-full transition-all"
            :class="devicesPercent >= 90 ? 'bg-destructive' : 'bg-primary'"
            :style="{ width: `${devicesPercent}%` }"
          ></div>
        </div>
        <div class="text-[11px] text-muted-foreground">
          Đã kết nối {{ devicesPercent }}% số lượng node Runner cho phép
        </div>
      </div>

      <!-- Metric 3: Storage -->
      <div
        class="rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm space-y-3"
      >
        <div class="flex items-center justify-between">
          <div
            class="flex items-center gap-2 text-sm font-medium text-foreground"
          >
            <HardDrive class="size-4 text-muted-foreground" />
            <span>Dung Lượng Lưu Trữ</span>
          </div>
          <span class="text-xs font-medium text-foreground">
            {{ quota.used_storage_mb }} MB / {{ quota.max_storage_mb }} MB
          </span>
        </div>

        <div class="h-2 w-full overflow-hidden rounded-full bg-muted/60">
          <div
            class="h-full rounded-full transition-all"
            :class="storagePercent >= 90 ? 'bg-destructive' : 'bg-primary'"
            :style="{ width: `${storagePercent}%` }"
          ></div>
        </div>
        <div class="text-[11px] text-muted-foreground">
          Lưu trữ artifacts, run profiles và media assets của workspace
        </div>
      </div>

      <!-- Metric 4: Monthly Runs -->
      <div
        class="rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm space-y-3"
      >
        <div class="flex items-center justify-between">
          <div
            class="flex items-center gap-2 text-sm font-medium text-foreground"
          >
            <PlayCircle class="size-4 text-muted-foreground" />
            <span>Lượt Chạy Hàng Tháng</span>
          </div>
          <span class="text-xs font-medium text-foreground">
            {{ quota.used_monthly_runs }} / {{ quota.max_monthly_runs }}
          </span>
        </div>

        <div class="h-2 w-full overflow-hidden rounded-full bg-muted/60">
          <div
            class="h-full rounded-full transition-all"
            :class="runsPercent >= 90 ? 'bg-destructive' : 'bg-primary'"
            :style="{ width: `${runsPercent}%` }"
          ></div>
        </div>
        <div class="text-[11px] text-muted-foreground">
          Số lần kích hoạt chiến dịch và workflow tự động trong chu kỳ hiện tại
        </div>
      </div>
    </div>
  </div>
</template>
