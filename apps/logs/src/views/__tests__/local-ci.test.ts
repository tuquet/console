import { createApp, h, nextTick, ref } from 'vue';

import { createPinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LogsLocalCiView from '../local-ci.vue';

const mockFetch = vi.fn();

vi.mock('@operon/kernel', () => ({
  useDaemonHeartbeat: () => ({
    checkNow: vi.fn(),
    isHealthy: ref(true),
    isInitialChecking: ref(false),
  }),
  useKernel: () => ({
    api: { daemonPort: 8765, localDaemonFetch: mockFetch },
    events: { navigate: vi.fn(), notify: vi.fn(), openLoginModal: vi.fn() },
  }),
}));

describe('logs local-ci view with Trace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      cache: {},
      files: [
        {
          content: [
            '=== local-ci: core (2026-11-26T08:40:17.647Z, main @ 91366ae5) ===',
            '> [cargo fmt] cargo fmt --all -- --check',
            '> [cargo test] cargo test --workspace',
            'error: test failed',
            '> [cargo clippy] cargo clippy --workspace',
            '--- Summary: core (12.0s) ---',
            '[PASS] cargo fmt (2.0s)',
            '[FAIL 101] cargo test (10.0s)',
          ].join('\n'),
          name: 'ci-core.log',
          sizeBytes: 256,
          suite: 'core',
          updatedAt: '2026-11-26T08:41:00.000Z',
        },
      ],
      logsDir: '~/.operon/logs/ci',
      runnerAvailable: true,
      runningSuites: [],
    });
  });

  it('renders CI steps inside shadcn Trace, hides directory path, and shows Run CI + raw log button', async () => {
    const errors: unknown[] = [];
    const host = document.createElement('div');
    document.body.append(host);

    const app = createApp({ render: () => h(LogsLocalCiView) });
    app.use(createPinia());
    app.config.errorHandler = (err) => errors.push(err);
    app.mount(host);

    await Promise.resolve();
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 10));
    await nextTick();

    expect(errors).toEqual([]);
    expect(host.textContent).not.toContain('~/.operon/logs/ci');
    expect(host.textContent).toContain('logs.run_btn');
    expect(host.textContent).toContain('logs.view_raw_btn');
    expect(host.querySelector('[data-slot="trace"]')).not.toBeNull();
    expect(host.querySelectorAll('[data-slot="trace-line"]').length).toBe(3);
    expect(
      host.querySelector('[data-slot="trace-line"][data-status="error"]'),
    ).not.toBeNull();
    expect(
      host.querySelector('[data-slot="trace-line"][data-status="running"]'),
    ).not.toBeNull();
    expect(host.textContent).toContain('cargo fmt');
    expect(host.textContent).toContain('cargo test');
    expect(host.textContent).toContain('error: test failed');

    app.unmount();
    host.remove();
  });
});
