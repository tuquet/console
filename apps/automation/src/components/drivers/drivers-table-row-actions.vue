<script setup lang="ts">
import type { DriverReleaseItem } from '../../api/browsers';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@operon-core/shadcn-ui';

import { Check, Download, Ellipsis, Loader2, Trash2 } from '@lucide/vue';

import { $t } from '../../locales';

export interface DriverRowCallbacks {
  onInstall: (version: string) => void;
  onSelect: (version: string) => void;
  onUninstall: (version: string) => void;
}

defineProps<{
  actions: DriverRowCallbacks;
  busy: boolean;
  driver: DriverReleaseItem;
  hasRunningSessions: boolean;
  installing: boolean;
}>();
</script>

<template>
  <div class="flex items-center justify-end" @click.stop>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          size="icon"
          variant="ghost"
          class="size-7"
          :disabled="busy"
          :aria-label="$t('common.actions')"
        >
          <Loader2 v-if="busy" class="size-4 animate-spin" />
          <Ellipsis v-else class="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-40">
        <DropdownMenuItem
          v-if="!driver.installed"
          :disabled="installing"
          @select="actions.onInstall(driver.version)"
        >
          <Download class="mr-2 size-3.5" />
          <span>{{ $t('automation.browsers.driver_install_btn') }}</span>
        </DropdownMenuItem>

        <template v-else>
          <DropdownMenuItem
            :disabled="driver.isActive || busy"
            @select="actions.onSelect(driver.version)"
          >
            <Check class="mr-2 size-3.5" />
            <span>{{ $t('automation.browsers.driver_select_btn') }}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            class="text-destructive focus:text-destructive"
            :disabled="driver.isActive || hasRunningSessions || busy"
            @select="actions.onUninstall(driver.version)"
          >
            <Trash2 class="mr-2 size-3.5" />
            <span>{{ $t('automation.browsers.driver_uninstall_btn') }}</span>
          </DropdownMenuItem>
        </template>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
