import { reactive } from 'vue';

import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildSearchMatcher,
  classifyLineSeverity,
  extractPackageTag,
  isNoiseLine,
  parseCiLogsResponse,
  splitHighlightSegments,
} from '../../utils/ci-log-parser';
import { useCiLogsStore } from '../ci-logs';

const mockFetch = vi.fn();

vi.mock('@operon/kernel', () => ({
  useKernel: () => ({
    api: {
      daemonPort: 8765,
      localDaemonFetch: mockFetch,
    },
    events: {
      navigate: vi.fn(),
      notify: vi.fn(),
      openLoginModal: vi.fn(),
    },
    workspace: reactive({ activeId: 'local-default' }),
  }),
}));

const sampleResponse = {
  logsDir: 'C:/repo/.logs',
  cache: {
    glossary: {
      hash: 'abc123',
      at: '2026-11-26T09:00:00.000Z',
    },
  },
  files: [
    {
      name: 'ci-core.log',
      suite: 'core',
      sizeBytes: 512,
      updatedAt: '2026-11-26T09:05:00.000Z',
      content: [
        '=== local-ci: core (2026-11-26T08:40:17.647Z, main @ 91366ae5) ===',
        '',
        '> [cargo fmt] cargo fmt --all -- --check',
        '',
        '> [cargo clippy] cargo clippy --workspace --all-targets -- -D warnings',
        'warning: unused variable `x`',
        '',
        '> [cargo test] cargo test --workspace --lib --bins --tests',
        'error: failed to remove `crates/cli/target/operon.exe`',
        'Caused by:',
        '  Access is denied. (os error 5)',
        '',
        '--- Summary: core (74.5s) ---',
        '[PASS] cargo fmt (2.7s)',
        '[PASS] cargo clippy (15.9s)',
        '[FAIL 101] cargo test (56.0s)',
      ].join('\n'),
    },
    {
      name: 'ci-console.log',
      suite: 'console',
      sizeBytes: 1024,
      updatedAt: '2026-11-26T09:08:00.000Z',
      content: [
        '=== local-ci: console (2026-11-26T09:05:07.623Z, main @ 91366ae5) ===',
        '> [check:type] pnpm check:type',
        '@operon/automation:typecheck: cache hit, replaying logs 123',
        '@operon/logs:typecheck: ✓ passed',
        '--- Summary: console (10.0s) ---',
        '[PASS] check:type (10.0s)',
      ].join('\n'),
    },
  ],
};

describe('ci-log-parser & store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockFetch.mockResolvedValue(sampleResponse);
  });

  it('parses suite status, steps, severities, and packages cleanly', () => {
    const runs = parseCiLogsResponse(sampleResponse);
    expect(runs.map((r) => r.suite)).toEqual(['core', 'console']);

    const coreRun = runs[0];
    expect(coreRun?.status).toBe('fail');
    expect(coreRun?.steps).toHaveLength(3);
    expect(coreRun?.steps[0]?.lines).toHaveLength(0);
    expect(coreRun?.steps[1]?.lines.map((l) => l.text)).toEqual([
      'warning: unused variable `x`',
    ]);
    expect(coreRun?.steps[2]?.lines).toHaveLength(3);
    expect(coreRun?.steps[2]?.status).toBe('fail');
    expect(coreRun?.steps[2]?.exitCode).toBe(101);
    expect(coreRun?.steps[2]?.errorCount).toBe(3);

    expect(classifyLineSeverity('warning: unused')).toBe('warn');
    expect(isNoiseLine('pkg: cache hit, replaying logs abc')).toBe(true);
    expect(extractPackageTag('crates/cli/src/main.rs:5')).toBe('crates/cli');
  });

  it('auto-selects failing suite and filters by severity, scope, regex, and noise', async () => {
    const store = useCiLogsStore();
    await store.fetchLogs();

    expect(mockFetch).toHaveBeenCalledWith('/api/v1/system/ci-logs');
    expect(store.selectedSuite).toBe('core');

    store.selectSuite('console');
    expect(store.availableScopes).toEqual([
      '@operon/automation',
      '@operon/logs',
    ]);
    expect(store.totalMatchedLines).toBe(1);

    store.hideNoise = false;
    expect(store.totalMatchedLines).toBe(2);

    store.scopeFilter = '@operon/logs';
    expect(store.totalMatchedLines).toBe(1);

    store.selectSuite('core');
    store.severityFilter = 'error';
    expect(store.totalMatchedLines).toBe(3);

    store.searchQuery = 'Access.*denied';
    store.regexEnabled = true;
    expect(store.searchError).toBeNull();
    expect(store.totalMatchedLines).toBe(1);
  });

  it('marks a step failed when it has errors but no summary line yet', () => {
    const runs = parseCiLogsResponse({
      logsDir: 'C:/repo/.logs',
      cache: {},
      files: [
        {
          name: 'ci-console.log',
          suite: 'console',
          sizeBytes: 256,
          updatedAt: '2026-11-26T09:08:00.000Z',
          content: [
            '=== local-ci: console (2026-11-26T09:05:07.623Z, main @ 91366ae5) ===',
            '> [test:unit] pnpm test:unit',
            'Error: unable to verify the first certificate',
            '> [check:dep] pnpm check:dep',
            '$ vsh check-dep',
          ].join('\n'),
        },
      ],
    });

    const run = runs[0];
    expect(run?.steps[0]?.status).toBe('fail');
    expect(run?.steps[1]?.status).toBe('running');
    expect(run?.status).toBe('fail');
  });

  it('splits highlight segments safely without HTML injection', () => {
    const { matcher } = buildSearchMatcher('error', false);
    const segments = splitHighlightSegments('found error here', matcher);
    expect(segments).toEqual([
      { match: false, text: 'found ' },
      { match: true, text: 'error' },
      { match: false, text: ' here' },
    ]);
  });

  it('triggers standalone CI run and enables live tail', async () => {
    setActivePinia(createPinia());
    mockFetch
      .mockResolvedValueOnce({
        ...sampleResponse,
        runnerAvailable: true,
        runningSuites: [],
      })
      .mockResolvedValueOnce({ started: true, suite: 'core' })
      .mockResolvedValueOnce({
        ...sampleResponse,
        runnerAvailable: true,
        runningSuites: ['core'],
      });

    const store = useCiLogsStore();
    await store.fetchLogs();
    expect(store.runnerAvailable).toBe(true);

    const ok = await store.runCi('core');
    expect(ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/system/ci-run',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(store.liveTail).toBe(true);
    store.setLiveTail(false);
  });
});
