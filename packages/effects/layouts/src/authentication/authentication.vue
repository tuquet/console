<script setup lang="ts">
import type { ToolbarType } from './types';

import { computed } from 'vue';

import { preferences, usePreferences } from '@vben/preferences';

import { Copyright } from '../basic/copyright';
import AuthenticationFormView from './form.vue';
import Toolbar from './toolbar.vue';

interface Props {
  appName?: string;
  logo?: string;
  logoDark?: string;
  pageTitle?: string;
  pageDescription?: string;
  sloganImage?: string;
  toolbar?: boolean;
  copyright?: boolean;
  toolbarList?: ToolbarType[];
  clickLogo?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  appName: '',
  copyright: true,
  logo: '',
  logoDark: '',
  pageDescription: '',
  pageTitle: '',
  sloganImage: '/illustrations/specter-waving.svg',
  toolbar: true,
  toolbarList: () => ['color', 'language', 'layout', 'theme'],
  clickLogo: () => {},
});

const { authPanelCenter, authPanelLeft, authPanelRight, isDark } =
  usePreferences();

/**
 * Select appropriate logo icon based on theme
 */
const logoSrc = computed(() => {
  // If dark theme and logoDark is provided, use dark theme logo
  if (isDark.value && props.logoDark) {
    return props.logoDark;
  }
  // Otherwise use default logo
  return props.logo;
});
</script>

<template>
  <div
    :class="[isDark ? 'dark' : '']"
    class="flex min-h-full flex-1 overflow-x-hidden select-none"
  >
    <template v-if="toolbar">
      <slot name="toolbar">
        <Toolbar :toolbar-list="toolbarList" />
      </slot>
    </template>
    <!-- Left authentication panel -->
    <AuthenticationFormView
      v-if="authPanelLeft"
      class="min-h-full w-2/5 flex-1"
      data-side="left"
    >
      <template v-if="copyright" #copyright>
        <slot name="copyright">
          <Copyright
            v-if="preferences.copyright.enable"
            v-bind="preferences.copyright"
          />
        </slot>
      </template>
    </AuthenticationFormView>

    <slot name="logo">
      <!-- Header logo and application name -->
      <div
        v-if="logoSrc || appName"
        class="absolute top-0 left-0 z-10 flex flex-1"
        @click="clickLogo"
      >
        <div
          class="mt-4 ml-4 flex flex-1 items-center text-foreground sm:top-6 sm:left-6 lg:text-foreground"
        >
          <img
            v-if="logoSrc"
            :key="logoSrc"
            :alt="appName"
            :src="logoSrc"
            class="mr-2"
            width="42"
          />
          <p v-if="appName" class="m-0 text-xl font-medium">
            {{ appName }}
          </p>
        </div>
      </div>
    </slot>

    <!-- System presentation -->
    <div
      v-if="!authPanelCenter"
      class="relative hidden w-0 flex-1 border-x border-border/50 lg:block dark:border-white/[0.05]"
    >
      <div
        class="absolute inset-0 size-full bg-[#fafafa] dark:bg-[#0a0a0a]"
      >
        <div class="login-background absolute top-0 left-0 size-full"></div>
        <div
          :key="authPanelLeft ? 'left' : authPanelRight ? 'right' : 'center'"
          class="relative flex-col-center size-full"
          :class="{
            'enter-x': authPanelLeft,
            '-enter-x': authPanelRight,
          }"
        >
          <slot name="slogan">
            <img
              :alt="appName"
              :src="sloganImage || '/illustrations/specter-waving.svg'"
              class="h-64 w-2/5 animate-float object-contain"
            />
          </slot>
          <div
            v-if="pageTitle"
            class="text-1xl mt-6 font-sans text-foreground lg:text-2xl"
          >
            {{ pageTitle }}
          </div>
          <div v-if="pageDescription" class="mt-2 dark:text-muted-foreground">
            {{ pageDescription }}
          </div>
        </div>
      </div>
    </div>

    <!-- Center authentication panel -->
    <div v-if="authPanelCenter" class="relative flex-center w-full">
      <div class="login-background absolute top-0 left-0 size-full"></div>
      <AuthenticationFormView
        class="w-full rounded-3xl pb-20 shadow-float shadow-primary/5 md:w-2/3 md:bg-background lg:w-1/2 xl:w-[36%]"
        data-side="bottom"
      >
        <template v-if="copyright" #copyright>
          <slot name="copyright">
            <Copyright
              v-if="preferences.copyright.enable"
              v-bind="preferences.copyright"
            />
          </slot>
        </template>
      </AuthenticationFormView>
    </div>

    <!-- Right authentication panel -->
    <AuthenticationFormView
      v-if="authPanelRight"
      class="min-h-full w-2/5 flex-1"
      data-side="right"
    >
      <template v-if="copyright" #copyright>
        <slot name="copyright">
          <Copyright
            v-if="preferences.copyright.enable"
            v-bind="preferences.copyright"
          />
        </slot>
      </template>
    </AuthenticationFormView>
  </div>
</template>

<style scoped>
.login-background {
  background-image: radial-gradient(
    rgb(20 20 19 / 7%) 1px,
    transparent 1px
  );
  background-size: 24px 24px;
  mask-image: radial-gradient(
    circle at 50% 50%,
    transparent 38%,
    rgb(0 0 0 / 55%) 100%
  );
}

.dark {
  .login-background {
    background-image: radial-gradient(
      rgb(232 232 236 / 6%) 1px,
      transparent 1px
    );
    background-size: 24px 24px;
    mask-image: radial-gradient(
      circle at 50% 50%,
      transparent 38%,
      rgb(0 0 0 / 55%) 100%
    );
  }
}
</style>
