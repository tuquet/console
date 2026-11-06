<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Copy, Minus, Square, X } from '@lucide/vue';
import { useEventListener } from '@vueuse/core';

import {
  closeWindow,
  isTauriEnvironment,
  isWindowMaximized,
  minimizeWindow,
  toggleMaximizeWindow,
} from '#/adapter/desktop';
import { $t } from '#/locales';

defineOptions({ name: 'WindowControls' });

const isDesktop = ref(isTauriEnvironment());
const isMaximized = ref(false);

async function handleMinimize() {
  await minimizeWindow();
}

async function handleToggleMaximize() {
  const state = await toggleMaximizeWindow();
  isMaximized.value = state;
}

async function handleClose() {
  await closeWindow();
}

async function refreshMaximized() {
  if (isDesktop.value) {
    isMaximized.value = await isWindowMaximized();
  }
}

onMounted(refreshMaximized);
useEventListener(window, 'resize', refreshMaximized);
</script>

<template>
  <div
    v-if="isDesktop"
    class="flex items-center space-x-1 shrink-0 ml-1 mr-2 no-drag"
    @dblclick.stop
  >
    <button
      type="button"
      class="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
      :title="$t('common.windowMinimize')"
      :aria-label="$t('common.windowMinimize')"
      @click="handleMinimize"
    >
      <Minus class="size-3.5" />
    </button>

    <button
      type="button"
      class="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
      :title="
        isMaximized ? $t('common.windowRestore') : $t('common.windowMaximize')
      "
      :aria-label="
        isMaximized ? $t('common.windowRestore') : $t('common.windowMaximize')
      "
      @click="handleToggleMaximize"
    >
      <Copy v-if="isMaximized" class="size-3 -rotate-90" />
      <Square v-else class="size-3" />
    </button>

    <button
      type="button"
      class="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
      :title="$t('common.windowClose')"
      :aria-label="$t('common.windowClose')"
      @click="handleClose"
    >
      <X class="size-3.5" />
    </button>
  </div>
</template>
