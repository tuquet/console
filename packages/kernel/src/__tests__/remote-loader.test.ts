import type { MicroAppManifest } from '../remote-loader';

import { describe, expect, it } from 'vitest';

import { createRemoteRoute } from '../remote-loader';

describe('createRemoteRoute', () => {
  const dummyManifest: MicroAppManifest = {
    id: 'dummy',
    name: 'Dummy App',
    defaultPath: 'overview',
    routes: (t) => [
      {
        path: 'overview',
        name: 'DummyOverview',
        component: () =>
          Promise.resolve({ default: { name: 'DummyComponent' } }),
        meta: { title: t('dummy.title') },
      },
      {
        path: 'static-stub',
        name: 'DummyStatic',
        meta: { title: t('dummy.static') },
      },
    ],
  };

  it('wraps function components into dynamic async components and preserves route structure', () => {
    const wrappedRoutes = createRemoteRoute({
      appId: 'dummy',
      devPort: 9999,
      manifest: dummyManifest,
      t: (key) => key,
      preferDynamic: false,
    });

    expect(wrappedRoutes).toHaveLength(2);
    expect(wrappedRoutes[0]?.name).toBe('DummyOverview');
    expect(wrappedRoutes[0]?.path).toBe('overview');
    expect(wrappedRoutes[0]?.meta?.title).toBe('dummy.title');
    expect(typeof wrappedRoutes[0]?.component).toBe('object');

    // Static route without component is preserved as-is
    expect(wrappedRoutes[1]?.name).toBe('DummyStatic');
    expect(wrappedRoutes[1]?.component).toBeUndefined();
  });

  it('falls back to bundled component when dev server is offline', async () => {
    const wrappedRoutes = createRemoteRoute({
      appId: 'dummy',
      devPort: 9999,
      manifest: dummyManifest,
      t: (key) => key,
      preferDynamic: true,
    });

    const asyncComp = wrappedRoutes[0]?.component as {
      __asyncLoader?: () => Promise<unknown>;
    };
    expect(asyncComp).toBeDefined();
    expect(typeof asyncComp.__asyncLoader).toBe('function');

    const loader = asyncComp.__asyncLoader;
    expect(loader).toBeDefined();
    if (!loader) {
      throw new Error('Async loader is not defined');
    }

    const resolved = await loader();
    expect(resolved).toEqual({ default: { name: 'DummyComponent' } });
  });
});
