<script setup lang="ts">
import type { StyleValue } from 'vue';

import type { PageProps } from './types';

import { computed } from 'vue';

import { cn } from '@operon-core/shared/utils';

defineOptions({
  name: 'Page',
});

const {
  autoContentHeight = true,
  heightOffset = 0,
  footerFixed = false,
} = defineProps<PageProps>();

const contentStyle = computed<StyleValue>(() => {
  if (!autoContentHeight) {
    return {};
  }

  return {
    '--page-content-height-offset': `${heightOffset}px`,
    marginBlockEnd: 'var(--page-content-height-offset)',
  };
});
</script>

<template>
  <div
    :class="
      cn(
        'relative flex h-full min-h-0 flex-col',
        autoContentHeight && 'overflow-hidden',
      )
    "
  >
    <div
      v-if="
        description ||
        $slots.description ||
        title ||
        $slots.title ||
        $slots.extra
      "
      :class="
        cn(
          'relative flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 sm:px-6',
          headerClass,
        )
      "
    >
      <div class="min-w-0 flex-auto">
        <slot name="title">
          <div
            v-if="title"
            class="flex text-lg font-semibold tracking-tight text-foreground"
            :class="{ 'mb-2': description || $slots.description }"
          >
            {{ title }}
          </div>
        </slot>

        <slot name="description">
          <p v-if="description" class="text-sm text-muted-foreground">
            {{ description }}
          </p>
        </slot>
      </div>

      <div
        v-if="$slots.extra"
        class="flex shrink-0 flex-wrap items-center gap-2"
      >
        <slot name="extra"></slot>
      </div>
    </div>

    <div
      data-layout-region="page-content"
      :class="
        cn(
          autoContentHeight
            ? 'min-h-0 flex-1 flex flex-col overflow-y-auto'
            : 'flex-1',
          'p-4',
          contentClass,
        )
      "
      :style="contentStyle"
    >
      <slot></slot>
    </div>
    <div
      v-if="$slots.footer"
      :class="
        cn(
          'align-center flex bg-card px-6 py-4',
          footerFixed ? 'mt-auto shrink-0' : 'shrink-0',
          footerClass,
        )
      "
    >
      <slot name="footer"></slot>
    </div>
  </div>
</template>
