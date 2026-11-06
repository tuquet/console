<script lang="ts" setup>
import { onMounted } from 'vue';

import { usePreferences } from '@operon/preferences';

import { Toaster } from '@operon-core/shadcn-ui';

import {
  initDesktopAuthHandling,
  isTauriEnvironment,
  restoreZoom,
  revealWindow,
} from '#/adapter/desktop';
import DesktopShell from '#/layouts/widgets/desktop-shell.vue';

defineOptions({ name: 'App' });

const { isDark } = usePreferences();
const isDesktop = isTauriEnvironment();

onMounted(async () => {
  if (isTauriEnvironment()) {
    await revealWindow();
    await initDesktopAuthHandling();
    await restoreZoom();
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
