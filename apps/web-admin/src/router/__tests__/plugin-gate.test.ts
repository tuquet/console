import type { RouteRecordRaw } from 'vue-router';

import { describe, expect, it } from 'vitest';

import { filterRoutesByPlugins } from '../plugin-gate';

describe('filterRoutesByPlugins', () => {
  it('should return empty array for empty routes input', () => {
    expect(filterRoutesByPlugins([], ['core-iam'])).toEqual([]);
    expect(
      filterRoutesByPlugins(null as unknown as RouteRecordRaw[], ['core-iam']),
    ).toEqual([]);
  });

  it('should retain routes without meta or without meta.plugin', () => {
    const routes: RouteRecordRaw[] = [
      {
        path: '/dashboard',
        name: 'Dashboard',
        children: [
          {
            path: 'analytics',
            name: 'Analytics',
          },
        ],
      } as unknown as RouteRecordRaw,
    ];

    const result = filterRoutesByPlugins(routes, ['core-iam']);
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Dashboard');
    expect(result[0]?.children).toHaveLength(1);
  });

  it('should retain route if required plugin is installed', () => {
    const routes: RouteRecordRaw[] = [
      {
        path: '/fleet',
        name: 'Fleet',
        meta: { plugin: 'runners' },
        children: [
          {
            path: 'devices',
            name: 'Devices',
          },
        ],
      } as unknown as RouteRecordRaw,
    ];

    const result = filterRoutesByPlugins(routes, ['core-iam', 'runners']);
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Fleet');
    expect(result[0]?.children).toHaveLength(1);
  });

  it('should omit route if required plugin is not installed', () => {
    const routes: RouteRecordRaw[] = [
      {
        path: '/automation',
        name: 'Automation',
        meta: { plugin: 'automa' },
        children: [
          {
            path: 'workflows',
            name: 'Workflows',
          },
        ],
      } as unknown as RouteRecordRaw,
    ];

    const result = filterRoutesByPlugins(routes, ['core-iam', 'runners']);
    expect(result).toHaveLength(0);
  });

  it('should filter individual child routes based on their plugin requirement', () => {
    const routes: RouteRecordRaw[] = [
      {
        path: '/system',
        name: 'System',
        meta: { plugin: 'core-iam' },
        children: [
          {
            path: 'plugins',
            name: 'Plugins',
            meta: { plugin: 'core-iam' },
          },
          {
            path: 'plans',
            name: 'Plans',
            meta: { plugin: 'subscriptions' },
          },
        ],
      } as unknown as RouteRecordRaw,
    ];

    // Case 1: subscriptions is NOT installed
    const withoutSubs = filterRoutesByPlugins(routes, ['core-iam']);
    expect(withoutSubs).toHaveLength(1);
    expect(withoutSubs[0]?.children).toHaveLength(1);
    expect(withoutSubs[0]?.children?.[0]?.name).toBe('Plugins');

    // Case 2: subscriptions IS installed
    const withSubs = filterRoutesByPlugins(routes, [
      'core-iam',
      'subscriptions',
    ]);
    expect(withSubs).toHaveLength(1);
    expect(withSubs[0]?.children).toHaveLength(2);
    expect(withSubs[0]?.children?.[1]?.name).toBe('Plans');
  });

  it('should prune parent route if it has no component and all its children were filtered out', () => {
    const routes: RouteRecordRaw[] = [
      {
        path: '/system',
        name: 'System',
        // No component specified (layout parent)
        children: [
          {
            path: 'plans',
            name: 'Plans',
            meta: { plugin: 'subscriptions' },
          },
        ],
      } as unknown as RouteRecordRaw,
    ];

    const result = filterRoutesByPlugins(routes, ['core-iam']);
    expect(result).toHaveLength(0);
  });

  it('should retain parent route if it has a component even when all children were filtered', () => {
    const routes: RouteRecordRaw[] = [
      {
        path: '/standalone',
        name: 'Standalone',
        component: () => Promise.resolve({}),
        children: [
          {
            path: 'sub',
            name: 'Sub',
            meta: { plugin: 'missing-plugin' },
          },
        ],
      } as unknown as RouteRecordRaw,
    ];

    const result = filterRoutesByPlugins(routes, ['core-iam']);
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Standalone');
    expect(result[0]?.children).toHaveLength(0);
  });
});
