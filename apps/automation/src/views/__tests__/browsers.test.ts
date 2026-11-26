import { createApp, h, nextTick, reactive, ref } from 'vue';

import { createPinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AutomationBrowsersView from '../browsers.vue';

const mockFetch = vi.fn();
const mockTenantState = reactive({
  activeId: 'local-default',
  activeName: 'Local Tenant',
  activeSlug: 'local',
  isLoading: false,
  items: [],
});

vi.mock('@operon/kernel', () => ({
  useKernel: () => ({
    api: { daemonPort: 8765, localDaemonFetch: mockFetch },
    events: { navigate: vi.fn(), notify: vi.fn(), openLoginModal: vi.fn() },
    tenant: mockTenantState,
  }),
  useLocalBridgeHeartbeat: () => ({
    checkNow: vi.fn(),
    isHealthy: ref(true),
    isInitialChecking: ref(false),
  }),
}));

const sampleBrowsers = [
  {
    createdAt: '2026-01-01T00:00:00Z',
    extensions: ['automation'],
    fingerprintConfig: {
      deviceMemoryGb: 16,
      hardwareConcurrency: 8,
      osPlatform: 'windows',
      seed: 101,
    },
    groupName: 'marketing',
    id: 'prf_1',
    isDefault: true,
    isOnline: false,
    name: 'Marketing Profile',
    proxy: 'socks5://127.0.0.1:1080',
    startupFlags: [],
    tags: ['sea'],
    tenantId: 'local-default',
    timezone: 'UTC',
    updatedAt: '2026-01-01T00:00:00Z',
    userAgent: null,
  },
  {
    createdAt: '2026-01-02T00:00:00Z',
    extensions: ['automation'],
    fingerprintConfig: {
      deviceMemoryGb: 8,
      hardwareConcurrency: 4,
      osPlatform: 'macos',
      seed: 202,
    },
    groupName: 'qa',
    id: 'prf_2',
    isDefault: false,
    isOnline: true,
    name: 'QA Running',
    proxy: null,
    startupFlags: [],
    tags: ['vip'],
    tenantId: 'local-default',
    timezone: 'UTC',
    updatedAt: '2026-01-02T00:00:00Z',
    userAgent: null,
  },
];

describe('automation browsers view with shared DataTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue(sampleBrowsers);
  });

  it('mounts KPI preset cards, DataTable toolbar, pagination, and profile rows', async () => {
    const errors: unknown[] = [];
    const host = document.createElement('div');
    document.body.append(host);

    const app = createApp({ render: () => h(AutomationBrowsersView) });
    app.use(createPinia());
    app.config.errorHandler = (err) => errors.push(err);
    app.mount(host);

    await nextTick();
    await nextTick();

    expect(errors).toEqual([]);
    expect(host.querySelectorAll('tbody tr').length).toBe(2);
    expect(host.textContent).toContain('Marketing Profile');
    expect(host.textContent).toContain('QA Running');
    expect(host.textContent).toContain('#sea');
    expect(host.textContent).toContain('#vip');
    expect(host.textContent).toContain('Rows per page');

    const autoDetectBtn = [...host.querySelectorAll('button')].find((btn) =>
      btn.textContent?.includes('auto_detect'),
    );
    expect(autoDetectBtn).toBeDefined();
    autoDetectBtn?.click();
    await nextTick();
    await nextTick();
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/browsers/auto-detect', {
      method: 'POST',
    });

    const profileLink = [
      ...host.querySelectorAll<HTMLButtonElement>('tbody button'),
    ].find((btn) => btn.textContent?.includes('Marketing Profile'));
    profileLink?.click();
    await nextTick();
    await nextTick();

    const sheet = document.body.querySelector('[role="dialog"]');
    expect(sheet?.textContent).toContain('common.edit');
    expect(sheet?.innerHTML).toContain('px-5 py-4');
    expect(sheet?.querySelector('[aria-label="common.close"]')).not.toBeNull();
    expect(
      sheet?.querySelector('[title="automation.browsers.detail_copy_id"]'),
    ).not.toBeNull();

    app.unmount();
    host.remove();
  });
});
