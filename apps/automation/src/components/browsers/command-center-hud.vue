<script setup lang="ts">
import type { BrowserSseStatus } from '../../stores/browsers';

import { computed, ref, watch } from 'vue';

import { Badge, Button } from '@operon-core/shadcn-ui';
import { cn } from '@operon-core/shared/utils';

import {
  Activity,
  Cpu,
  FileSpreadsheet,
  Loader2,
  OctagonX,
  PanelRight,
  Plus,
  Radar,
  RefreshCw,
} from '@lucide/vue';

import { $t } from '../../locales';

const props = defineProps<{
  activeDownloadPercent?: null | number;
  activeDriverVersion?: string;
  daemonHealthy: boolean;
  killingAll: boolean;
  loading: boolean;
  runningCount: number;
  showTelemetryRail: boolean;
  sseStatus: BrowserSseStatus;
}>();

const emit = defineEmits<{
  importCsv: [];
  killAll: [];
  newProfile: [];
  openDrivers: [];
  reconnectSse: [];
  refresh: [];
  toggleTelemetryRail: [];
}>();

const confirmKillAll = ref(false);

watch(
  () => props.runningCount,
  (count) => {
    if (count === 0) {
      confirmKillAll.value = false;
    }
  },
);

const sseBadgeConfig = computed(() => {
  if (!props.daemonHealthy || props.sseStatus === 'error') {
    return {
      dotClass: 'bg-destructive',
      label: $t('automation.browsers.cmd_sse_offline'),
      ping: false,
      variant: 'outline' as const,
    };
  }
  if (props.sseStatus === 'open') {
    return {
      dotClass: 'bg-emerald-500',
      label: $t('automation.browsers.cmd_sse_live'),
      ping: true,
      variant: 'secondary' as const,
    };
  }
  return {
    dotClass: 'bg-amber-500',
    label: $t('automation.browsers.cmd_sse_connecting'),
    ping: false,
    variant: 'outline' as const,
  };
});

function handleKillAllClick() {
  if (!confirmKillAll.value) {
    confirmKillAll.value = true;
    return;
  }
  confirmKillAll.value = false;
  emit('killAll');
}
</script>

<template>
  <div class="flex flex-col gap-2.5">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex min-w-0 flex-wrap items-center gap-2">
        <Radar class="text-primary size-4 shrink-0" />
        <h2 class="text-base font-semibold tracking-tight">
          {{ $t('automation.browsers.cmd_title') }}
        </h2>

        <button
          type="button"
          class="inline-flex items-center focus:outline-none"
          :title="$t('automation.browsers.cmd_sse_title')"
          @click="emit('reconnectSse')"
        >
          <Badge :variant="sseBadgeConfig.variant" class="gap-1.5">
            <span class="relative flex size-2">
              <span
                v-if="sseBadgeConfig.ping"
                class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
              ></span>
              <span
                :class="
                  cn(
                    'relative inline-flex size-2 rounded-full',
                    sseBadgeConfig.dotClass,
                  )
                "
              ></span>
            </span>
            <span>{{ sseBadgeConfig.label }}</span>
          </Badge>
        </button>

        <Badge
          v-if="runningCount > 0"
          variant="outline"
          class="border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
        >
          <Activity class="size-3" />
          <span>
            {{
              $t('automation.browsers.cmd_fleet_running', {
                count: runningCount,
              })
            }}
          </span>
        </Badge>

        <button
          v-if="
            activeDriverVersion || typeof activeDownloadPercent === 'number'
          "
          type="button"
          class="inline-flex items-center focus:outline-none"
          @click="emit('openDrivers')"
        >
          <Badge
            variant="outline"
            class="hover:bg-accent gap-1.5 transition-colors"
          >
            <Loader2
              v-if="typeof activeDownloadPercent === 'number'"
              class="text-primary size-3 animate-spin"
            />
            <Cpu v-else class="size-3" />
            <span>
              {{
                typeof activeDownloadPercent === 'number'
                  ? `${activeDownloadPercent}%`
                  : `v${activeDriverVersion}`
              }}
            </span>
          </Badge>
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <Button
          v-if="runningCount > 0"
          :variant="confirmKillAll ? 'destructive' : 'outline'"
          size="sm"
          :class="
            cn(
              'h-8 gap-1.5 shadow-none',
              !confirmKillAll &&
                'border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive',
            )
          "
          :disabled="!daemonHealthy || killingAll"
          @click="handleKillAllClick"
        >
          <Loader2 v-if="killingAll" class="size-3.5 animate-spin" />
          <OctagonX v-else class="size-3.5" />
          <span>
            {{
              confirmKillAll
                ? $t('automation.browsers.cmd_stop_all_confirm')
                : $t('automation.browsers.cmd_stop_all')
            }}
          </span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          class="h-8 gap-1.5 shadow-none"
          :disabled="!daemonHealthy || loading"
          @click="emit('refresh')"
        >
          <RefreshCw class="size-3.5" :class="{ 'animate-spin': loading }" />
          <span class="hidden sm:inline">{{ $t('common.refresh') }}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          class="h-8 gap-1.5 shadow-none"
          :disabled="!daemonHealthy"
          @click="emit('importCsv')"
        >
          <FileSpreadsheet class="size-3.5" />
          <span class="hidden sm:inline">
            {{ $t('automation.browsers.import_csv') }}
          </span>
        </Button>

        <Button
          size="sm"
          class="h-8 gap-1.5"
          :disabled="!daemonHealthy"
          @click="emit('newProfile')"
        >
          <Plus class="size-3.5" />
          <span>{{ $t('automation.browsers.new_profile') }}</span>
        </Button>

        <Button
          :variant="showTelemetryRail ? 'secondary' : 'outline'"
          size="sm"
          class="hidden h-8 gap-1.5 shadow-none xl:inline-flex"
          @click="emit('toggleTelemetryRail')"
        >
          <PanelRight class="size-3.5" />
          <span>{{ $t('automation.browsers.cmd_telemetry_btn') }}</span>
        </Button>
      </div>
    </div>
  </div>
</template>
