<script setup lang="ts">
import { useOperonDrawer } from '../../use-drawer';

interface TypedDrawerData {
  id: number;
  mode: 'edit' | 'view';
}

const [, drawerApi] = useOperonDrawer<TypedDrawerData | null>();

defineExpose({ drawerApi });
</script>

<template>
  <div />
</template>
