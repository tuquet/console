import { createApp, h, nextTick, reactive, ref } from 'vue';

import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { createPinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useBrowserDriversStore } from '../../stores/browser-drivers';
import AutomationDriversView from '../drivers.vue';

const mockFetch = vi.fn();
const mockPushNotification = vi.fn();
const mockWorkspaceState = reactive({
  activeId: 'local-default',
  activeName: 'Local Workspace',
  activeSlug: 'local',
  isLoading: false,
  items: [],
});

vi.mock('@operon/kernel', () => ({
  useKernel: () => ({
    api: { daemonPort: 8765, localDaemonFetch: mockFetch },
    events: { navigate: vi.fn(), notify: vi.fn(), openLoginModal: vi.fn() },
    notifications: {
      getPermission: vi.fn(),
      platform: 'web',
      push: mockPushNotification,
      requestPermission: vi.fn(),
    },
    workspace: mockWorkspaceState,
  }),
  useDaemonHeartbeat: () => ({
    checkNow: vi.fn(),
    isHealthy: ref(true),
    isInitialChecking: ref(false),
  }),
}));

const sampleDrivers = {
  activeVersion: '148.0.7778.215',
  releases: [
    {
      channel: 'lts',
      installed: true,
      isActive: true,
      notes: 'Golden LTS Chromium',
      sizeMb: 185,
      status: 'recommended',
      tag: 'v148.0.7778.215',
      version: '148.0.7778.215',
    },
    {
      channel: 'latest',
      installed: false,
      isActive: false,
      notes: 'Nightly testing release',
      sizeMb: 194,
      status: 'buggy',
      tag: 'v150.0.7871.186',
      version: '150.0.7871.186',
    },
  ],
};

describe('automation drivers DataTable view', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue(sampleDrivers);
  });

  it('mounts KPI preset cards, DataTable rows, and live download progress', async () => {
    const errors: unknown[] = [];
    const host = document.createElement('div');
    document.body.append(host);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const pinia = createPinia();
    const app = createApp({ render: () => h(AutomationDriversView) });
    app.use(pinia);
    app.use(VueQueryPlugin, { queryClient });
    app.config.errorHandler = (err) => errors.push(err);
    app.mount(host);

    await Promise.resolve();
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 15));
    await nextTick();

    expect(errors).toEqual([]);
    expect(host.querySelectorAll('tbody tr').length).toBe(2);
    expect(host.textContent).toContain('v148.0.7778.215');
    expect(host.textContent).toContain('v150.0.7871.186');
    expect(host.textContent).toContain('Golden LTS Chromium');
    expect(host.textContent).toContain('Rows per page');

    const driversStore = useBrowserDriversStore(pinia);
    driversStore.applyProgressEvent({
      downloadedBytes: 52_428_800,
      percent: 45,
      stage: 'downloading',
      totalBytes: 104_857_600,
      version: '150.0.7871.186',
    });
    await nextTick();

    const progressBadge = host.querySelector('[title*="50.0 / 100.0 MB"]');
    expect(progressBadge?.textContent).toContain('45%');

    driversStore.applyProgressEvent({
      error: 'Network timeout',
      percent: 0,
      stage: 'error',
      version: '150.0.7871.186',
    });
    await nextTick();

    const errorBadge = host.querySelector('[title="Network timeout"]');
    expect(errorBadge?.textContent).toContain('drivers_state_failed');

    // Click installed LTS row to open SchemaSheet detail view
    const firstRow = host.querySelector('tbody tr') as HTMLElement | null;
    firstRow?.click();
    await nextTick();

    expect(document.body.textContent).toContain('Golden LTS Chromium');
    expect(document.body.textContent).toContain('driver_uninstall_btn');

    app.unmount();
    host.remove();
  });
});
