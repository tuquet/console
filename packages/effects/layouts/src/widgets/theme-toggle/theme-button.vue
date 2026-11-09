<script lang="ts" setup>
import { nextTick } from 'vue';

import { MoonStar, Sun } from '@operon/icons';
import { $t } from '@operon/locales';

import { Button } from '@operon-core/shadcn-ui';

interface Props {
  /**
   * Type
   */
  type?: 'icon' | 'normal';
}

defineOptions({
  name: 'ThemeToggleButton',
});

const props = withDefaults(defineProps<Props>(), {
  type: 'normal',
});

const isDark = defineModel<boolean>();

function toggleTheme(event: MouseEvent) {
  const isAppearanceTransition =
    // @ts-expect-error - startViewTransition is not available in the current DOM lib target
    document.startViewTransition &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!isAppearanceTransition || !event) {
    isDark.value = !isDark.value;
    return;
  }
  const x = event.clientX;
  const y = event.clientY;
  const endRadius = Math.hypot(
    Math.max(x, innerWidth - x),
    Math.max(y, innerHeight - y),
  );
  const transition = document.startViewTransition(async () => {
    isDark.value = !isDark.value;
    await nextTick();
  });
  transition.ready.then(() => {
    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${endRadius}px at ${x}px ${y}px)`,
    ];
    const animate = document.documentElement.animate(
      {
        clipPath: isDark.value ? [...clipPath].toReversed() : clipPath,
      },
      {
        duration: 450,
        easing: 'ease-in',
        pseudoElement: isDark.value
          ? '::view-transition-old(root)'
          : '::view-transition-new(root)',
      },
    );
    animate.onfinish = () => {
      transition.skipTransition();
    };
  });
}
</script>

<template>
  <Button
    type="button"
    variant="ghost"
    :size="props.type === 'icon' ? 'icon' : 'default'"
    :aria-label="
      isDark ? $t('preferences.theme.light') : $t('preferences.theme.dark')
    "
    @click.stop="toggleTheme"
  >
    <Sun v-if="isDark" />
    <MoonStar v-else />
  </Button>
</template>
