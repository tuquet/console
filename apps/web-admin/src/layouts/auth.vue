<script lang="ts" setup>
import type { ActiveBannerScene } from '#/components/common/specter-ghost-banner.vue';

import { computed, ref } from 'vue';

import { STORAGE_KEYS } from '@vben/constants';
import { AuthPageLayout } from '@vben/layouts';
import { $t } from '@vben/locales';
import { preferences } from '@vben/preferences';

import HairlinePhoneBanner from '#/components/common/hairline-phone-banner.vue';
import SpecterGhostBanner, {
  nextBannerScene,
} from '#/components/common/specter-ghost-banner.vue';
import SplineRobotBanner from '#/components/common/spline-robot-banner.vue';

type BannerMode = 'ghost' | 'phone' | 'random' | 'robot';

const STORAGE_KEY = STORAGE_KEYS.AUTH_BANNER_MODE;
const SCENES: ActiveBannerScene[] = ['phone', 'robot', 'ghost'];

function getInitialMode(): BannerMode {
  if (typeof window === 'undefined') return 'phone';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (
    saved === 'phone' ||
    saved === 'robot' ||
    saved === 'ghost' ||
    saved === 'random'
  ) {
    return saved;
  }
  return 'phone';
}

const bannerMode = ref<BannerMode>(getInitialMode());
const randomPick = ref<ActiveBannerScene>(
  SCENES[Math.floor(Math.random() * SCENES.length)] ?? 'phone',
);

const activeScene = computed<ActiveBannerScene>(() => {
  if (bannerMode.value === 'random') {
    return randomPick.value;
  }
  return bannerMode.value;
});

function selectMode(mode: BannerMode) {
  if (mode === 'random') {
    randomPick.value = nextBannerScene(activeScene.value);
  }
  bannerMode.value = mode;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, mode);
  }
}

const appName = computed(() => preferences.app.name);
const logo = computed(() => preferences.logo.source);
const logoDark = computed(() => preferences.logo.sourceDark);

function labelOrFallback(translated: string, key: string, fallback: string) {
  return translated === key ? fallback : translated;
}
</script>

<template>
  <AuthPageLayout :app-name="appName" :logo="logo" :logo-dark="logoDark">
    <template #slogan>
      <div class="relative flex size-full items-center justify-center">
        <div
          v-if="activeScene === 'phone'"
          class="flex size-full items-center justify-center px-8"
        >
          <HairlinePhoneBanner />
        </div>
        <SplineRobotBanner v-else-if="activeScene === 'robot'" />
        <SpecterGhostBanner v-else />

        <!-- Minimal monochrome scene switcher pill -->
        <div
          class="absolute bottom-5 left-5 z-30 inline-flex items-center gap-0.5 rounded-full border border-border/70 bg-background/80 p-1 font-mono text-2xs backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/80"
        >
          <button
            type="button"
            class="rounded-full px-2.5 py-0.5 transition-colors"
            :class="
              bannerMode === 'phone'
                ? 'bg-foreground text-background font-medium'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="selectMode('phone')"
          >
            {{
              labelOrFallback(
                $t('authentication.bannerPhone'),
                'authentication.bannerPhone',
                'phone',
              )
            }}
          </button>
          <button
            type="button"
            class="rounded-full px-2.5 py-0.5 transition-colors"
            :class="
              bannerMode === 'robot'
                ? 'bg-foreground text-background font-medium'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="selectMode('robot')"
          >
            {{
              labelOrFallback(
                $t('authentication.bannerRobot'),
                'authentication.bannerRobot',
                'robot 3d',
              )
            }}
          </button>
          <button
            type="button"
            class="rounded-full px-2.5 py-0.5 transition-colors"
            :class="
              bannerMode === 'ghost'
                ? 'bg-foreground text-background font-medium'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="selectMode('ghost')"
          >
            {{
              labelOrFallback(
                $t('authentication.bannerGhost'),
                'authentication.bannerGhost',
                'ghost 3d',
              )
            }}
          </button>
          <button
            type="button"
            :title="$t('authentication.bannerRandomTooltip')"
            class="rounded-full px-2.5 py-0.5 transition-colors"
            :class="
              bannerMode === 'random'
                ? 'bg-foreground text-background font-medium'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="selectMode('random')"
          >
            {{
              labelOrFallback(
                $t('authentication.bannerRandom'),
                'authentication.bannerRandom',
                'random',
              )
            }}
          </button>
        </div>
      </div>
    </template>
  </AuthPageLayout>
</template>
