import { createApp, defineComponent, h, nextTick } from 'vue';

import { describe, expect, it, vi } from 'vitest';

import AuthLayout from '../../../layouts/auth.vue';
import SpecterGhostBanner, {
  computeSkirtWaveDisplacement,
  createGhostPointerState,
  nextBannerScene,
  stepGhostPointer,
} from '../specter-ghost-banner.vue';

vi.mock('@vben/preferences', () => ({
  preferences: {
    app: { name: 'Specter' },
    logo: { source: '/logo.svg', sourceDark: '/logo-dark.svg' },
  },
  usePreferences: () => ({
    isDark: { value: true },
  }),
}));

vi.mock('@vben/layouts', () => ({
  AuthPageLayout: defineComponent({
    name: 'AuthPageLayoutStub',
    setup(_props, { slots }) {
      return () => h('div', { class: 'auth-layout-stub' }, slots.slogan?.());
    },
  }),
}));

describe('specter-ghost-banner (3d specter ghost)', () => {
  it('damps pointer coordinates smoothly toward target and decays waveBoost', () => {
    const state = createGhostPointerState();
    state.targetX = 0.8;
    state.targetY = -0.6;
    state.waveBoost = 1;

    stepGhostPointer(state, 0.1);

    expect(state.currentX).toBeGreaterThan(0.3);
    expect(state.currentX).toBeLessThan(0.8);
    expect(state.currentY).toBeLessThan(-0.2);
    expect(state.currentY).toBeGreaterThan(-0.6);
    expect(state.waveBoost).toBeLessThan(1);
    expect(state.waveBoost).toBeGreaterThanOrEqual(0);
  });

  it('keeps upper head dome stable while displacing lower skirt hem with harmonic waves', () => {
    const upper = computeSkirtWaveDisplacement(0.5, 0.9, 0.5, 1.2);
    expect(upper.dx).toBe(0);
    expect(upper.dy).toBe(0);
    expect(upper.dz).toBe(0);

    const lowerA = computeSkirtWaveDisplacement(0.7, -1.1, 0.4, 0.5);
    const lowerB = computeSkirtWaveDisplacement(0.7, -1.1, 0.4, 1.8);
    expect(Math.hypot(lowerA.dx, lowerA.dy, lowerA.dz)).toBeGreaterThan(0.01);
    expect(lowerA.dx).not.toBeCloseTo(lowerB.dx, 3);
  });

  it('cycles banner scenes across phone, robot, and ghost', () => {
    expect(nextBannerScene('phone')).toBe('robot');
    expect(nextBannerScene('robot')).toBe('ghost');
    expect(nextBannerScene('ghost')).toBe('phone');
  });

  it('mounts canvas and spotlight SVG and unmounts cleanly', async () => {
    const container = document.createElement('div');
    document.body.append(container);
    const app = createApp(SpecterGhostBanner);
    try {
      app.mount(container);
      await nextTick();
      expect(container.querySelector('canvas')).not.toBeNull();
      expect(container.querySelector('svg.animate-spotlight')).not.toBeNull();
    } finally {
      app.unmount();
      container.remove();
    }
  });

  it('switches across phone, robot 3d, ghost 3d, and random modes in auth.vue and persists to localStorage', async () => {
    window.localStorage.removeItem('specter:auth-banner-mode');
    const container = document.createElement('div');
    document.body.append(container);
    const app = createApp(AuthLayout);
    try {
      app.mount(container);
      await nextTick();

      const buttons = [...container.querySelectorAll('button')];
      expect(buttons.map((b) => b.textContent?.trim())).toEqual([
        'phone',
        'robot 3d',
        'ghost 3d',
        'random',
      ]);

      // Switch to ghost 3d
      buttons[2]?.click();
      await nextTick();
      expect(window.localStorage.getItem('specter:auth-banner-mode')).toBe(
        'ghost',
      );
      expect(container.querySelector('.specter-ghost-banner')).not.toBeNull();

      // Switch to robot 3d
      buttons[1]?.click();
      await nextTick();
      expect(window.localStorage.getItem('specter:auth-banner-mode')).toBe(
        'robot',
      );
      expect(container.querySelector('.spline-robot-banner')).not.toBeNull();

      // Switch to random
      buttons[3]?.click();
      await nextTick();
      expect(window.localStorage.getItem('specter:auth-banner-mode')).toBe(
        'random',
      );
    } finally {
      app.unmount();
      container.remove();
    }
  });
});
