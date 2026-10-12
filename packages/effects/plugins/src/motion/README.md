# Motion Plugin

Animation plugin based on @vueuse/motion.

## Exports

| Export            | Type      | Description            |
| ----------------- | --------- | ---------------------- |
| `Motion`          | Component | Motion component       |
| `MotionGroup`     | Component | Motion group component |
| `MotionDirective` | Directive | Motion directive       |
| `MotionPlugin`    | Plugin    | Vue plugin             |

## Usage

```ts
import { MotionPlugin, Motion, MotionDirective } from '@vben/plugins/motion';

app.use(MotionPlugin);
```

## Types

```ts
import type { MotionOptions, MotionVariants } from '@vben/plugins/motion';
```
