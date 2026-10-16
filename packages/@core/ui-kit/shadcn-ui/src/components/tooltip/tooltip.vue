<script setup lang="ts">
import type { TooltipContentProps } from 'reka-ui';

import type { StyleValue } from 'vue';

import type { ClassType } from '@vben-core/typings';

import { cn } from '@vben-core/shared/utils';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../ui';

interface Props {
  contentClass?: ClassType;
  contentStyle?: StyleValue;
  delayDuration?: number;
  side?: TooltipContentProps['side'];
}

withDefaults(defineProps<Props>(), {
  delayDuration: 0,
  side: 'right',
});
</script>

<template>
  <TooltipProvider :delay-duration="delayDuration">
    <Tooltip>
      <TooltipTrigger as-child tabindex="-1">
        <slot name="trigger"></slot>
      </TooltipTrigger>
      <TooltipContent
        :class="
          cn('bg-accent text-popover-foreground rounded-md', contentClass)
        "
        :side="side"
        :style="contentStyle"
      >
        <slot></slot>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
