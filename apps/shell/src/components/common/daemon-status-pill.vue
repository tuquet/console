<script lang="ts" setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { DEFAULT_HOME_PATH } from '@operon/constants';
import { useLocalBridgeHeartbeat } from '@operon/kernel';

import { Activity, Loader2, WifiOff } from '@lucide/vue';

import { $t } from '#/locales';

defineOptions({ name: 'DaemonStatusPill' });

const props = withDefaults(defineProps<{ collapsed?: boolean }>(), {
  collapsed: false,
});

const router = useRouter();
const bridge = useLocalBridgeHeartbeat({ intervalMs: 5000 });

const isHealthy = computed(() => bridge.status.value === 'healthy');
const isChecking = computed(() => bridge.status.value === 'checking');

const statusLabel = computed(() => {
  if (isChecking.value) return $t('page.overview.daemonChecking');
  return isHealthy.value
    ? $t('page.overview.daemonHealthy')
    : $t('page.overview.daemonOffline');
});

function goToOverview() {
  void router.push(DEFAULT_HOME_PATH);
}
</script>

<template>
  <div class="border-t border-border/50 p-2">
    <button
      type="button"
      :title="`Operon Daemon (:${bridge.port}) — ${statusLabel}`"
      class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-accent/60"
      :class="props.collapsed ? 'justify-center px-0' : 'justify-between'"
      @click="goToOverview"
    >
      <div class="flex min-w-0 items-center gap-2">
        <Loader2
          v-if="isChecking"
          class="size-3.5 shrink-0 animate-spin text-muted-foreground"
        />
        <Activity
          v-else-if="isHealthy"
          class="size-3.5 shrink-0 text-emerald-500"
        />
        <WifiOff v-else class="size-3.5 shrink-0 text-amber-500" />
        <span
          v-if="!props.collapsed"
          class="truncate font-medium text-foreground"
        >
          {{ statusLabel }}
        </span>
      </div>
      <span
        v-if="!props.collapsed"
        class="shrink-0 font-mono text-[10px] text-muted-foreground"
      >
        :{{ bridge.port }}
      </span>
    </button>
  </div>
</template>
