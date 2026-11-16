<script setup lang="ts">
import { computed, useId } from 'vue';

interface Props {
  ariaLabel?: string;
  size?: number | string;
  theme?: string;
}

defineOptions({
  name: 'SpecterLogo',
});

const props = withDefaults(defineProps<Props>(), {
  ariaLabel: 'Logo',
  size: 32,
  theme: 'light',
});

const logoUid = useId();
const isDark = computed(() => props.theme === 'dark');
</script>

<template>
  <svg
    :aria-label="ariaLabel"
    :height="size"
    :width="size"
    data-specter-logo="true"
    fill="none"
    role="img"
    viewBox="0 0 400 400"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <filter
        :id="`${logoUid}-blur`"
        color-interpolation-filters="sRGB"
        filterUnits="userSpaceOnUse"
        height="440"
        width="440"
        x="-20"
        y="-20"
      >
        <feFlood flood-opacity="0" result="BackgroundImageFix" />
        <feBlend
          in="SourceGraphic"
          in2="BackgroundImageFix"
          mode="normal"
          result="shape"
        />
        <feGaussianBlur result="effect1_foregroundBlur" stdDeviation="20" />
      </filter>

      <linearGradient
        :id="`${logoUid}-body`"
        gradientUnits="userSpaceOnUse"
        x1="136"
        x2="304"
        y1="24"
        y2="376"
      >
        <stop
          :stop-color="isDark ? '#FFFFFF' : '#52525B'"
          class="specter-stop-top"
          offset="0%"
        />
        <stop
          :stop-color="isDark ? '#E4E4E7' : '#3F3F46'"
          class="specter-stop-mid"
          offset="50%"
        />
        <stop
          :stop-color="isDark ? '#D4D4D8' : '#27272A'"
          class="specter-stop-bot"
          offset="100%"
        />
      </linearGradient>
    </defs>

    <g :filter="`url(#${logoUid}-blur)`">
      <circle
        :fill="
          isDark ? 'rgb(228 228 231 / 0.16)' : 'hsl(var(--primary) / 0.22)'
        "
        class="specter-halo"
        cx="200"
        cy="200"
        r="144"
      />
    </g>

    <path
      :fill="`url(#${logoUid}-body)`"
      d="M200 24C279.529 24 344 88.471 344 168V336C344 358.091 326.091 376 304 376C276 376 280 346 252 346C224 346 228 376 200 376C172 376 176 346 148 346C120 346 124 376 96 376C73.909 376 56 358.091 56 336V168C56 88.471 120.471 24 200 24Z"
    />

    <rect
      :fill="isDark ? '#09090B' : '#FAFAFA'"
      class="specter-eye"
      height="54"
      rx="24"
      width="48"
      x="122"
      y="147"
    />
    <rect
      :fill="isDark ? '#09090B' : '#FAFAFA'"
      class="specter-eye"
      height="54"
      rx="24"
      width="48"
      x="230"
      y="147"
    />
  </svg>
</template>

<style scoped>
:global(.dark) .specter-stop-top {
  stop-color: #fff;
}

:global(.dark) .specter-stop-mid {
  stop-color: #e4e4e7;
}

:global(.dark) .specter-stop-bot {
  stop-color: #d4d4d8;
}

:global(.dark) .specter-halo {
  fill: rgb(228 228 231 / 16%);
}

:global(.dark) .specter-eye {
  fill: #09090b;
}
</style>
