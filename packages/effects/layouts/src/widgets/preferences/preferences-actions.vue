<script setup lang="ts">
import { Copy, LogOut, RotateCw } from '@operon/icons';
import { $t } from '@operon/locales';

import { Button } from '@operon-core/shadcn-ui';

defineProps<{ canReset: boolean; showCopy?: boolean }>();
defineEmits<{ reset: []; copy: []; clear: [] }>();
</script>

<template>
  <div class="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
    <div class="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        :disabled="!canReset"
        @click="$emit('reset')"
      >
        <RotateCw data-icon="inline-start" />
        {{ $t('preferences.resetConfiguration') }}
      </Button>
      <Button
        v-if="showCopy"
        type="button"
        size="sm"
        variant="outline"
        :disabled="!canReset"
        @click="$emit('copy')"
      >
        <Copy data-icon="inline-start" />
        {{ $t('preferences.copyPreferences') }}
      </Button>
    </div>
    <Button
      type="button"
      size="sm"
      variant="destructive"
      class="sm:ml-auto"
      @click="$emit('clear')"
    >
      <LogOut data-icon="inline-start" />
      {{ $t('preferences.clearAndLogout') }}
    </Button>
  </div>
</template>
