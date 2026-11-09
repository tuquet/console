<script lang="ts" setup>
import { ref } from 'vue';

import { Settings } from '@operon/icons';
import { $t } from '@operon/locales';

import { Button } from '@operon-core/shadcn-ui';

import Preferences from './preferences.vue';

const emit = defineEmits<{ clearPreferencesAndLogout: [] }>();

function clearPreferencesAndLogout() {
  emit('clearPreferencesAndLogout');
}

const preferencesRef = ref<InstanceType<typeof Preferences> | null>(null);
</script>

<template>
  <Preferences
    ref="preferencesRef"
    @clear-preferences-and-logout="clearPreferencesAndLogout"
  >
    <Button
      type="button"
      variant="ghost"
      size="icon"
      :title="$t('preferences.settingsTitle')"
      :aria-label="$t('preferences.settingsTitle')"
      @click="preferencesRef?.open()"
    >
      <Settings />
    </Button>
  </Preferences>
</template>
