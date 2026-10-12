# @vben/turbo-run

`turbo-run` is a CLI tool that allows running commands across multiple packages in parallel. It provides an interactive UI to choose packages.

## Features

- 🚀 Interactively select packages to run
- 📦 Monorepo project structure support
- 🔍 Automatically detect available commands
- 🎯 Accurately filter target packages

## Installation

```bash
pnpm add -D @vben/turbo-run
```

## Usage

Basic syntax:

```bash
turbo-run [script]
```

For example, to run the `dev` command:

```bash
turbo-run dev
```

The tool automatically detects which packages have the `dev` command and displays an interactive menu to choose packages.

## Example

Suppose your project contains the following packages:

- `@vben/app`
- `@vben/admin`
- `@vben/website`

When you run:

```bash
turbo-run dev
```

The tool will:

1. Detect which packages have the `dev` command
2. Show an interactive selection prompt
3. Let you select which packages to run
4. Run commands in selected packages using `pnpm --filter`

## Notes

- Ensure your project uses pnpm as the package manager
- Ensure target packages define the corresponding scripts in `package.json`
- This tool must be run from the root directory of the monorepo
