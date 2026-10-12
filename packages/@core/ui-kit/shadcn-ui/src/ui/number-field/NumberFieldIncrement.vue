<script setup lang="ts">
import type { NumberFieldIncrementProps } from 'reka-ui';

import type { HTMLAttributes } from 'vue';

import { cn } from '@vben-core/shared/utils';

import { Plus } from '@lucide/vue';
import { reactiveOmit } from '@vueuse/core';
import { NumberFieldIncrement, useForwardProps } from 'reka-ui';

const props = defineProps<
  NumberFieldIncrementProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = reactiveOmit(props, 'class');

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <NumberFieldIncrement
    data-slot="increment"
    v-bind="forwarded"
    :class="
      cn(
        'absolute top-1/2 right-1 flex size-7 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-20',
        props.class,
      )
    "
  >
    <slot>
      <Plus class="size-4" />
    </slot>
  </NumberFieldIncrement>
</template>
