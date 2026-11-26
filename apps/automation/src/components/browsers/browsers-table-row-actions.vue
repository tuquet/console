<script setup lang="ts">
import type { BrowserProfileRecord } from '../../api/browsers';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@operon-core/shadcn-ui';

import {
  CopyPlus,
  Eye,
  Loader2,
  MoreHorizontal,
  Pencil,
  Play,
  Square,
  Star,
  Trash2,
  Unlink,
  Wifi,
} from '@lucide/vue';

import { $t } from '../../locales';

export interface BrowserRowCallbacks {
  onDelete: (profile: BrowserProfileRecord) => void;
  onDuplicate: (profile: BrowserProfileRecord) => void;
  onEdit: (profile: BrowserProfileRecord) => void;
  onInspect: (profile: BrowserProfileRecord) => void;
  onProbeProxy: (profile: BrowserProfileRecord) => void;
  onSetDefault: (profile: BrowserProfileRecord) => void;
  onToggleRun: (profile: BrowserProfileRecord) => void;
  onUnbind: (profile: BrowserProfileRecord) => void;
}

defineProps<{
  actions: BrowserRowCallbacks;
  mutating: boolean;
  profile: BrowserProfileRecord;
}>();
</script>

<template>
  <div class="flex items-center justify-end gap-1" @click.stop>
    <Button
      size="sm"
      :variant="profile.isOnline ? 'destructive' : 'outline'"
      class="h-7 gap-1 px-2.5 shadow-none"
      :disabled="mutating"
      @click="actions.onToggleRun(profile)"
    >
      <Loader2 v-if="mutating" class="size-3 animate-spin" />
      <Square v-else-if="profile.isOnline" class="size-3" />
      <Play v-else class="size-3" />
      <span>
        {{
          profile.isOnline
            ? $t('automation.browsers.action_stop')
            : $t('automation.browsers.action_run')
        }}
      </span>
    </Button>

    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button size="icon" variant="ghost" class="size-7">
          <MoreHorizontal class="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-44">
        <DropdownMenuItem @select="actions.onInspect(profile)">
          <Eye class="mr-2 size-3.5" />
          <span>{{ $t('automation.browsers.action_inspect') }}</span>
        </DropdownMenuItem>
        <DropdownMenuItem @select="actions.onEdit(profile)">
          <Pencil class="mr-2 size-3.5" />
          <span>{{ $t('common.edit') }}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          v-if="profile.proxy"
          @select="actions.onProbeProxy(profile)"
        >
          <Wifi class="mr-2 size-3.5" />
          <span>{{ $t('automation.browsers.action_probe_proxy') }}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          :disabled="profile.isDefault"
          @select="actions.onSetDefault(profile)"
        >
          <Star class="mr-2 size-3.5" />
          <span>{{ $t('automation.browsers.action_set_default') }}</span>
        </DropdownMenuItem>
        <DropdownMenuItem @select="actions.onDuplicate(profile)">
          <CopyPlus class="mr-2 size-3.5" />
          <span>{{ $t('automation.browsers.action_duplicate') }}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          :disabled="profile.isOnline"
          @select="actions.onUnbind(profile)"
        >
          <Unlink class="mr-2 size-3.5" />
          <span>{{ $t('automation.overview.browser_batch_unbind_btn') }}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          class="text-destructive focus:text-destructive"
          @select="actions.onDelete(profile)"
        >
          <Trash2 class="mr-2 size-3.5" />
          <span>{{ $t('common.delete') }}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
