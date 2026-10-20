## Effects Directory

The `effects` directory is dedicated to code and logic with side-effects or loose couplings. Place packages here if they involve:

- **State Management**: Using `pinia` stores with side-effects (e.g. async operations, API calls).
- **Preferences**: Handling user preferences with `@tuquet-core/preferences`, touching storage or browser cache (`localStorage`).
- **Navigation & Routing**: Handling navigation, page redirects, and route transitions.
- **UI Library Coupling**: Tightly coupled with or dependent on specific component libraries.

Organizing related logic under `effects` keeps architecture clear, maintainable, and extensible.
