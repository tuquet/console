# Specter (`admin.tuquet.com`)

Unified Management, IAM & Operations Console for the **[Tuquet Ecosystem](https://tuquet.com)**, powered by Vue 3, Vite, and Ant Design Vue / Shadcn-Vue.

## Production Domain

- **Management & Admin Console**: [https://admin.tuquet.com](https://admin.tuquet.com)
- **Official Website**: [https://tuquet.com](https://tuquet.com)

## Architecture & Documentation

- [Routing Architecture Specification (Tuquet Cloud Aligned)](docs/routing_architecture.md)

## Tech Stack

- **Framework**: [Vue 3](https://vuejs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/) + [Turbo](https://turbo.build/)
- **UI & Components**: [Shadcn-Vue](https://www.shadcn-vue.com/) / [@tuquet/vue-ui](https://github.com/tuquet/lib)
- **Table System**: [@tuquet/vue-table](https://github.com/tuquet/lib) (TanStack Table)
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Routing**: [Vue Router](https://router.vuejs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)

## Getting Started

### Prerequisites

- **Node.js**: `>= 22.0.0`
- **pnpm**: `>= 10.0.0`

### Installation

```bash
# Install dependencies
pnpm install

# Start local development server
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

- **Default Accounts**:
  - `tuquet` / `123456` (Super Administrator)
  - `admin` / `123456` (Administrator)

## License

MIT © [Tuquet](https://tuquet.com)
