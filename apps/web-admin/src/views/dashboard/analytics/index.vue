<script lang="ts" setup>
import type { RealAnalyticsData } from '#/api';

import { onMounted, ref } from 'vue';

import {
  Activity,
  Building2,
  CheckCircle2,
  Layers,
  Loader2,
  RefreshCw,
  Terminal,
} from '@lucide/vue';
import { Badge, Button, toast } from '@tuquet/vue-ui';

import { getRealAnalyticsDataApi } from '#/api';
import { $t } from '#/locales';

import GrowthChart from './growth-chart.vue';
import PlansChart from './plans-chart.vue';
import PluginsChart from './plugins-chart.vue';

defineOptions({ name: 'Analytics' });

const loading = ref(true);
const analyticsData = ref<RealAnalyticsData>({
  fleet: { loopbackPort: 8765, status: 'ready' },
  plugins: { coreCount: 0, items: [], moduleCount: 0, total: 0 },
  system: {
    edgeProvider: 'Cloudflare Pages',
    latencyMs: 20,
    status: 'healthy',
  },
  tenants: {
    activeCount: 0,
    growth: [],
    items: [],
    planBreakdown: { enterprise: 0, free: 0, pro: 0 },
    total: 0,
  },
});

async function loadAnalytics() {
  loading.value = true;
  try {
    const data = await getRealAnalyticsDataApi();
    analyticsData.value = data;
  } catch (error: any) {
    toast.error(error.message || $t('common.error'));
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadAnalytics();
});
</script>

