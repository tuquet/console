<script lang="ts" setup>
import { OperonSpinner } from '@operon-core/shadcn-ui';

import { useContentSpinner } from './use-content-spinner';

defineOptions({ name: 'LayoutContentSpinner' });

const { spinning } = useContentSpinner();
</script>
<template>
  <OperonSpinner :spinning="spinning" />
</template>
