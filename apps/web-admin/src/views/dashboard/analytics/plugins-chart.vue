<script lang="ts" setup>
import { computed } from 'vue';

import { $t } from '@vben/locales';

import { DonutChart } from '@vben-core/shadcn-ui';

const props = defineProps<{
  coreCount: number;
  moduleCount: number;
}>();

const chartData = computed(() => {
  return [
    {
      name: $t('page.analytics.core_kernel'),
      value: props.coreCount,
    },
    {
      name: $t('page.analytics.service_modules'),
      value: props.moduleCount,
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
