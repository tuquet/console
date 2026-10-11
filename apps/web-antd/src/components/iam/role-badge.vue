<script lang="ts" setup>
import { computed } from 'vue';

import { Tag } from 'ant-design-vue';

interface RoleConfig {
  color: string;
  label: string;
}

const props = withDefaults(defineProps<Props>(), {
  uppercase: true,
});

const ROLE_MAP: Record<string, RoleConfig> = {
  admin: { color: 'blue', label: 'Admin' },
  developer: { color: 'cyan', label: 'Developer' },
  member: { color: 'default', label: 'Member' },
  owner: { color: 'purple', label: 'Owner' },
  read_only: { color: 'blue', label: 'Read Only' },
  viewer: { color: 'default', label: 'Viewer' },
};

interface Props {
  role: string;
  uppercase?: boolean;
}

const roleConfig = computed<RoleConfig>(() => {
  return (
    ROLE_MAP[props.role.toLowerCase()] || {
      color: 'default',
      label: props.role,
    }
  );
});
</script>

<template>
  <Tag
    :color="roleConfig.color"
    class="font-medium"
    :class="[props.uppercase ? 'uppercase' : '']"
  >
    {{ roleConfig.label }}
  </Tag>
</template>
