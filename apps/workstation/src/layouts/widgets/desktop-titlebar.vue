<script lang="ts" setup>
import TitlebarMenubar from './titlebar-menubar.vue';
import WindowControls from './window-controls.vue';

defineOptions({ name: 'DesktopTitlebar' });
</script>

<template>
  <header
    class="flex h-9 w-full select-none items-center border-b border-border/60 bg-background/95 text-foreground backdrop-blur z-50 shrink-0"
    data-layout-region="window-titlebar"
    data-tauri-drag-region
  >
    <!-- Left: App brand -->
    <div
      class="flex shrink-0 items-center pl-3 pointer-events-none"
      data-tauri-drag-region
    >
      <span
        class="font-semibold tracking-tight text-foreground text-sm"
        data-tauri-drag-region
      >
        Operon
      </span>
    </div>

    <!-- Menubar navigation (interactive — no drag) -->
    <div class="no-drag flex items-center pl-1" @dblclick.stop>
      <TitlebarMenubar />
    </div>

    <!-- Center: Drag handle area -->
    <div class="flex-1 h-full" data-tauri-drag-region></div>

    <!-- Right: Window controls -->
    <WindowControls />
  </header>
</template>
