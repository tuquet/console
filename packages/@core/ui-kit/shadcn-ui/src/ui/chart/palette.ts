export function defaultColors(count: number = 3) {
  const chartPalette = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
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
