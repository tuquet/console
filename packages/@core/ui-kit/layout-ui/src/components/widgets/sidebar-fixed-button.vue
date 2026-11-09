<script setup lang="ts">
import { Pin, PinOff } from '@operon-core/icons';
import { VbenButton } from '@operon-core/shadcn-ui';

defineProps<{ inline?: boolean }>();

const expandOnHover = defineModel<boolean>('expandOnHover');
const expandOnHovering = defineModel<boolean>('expandOnHovering');
const collapse = defineModel<boolean>('collapse');
const extraVisible = defineModel<boolean>('extraVisible');

function toggleFixed() {
  expandOnHover.value = !expandOnHover.value;
  collapse.value = false;
  extraVisible.value = true;
  if (!expandOnHover.value) {
    expandOnHovering.value = true;
  }
}
</script>

<template>
  <VbenButton
    type="button"
    variant="ghost"
    size="icon"
    :aria-label="expandOnHover ? 'Pin sidebar' : 'Unpin sidebar'"
    :title="expandOnHover ? 'Pin sidebar' : 'Unpin sidebar'"
    :aria-pressed="!expandOnHover"
    class="flex-center size-8 shrink-0 rounded-md text-muted-foreground"
    :class="inline ? '' : 'absolute right-3 bottom-2 z-10'"
    @click="toggleFixed"
  >
    <PinOff v-show="!expandOnHover" class="size-4" />
    <Pin v-show="expandOnHover" class="size-4" />
  </VbenButton>
</template>
