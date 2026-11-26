<script setup lang="ts">
import { computed, ref } from 'vue';

import { Badge, Button } from '@operon-core/shadcn-ui';

import { Check, Copy } from '@lucide/vue';

const props = withDefaults(
  defineProps<{
    copyTitle?: string;
    emptyBadge?: string;
    emptyText?: string;
    modelValue?: unknown;
    onCopy?: (text: string) => void;
    prefix?: string;
  }>(),
  {
    copyTitle: 'Copy',
    emptyBadge: undefined,
    emptyText: '—',
    modelValue: undefined,
    onCopy: undefined,
    prefix: '',
  },
);

const copied = ref(false);

const rawText = computed(() => {
  if (props.modelValue === undefined || props.modelValue === null) return '';
  const str = String(props.modelValue);
  return str ? `${props.prefix}${str}` : '';
});

async function handleCopy() {
  if (!rawText.value) return;
  try {
    await navigator.clipboard.writeText(rawText.value);
    copied.value = true;
    props.onCopy?.(rawText.value);
    setTimeout(() => {
      copied.value = false;
    }, 1500);
  } catch {
    // Ignore clipboard rejection in restricted environments
  }
}
</script>

<template>
  <div
    v-if="rawText"
    class="bg-muted inline-flex max-w-full min-w-0 items-center gap-1 rounded py-0.5 pr-1 pl-2"
  >
    <code class="text-ui-caption min-w-0 truncate" :title="rawText">
      {{ rawText }}
    </code>
    <Button
      type="button"
      variant="ghost"
      size="icon"
      class="text-muted-foreground hover:text-foreground size-5 shrink-0 rounded-sm"
      :title="copyTitle"
      :aria-label="copyTitle"
      @click="handleCopy"
    >
      <Check v-if="copied" class="size-3 text-emerald-500" />
      <Copy v-else class="size-3" />
    </Button>
  </div>
  <Badge v-else-if="emptyBadge" variant="outline">
    {{ emptyBadge }}
  </Badge>
  <span v-else class="text-ui-body text-muted-foreground">{{ emptyText }}</span>
</template>
