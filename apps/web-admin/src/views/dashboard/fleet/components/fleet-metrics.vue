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
    <div class="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-muted-foreground">
          Tổng Máy Trạm
        </span>
        <span
          class="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground"
        >
          <Laptop class="size-4.5" />
        </span>
      </div>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-3xl font-extrabold tracking-tight text-foreground">
          {{ props.metrics.total_nodes }}
        </span>
        <span class="text-xs font-semibold text-muted-foreground"
          >Thiết bị</span
        >
      </div>
      <div class="mt-2 text-xs text-muted-foreground">
        Đã đăng ký vào hệ thống
      </div>
    </div>

    <!-- Metric 2: Online Nodes -->
    <div class="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-muted-foreground">
          Đang Trực Tuyến
        </span>
        <span
          class="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground"
        >
          <CheckCircle2 class="size-4.5 text-emerald-500" />
        </span>
      </div>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-3xl font-extrabold tracking-tight text-foreground">
          {{ props.metrics.online_nodes }}
        </span>
        <span class="text-xs font-semibold text-muted-foreground"
          >Sẵn sàng</span
        >
      </div>
      <div class="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span
          class="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0"
        ></span>
        <span>Nhận lệnh thực thi tự động</span>
      </div>
    </div>

    <!-- Metric 3: Active Jobs -->
    <div class="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-muted-foreground">
          Tác Vụ Đang Chạy
        </span>
        <span
          class="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground"
        >
          <Cpu class="size-4.5" />
        </span>
      </div>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-3xl font-extrabold tracking-tight text-foreground">
          {{ props.metrics.active_jobs }}
        </span>
        <span class="text-xs font-semibold text-muted-foreground"
          >Runner Jobs</span
        >
      </div>
      <div class="mt-2 text-xs text-muted-foreground">
        Tiến trình Win32 Job Object
      </div>
    </div>

    <!-- Metric 4: Loopback Daemon -->
    <div class="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-muted-foreground">
          Cổng Daemon Loopback
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
            class="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0"
          ></span>
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
