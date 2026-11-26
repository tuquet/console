import { createApp, h, nextTick, reactive } from 'vue';

import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { createPinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';

import BrowserDetailSheet from '../browser-detail-sheet.vue';

const mockFetch = vi.fn();

vi.mock('@operon/kernel', () => ({
  useKernel: () => ({
    api: { daemonPort: 8765, localDaemonFetch: mockFetch },
    events: { navigate: vi.fn(), notify: vi.fn(), openLoginModal: vi.fn() },
    workspace: reactive({
      activeId: 'local-default',
      activeName: 'Local Workspace',
      activeSlug: 'local',
      isLoading: false,
      items: [
        { id: 'local-default', name: 'Local Workspace', slug: 'local' },
        { id: 'ws-2', name: 'Marketing', slug: 'mkt' },
      ],
    }),
  }),
}));

describe('browserDetailSheet (SchemaSheet)', () => {
  it('renders multi-tab profile inspector with overview, fingerprint, extensions, and header actions', async () => {
    const errors: unknown[] = [];
    const onEdit = vi.fn();
    const host = document.createElement('div');
    document.body.append(host);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const app = createApp({
      render: () =>
        h(BrowserDetailSheet, {
          onEdit,
          open: true,
          profile: {
            debuggingPort: 9222,
            diskSizeBytes: 5_242_880,
            extensions: ['ublock'],
            fingerprintConfig: {
              deviceMemoryGb: 16,
              hardwareConcurrency: 8,
              lang: 'en-US',
              osPlatform: 'windows',
              screenHeight: 1080,
              screenWidth: 1920,
              seed: 1337,
              webrtcMode: 'proxy_shielded',
            },
            groupName: 'growth',
            id: 'prof-1',
            isDefault: false,
            isOnline: true,
            name: 'Warm Account #1',
            pid: 4242,
            proxy: 'socks5://127.0.0.1:1080',
            tags: ['us', 'tiktok'],
            timezone: 'America/New_York',
            workspaceId: 'local-default',
            wsUrl: 'ws://127.0.0.1:9222/devtools/browser/abc',
          } as any,
        }),
    });
    app.use(createPinia());
    app.use(VueQueryPlugin, { queryClient });
    app.config.errorHandler = (err) => errors.push(err);
    app.mount(host);
    await nextTick();

    expect(errors).toEqual([]);
    expect(document.body.textContent).toContain('Warm Account #1');
    expect(document.body.textContent).toContain('prof-1');
    expect(document.body.textContent).toContain('5.00 MB');
    expect(document.body.textContent).toContain('#us');
    expect(document.body.textContent).toContain('socks5://127.0.0.1:1080');

    // Click Edit button from header-bar actions
    const editBtn = [...document.body.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('common.edit'),
    );
    editBtn?.click();
    await nextTick();
    expect(onEdit).toHaveBeenCalledTimes(1);

    // Switch to Fingerprint tab (Reka TabsTrigger activates automatically on focus / mousedown)
    const fpTab = [...document.body.querySelectorAll('[role="tab"]')].find(
      (el) => el.textContent?.includes('detail_fingerprint'),
    ) as HTMLElement | undefined;
    fpTab?.focus();
    fpTab?.dispatchEvent(new FocusEvent('focus'));
    await nextTick();
    await nextTick();
    expect(fpTab?.dataset.state).toBe('active');
    expect(document.body.textContent).toContain('1920x1080');
    expect(document.body.textContent).toContain('proxy_shielded');

    app.unmount();
    host.remove();
  });
});
