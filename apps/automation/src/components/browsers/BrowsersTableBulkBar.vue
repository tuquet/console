<script setup lang="ts">
import type { BrowserProfileRecord } from '../../api/browsers';

import { onBeforeUnmount, onMounted } from 'vue';

import { Badge, Button, Kbd, Separator } from '@operon-core/shadcn-ui';

import { Play, Square, Trash2, X } from '@lucide/vue';

import { $t } from '../../locales';

const props = defineProps<{
  selectedBrowsers: BrowserProfileRecord[];
}>();

const emit = defineEmits<{
  batchDelete: [];
  batchLaunch: [];
  batchStop: [];
  clear: [];
}>();

function handleEsc(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.selectedBrowsers.length > 0) {
    if (document.querySelector('[data-state="open"][role="dialog"]')) return;
    emit('clear');
  }
}

onMounted(() => window.addEventListener('keydown', handleEsc));
onBeforeUnmount(() => window.removeEventListener('keydown', handleEsc));
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-4 opacity-0 scale-95"
    enter-to-class="translate-y-0 opacity-100 scale-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="translate-y-0 opacity-100 scale-100"
    leave-to-class="translate-y-4 opacity-0 scale-95"
  >
    <div
      v-if="selectedBrowsers.length > 0"
      class="border-border bg-popover/95 text-popover-foreground fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 flex-wrap items-center gap-1.5 rounded-xl border px-3 py-2 shadow-xl backdrop-blur-md"
    >
      <div class="flex items-center gap-2 pr-1">
        <Badge variant="default" class="font-mono">
          {{ selectedBrowsers.length }}
        </Badge>
        <span class="text-xs font-medium whitespace-nowrap">
          {{
            $t('automation.browsers.selected_count', {
              count: selectedBrowsers.length,
            })
          }}
        </span>
      </div>

      <Separator orientation="vertical" class="mx-1 h-5" />

      <Button
        variant="ghost"
        size="sm"
        class="h-8"
        @click="emit('batchLaunch')"
      >
        <Play class="mr-1.5 size-3.5 text-emerald-500" />
        {{ $t('automation.overview.browser_batch_run_btn') }}
      </Button>

      <Button variant="ghost" size="sm" class="h-8" @click="emit('batchStop')">
        <Square class="mr-1.5 size-3.5 text-amber-500" />
        {{ $t('automation.overview.browser_batch_stop_btn') }}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        class="text-destructive hover:text-destructive h-8"
        @click="emit('batchDelete')"
      >
        <Trash2 class="mr-1.5 size-3.5" />
        {{ $t('automation.browsers.batch_delete') }}
      </Button>

      <Separator orientation="vertical" class="mx-1 h-5" />

      <Button
        variant="ghost"
        size="sm"
        class="text-muted-foreground h-8 px-2"
        @click="emit('clear')"
      >
        <X class="size-3.5" />
        <Kbd class="ml-1.5 text-[10px]">Esc</Kbd>
      </Button>
    </div>
  </Transition>
</template>
