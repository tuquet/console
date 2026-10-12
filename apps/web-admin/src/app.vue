<script lang="ts" setup>
import { Toaster } from '@tuquet/vue-ui';

defineOptions({ name: 'App' });
</script>

<template>
  <RouterView />
  <Toaster position="top-right" rich-colors />
</template>
