<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';

import ProxyBulkCheckDialog from './proxy-bulk-check-dialog.vue';

defineOptions({ name: 'ShellToolDialogs' });

interface OpenShellToolDetail {
  toolId?: string;
}

const activeTool = ref<null | string>(null);

function handleOpenTool(event: Event) {
  const detail = (event as CustomEvent<OpenShellToolDetail>).detail;
  if (detail?.toolId) {
    activeTool.value = detail.toolId;
  }
}

onMounted(() => {
  window.addEventListener('open-shell-tool', handleOpenTool);
});

onUnmounted(() => {
  window.removeEventListener('open-shell-tool', handleOpenTool);
});
</script>

<template>
  <ProxyBulkCheckDialog
    :open="activeTool === 'proxy-bulk-check'"
    @update:open="(val) => !val && (activeTool = null)"
  />
</template>
