<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

import { cn } from '@vben-core/shared/utils';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <div
    :class="
      cn(
        'relative [&>[data-slot=input]]:has-[[data-slot=increment]]:pr-9 [&>[data-slot=input]]:has-[[data-slot=decrement]]:pl-9',
        props.class,
      )
    "
  >
    <slot></slot>
  </div>
</template>
