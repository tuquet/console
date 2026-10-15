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
import { $t } from '#/locales';

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
              <Badge variant="secondary" class="text-xs font-medium">
                ${{ subscription?.plan?.price_monthly_usd || 0 }}/{{
                  $t('page.tenants_view.per_month')
                }}
              </Badge>
            </div>
            <p class="text-xs text-muted-foreground mt-0.5">
              {{
                subscription?.plan?.description ||
                $t('page.tenants_view.default_plan_desc')
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
            >{{ $t('page.tenants_view.period_end') }}:
            <strong class="text-foreground">{{
              formatDateOnly(subscription.current_period_end)
            }}</strong></span
          >
        </div>
      </div>
    </div>

    <!-- Resource Quotas Progress Grid -->
    <div class="grid grid-cols-2 gap-2.5 sm:gap-4">
      <!-- Metric 1: Members -->
      <div
        class="rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm space-y-3"
      >
        <div class="flex items-center justify-between">
          <div
            class="flex items-center gap-2 text-sm font-medium text-foreground"
          >
            <Users class="size-4 text-muted-foreground" />
            <span>{{ $t('page.tenants_view.quota_members_title') }}</span>
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
        <div class="text-xs text-muted-foreground">
          {{
            $t('page.tenants_view.quota_members_desc', {
              percent: membersPercent,
            })
          }}
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
            <span>{{ $t('page.tenants_view.quota_devices_title') }}</span>
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
        <div class="text-xs text-muted-foreground">
          {{
            $t('page.tenants_view.quota_devices_desc', {
              percent: devicesPercent,
            })
          }}
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
            <span>{{ $t('page.tenants_view.quota_storage_title') }}</span>
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
        <div class="text-xs text-muted-foreground">
          {{ $t('page.tenants_view.quota_storage_desc') }}
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
            <span>{{ $t('page.tenants_view.quota_runs_title') }}</span>
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
        <div class="text-xs text-muted-foreground">
          {{ $t('page.tenants_view.quota_runs_desc') }}
        </div>
      </div>
    </div>
  </div>
</template>
