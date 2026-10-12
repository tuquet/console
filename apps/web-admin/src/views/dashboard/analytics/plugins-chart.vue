<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { nextTick, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

const props = defineProps<{
  coreCount: number;
  moduleCount: number;
}>();

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

function updateChart() {
  const chartData = [
    {
      itemStyle: { color: '#0284c7' },
      name: 'Core Kernel (System)',
      value: props.coreCount,
    },
    {
      itemStyle: { color: '#10b981' },
      name: 'Service Modules',
      value: props.moduleCount,
    },
  ].filter((item) => item.value > 0);

  nextTick(() => {
    renderEcharts({
      legend: {
        bottom: '2%',
        itemGap: 16,
        itemHeight: 10,
        itemWidth: 10,
        left: 'center',
        textStyle: { color: '#94a3b8', fontSize: 11 },
      },
      series: [
        {
          center: ['50%', '42%'],
          data: chartData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
              shadowOffsetX: 0,
            },
          },
          itemStyle: {
            borderColor: '#0f172a',
            borderRadius: 6,
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          name: 'Hệ Sinh Thái Plugins',
          radius: ['38%', '62%'],
          type: 'pie',
        },
      ],
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        borderColor: 'rgba(71, 85, 105, 0.6)',
        textStyle: { color: '#f8fafc' },
        trigger: 'item',
      },
    });
  });
}

watch(() => [props.coreCount, props.moduleCount], updateChart, {
  immediate: true,
});
</script>

<template>
  <div class="h-64 w-full sm:h-80">
    <EchartsUI ref="chartRef" />
  </div>
</template>
