# `@operon-core/shadcn-ui`

- `src/ui/` holds **upstream `shadcn-vue` (`new-york-v4`) primitives only**. Do not customize base primitives directly inside `src/ui/` — pass `class` at call sites, add global CSS rules in `internal/tailwind-config/src/theme.css`, or wrap/extend in `src/components/`.
- `src/components/` holds Operon-specific wrappers and custom components (`tree/`, `chart-area/`, `chart-bar/`, `chart-donut/`, `button/`, etc.).
- Both are re-exported from `src/index.ts`.

## Commands

```bash
# List or search upstream shadcn-vue components
pnpm --filter @operon-core/shadcn-ui shadcn:search
pnpm --filter @operon-core/shadcn-ui shadcn:search -q trace

# Inspect upstream registry files (prompts for component name when run with no args)
pnpm --filter @operon-core/shadcn-ui shadcn:view
pnpm --filter @operon-core/shadcn-ui shadcn:view @shadcn/trace

# Check differences against upstream new-york-v4 before upgrading
pnpm --filter @operon-core/shadcn-ui shadcn:diff
pnpm --filter @operon-core/shadcn-ui shadcn:diff button
```

## Upstream CLI (`add --overwrite`)

```bash
# Kiểm tra khác biệt trước khi ghi đè
pnpm --dir console/packages/@core/ui-kit/shadcn-ui dlx shadcn-vue@latest diff <component>

# Cài / ghi đè 1 component (ví dụ: trace, button, dialog)
pnpm --dir console/packages/@core/ui-kit/shadcn-ui dlx shadcn-vue@latest add <component> --overwrite

# Ghi đè tất cả component
pnpm --dir console/packages/@core/ui-kit/shadcn-ui dlx shadcn-vue@latest add --all --overwrite
```

> **Note:** Keep external dependencies in `package.json` using `"catalog:"` after running `shadcn-vue add`, and export new `src/ui/<component>` modules from `src/ui/index.ts`.