<template>
  <div class="space-y-3 p-3 sm:space-y-5 sm:p-5">
    <!-- Top Header: Streamlined, Flat & Compact -->
    <div class="flex items-center justify-between gap-2">
      <div class="min-w-0">
        <h1
          class="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl"
        >
          {{ $t('page.analytics.title') }}
        </h1>
        <p class="hidden text-xs text-muted-foreground sm:block">
          {{ $t('page.analytics.badge') }}
        </p>
      </div>

      <div class="flex items-center shrink-0">
        <Button
          :disabled="loading"
          variant="outline"
          size="icon"
          class="size-8 shrink-0"
          :title="$t('common.refresh')"
          @click="loadAnalytics"
        >
          <RefreshCw class="size-3.5" :class="{ 'animate-spin': loading }" />
        </Button>
      </div>
    </div>

    <!-- 4 Platform Metric Cards: Clean 2-Row Executive KPI Strip -->
    <div class="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
      <!-- Metric 1: Workspaces -->
      <div
        data-testid="kpi-card-workspaces"
        class="rounded-xl border border-border/60 bg-card p-3.5 sm:p-4 shadow-xs transition-all hover:border-border"
      >
        <div class="flex items-center justify-between gap-2">
          <span
            class="truncate text-xs sm:text-sm font-medium text-muted-foreground"
          >
            {{ $t('page.analytics.total_workspaces') }}
          </span>
          <span
            class="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground"
          >
            <Building2 class="size-4" />
          </span>
        </div>
        <div class="mt-2.5 flex items-baseline justify-between gap-2">
          <span
            data-testid="kpi-workspaces-total"
            class="font-mono text-xl sm:text-2xl font-bold tracking-tight text-foreground"
          >
            {{ analyticsData.tenants.total }}
          </span>
          <span
            data-testid="kpi-workspaces-status"
            class="inline-flex items-center gap-1.5 truncate rounded-full border border-border/60 bg-muted/30 px-2 py-0.5 text-2xs font-medium text-muted-foreground"
          >
            <span class="size-1.5 shrink-0 rounded-full bg-success"></span>
            <span class="truncate">{{
              analyticsData.tenants.activeCount === analyticsData.tenants.total
                ? $t('page.analytics.active_workspaces')
                : `${analyticsData.tenants.activeCount}/${analyticsData.tenants.total} ${$t('page.analytics.active_workspaces')}`
            }}</span>
          </span>
        </div>
      </div>

      <!-- Metric 2: System Plugins -->
      <div
        data-testid="kpi-card-plugins"
        class="rounded-xl border border-border/60 bg-card p-3.5 sm:p-4 shadow-xs transition-all hover:border-border"
      >
        <div class="flex items-center justify-between gap-2">
          <span
            class="truncate text-xs sm:text-sm font-medium text-muted-foreground"
          >
            {{ $t('page.analytics.system_plugins') }}
          </span>
          <span
            class="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground"
          >
            <Layers class="size-4" />
          </span>
        </div>
        <div class="mt-2.5 flex items-baseline justify-between gap-2">
          <span
            data-testid="kpi-plugins-total"
            class="font-mono text-xl sm:text-2xl font-bold tracking-tight text-foreground"
          >
            {{ analyticsData.plugins.total }}
          </span>
          <span
            class="inline-flex items-center gap-1.5 truncate rounded-full border border-border/60 bg-muted/30 px-2 py-0.5 text-2xs font-medium text-muted-foreground"
          >
            <span class="size-1.5 shrink-0 rounded-full bg-primary"></span>
            <span class="truncate">{{ $t('page.analytics.ready') }}</span>
          </span>
        </div>
      </div>

      <!-- Metric 3: Fleet CLI Daemon -->
      <div
        data-testid="kpi-card-fleet"
        class="rounded-xl border border-border/60 bg-card p-3.5 sm:p-4 shadow-xs transition-all hover:border-border"
      >
        <div class="flex items-center justify-between gap-2">
          <span
            class="truncate text-xs sm:text-sm font-medium text-muted-foreground"
          >
            {{ $t('page.analytics.fleet_bridge') }}
          </span>
          <span
            class="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground"
          >
            <Terminal class="size-4" />
          </span>
        </div>
        <div class="mt-2.5 flex items-baseline justify-between gap-2">
          <span
            data-testid="kpi-fleet-port"
            class="font-mono text-xl sm:text-2xl font-bold tracking-tight text-foreground"
          >
            :{{ analyticsData.fleet.loopbackPort }}
          </span>
          <span
            class="inline-flex items-center gap-1.5 truncate rounded-full border border-border/60 bg-muted/30 px-2 py-0.5 text-2xs font-medium text-muted-foreground"
          >
            <span
              class="size-1.5 shrink-0 animate-pulse rounded-full bg-success"
            ></span>
            <span class="truncate">{{ $t('page.analytics.online') }}</span>
          </span>
        </div>
      </div>

      <!-- Metric 4: API Edge Latency -->
      <div
        data-testid="kpi-card-latency"
        class="rounded-xl border border-border/60 bg-card p-3.5 sm:p-4 shadow-xs transition-all hover:border-border"
      >
        <div class="flex items-center justify-between gap-2">
          <span
            class="truncate text-xs sm:text-sm font-medium text-muted-foreground"
          >
            {{ $t('page.analytics.api_latency') }}
          </span>
          <span
            class="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground"
          >
            <Activity class="size-4" />
          </span>
        </div>
        <div class="mt-2.5 flex items-baseline justify-between gap-2">
          <span
            data-testid="kpi-latency-ms"
            class="font-mono text-xl sm:text-2xl font-bold tracking-tight text-foreground"
          >
            {{ analyticsData.system.latencyMs
            }}<span
              class="ml-0.5 font-sans text-xs font-medium text-muted-foreground"
              >ms</span
            >
          </span>
          <span
            class="inline-flex items-center gap-1 truncate rounded-full border border-border/60 bg-muted/30 px-2 py-0.5 text-2xs font-medium text-muted-foreground"
          >
            <CheckCircle2 class="size-3 shrink-0 text-success" />
            <span class="truncate">{{ $t('page.analytics.operational') }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Charts Row 1: Growth Timeline & Plans Breakdown -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Growth Timeline (2 cols on lg) -->
      <div
        class="overflow-hidden rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm lg:col-span-2"
      >
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-base font-semibold text-foreground">
            {{ $t('page.analytics.growth_timeline') }}
          </h2>
          <span class="text-xs text-muted-foreground">
            {{ $t('page.analytics.weekly_updates') }}
          </span>
        </div>
        <div
          v-if="loading"
          class="flex h-[260px] items-center justify-center text-sm text-muted-foreground"
        >
          <div class="flex items-center gap-2">
            <Loader2 class="size-5 animate-spin text-primary" />
            <span>{{ $t('common.loading') }}</span>
          </div>
        </div>
        <GrowthChart v-else :data="analyticsData.tenants.growth" />
      </div>

      <!-- Plan Distribution Donut Chart -->
      <div
        class="rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm"
      >
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-base font-semibold text-foreground">
            {{ $t('page.analytics.plans_structure') }}
          </h2>
          <span class="text-xs text-muted-foreground">
            {{ $t('page.analytics.actual') }}
          </span>
        </div>
        <div
          v-if="loading"
          class="flex h-[260px] items-center justify-center text-sm text-muted-foreground"
        >
          <div class="flex items-center gap-2">
            <Loader2 class="size-5 animate-spin text-primary" />
            <span>{{ $t('common.loading') }}</span>
          </div>
        </div>
        <PlansChart v-else :data="analyticsData.tenants.planBreakdown" />
      </div>
    </div>

    <!-- Charts Row 2: Plugins Core vs Module Chart & Infrastructure Status -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Plugins Breakdown (2 cols on lg) -->
      <div
        class="rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm lg:col-span-2"
      >
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-base font-semibold text-foreground">
            {{ $t('page.analytics.plugins_distribution') }}
          </h2>
          <span class="text-xs text-muted-foreground">
            {{ $t('page.analytics.actual') }}
          </span>
        </div>
        <div
          v-if="loading"
          class="flex h-[220px] items-center justify-center text-sm text-muted-foreground"
        >
          <div class="flex items-center gap-2">
            <Loader2 class="size-5 animate-spin text-primary" />
            <span>{{ $t('common.loading') }}</span>
          </div>
        </div>
        <PluginsChart
          v-else
          :core-count="analyticsData.plugins.coreCount"
          :module-count="analyticsData.plugins.moduleCount"
        />
      </div>

      <!-- Infrastructure Status List -->
      <div
        class="rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm"
      >
        <div class="mb-4">
          <h2 class="text-base font-semibold text-foreground">
            {{ $t('page.analytics.services_title') }}
          </h2>
        </div>

        <div class="divide-y divide-border/40">
          <div class="flex items-center justify-between py-3">
            <div>
              <div class="font-medium text-foreground">
                {{ $t('page.analytics.service_database') }}
              </div>
              <div class="text-xs text-muted-foreground">
                {{ $t('page.analytics.service_database_desc') }}
              </div>
            </div>
            <Badge variant="secondary" class="text-xs font-normal">
              <span class="mr-1.5 size-1.5 rounded-full bg-success"></span>
              {{ $t('page.analytics.operational') }}
            </Badge>
          </div>

          <div class="flex items-center justify-between py-3">
            <div>
              <div class="font-medium text-foreground">
                {{ $t('page.analytics.edge_delivery') }}
              </div>
              <div class="text-xs text-muted-foreground">
                {{ analyticsData.system.edgeProvider }}
              </div>
            </div>
            <Badge variant="secondary" class="text-xs font-normal">
              <span class="mr-1.5 size-1.5 rounded-full bg-success"></span>
              {{ $t('page.analytics.online') }}
            </Badge>
          </div>

          <div class="flex items-center justify-between py-3">
            <div>
              <div class="font-medium text-foreground">
                {{ $t('page.analytics.service_gateway') }}
              </div>
              <div class="text-xs text-muted-foreground">
                {{ $t('page.analytics.service_gateway_desc') }}
              </div>
            </div>
            <Badge variant="secondary" class="text-xs font-normal">
              <span class="mr-1.5 size-1.5 rounded-full bg-success"></span>
              {{ $t('page.analytics.operational') }}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
