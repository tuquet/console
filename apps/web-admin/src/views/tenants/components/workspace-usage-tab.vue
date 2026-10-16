<script lang="ts" setup>
import type { WorkspaceSubscription, WorkspaceUsageQuota } from '#/api';

import { computed } from 'vue';

import { Calendar, Cpu, HardDrive, PlayCircle, Users } from '@lucide/vue';
import { Progress } from '@tuquet/vue-ui';

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
    <!-- Billing Cycle Context Strip -->
    <div
      v-if="subscription?.current_period_end"
      class="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-muted/20 px-3.5 py-2 text-xs text-muted-foreground"
    >
      <span>{{ $t('page.tenants_view.default_plan_desc') }}</span>
      <span class="inline-flex shrink-0 items-center gap-1.5">
        <Calendar class="size-3.5" />
        <span
          >{{ $t('page.tenants_view.period_end') }}:
          <strong class="text-foreground">{{
            formatDateOnly(subscription.current_period_end)
          }}</strong></span
        >
      </span>
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

        <Progress :model-value="membersPercent" class="h-2" />
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

        <Progress :model-value="devicesPercent" class="h-2" />
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

        <Progress :model-value="storagePercent" class="h-2" />
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

        <Progress :model-value="runsPercent" class="h-2" />
        <div class="text-xs text-muted-foreground">
          {{ $t('page.tenants_view.quota_runs_desc') }}
        </div>
      </div>
    </div>
  </div>
</template>
