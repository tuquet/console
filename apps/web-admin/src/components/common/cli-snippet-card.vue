<script lang="ts" setup>
import { Check, Copy, Terminal } from '@lucide/vue';
import { Button } from '@tuquet/vue-ui';

import { useClipboard } from '#/composables';

interface Props {
  command: string;
  copiedLabel?: string;
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  copiedLabel: 'Lệnh CLI',
  label: 'Lệnh Kết Nối Specter CLI',
});

const { copyToClipboard, isCopied } = useClipboard();
</script>

<template>
  <div class="rounded-xl border border-border/60 bg-muted/20 p-4">
    <div class="flex items-center gap-2 mb-2">
      <Terminal class="size-4 text-sky-400" />
      <label
        class="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {{ props.label }}
      </label>
    </div>
    <div
      class="rounded bg-black/60 p-3 font-mono text-xs text-sky-300 flex items-center justify-between gap-2 overflow-x-auto"
    >
      <code class="break-all">{{ props.command }}</code>
      <Button
        variant="ghost"
        size="icon"
        class="text-sky-300 hover:text-white p-0 size-6 shrink-0"
        @click="copyToClipboard(props.command, props.copiedLabel)"
      >
        <Check
          v-if="isCopied(props.copiedLabel)"
          class="size-3.5 text-green-500"
        />
        <Copy v-else class="size-3.5" />
      </Button>
    </div>
  </div>
</template>
