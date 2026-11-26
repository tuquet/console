<script setup lang="ts">
import type { BrowserProfileRecord } from '../../api/browsers';
import type { BrowserSseEvent, BrowserSseStatus } from '../../stores/browsers';

import { computed, ref } from 'vue';

import { Badge, Button, Card } from '@operon-core/shadcn-ui';
import { cn } from '@operon-core/shared/utils';

import { Activity, Eye, Loader2, Radio, Square, Trash2 } from '@lucide/vue';

import { $t } from '../../locales';

const props = defineProps<{
  events: BrowserSseEvent[];
  isMutating: (id: string) => boolean;
  lastEventAt: null | string;
  runningProfiles: BrowserProfileRecord[];
  sseStatus: BrowserSseStatus;
}>();

const emit = defineEmits<{
  clearEvents: [];
  inspectProfile: [profile: BrowserProfileRecord];
  inspectTargetId: [id: string];
  stopProfile: [profile: BrowserProfileRecord];
}>();

type EventFilter = 'all' | 'driver' | 'session';
const filter = ref<EventFilter>('all');

const filteredEvents = computed(() => {
  if (filter.value === 'all') return props.events;
  return props.events.filter((e) => e.category === filter.value);
});

function formatTime(iso: string): string {
  try {
    const dt = new Date(iso);
    return dt.toLocaleTimeString([], {
      hour: '2-digit',
      hour12: false,
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '--:--:--';
  }
}

function severityDotClass(severity: BrowserSseEvent['severity']): string {
  if (severity === 'success') return 'bg-emerald-500';
  if (severity === 'error') return 'bg-destructive';
  if (severity === 'warning') return 'bg-amber-500';
  return 'bg-primary';
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-3">
    <!-- Active Fleet Monitor -->
    <Card class="border-border flex flex-col gap-2.5 p-3.5 shadow-none">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <Activity class="text-emerald-500 size-4" />
          <h3 class="text-ui-label font-semibold">
            {{ $t('automation.browsers.cmd_active_fleet') }}
          </h3>
        </div>
        <Badge variant="secondary">{{ runningProfiles.length }}</Badge>
      </div>

      <div
        v-if="runningProfiles.length === 0"
        class="text-ui-caption text-muted-foreground rounded-md border border-dashed px-3 py-3 text-center"
      >
        {{ $t('automation.browsers.cmd_no_active_sessions') }}
      </div>

      <div v-else class="flex max-h-48 flex-col gap-1.5 overflow-y-auto">
        <div
          v-for="profile in runningProfiles"
          :key="profile.id"
          class="bg-muted/35 border-border/70 flex items-center justify-between gap-2 rounded-md border px-2.5 py-2"
        >
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <span class="size-2 shrink-0 rounded-full bg-emerald-500"></span>
              <span class="text-ui-label truncate font-medium">
                {{ profile.name }}
              </span>
            </div>
            <p class="text-ui-caption text-muted-foreground truncate">
              {{
                profile.debuggingPort
                  ? `PID ${profile.pid ?? '?'} · :${profile.debuggingPort}`
                  : profile.id
              }}
            </p>
          </div>

          <div class="flex shrink-0 items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              class="size-7"
              :aria-label="$t('automation.browsers.action_inspect')"
              :title="$t('automation.browsers.action_inspect')"
              @click="emit('inspectProfile', profile)"
            >
              <Eye class="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              class="text-destructive hover:text-destructive size-7"
              :disabled="isMutating(profile.id)"
              :aria-label="$t('automation.browsers.action_stop')"
              :title="$t('automation.browsers.action_stop')"
              @click="emit('stopProfile', profile)"
            >
              <Loader2
                v-if="isMutating(profile.id)"
                class="size-3.5 animate-spin"
              />
              <Square v-else class="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </Card>

    <!-- Real-time SSE Stream -->
    <Card
      class="border-border flex min-h-0 flex-1 flex-col gap-2.5 p-3.5 shadow-none"
    >
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <Radio
            :class="
              cn(
                'size-4',
                sseStatus === 'open'
                  ? 'text-emerald-500'
                  : 'text-muted-foreground',
              )
            "
          />
          <h3 class="text-ui-label font-semibold">
            {{ $t('automation.browsers.cmd_sse_stream') }}
          </h3>
        </div>

        <div class="flex items-center gap-1.5">
          <span
            v-if="lastEventAt"
            class="text-ui-caption text-muted-foreground tabular-nums"
          >
            {{ formatTime(lastEventAt) }}
          </span>
          <Button
            v-if="events.length > 0"
            size="icon"
            variant="ghost"
            class="size-7"
            :aria-label="$t('common.reset')"
            @click="emit('clearEvents')"
          >
            <Trash2 class="size-3.5" />
          </Button>
        </div>
      </div>

      <div class="flex items-center gap-1">
        <Button
          v-for="tabKey in ['all', 'session', 'driver'] as const"
          :key="tabKey"
          size="sm"
          :variant="filter === tabKey ? 'secondary' : 'ghost'"
          class="h-7 px-2.5"
          @click="filter = tabKey"
        >
          {{
            tabKey === 'all'
              ? $t('automation.browsers.cmd_filter_all')
              : tabKey === 'session'
                ? $t('automation.browsers.cmd_filter_sessions')
                : $t('automation.browsers.cmd_filter_drivers')
          }}
        </Button>
      </div>

      <div
        v-if="filteredEvents.length === 0"
        class="text-ui-caption text-muted-foreground flex flex-1 items-center justify-center rounded-md border border-dashed px-3 py-6 text-center"
      >
        {{ $t('automation.browsers.cmd_sse_empty') }}
      </div>

      <div v-else class="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
        <button
          v-for="evt in filteredEvents"
          :key="evt.id"
          type="button"
          class="hover:bg-accent/60 border-border/60 flex w-full items-start gap-2 rounded-md border px-2.5 py-2 text-left transition-colors"
          :disabled="evt.category !== 'session' || !evt.targetId"
          @click="
            evt.category === 'session' &&
            evt.targetId &&
            emit('inspectTargetId', evt.targetId)
          "
        >
          <span
            :class="
              cn(
                'mt-1.5 size-2 shrink-0 rounded-full',
                severityDotClass(evt.severity),
              )
            "
          ></span>
          <div class="min-w-0 flex-1">
            <p class="text-ui-body truncate">{{ evt.message }}</p>
            <p class="text-ui-caption text-muted-foreground tabular-nums">
              {{ formatTime(evt.timestamp) }} · {{ evt.type }}
            </p>
          </div>
        </button>
      </div>
    </Card>
  </div>
</template>
