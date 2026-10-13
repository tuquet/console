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
    toast.error(error.message || 'Không thể tải dữ liệu telemetry');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadAnalytics();
});
</script>

<template>
  <div class="space-y-4 p-4 sm:space-y-5 sm:p-5">
    <!-- Top Header: Streamlined, Flat & Compact -->
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex items-center gap-2.5">
        <h1
          class="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
        >
          Giám Sát Nền Tảng
        </h1>
        <Badge variant="outline" class="font-mono text-xs uppercase">
          Live Telemetry
        </Badge>
      </div>

      <div class="flex items-center shrink-0">
        <Button
          :disabled="loading"
          variant="outline"
          size="icon"
          class="size-8 shrink-0"
          title="Làm mới"
          @click="loadAnalytics"
        >
          <RefreshCw class="size-3.5" :class="{ 'animate-spin': loading }" />
        </Button>
      </div>
    </div>

    <!-- 4 Platform Metric Cards: Mobile-First Grid -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <!-- Metric 1: Workspaces -->
      <div
        class="rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-border"
      >
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">
            Tổng Workspace
          </span>
          <span
            class="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground"
          >
            <Building2 class="size-4.5" />
          </span>
        </div>
        <div class="mt-3 flex items-baseline gap-2">
          <span class="text-2xl font-bold tracking-tight text-foreground">
            {{ analyticsData.tenants.total }}
          </span>
          <span
            class="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"
          >
            <span class="size-1.5 rounded-full bg-success"></span>
            {{ analyticsData.tenants.activeCount }} Đang hoạt động
          </span>
        </div>
        <div class="mt-2 text-xs text-muted-foreground">
          Phân bổ:
          <span class="font-medium text-foreground">
            {{ analyticsData.tenants.planBreakdown.pro }} Pro
          </span>
          •
          <span class="font-medium text-foreground">
            {{ analyticsData.tenants.planBreakdown.free }} Free
          </span>
        </div>
      </div>

      <!-- Metric 2: System Plugins -->
      <div
        class="rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-border"
      >
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">
            Plugin Hệ Thống
          </span>
          <span
            class="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground"
          >
            <Layers class="size-4.5" />
          </span>
        </div>
        <div class="mt-3 flex items-baseline gap-2">
          <span class="text-2xl font-bold tracking-tight text-foreground">
            {{ analyticsData.plugins.total }}
          </span>
          <span class="text-xs font-medium text-muted-foreground">
            Dịch vụ Sẵn sàng
          </span>
        </div>
        <div class="mt-2 text-xs text-muted-foreground">
          Gồm:
          <span class="font-medium text-foreground">
            {{ analyticsData.plugins.coreCount }} Core Kernel
          </span>
          và các Module mở rộng
        </div>
      </div>

      <!-- Metric 3: Fleet CLI Daemon -->
      <div
        class="rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-border"
      >
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">
            Fleet Bridge
          </span>
          <span
            class="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground"
          >
            <Terminal class="size-4.5" />
          </span>
        </div>
        <div class="mt-3 flex items-baseline gap-2">
          <span class="text-2xl font-bold tracking-tight text-foreground">
            Sẵn Sàng
          </span>
          <span
            class="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span class="size-2 rounded-full bg-success animate-pulse"></span>
            Online
          </span>
        </div>
        <div class="mt-2 font-mono text-xs text-muted-foreground">
          Cổng SSO Loopback:
          <span class="font-semibold text-foreground">
            :{{ analyticsData.fleet.loopbackPort }}
          </span>
        </div>
      </div>

      <!-- Metric 4: API Edge Latency -->
      <div
        class="rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-border"
      >
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">
            Độ trễ API Edge
          </span>
          <span
            class="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground"
          >
            <Activity class="size-4.5" />
          </span>
        </div>
        <div class="mt-3 flex items-baseline gap-2">
          <span class="text-2xl font-bold tracking-tight text-foreground">
            {{ analyticsData.system.latencyMs }}
          </span>
          <span class="text-sm font-medium text-muted-foreground">ms</span>
        </div>
        <div
          class="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <CheckCircle2 class="size-3.5 text-success" />
          <span>Cloudflare Anycast & Supabase Khỏe mạnh</span>
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
            Tăng Trưởng Workspace
          </h2>
          <Badge variant="secondary" class="text-xs">
            Tổng: {{ analyticsData.tenants.total }}
          </Badge>
        </div>

        <div
          v-if="loading"
          class="flex h-64 items-center justify-center sm:h-80"
        >
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 class="size-5 animate-spin text-primary" />
            <span>Đang tải dữ liệu biểu đồ...</span>
          </div>
        </div>
        <GrowthChart v-else :data="analyticsData.tenants.growth" />
      </div>

      <!-- Subscription Plans Donut (1 col on lg) -->
      <div
        class="overflow-hidden rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm"
      >
        <div class="mb-4">
          <h2 class="text-base font-semibold text-foreground">
            Phân Bổ Gói Dịch Vụ
          </h2>
        </div>

        <div
          v-if="loading"
          class="flex h-64 items-center justify-center sm:h-80"
        >
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 class="size-5 animate-spin text-primary" />
            <span>Đang tải...</span>
          </div>
        </div>
        <PlansChart v-else :data="analyticsData.tenants.planBreakdown" />
      </div>
    </div>

    <!-- Charts Row 2: Plugins Ecosystem & Infrastructure Health -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Plugins Distribution -->
      <div
        class="overflow-hidden rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm"
      >
        <div class="mb-4">
          <h2 class="text-base font-semibold text-foreground">
            Phân Loại Plugin
          </h2>
        </div>

        <div
          v-if="loading"
          class="flex h-64 items-center justify-center sm:h-80"
        >
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 class="size-5 animate-spin text-primary" />
            <span>Đang tải...</span>
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
            Trạng Thái Dịch Vụ Cốt Lõi
          </h2>
        </div>

        <div class="divide-y divide-border/40">
          <div class="flex items-center justify-between py-3">
            <div>
              <div class="font-medium text-foreground">
                Tuquet Cloud Database
              </div>
              <div class="text-xs text-muted-foreground">
                PostgreSQL Multi-Tenant via Supabase
              </div>
            </div>
            <Badge variant="secondary" class="text-xs font-normal">
              <span class="mr-1.5 size-1.5 rounded-full bg-success"></span>
              HOẠT ĐỘNG TỐT
            </Badge>
          </div>

          <div class="flex items-center justify-between py-3">
            <div>
              <div class="font-medium text-foreground">
                Global CDN & Edge Delivery
              </div>
              <div class="text-xs text-muted-foreground">
                {{ analyticsData.system.edgeProvider }}
              </div>
            </div>
            <Badge variant="secondary" class="text-xs font-normal">
              <span class="mr-1.5 size-1.5 rounded-full bg-success"></span>
              ONLINE
            </Badge>
          </div>

          <div class="flex items-center justify-between py-3">
            <div>
              <div class="font-medium text-foreground">Desktop Bridge</div>
              <div class="text-xs text-muted-foreground">
                SSO Loopback Daemon (:8765)
              </div>
            </div>
            <Badge variant="secondary" class="text-xs font-normal">
              <span class="mr-1.5 size-1.5 rounded-full bg-primary"></span>
              SẴN SÀNG GHÉP NỐI
            </Badge>
          </div>

          <div class="flex items-center justify-between py-3">
            <div>
              <div class="font-medium text-foreground">
                Core Authentication & IAM
              </div>
              <div class="text-xs text-muted-foreground">
                Plugin: core-iam (Schema: public)
              </div>
            </div>
            <Badge variant="secondary" class="text-xs font-normal">
              <span class="mr-1.5 size-1.5 rounded-full bg-success"></span>
              ACTIVE
            </Badge>
          </div>

          <div class="flex items-center justify-between py-3">
            <div>
              <div class="font-medium text-foreground">
                Runners Execution Engine
              </div>
              <div class="text-xs text-muted-foreground">
                Plugin: runners (Schema: runners)
              </div>
            </div>
            <Badge variant="secondary" class="text-xs font-normal">
              <span class="mr-1.5 size-1.5 rounded-full bg-success"></span>
              ACTIVE
            </Badge>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
