<script lang="ts" setup>
import { ref } from 'vue';

import {
  getLocalBridgeInstallInfo,
  useLocalBridgeHeartbeat,
} from '@operon/kernel';

import { Button, toast } from '@operon-core/shadcn-ui';

import { Copy, Download, Minimize2, RefreshCw, WifiOff } from '@lucide/vue';

import { $t } from '#/locales';

defineOptions({ name: 'LocalBridgeNotice' });

const bridge = useLocalBridgeHeartbeat({ intervalMs: 5000 });
const installInfo = getLocalBridgeInstallInfo();
const minimized = ref(false);

async function copyCommand() {
  try {
    await navigator.clipboard.writeText(installInfo.command);
    toast.success($t('page.localBridge.copied'));
  } catch {
    toast.error($t('page.localBridge.copyFailed'));
  }
}
</script>

<template>
  <div
    v-if="bridge.status.value === 'offline'"
    class="fixed right-4 bottom-4 z-50 max-w-md"
  >
    <Button
      v-if="minimized"
      size="sm"
      variant="outline"
      class="border-amber-500/40 bg-background/95 shadow-lg backdrop-blur"
      @click="minimized = false"
    >
      <WifiOff class="size-3.5 mr-1.5 text-amber-500" />
      {{ $t('page.localBridge.offlinePill') }}
    </Button>

    <div
      v-else
      class="rounded-xl border border-amber-500/40 bg-card/95 p-4 shadow-xl backdrop-blur"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-start gap-2.5">
          <WifiOff class="size-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 class="text-sm font-semibold text-foreground">
              {{ $t('page.localBridge.title') }}
            </h4>
            <p class="text-xs text-muted-foreground mt-1">
              {{ $t('page.localBridge.description', { port: bridge.port }) }}
            </p>
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          class="size-6 shrink-0"
          @click="minimized = true"
        >
          <Minimize2 class="size-3.5" />
        </Button>
      </div>

      <div
        class="mt-3 flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/80 px-2.5 py-1.5"
      >
        <code class="text-[11px] font-mono text-foreground truncate">
          {{ installInfo.command }}
        </code>
        <Button
          size="sm"
          variant="ghost"
          class="h-6 px-2 text-xs shrink-0"
          @click="copyCommand"
        >
          <Copy class="size-3 mr-1" />
          {{ $t('page.localBridge.copy') }}
        </Button>
      </div>

      <div class="mt-3 flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          as="a"
          :href="installInfo.releasesUrl"
          target="_blank"
          rel="noreferrer"
        >
          <Download class="size-3.5 mr-1.5" />
          {{ $t('page.localBridge.download') }}
        </Button>
        <Button size="sm" variant="default" @click="bridge.checkNow()">
          <RefreshCw class="size-3.5 mr-1.5" />
          {{ $t('page.localBridge.retry') }}
        </Button>
      </div>
    </div>
  </div>
</template>
