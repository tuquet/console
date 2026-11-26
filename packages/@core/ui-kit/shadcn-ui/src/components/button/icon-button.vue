<script setup lang="ts">
import type { ButtonVariants } from '../../ui';
import type { OperonButtonProps } from './button';

import { computed, useSlots } from 'vue';

import { cn } from '@operon-core/shared/utils';

import { OperonTooltip } from '../tooltip';
import OperonButton from './button.vue';

interface Props extends OperonButtonProps {
  class?: any;
  disabled?: boolean;
  onClick?: ((e?: MouseEvent) => void)[] | ((e?: MouseEvent) => void);
  tooltip?: string;
  tooltipDelayDuration?: number;
  tooltipSide?: 'bottom' | 'left' | 'right' | 'top';
  variant?: ButtonVariants['variant'];
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  onClick: () => {},
  tooltipDelayDuration: 200,
  tooltipSide: 'bottom',
  variant: 'ghost',
});

const slots = useSlots();

const showTooltip = computed(() => !!slots.tooltip || !!props.tooltip);

function handleClick(e: MouseEvent) {
  if (Array.isArray(props.onClick)) {
    for (const fn of props.onClick) {
      fn?.(e);
    }
  } else {
    props.onClick?.(e);
  }
}
</script>

<template>
  <OperonButton
    v-if="!showTooltip"
    :class="cn('rounded-full', props.class)"
    :disabled="disabled"
    :variant="variant"
    size="icon"
    @click="handleClick"
  >
    <slot></slot>
  </OperonButton>

  <OperonTooltip
    v-else
    :delay-duration="tooltipDelayDuration"
    :side="tooltipSide"
  >
    <template #trigger>
      <OperonButton
        :class="cn('rounded-full', props.class)"
        :disabled="disabled"
        :variant="variant"
        size="icon"
        @click="handleClick"
      >
        <slot></slot>
      </OperonButton>
    </template>
    <slot v-if="slots.tooltip" name="tooltip"> </slot>
    <template v-else>
      {{ tooltip }}
    </template>
  </OperonTooltip>
</template>
