<script lang="ts" setup>
import { computed } from 'vue';

import { Badge } from '@tuquet/vue-ui';

interface RoleConfig {
  class: string;
  label: string;
}

const props = withDefaults(defineProps<Props>(), {
  uppercase: true,
});

const ROLE_MAP: Record<string, RoleConfig> = {
  admin: {
    class: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    label: 'Admin',
  },
  developer: {
    class: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    label: 'Developer',
  },
  member: {
    class: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
    label: 'Member',
  },
  owner: {
    class: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    label: 'Owner',
  },
  read_only: {
    class: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    label: 'Read Only',
  },
  viewer: {
    class: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
    label: 'Viewer',
  },
};

interface Props {
  role: string;
  uppercase?: boolean;
}

const roleConfig = computed<RoleConfig>(() => {
  return (
    ROLE_MAP[props.role.toLowerCase()] || {
      class: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
      label: props.role,
    }
  );
});
</script>

<template>
  <Badge
    variant="outline"
    class="font-medium text-xs px-2 py-0.5 border"
    :class="[roleConfig.class, props.uppercase ? 'uppercase' : '']"
  >
    {{ roleConfig.label }}
  </Badge>
</template>
