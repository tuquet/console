# @operon/kernel

Typed contract between the shell and business applications. Applications consume host authentication, HTTP clients and events through `useKernel()`; they must not import shell internals.

The shell provides `KERNEL_INJECTION_KEY`. Standalone applications provide `createMockKernel()`. Public types are defined in `src/types.ts`, including `KernelRequestOptions`; the implementation is the source of truth.

HTTP failures use `KernelApiError` with an HTTP `status`. Network failures retain the original error. Response generics default to `unknown`; callers must select a response type or narrow the result. Generic types do not validate server payloads.

Apps are currently compiled and released with the shell. Prefer optional contract additions for compatibility; adding a required property requires updating host, mock and consumers together.

See [architecture](../../docs/ARCHITECTURE.md).
