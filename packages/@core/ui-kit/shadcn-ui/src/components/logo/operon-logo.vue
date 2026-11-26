<script setup lang="ts">
import { computed, useId } from 'vue';

interface Props {
  ariaLabel?: string;
  size?: number | string;
  theme?: string;
}

defineOptions({
  name: 'OperonLogo',
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
    data-operon-logo="true"
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
        height="400"
        width="400"
        x="0"
        y="0"
      >
        <feFlood flood-opacity="0" result="BackgroundImageFix" />
        <feBlend
          in="SourceGraphic"
          in2="BackgroundImageFix"
          mode="normal"
          result="shape"
        />
        <feGaussianBlur result="effect1_foregroundBlur" stdDeviation="16" />
      </filter>

      <linearGradient
        :id="`${logoUid}-body`"
        gradientUnits="userSpaceOnUse"
        x1="112"
        x2="310"
        y1="14"
        y2="386"
      >
        <stop
          :stop-color="isDark ? '#FFFFFF' : '#52525B'"
          class="operon-stop-top"
          offset="0%"
        />
        <stop
          :stop-color="isDark ? '#E4E4E7' : '#3F3F46'"
          class="operon-stop-mid"
          offset="50%"
        />
        <stop
          :stop-color="isDark ? '#D4D4D8' : '#27272A'"
          class="operon-stop-bot"
          offset="100%"
        />
      </linearGradient>
    </defs>

    <g :filter="`url(#${logoUid}-blur)`">
      <circle
        :fill="
          isDark ? 'rgb(228 228 231 / 0.16)' : 'hsl(var(--primary) / 0.22)'
        "
        class="operon-halo"
        cx="200"
        cy="200"
        r="136"
      />
    </g>

    <path
      :fill="`url(#${logoUid}-body)`"
      d="M200 14C294.993 14 372 91.007 372 186V342C372 366.301 352.301 386 328 386C296 386 296 351 264 351C232 351 232 386 200 386C168 386 168 351 136 351C104 351 104 386 72 386C47.699 386 28 366.301 28 342V186C28 91.007 105.007 14 200 14Z"
    />

    <rect
      :fill="isDark ? '#09090B' : '#FAFAFA'"
      class="operon-eye"
      height="64"
      rx="28"
      width="56"
      x="112"
      y="154"
    />
    <rect
      :fill="isDark ? '#09090B' : '#FAFAFA'"
      class="operon-eye"
      height="64"
      rx="28"
      width="56"
      x="232"
      y="154"
    />
  </svg>
</template>

<style scoped>
:global(.dark) .operon-stop-top {
  stop-color: #fff;
}

:global(.dark) .operon-stop-mid {
  stop-color: #e4e4e7;
}

:global(.dark) .operon-stop-bot {
  stop-color: #d4d4d8;
}

:global(.dark) .operon-halo {
  fill: rgb(228 228 231 / 16%);
}

:global(.dark) .operon-eye {
  fill: #09090b;
}
</style>
