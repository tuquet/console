<script lang="ts" setup>
import { computed, ref } from 'vue';

import { AuthPageLayout } from '@vben/layouts';
import { preferences } from '@vben/preferences';

import HairlinePhoneBanner from '#/components/common/hairline-phone-banner.vue';
import SplineRobotBanner from '#/components/common/spline-robot-banner.vue';

type BannerMode = 'phone' | 'random' | 'robot';
type ActiveScene = 'phone' | 'robot';

const STORAGE_KEY = 'specter:auth-banner-mode';

function getInitialMode(): BannerMode {
  if (typeof window === 'undefined') return 'phone';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'phone' || saved === 'robot' || saved === 'random') {
    return saved;
  }
  return 'phone';
}

const bannerMode = ref<BannerMode>(getInitialMode());
const randomPick = ref<ActiveScene>(Math.random() < 0.5 ? 'phone' : 'robot');

const activeScene = computed<ActiveScene>(() => {
  if (bannerMode.value === 'random') {
    return randomPick.value;
  }
  return bannerMode.value;
});

function selectMode(mode: BannerMode) {
  if (mode === 'random') {
    randomPick.value = activeScene.value === 'phone' ? 'robot' : 'phone';
  }
  bannerMode.value = mode;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, mode);
  }
}

const appName = computed(() => preferences.app.name);
const logo = computed(() => preferences.logo.source);
const logoDark = computed(() => preferences.logo.sourceDark);
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
        <SplineRobotBanner v-else />

        <!-- Minimal monochrome scene switcher pill -->
        <div
          class="absolute bottom-5 left-5 z-30 inline-flex items-center gap-0.5 rounded-full border border-border/70 bg-background/80 p-1 font-mono text-[11px] backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/80"
        >
          <button
            type="button"
            class=" rounded-full px-2.5 py-0.5 transition-colors"
            :class="
              bannerMode === 'phone'
                ? 'bg-foreground text-background font-medium'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="selectMode('phone')"
          >
            phone
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
            robot 3d
          </button>
          <button
            type="button"
            title="Tự động đổi ngẫu nhiên mỗi lần tải trang (nhấn để đổi ngay)"
            class="rounded-full px-2.5 py-0.5 transition-colors"
            :class="
              bannerMode === 'random'
                ? 'bg-foreground text-background font-medium'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="selectMode('random')"
          >
            random
          </button>
        </div>
      </div>
    </template>
  </AuthPageLayout>
</template>
