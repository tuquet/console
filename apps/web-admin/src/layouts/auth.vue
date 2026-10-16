<script lang="ts" setup>
import { computed } from 'vue';

import { AuthPageLayout } from '@vben/layouts';
import { preferences, usePreferences } from '@vben/preferences';

import HairlinePhoneBanner from '#/components/common/hairline-phone-banner.vue';
import SplineRobotBanner from '#/components/common/spline-robot-banner.vue';

const { isDark } = usePreferences();

const appName = computed(() => preferences.app.name);
const logo = computed(() => preferences.logo.source);
const logoDark = computed(() => preferences.logo.sourceDark);
</script>

<template>
  <AuthPageLayout :app-name="appName" :logo="logo" :logo-dark="logoDark">
    <template #slogan>
      <div class="relative flex size-full items-center justify-center">
        <!-- High-performance theme adaptive banners with KeepAlive caching -->
        <KeepAlive>
          <SplineRobotBanner v-if="isDark" key="robot" />
          <HairlinePhoneBanner v-else key="phone" />
        </KeepAlive>
      </div>
    </template>
  </AuthPageLayout>
</template>
