<script lang="ts" setup>
import { onMounted, onUnmounted } from 'vue';

import { usePreferences } from '@operon/preferences';

import { Toaster } from '@operon-core/shadcn-ui';

import {
  initDesktopAuthHandling,
  isTauriEnvironment,
  resetZoom,
  restoreZoom,
  revealWindow,
  toggleDevtools,
  zoomIn,
  zoomOut,
} from '#/adapter/desktop';
import { checkAndNotifyUpdate } from '#/adapter/desktop/updater';
import DesktopShell from '#/layouts/widgets/desktop-shell.vue';

defineOptions({ name: 'App' });

const { isDark } = usePreferences();
const isDesktop = isTauriEnvironment();

function handleCommandPaletteKey(event: KeyboardEvent) {
  const ctrlOrCmd = event.ctrlKey || event.metaKey;
  const key = event.key?.toLowerCase();
  const isP = key === 'p' || event.code === 'KeyP';
  const isK = key === 'k' || event.code === 'KeyK';
  const isF1 = event.key === 'F1';

  // 1. Command Mode: Ctrl+Shift+P, Cmd+Shift+P, or F1
  if ((ctrlOrCmd && event.shiftKey && isP) || isF1) {
    event.preventDefault();
    event.stopPropagation();
    if (!event.repeat) {
      window.dispatchEvent(
        new CustomEvent('open-command-palette', {
          detail: { mode: 'command', initialValue: '>' },
        }),
      );
    }
    return;
  }

  // 2. Navigation Mode: Ctrl+P, Cmd+P, or Ctrl+K, Cmd+K
  if ((ctrlOrCmd && !event.shiftKey && isP) || (ctrlOrCmd && isK)) {
    event.preventDefault();
    event.stopPropagation();
    if (!event.repeat) {
      window.dispatchEvent(
        new CustomEvent('open-command-palette', {
          detail: { mode: 'navigation', initialValue: '' },
        }),
      );
    }
  }
}

// Global action handlers for desktop zoom, updates, and devtools
const handleZoomIn = () => {
  zoomIn();
};
const handleZoomOut = () => {
  zoomOut();
};
const handleZoomReset = () => {
  resetZoom();
};
const handleToggleDevtools = () => {
  toggleDevtools();
};
const handleCheckUpdates = () => {
  checkAndNotifyUpdate();
};

onMounted(async () => {
  window.addEventListener('keydown', handleCommandPaletteKey, {
    capture: true,
  });
  window.addEventListener('operon-zoom-in', handleZoomIn);
  window.addEventListener('operon-zoom-out', handleZoomOut);
  window.addEventListener('operon-zoom-reset', handleZoomReset);
  window.addEventListener('toggle-desktop-devtools', handleToggleDevtools);
  window.addEventListener('check-desktop-updates', handleCheckUpdates);

  if (isTauriEnvironment()) {
    await revealWindow();
    await initDesktopAuthHandling();
    await restoreZoom();
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleCommandPaletteKey, {
    capture: true,
  });
  window.removeEventListener('operon-zoom-in', handleZoomIn);
  window.removeEventListener('operon-zoom-out', handleZoomOut);
  window.removeEventListener('operon-zoom-reset', handleZoomReset);
  window.removeEventListener('toggle-desktop-devtools', handleToggleDevtools);
  window.removeEventListener('check-desktop-updates', handleCheckUpdates);
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
