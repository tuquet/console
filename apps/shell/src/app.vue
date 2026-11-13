<script lang="ts" setup>
import { onMounted, provide } from 'vue';
import { useRouter } from 'vue-router';

import { KERNEL_INJECTION_KEY } from '@operon/kernel';
import { usePreferences } from '@operon/preferences';

import { Toaster } from '@operon-core/shadcn-ui';

import {
  initDesktopAuthHandling,
  isTauriEnvironment,
  restoreZoom,
  revealWindow,
} from '#/adapter/desktop';
import { useAppUpdater } from '#/composables/use-app-updater';
import { useGlobalShortcuts } from '#/composables/use-global-shortcuts';
import { createHostKernel } from '#/kernel/host-kernel';
import DesktopShell from '#/layouts/widgets/desktop-shell.vue';

defineOptions({ name: 'App' });

const router = useRouter();
const hostKernel = createHostKernel(router);
provide(KERNEL_INJECTION_KEY, hostKernel);

const { isDark } = usePreferences();
const isDesktop = isTauriEnvironment();

useGlobalShortcuts(isDesktop);

onMounted(async () => {
  if (isDesktop) {
    await revealWindow();
    await initDesktopAuthHandling();
    await restoreZoom();

    // Silent background check for updates after window is initialized
    setTimeout(() => {
      useAppUpdater().checkForUpdates(true);
    }, 2500);
  }
});
</script>

<template>
  <DesktopShell v-if="isDesktop">
    <RouterView />
  </DesktopShell>
  <RouterView v-else />
  <Toaster
    position="top-right"
    :theme="isDark ? 'dark' : 'light'"
    rich-colors
  />
</template>
