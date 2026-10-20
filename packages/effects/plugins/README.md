# @tuquet/plugins

This directory contains third-party library integrations and plugins. Each plugin encapsulates reusable logic, configuration, and components for unified management.

## Notes

All third-party plugins must be imported via `subpath` exports, for example:

Taking `echarts` as an example:

**packages.json**

```json
"exports": {
    "./echarts": {
      "types": "./src/echarts/index.ts",
      "default": "./src/echarts/index.ts"
    }
  }
```

**Usage**

```ts
import { useEcharts } from '@tuquet/plugins/echarts';
```

This ensures apps only bundle required plugins without unnecessary overhead or side-effects.
