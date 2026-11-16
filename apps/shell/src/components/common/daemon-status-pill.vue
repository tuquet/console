<script lang="ts" setup>
import { Settings } from '@lucide/vue';

import { $t } from '#/locales';

defineOptions({ name: 'DaemonStatusPill' });

const props = withDefaults(defineProps<{ collapsed?: boolean }>(), {
  collapsed: false,
});

function openSettings() {
  window.dispatchEvent(new CustomEvent('open-preferences'));
}
</script>

<template>
  <div class="border-t border-border/50 p-2">
    <button
      type="button"
      :title="$t('preferences.settingsTitle')"
      class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
      :class="props.collapsed ? 'justify-center px-0' : ''"
      @click="openSettings"
    >
      <Settings class="size-4 shrink-0" />
      <span v-if="!props.collapsed" class="truncate font-medium">
        {{ $t('preferences.settingsTitle') }}
      </span>
    </button>
  </div>
</template>
