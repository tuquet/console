<script lang="ts" setup>
import type { FleetMetricsData } from '#/api';

import { CheckCircle2, Cpu, Laptop, Terminal } from '@lucide/vue';

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
    <div class="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-muted-foreground">
          Tổng Máy Trạm
        </span>
        <span
          class="flex size-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400"
        >
          <Laptop class="size-4.5" />
        </span>
      </div>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-3xl font-extrabold tracking-tight text-foreground">
          {{ props.metrics.total_nodes }}
        </span>
        <span class="text-xs font-semibold text-sky-400">Thiết bị</span>
      </div>
      <div class="mt-2 text-xs text-muted-foreground">
        Đã đăng ký vào hệ thống
      </div>
    </div>

    <!-- Metric 2: Online Nodes -->
    <div class="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-muted-foreground">
          Đang Trực Tuyến
        </span>
        <span
          class="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400"
        >
          <CheckCircle2 class="size-4.5" />
        </span>
      </div>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-3xl font-extrabold tracking-tight text-foreground">
          {{ props.metrics.online_nodes }}
        </span>
        <span class="text-xs font-semibold text-emerald-400">Sẵn sàng</span>
      </div>
      <div class="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
        <span class="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Nhận lệnh thực thi tự động</span>
      </div>
    </div>

    <!-- Metric 3: Active Jobs -->
    <div class="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-muted-foreground">
          Tác Vụ Đang Chạy
        </span>
        <span
          class="flex size-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400"
        >
          <Cpu class="size-4.5" />
        </span>
      </div>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-3xl font-extrabold tracking-tight text-foreground">
          {{ props.metrics.active_jobs }}
        </span>
        <span class="text-xs font-semibold text-indigo-400">Runner Jobs</span>
      </div>
      <div class="mt-2 text-xs text-muted-foreground">
        Tiến trình Win32 Job Object
      </div>
    </div>

    <!-- Metric 4: Loopback Daemon -->
    <div class="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-muted-foreground">
          Cổng Daemon Loopback
        </span>
        <span
          class="flex size-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400"
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
          class="inline-flex items-center gap-1 text-xs text-emerald-400"
        >
          <span class="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Online
        </span>
        <span v-else class="text-xs text-muted-foreground"> Chờ kết nối </span>
      </div>
      <div class="mt-2 font-mono text-xs text-muted-foreground">
        Specter Process Supervisor
      </div>
    </div>
  </div>
</template>
