# VXE Table Plugin

Table component plugin based on vxe-table and vxe-pc-ui.

## Exports

| Export                | Type      | Description                    |
| --------------------- | --------- | ------------------------------ |
| `setupVbenVxeTable`   | Function  | Initialization config function |
| `useVbenVxeGrid`      | Function  | Table composable function      |
| `VbenVxeGrid`         | Component | Table component                |
| `VxeTableGridColumns` | Type      | Table columns type             |
| `VxeTableGridOptions` | Type      | Table options type             |
| `VxeGridProps`        | Type      | Table props type               |
| `VxeGridListeners`    | Type      | Table events type              |

## Usage

```ts
import {
  setupVbenVxeTable,
  useVbenVxeGrid,
  VbenVxeGrid,
} from '@tuquet/plugins/vxe-table';
```

## Initialization

Invoke at application entrypoint:

```ts
import { setupVbenVxeTable } from '@tuquet/plugins/vxe-table';
import { useVbenForm } from '@tuquet-core/form-ui';

setupVbenVxeTable({
  configVxeTable: (vxeUI) => {
    // Configure VXE Table
  },
  useVbenForm,
});
```

## Types

```ts
import type {
  VxeTableGridOptions,
  VxeGridProps,
} from '@tuquet/plugins/vxe-table';
```
