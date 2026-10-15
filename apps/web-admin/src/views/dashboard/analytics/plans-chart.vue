<script lang="ts" setup>
import type { PlanBreakdown } from '#/api';

import { computed } from 'vue';

import { $t } from '@vben/locales';

import { DonutChart } from '@vben-core/shadcn-ui';

const props = defineProps<{
  data: PlanBreakdown;
}>();

const chartData = computed(() => {
  if (!props.data) return [];
  return [
    {
      name: $t('page.analytics.plan_pro'),
      value: props.data.pro,
    },
    {
      name: $t('page.analytics.plan_free'),
      value: props.data.free,
    },
    {
      name: $t('page.analytics.plan_enterprise'),
      value: props.data.enterprise,
    },
  ].filter((item) => item.value > 0);
});
</script>

<template>
  <div class="flex h-64 w-full items-center justify-center sm:h-80">
    <DonutChart
      :data="chartData"
      category="value"
      class="h-full w-full"
      index="name"
    />
  </div>
</template>
