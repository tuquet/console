<script setup lang="ts">
import { computed } from 'vue';

import { Badge, Progress } from '@operon-core/shadcn-ui';

import { Loader2 } from '@lucide/vue';

export interface SchemaProgressStatusValue {
  downloadedBytes?: number;
  error?: string;
  idleLabel?: string;
  idleVariant?: 'default' | 'destructive' | 'outline' | 'secondary';
  percent?: number;
  stage?: string;
  stageLabel?: string;
  totalBytes?: number;
}

const props = withDefaults(
  defineProps<{
    modelValue?: null | SchemaProgressStatusValue;
  }>(),
  {
    modelValue: undefined,
  },
);

const isActive = computed(() => {
  const stage = props.modelValue?.stage;
  return stage === 'downloading' || stage === 'extracting';
});

const bytesSummary = computed(() => {
  const dl = props.modelValue?.downloadedBytes;
  const total = props.modelValue?.totalBytes;
  if (typeof total === 'number' && total > 0 && typeof dl === 'number') {
    return `${(dl / 1_048_576).toFixed(1)} / ${(total / 1_048_576).toFixed(1)} MB`;
  }
  return null;
});
</script>

<template>
  <div v-if="modelValue && isActive" class="flex w-full flex-col gap-1.5">
    <div class="flex items-center justify-between gap-2">
      <span class="flex items-center gap-1.5 font-medium">
        <Loader2 class="size-3.5 animate-spin" />
        <span>{{ modelValue.stageLabel || modelValue.stage }}</span>
      </span>
      <span class="text-muted-foreground tabular-nums">
        {{ bytesSummary ? `${bytesSummary} · ` : ''
        }}{{ modelValue.percent ?? 0 }}%
      </span>
    </div>
    <Progress :model-value="modelValue.percent ?? 0" class="h-1.5" />
  </div>
  <div v-else-if="modelValue?.stage === 'error'" class="flex flex-col gap-1">
    <Badge variant="destructive" class="w-fit">
      {{ modelValue.idleLabel || 'Failed' }}
    </Badge>
    <p v-if="modelValue.error" class="text-destructive break-words">
      {{ modelValue.error }}
    </p>
  </div>
  <Badge v-else :variant="modelValue?.idleVariant ?? 'secondary'" class="w-fit">
    {{ modelValue?.idleLabel || '—' }}
  </Badge>
</template>
