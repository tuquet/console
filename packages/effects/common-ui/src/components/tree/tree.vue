<script setup lang="ts">
import type { TreeProps } from '@operon-core/shadcn-ui';

import { Inbox } from '@operon/icons';
import { $t } from '@operon/locales';

import { OperonTree, treePropsDefaults } from '@operon-core/shadcn-ui';

const props = withDefaults(defineProps<TreeProps>(), treePropsDefaults());
</script>

<template>
  <OperonTree v-if="props.treeData?.length > 0" v-bind="props">
    <template v-for="(_, key) in $slots" :key="key" #[key]="slotProps">
      <slot :name="key" v-bind="slotProps"> </slot>
    </template>
  </OperonTree>
  <div
    v-else
    class="flex-col-center cursor-pointer rounded-lg border p-10 text-muted-foreground"
  >
    <Inbox class="size-10" />
    <div class="mt-1">{{ $t('common.noData') }}</div>
  </div>
</template>
