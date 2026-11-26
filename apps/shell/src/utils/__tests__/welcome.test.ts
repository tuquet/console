import { beforeEach, describe, expect, it } from 'vitest';

import {
  buildWelcomeLocation,
  clearWelcomeRedirect,
  hasDaemonSeen,
  hasPendingWelcomeRedirect,
  markDaemonSeen,
  resolveWelcomeRedirect,
  saveWelcomeRedirect,
} from '../welcome';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    key: (index) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
    removeItem: (key) => {
      store.delete(key);
    },
    setItem: (key, value) => {
      store.set(key, value);
    },
  };
}

describe('welcome daemon & redirect helpers', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: createMemoryStorage(),
    });
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      value: createMemoryStorage(),
    });
  });

  it('tracks whether the local Operon daemon was ever seen', () => {
    expect(hasDaemonSeen()).toBe(false);
    markDaemonSeen();
    expect(hasDaemonSeen()).toBe(true);
  });

  it('caches and resolves safe deep-link redirect paths across query & session cache', () => {
    expect(saveWelcomeRedirect('/automation/overview')).toBe(
      '/automation/overview',
    );
    expect(hasPendingWelcomeRedirect()).toBe(true);
    expect(resolveWelcomeRedirect(undefined, '/dashboard/overview')).toBe(
      '/automation/overview',
    );
    expect(resolveWelcomeRedirect('/workspaces', '/dashboard/overview')).toBe(
      '/workspaces',
    );

    clearWelcomeRedirect();
    expect(hasPendingWelcomeRedirect()).toBe(false);
    expect(resolveWelcomeRedirect(undefined, '/dashboard/overview')).toBe(
      '/dashboard/overview',
    );
  });

  it('ignores unsafe external redirects and builds clean /welcome locations', () => {
    expect(saveWelcomeRedirect('https://evil.example/phish')).toBeNull();
    expect(saveWelcomeRedirect('/welcome')).toBeNull();
    expect(saveWelcomeRedirect('/auth/login')).toBeNull();

    expect(buildWelcomeLocation('/dashboard/overview')).toEqual({
      path: '/welcome',
    });
    expect(buildWelcomeLocation('/automation/overview')).toEqual({
      path: '/welcome',
      query: { redirect: '/automation/overview' },
    });
  });
});
