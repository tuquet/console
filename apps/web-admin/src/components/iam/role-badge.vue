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
    class: 'bg-secondary text-secondary-foreground border-border',
    label: 'Admin',
  },
  developer: {
    class: 'bg-secondary text-secondary-foreground border-border',
    label: 'Developer',
  },
  member: {
    class: 'bg-muted text-muted-foreground border-border',
    label: 'Member',
  },
  owner: {
    class: 'bg-primary/10 text-primary border-primary/20',
    label: 'Owner',
  },
  read_only: {
    class: 'bg-muted text-muted-foreground border-border',
    label: 'Read Only',
  },
  viewer: {
    class: 'bg-muted text-muted-foreground border-border',
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
