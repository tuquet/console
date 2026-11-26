<script setup lang="ts">
import { useOperonModal } from '../../use-modal';

interface TypedModalData {
  id: number;
  mode: 'edit' | 'view';
}

const [, modalApi] = useOperonModal<TypedModalData | null>();

defineExpose({ modalApi });
</script>

<template>
  <div />
</template>
