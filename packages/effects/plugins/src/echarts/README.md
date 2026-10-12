# ECharts Plugin

ECharts chart plugin with preset components and chart types.

## Exports

| Export       | Type      | Description               |
| ------------ | --------- | ------------------------- |
| `default`    | Object    | echarts instance          |
| `EchartsUI`  | Component | Chart container component |
| `ECOption`   | Type      | Chart option type         |
| `useEcharts` | Function  | Composable                |

## Usage

```ts
import { EchartsUI, useEcharts, ECOption } from '@vben/plugins/echarts';
```

## Types

```ts
import type { ECOption } from '@vben/plugins/echarts';
```

## Preset Components

- TitleComponent
- TooltipComponent
- GridComponent
- LegendComponent
- ToolboxComponent
- DatasetComponent
- TransformComponent

## Preset Charts

- BarChart
- LineChart
- PieChart
- RadarChart
