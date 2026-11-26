import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useBrowserDriversStore } from '../browser-drivers';
import { resetFallbackQueryClient } from '../query-client';

const mockFetch = vi.fn();
const mockPushNotification = vi.fn();
const mockNotify = vi.fn();

vi.mock('@operon/kernel', () => ({
  useKernel: () => ({
    api: {
      daemonPort: 8765,
      localDaemonFetch: mockFetch,
    },
    events: {
      navigate: vi.fn(),
      notify: mockNotify,
      openLoginModal: vi.fn(),
    },
    notifications: {
      getPermission: vi.fn(),
      platform: 'web',
      push: mockPushNotification,
      requestPermission: vi.fn(),
    },
  }),
}));

describe('useBrowserDriversStore', () => {
  beforeEach(() => {
    resetFallbackQueryClient();
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ activeVersion: '148', releases: [] });
  });

  it('tracks downloading -> extracting -> ready progress and notifies on completion', () => {
    const store = useBrowserDriversStore();

    store.applyProgressEvent({
      downloadedBytes: 50_000_000,
      percent: 45,
      stage: 'downloading',
      totalBytes: 100_000_000,
      version: '148',
    });

    expect(store.driverProgress['148']).toEqual({
      downloadedBytes: 50_000_000,
      error: undefined,
      percent: 45,
      stage: 'downloading',
      totalBytes: 100_000_000,
    });

    store.applyProgressEvent({
      percent: 90,
      stage: 'extracting',
      version: '148',
    });

    expect(store.driverProgress['148']?.stage).toBe('extracting');
    expect(store.driverProgress['148']?.downloadedBytes).toBe(50_000_000);

    store.applyProgressEvent({
      percent: 100,
      stage: 'ready',
      version: '148',
    });

    expect(mockPushNotification).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'success' }),
    );
  });

  it('pushes download errors into kernel notifications once per error', () => {
    const store = useBrowserDriversStore();

    store.applyProgressEvent({
      error: 'HTTP 502 Bad Gateway',
      percent: 0,
      stage: 'error',
      version: '150',
    });

    expect(store.driverProgress['150']?.stage).toBe('error');
    expect(mockPushNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        body: 'HTTP 502 Bad Gateway',
        severity: 'error',
      }),
    );
  });
});
