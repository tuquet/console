export { default as ChartCrosshair } from './ChartCrosshair.vue';
export { default as ChartLegend } from './ChartLegend.vue';
export { default as ChartSingleTooltip } from './ChartSingleTooltip.vue';
export { default as ChartTooltip } from './ChartTooltip.vue';

export function defaultColors(count: number = 3) {
  const chartPalette = [
    '#38bdf8',
    '#10b981',
    '#a855f7',
    '#f59e0b',
    '#ec4899',
    '#06b6d4',
  ];

  if (count <= chartPalette.length) {
    return chartPalette.slice(0, count);
  }

  const quotient = Math.floor(count / 2);
  const remainder = count % 2;

  const primaryCount = quotient + remainder;
  const secondaryCount = quotient;
  return [
    ...Array.from(
      { length: primaryCount },
      (_, i) =>
        `hsl(var(--vis-primary-color, var(--primary)) / ${1 - (1 / primaryCount) * i})`,
    ),
    ...Array.from(
      { length: secondaryCount },
      (_, i) =>
        `hsl(var(--vis-secondary-color, var(--muted)) / ${1 - (1 / secondaryCount) * i})`,
    ),
  ];
}

export * from './interface';
