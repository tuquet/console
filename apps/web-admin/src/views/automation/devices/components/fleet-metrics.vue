<script lang="ts" setup>
import type { FleetMetricsData } from '#/api';

import { CheckCircle2, Cpu, Laptop, Terminal } from '@lucide/vue';

import { $t } from '#/locales';

interface Props {
  loading?: boolean;
  metrics: FleetMetricsData;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});
</script>

<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <!-- Metric 1: Total Nodes -->
    <div class="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-muted-foreground">
          {{ $t('page.fleet_view.metric_total_nodes') }}
        </span>
        <span
          class="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground"
        >
          <Laptop class="size-4.5" />
        </span>
      </div>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-2xl font-bold tracking-tight text-foreground">
          {{ props.metrics.total_nodes }}
        </span>
        <span class="text-xs font-medium text-muted-foreground">
          {{ $t('page.fleet_view.metric_devices_unit') }}
        </span>
      </div>
      <div class="mt-2 text-xs text-muted-foreground">
        {{ $t('page.fleet_view.metric_registered_desc') }}
      </div>
    </div>

    <!-- Metric 2: Online Nodes -->
    <div class="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-muted-foreground">
          {{ $t('page.fleet_view.metric_online_nodes') }}
        </span>
        <span
          class="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground"
        >
          <CheckCircle2 class="size-4.5 text-success" />
        </span>
      </div>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-2xl font-bold tracking-tight text-foreground">
          {{ props.metrics.online_nodes }}
        </span>
        <span class="text-xs font-medium text-muted-foreground">
          {{ $t('page.fleet_view.metric_ready_unit') }}
        </span>
      </div>
      <div class="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span
          class="size-2 rounded-full bg-success animate-pulse shrink-0"
        ></span>
        <span>{{ $t('page.fleet_view.metric_auto_exec_desc') }}</span>
      </div>
    </div>

    <!-- Metric 3: Active Jobs -->
    <div class="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-muted-foreground">
          {{ $t('page.fleet_view.metric_active_jobs') }}
        </span>
        <span
          class="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground"
        >
          <Cpu class="size-4.5" />
        </span>
      </div>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-2xl font-bold tracking-tight text-foreground">
          {{ props.metrics.active_jobs }}
        </span>
        <span class="text-xs font-medium text-muted-foreground">
          {{ $t('page.fleet_view.metric_jobs_unit') }}
        </span>
      </div>
      <div class="mt-2 text-xs text-muted-foreground">
        {{ $t('page.fleet_view.metric_active_jobs_desc') }}
      </div>
    </div>

    <!-- Metric 4: Loopback Daemon -->
    <div class="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-muted-foreground">
          {{ $t('page.fleet_view.metric_loopback_port') }}
        </span>
        <span
          class="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground"
        >
          <Terminal class="size-4.5" />
        </span>
      </div>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-2xl font-bold tracking-tight text-foreground">
          :{{ props.metrics.loopback_port }}
        </span>
        <span
          v-if="props.metrics.loopback_online"
          class="inline-flex items-center gap-1.5 text-xs text-foreground"
        >
          <span
            class="size-2 rounded-full bg-success animate-pulse shrink-0"
          ></span>
          {{ $t('page.fleet_view.online') }}
        </span>
        <span v-else class="text-xs text-muted-foreground">
          {{ $t('page.fleet_view.standby') }}
        </span>
      </div>
      <div class="mt-2 font-mono text-xs text-muted-foreground">
        {{ $t('page.fleet_view.process_supervisor') }}
      </div>
    </div>
  </div>
</template>
