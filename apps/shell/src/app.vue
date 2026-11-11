<script lang="ts" setup>
import { onMounted, onUnmounted, provide } from 'vue';
import { useRouter } from 'vue-router';

import { KERNEL_INJECTION_KEY } from '@operon/kernel';
import {
  preferences,
  updatePreferences,
  usePreferences,
} from '@operon/preferences';

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
import { useAppUpdater } from '#/composables/use-app-updater';
import { createHostKernel } from '#/kernel/host-kernel';
import DesktopShell from '#/layouts/widgets/desktop-shell.vue';

defineOptions({ name: 'App' });

const router = useRouter();
const hostKernel = createHostKernel(router);
provide(KERNEL_INJECTION_KEY, hostKernel);

const { isDark } = usePreferences();
const isDesktop = isTauriEnvironment();

function isEditableElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    target.isContentEditable ||
    Boolean(target.closest('.monaco-editor, [contenteditable="true"]'))
  );
}

function handleGlobalKeydown(event: KeyboardEvent) {
  const ctrlOrCmd = event.ctrlKey || event.metaKey;
  const key = event.key?.toLowerCase();
  const code = event.code;

  // 1. Command Mode: Ctrl+Shift+P, Cmd+Shift+P, or F1
  const isP = key === 'p' || code === 'KeyP';
  const isK = key === 'k' || code === 'KeyK';
  const isF1 = event.key === 'F1' || code === 'F1';

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
  if (
    (ctrlOrCmd && !event.shiftKey && isP) ||
    (ctrlOrCmd && !event.shiftKey && isK)
  ) {
    event.preventDefault();
    event.stopPropagation();
    if (!event.repeat) {
      window.dispatchEvent(
        new CustomEvent('open-command-palette', {
          detail: { mode: 'navigation', initialValue: '' },
        }),
      );
    }
    return;
  }

  // 3. Open Settings / Preferences: Ctrl+, or Cmd+,
  const isComma = event.key === ',' || code === 'Comma';
  if (ctrlOrCmd && !event.shiftKey && !event.altKey && isComma) {
    event.preventDefault();
    event.stopPropagation();
    if (!event.repeat) {
      window.dispatchEvent(new CustomEvent('open-preferences'));
    }
    return;
  }

  // 4. Toggle Primary Sidebar: Ctrl+B or Cmd+B (only when not editing text)
  const isB = key === 'b' || code === 'KeyB';
  if (
    ctrlOrCmd &&
    !event.shiftKey &&
    !event.altKey &&
    isB &&
    !isEditableElement(event.target)
  ) {
    event.preventDefault();
    event.stopPropagation();
    if (!event.repeat) {
      updatePreferences({
        sidebar: { collapsed: !preferences.sidebar.collapsed },
      });
    }
    return;
  }

  // 5. System: Lock Screen: Ctrl+L or Cmd+L
  const isL = key === 'l' || code === 'KeyL';
  if (ctrlOrCmd && !event.shiftKey && !event.altKey && isL) {
    event.preventDefault();
    event.stopPropagation();
    if (!event.repeat) {
      window.dispatchEvent(new CustomEvent('open-lock-screen-modal'));
    }
    return;
  }

  // 6. View: Zoom In: Ctrl+=, Ctrl++, Cmd+=, Cmd++
  const isEqual =
    event.key === '=' ||
    event.key === '+' ||
    code === 'Equal' ||
    code === 'NumpadAdd';
  if (ctrlOrCmd && !event.altKey && isEqual && isDesktop) {
    event.preventDefault();
    event.stopPropagation();
    zoomIn();
    return;
  }

  // 7. View: Zoom Out: Ctrl+-, Cmd+-
  const isMinus =
    event.key === '-' || code === 'Minus' || code === 'NumpadSubtract';
  if (ctrlOrCmd && !event.altKey && isMinus && isDesktop) {
    event.preventDefault();
    event.stopPropagation();
    zoomOut();
    return;
  }

  // 8. View: Reset Zoom (100%): Ctrl+0, Cmd+0
  const isZero = event.key === '0' || code === 'Digit0' || code === 'Numpad0';
  if (ctrlOrCmd && !event.altKey && isZero && isDesktop) {
    event.preventDefault();
    event.stopPropagation();
    resetZoom();
    return;
  }

  // 9. View: Toggle Fullscreen: F11
  if (
    !ctrlOrCmd &&
    !event.shiftKey &&
    !event.altKey &&
    (event.key === 'F11' || code === 'F11')
  ) {
    event.preventDefault();
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen?.();
      } else {
        document.documentElement.requestFullscreen?.();
      }
    } catch {
      // Ignore
    }
    return;
  }

  // 10. Developer: Toggle DevTools: F12
  if (
    !ctrlOrCmd &&
    !event.shiftKey &&
    !event.altKey &&
    (event.key === 'F12' || code === 'F12') &&
    isDesktop
  ) {
    event.preventDefault();
    toggleDevtools();
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
  window.addEventListener('keydown', handleGlobalKeydown, {
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

    // Silent background check for updates after window is initialized
    setTimeout(() => {
      useAppUpdater().checkForUpdates(true);
    }, 2500);
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown, {
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
