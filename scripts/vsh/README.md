# @tuquet/vsh

A collection of shell utility scripts for project development and management.

## Features

- 🚀 Modern Node.js-based shell utilities
- 📦 Modular design with on-demand loading
- 🔍 Dependency inspection and analysis
- 🔄 Circular dependency scanning
- 📝 Package publish checks

## Installation

```bash
# Install with pnpm
pnpm add -D @tuquet/vsh

# Or with npm
npm install -D @tuquet/vsh

# Or with yarn
yarn add -D @tuquet/vsh
```

## Usage

### Global Installation

```bash
# Global install
pnpm add -g @tuquet/vsh

# Use vsh command
vsh [command]
```

### Local Usage

```bash
# Add script to package.json
{
  "scripts": {
    "vsh": "vsh"
  }
}

# Run command
pnpm vsh [command]
```

## Commands List

- `vsh check-deps`: Inspect project dependencies
- `vsh scan-circular`: Scan circular dependencies
- `vsh publish-check`: Check package publish configuration
