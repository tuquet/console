# @operon/shell

Host application for the web console and Tauri desktop application.

The shell owns authentication, session lifecycle, layout, top-level routes, access guards, desktop adapters and the implementation of `@operon/kernel`. Business screens and child routes live in their owning applications. All apps are compiled and released together.

Local database schemas, migrations and synchronization live in `packages/local-db`. Desktop adapters live in `src/adapter/desktop`.

See [architecture](../../docs/ARCHITECTURE.md) and [development setup](../../docs/DEVELOPMENT.md) for dependency rules and commands.
