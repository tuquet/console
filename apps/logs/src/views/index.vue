<script lang="ts" setup>
import type { CiSuiteTarget } from '../api/ci-logs';
import type {
  CiLineSeverity,
  CiRunStatus,
  CiSeverityFilter,
} from '../utils/ci-log-parser';

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { useDaemonHeartbeat, useKernel } from '@operon/kernel';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Input,
  Label,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@operon-core/shadcn-ui';

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Copy,
  FileText,
  FilterX,
  Play,
  RefreshCw,
  ScrollText,
  Search,
  Terminal,
  WifiOff,
  XCircle,
} from '@lucide/vue';

import { $t } from '../locales';
import { ALL_FILTER_VALUE, useCiLogsStore } from '../stores/ci-logs';
import { splitHighlightSegments } from '../utils/ci-log-parser';

defineOptions({ name: 'CiLogsOverviewView' });

const kernel = useKernel();
const store = useCiLogsStore();
const daemon = useDaemonHeartbeat({ intervalMs: 5000 });

const openSteps = ref<Record<string, boolean>>({});

const hasActiveFilter = computed(
  () =>
    store.selectedStep !== ALL_FILTER_VALUE ||
    store.scopeFilter !== ALL_FILTER_VALUE ||
    store.severityFilter !== 'all' ||
    store.searchQuery.trim().length > 0,
);

const visibleSteps = computed(() =>
  hasActiveFilter.value
    ? store.filteredSteps.filter((entry) => entry.filteredLines.length > 0)
    : store.filteredSteps,
);

function statusBadgeVariant(
  status: 'fail' | 'pass' | 'running' | CiRunStatus,
): 'default' | 'destructive' | 'outline' | 'secondary' {
  switch (status) {
    case 'fail': {
      return 'destructive';
    }
    case 'pass': {
      return 'default';
    }
    case 'running': {
      return 'secondary';
    }
    default: {
      return 'outline';
    }
  }
}

function lineClass(severity: CiLineSeverity): string {
  switch (severity) {
    case 'error': {
      return 'bg-destructive/15 text-destructive';
    }
    case 'pass': {
      return 'text-emerald-600 dark:text-emerald-400';
    }
    case 'warn': {
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-300';
    }
    default: {
      return 'text-foreground/90';
    }
  }
}

function isStepOpen(stepName: string, status: 'fail' | 'pass' | 'running') {
  if (hasActiveFilter.value) return true;
  if (stepName in openSteps.value) {
    return Boolean(openSteps.value[stepName]);
  }
  return status !== 'pass';
}

function setStepOpen(stepName: string, open: boolean) {
  openSteps.value = { ...openSteps.value, [stepName]: open };
}

async function copyStepCommand(command: string) {
  try {
    await navigator.clipboard.writeText(command);
    kernel.events.notify('success', $t('logs.copied_command'));
  } catch {
    kernel.events.notify('error', $t('logs.copy_failed'));
  }
}

function handleGlobalKeydown(event: KeyboardEvent) {
  const tag = (event.target as HTMLElement | null)?.tagName;
  if (event.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
    event.preventDefault();
    document.querySelector<HTMLInputElement>('#ci-search-input')?.focus();
  }
}

const SUITE_TARGETS: { key: string; value: CiSuiteTarget }[] = [
  { key: 'logs.suite_all', value: 'all' },
  { key: 'logs.suite_glossary', value: 'glossary' },
  { key: 'logs.suite_core', value: 'core' },
  { key: 'logs.suite_console', value: 'console' },
  { key: 'logs.suite_docker', value: 'docker' },
];

async function handleRunCi(suite: CiSuiteTarget = store.targetSuite) {
  const ok = await store.runCi(suite);
  if (ok) {
    kernel.events.notify('success', $t('logs.run_started', { suite }));
  } else {
    kernel.events.notify('error', store.error || $t('logs.run_failed'));
  }
}

watch(
  () => daemon.isHealthy.value,
  (healthy) => {
    if (healthy && store.runs.length === 0) {
      void store.fetchLogs();
    }
  },
);

onMounted(() => {
  void store.fetchLogs();
  window.addEventListener('keydown', handleGlobalKeydown);
});

onBeforeUnmount(() => {
  store.setLiveTail(false);
  window.removeEventListener('keydown', handleGlobalKeydown);
});
</script>

<template>
  <div class="flex flex-col gap-4 p-4 lg:p-6">
    <!-- Top Header -->
    <div
      class="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-4"
    >
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2.5">
          <ScrollText class="size-5 text-primary" />
          <h1 class="text-xl font-semibold tracking-tight">
            {{ $t('logs.title') }}
          </h1>
          <Badge
            v-if="store.logsDir"
            variant="outline"
            class="font-mono text-xs"
          >
            {{ store.logsDir }}
          </Badge>
        </div>
        <p class="text-sm text-muted-foreground">
          {{ $t('logs.description') }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <div v-if="store.runnerAvailable" class="flex items-center gap-1.5">
          <Select v-model="store.targetSuite">
            <SelectTrigger class="h-8 w-[140px] font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="item in SUITE_TARGETS"
                :key="item.value"
                :value="item.value"
              >
                {{ $t(item.key) }}
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="sm"
            class="gap-1.5"
            :disabled="store.isRunning || store.startingRun"
            @click="handleRunCi()"
          >
            <Play class="size-3.5" />
            <span>
              {{
                store.isRunning || store.startingRun
                  ? $t('logs.running_label', {
                      suite: store.runningSuites[0] || store.targetSuite,
                    })
                  : $t('logs.run_btn')
              }}
            </span>
          </Button>
        </div>

        <div class="flex items-center gap-2">
          <Switch
            id="ci-live-tail"
            :model-value="store.liveTail"
            @update:model-value="(val) => store.setLiveTail(Boolean(val))"
          />
          <Label for="ci-live-tail" class="cursor-pointer text-xs font-medium">
            {{ $t('logs.live_tail') }}
          </Label>
        </div>

        <Button
          size="sm"
          variant="outline"
          class="gap-1.5"
          :disabled="store.loading"
          @click="store.fetchLogs()"
        >
          <RefreshCw
            class="size-3.5"
            :class="{ 'animate-spin': store.loading }"
          />
          <span>{{ $t('logs.refresh_btn') }}</span>
        </Button>
      </div>
    </div>

    <!-- Daemon Offline Warning -->
    <Card
      v-if="!daemon.isHealthy.value && store.error && !store.runnerAvailable"
      class="gap-0 border-amber-500/40 bg-amber-500/5 py-0"
    >
      <CardContent class="flex items-center justify-between gap-3 p-4">
        <div class="flex items-center gap-3">
          <WifiOff class="size-5 shrink-0 text-amber-500" />
          <div>
            <p class="text-sm font-medium">{{ $t('logs.daemon_offline') }}</p>
            <p class="text-xs text-muted-foreground">
              {{ $t('logs.daemon_offline_hint') }}
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" @click="store.fetchLogs()">
          {{ $t('logs.retry_btn') }}
        </Button>
      </CardContent>
    </Card>

    <!-- Loading Skeleton -->
    <div
      v-if="store.loading && store.runs.length === 0"
      class="grid gap-3 md:grid-cols-4"
    >
      <Skeleton v-for="idx in 4" :key="idx" class="h-24 w-full rounded-xl" />
    </div>

    <!-- Main Layout -->
    <div
      v-else-if="store.runs.length > 0"
      class="grid gap-4 lg:grid-cols-[290px_1fr]"
    >
      <!-- Left Sidebar: CI Suites & Step Tree -->
      <div class="flex flex-col gap-2.5">
        <Card
          v-for="run in store.runs"
          :key="run.suite"
          class="cursor-pointer gap-0 py-0 transition-colors"
          :class="
            store.activeRun?.suite === run.suite
              ? 'border-primary bg-primary/5'
              : 'hover:border-primary/40'
          "
          @click="store.selectSuite(run.suite)"
        >
          <CardHeader class="p-3 pb-2">
            <div class="flex items-center justify-between gap-2">
              <CardTitle class="font-mono text-sm">
                {{ run.suite }}
              </CardTitle>
              <Badge
                :variant="statusBadgeVariant(run.status)"
                class="uppercase"
              >
                {{ run.status }}
              </Badge>
            </div>
          </CardHeader>
          <CardContent class="flex flex-col gap-2 p-3 pt-0 text-xs">
            <div
              class="flex items-center justify-between font-mono text-muted-foreground"
            >
              <span>
                {{
                  $t('logs.err_warn_counts', {
                    err: run.errorCount,
                    warn: run.warnCount,
                  })
                }}
              </span>
              <span>
                {{
                  run.totalSeconds != null
                    ? `${run.totalSeconds.toFixed(1)}s`
                    : '—'
                }}
              </span>
            </div>

            <div
              v-if="
                store.activeRun?.suite === run.suite && run.steps.length > 0
              "
              class="mt-1 flex flex-col gap-1 border-t border-border/60 pt-2"
              @click.stop
            >
              <button
                type="button"
                class="flex items-center justify-between rounded-md px-2 py-1 text-left font-mono text-[11px] transition-colors"
                :class="
                  store.selectedStep === ALL_FILTER_VALUE
                    ? 'bg-primary/15 font-semibold text-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                "
                @click="store.selectedStep = ALL_FILTER_VALUE"
              >
                <span>{{
                  $t('logs.all_steps', { count: run.steps.length })
                }}</span>
                <span>{{ run.lineCount }}L</span>
              </button>

              <button
                v-for="step in run.steps"
                :key="step.name"
                type="button"
                class="flex items-center justify-between rounded-md px-2 py-1 text-left font-mono text-[11px] transition-colors"
                :class="[
                  store.selectedStep === step.name
                    ? 'bg-primary/15 font-semibold text-foreground'
                    : 'text-muted-foreground hover:bg-muted',
                  step.status === 'fail' ? 'text-destructive' : '',
                ]"
                @click="store.selectedStep = step.name"
              >
                <span class="flex items-center gap-1.5 truncate">
                  <XCircle
                    v-if="step.status === 'fail'"
                    class="size-3 shrink-0 text-destructive"
                  />
                  <CheckCircle2
                    v-else-if="step.status === 'pass'"
                    class="size-3 shrink-0 text-emerald-500"
                  />
                  <AlertTriangle
                    v-else
                    class="size-3 shrink-0 text-amber-500"
                  />
                  <span class="truncate">{{ step.name }}</span>
                </span>
                <span class="shrink-0">
                  {{
                    step.seconds != null ? `${step.seconds.toFixed(1)}s` : '...'
                  }}
                </span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Right Content: Filters & Step Accordions -->
      <div class="flex min-w-0 flex-col gap-3">
        <Card class="gap-0 py-0">
          <CardContent class="flex flex-col gap-3 p-3.5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <Tabs
                :model-value="store.severityFilter"
                @update:model-value="
                  (val) => (store.severityFilter = val as CiSeverityFilter)
                "
              >
                <TabsList>
                  <TabsTrigger value="all">
                    {{ $t('logs.sev_all') }}
                  </TabsTrigger>
                  <TabsTrigger value="error">
                    {{ $t('logs.sev_error') }}
                  </TabsTrigger>
                  <TabsTrigger value="warn">
                    {{ $t('logs.sev_warn') }}
                  </TabsTrigger>
                  <TabsTrigger value="summary">
                    {{ $t('logs.sev_summary') }}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div
                v-if="store.activeRun"
                class="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground"
              >
                <span v-if="store.activeRun.gitRef">{{
                  store.activeRun.gitRef
                }}</span>
                <span v-if="store.activeRun.timestamp">{{
                  store.activeRun.timestamp
                }}</span>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2.5">
              <div class="relative min-w-[220px] flex-1">
                <Search
                  class="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="ci-search-input"
                  v-model="store.searchQuery"
                  :placeholder="$t('logs.search_placeholder')"
                  class="h-8 pl-8 font-mono text-xs"
                />
              </div>

              <Select v-model="store.scopeFilter">
                <SelectTrigger class="h-8 w-[210px] font-mono text-xs">
                  <SelectValue :placeholder="$t('logs.all_scopes')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem :value="ALL_FILTER_VALUE">
                    {{ $t('logs.all_scopes') }}
                  </SelectItem>
                  <SelectItem
                    v-for="scope in store.availableScopes"
                    :key="scope"
                    :value="scope"
                  >
                    {{ scope }}
                  </SelectItem>
                </SelectContent>
              </Select>

              <div class="flex items-center gap-1.5">
                <Switch id="ci-regex-toggle" v-model="store.regexEnabled" />
                <Label for="ci-regex-toggle" class="cursor-pointer text-xs">
                  {{ $t('logs.regex_label') }}
                </Label>
              </div>

              <div class="flex items-center gap-1.5">
                <Switch id="ci-hide-noise" v-model="store.hideNoise" />
                <Label for="ci-hide-noise" class="cursor-pointer text-xs">
                  {{ $t('logs.hide_noise') }}
                </Label>
              </div>

              <Button
                v-if="hasActiveFilter"
                size="sm"
                variant="ghost"
                class="h-8 gap-1 px-2 text-xs"
                @click="store.resetFilters()"
              >
                <FilterX class="size-3.5" />
                <span>{{ $t('logs.clear_filters') }}</span>
              </Button>
            </div>

            <p
              v-if="store.searchError"
              class="font-mono text-xs text-destructive"
            >
              {{ store.searchError }}
            </p>
          </CardContent>
        </Card>

        <!-- Summary View -->
        <Card
          v-if="store.severityFilter === 'summary' && store.activeRun"
          class="gap-0 py-0"
        >
          <CardHeader class="p-3.5 pb-2">
            <CardTitle class="flex items-center gap-2 text-sm">
              <FileText class="size-4 text-primary" />
              <span>{{ $t('logs.summary_title') }}</span>
            </CardTitle>
          </CardHeader>
          <CardContent class="p-3.5 pt-0">
            <div
              class="rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs"
            >
              <p
                v-for="(line, idx) in store.activeRun.summaryLines"
                :key="idx"
                class="py-0.5"
                :class="
                  line.includes('[FAIL')
                    ? 'text-destructive'
                    : 'text-emerald-600 dark:text-emerald-400'
                "
              >
                {{ line }}
              </p>
              <p
                v-if="store.activeRun.summaryLines.length === 0"
                class="text-muted-foreground"
              >
                {{ $t('logs.no_summary') }}
              </p>
            </div>
          </CardContent>
        </Card>

        <!-- Step Collapsibles -->
        <template v-else>
          <Collapsible
            v-for="{ step, filteredLines } in visibleSteps"
            :key="`${store.activeRun?.suite}-${step.name}`"
            :open="isStepOpen(step.name, step.status)"
            @update:open="(val) => setStepOpen(step.name, Boolean(val))"
          >
            <Card
              class="gap-0 overflow-hidden py-0"
              :class="step.status === 'fail' ? 'border-destructive/60' : ''"
            >
              <CollapsibleTrigger as-child>
                <div
                  class="flex cursor-pointer items-center justify-between gap-3 bg-muted/40 px-3.5 py-2.5 hover:bg-muted/60"
                >
                  <div class="flex min-w-0 items-center gap-2">
                    <ChevronDown
                      class="size-4 shrink-0 text-muted-foreground transition-transform"
                      :class="
                        isStepOpen(step.name, step.status)
                          ? 'rotate-0'
                          : '-rotate-90'
                      "
                    />
                    <Badge
                      :variant="statusBadgeVariant(step.status)"
                      class="uppercase"
                    >
                      {{ step.status }}
                    </Badge>
                    <span class="font-mono text-xs font-semibold">
                      {{ step.name }}
                    </span>
                    <span
                      class="truncate font-mono text-xs text-muted-foreground"
                    >
                      {{ step.command }}
                    </span>
                  </div>

                  <div class="flex shrink-0 items-center gap-2" @click.stop>
                    <Badge
                      v-if="step.errorCount > 0"
                      variant="destructive"
                      class="font-mono text-[10px]"
                    >
                      {{ step.errorCount }} err
                    </Badge>
                    <Badge variant="outline" class="font-mono text-[10px]">
                      {{ filteredLines.length }} lines
                    </Badge>
                    <span class="font-mono text-xs text-muted-foreground">
                      {{
                        step.seconds != null
                          ? `${step.seconds.toFixed(1)}s`
                          : '...'
                      }}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      class="h-7 gap-1 px-2 text-xs"
                      @click="copyStepCommand(step.command)"
                    >
                      <Copy class="size-3" />
                      <span>{{ $t('logs.copy_btn') }}</span>
                    </Button>
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <ScrollArea class="max-h-[420px] border-t border-border/60">
                  <div
                    v-if="filteredLines.length === 0"
                    class="p-4 text-center font-mono text-xs text-muted-foreground"
                  >
                    {{ $t('logs.no_matching_lines') }}
                  </div>
                  <div
                    v-else
                    class="divide-y divide-border/20 py-1 font-mono text-xs"
                  >
                    <div
                      v-for="line in filteredLines"
                      :key="line.lineNo"
                      class="grid grid-cols-[52px_minmax(0,1fr)] gap-2 px-3 py-0.5 leading-5 hover:bg-muted/40"
                      :class="lineClass(line.severity)"
                    >
                      <span
                        class="select-none text-right text-muted-foreground/70"
                      >
                        {{ line.lineNo }}
                      </span>
                      <span class="min-w-0 whitespace-pre-wrap break-all">
                        <template
                          v-for="(seg, sIdx) in splitHighlightSegments(
                            line.text,
                            store.searchMatcher,
                          )"
                          :key="sIdx"
                        >
                          <mark
                            v-if="seg.match"
                            class="rounded bg-primary/30 px-0.5 text-foreground"
                            >{{ seg.text }}</mark
                          >
                          <template v-else>{{ seg.text }}</template>
                        </template>
                      </span>
                    </div>
                  </div>
                </ScrollArea>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Empty v-if="visibleSteps.length === 0" class="border border-dashed">
            <EmptyHeader>
              <Terminal class="size-8 text-muted-foreground" />
              <EmptyTitle>{{ $t('logs.empty_title') }}</EmptyTitle>
              <EmptyDescription>{{ $t('logs.empty_desc') }}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </template>
      </div>
    </div>

    <!-- Empty Logs Directory -->
    <Empty v-else class="border border-dashed">
      <EmptyHeader>
        <ScrollText class="size-8 text-muted-foreground" />
        <EmptyTitle>{{ $t('logs.empty_title') }}</EmptyTitle>
        <EmptyDescription>{{ $t('logs.empty_desc') }}</EmptyDescription>
      </EmptyHeader>
      <Button
        v-if="store.runnerAvailable"
        size="sm"
        class="mt-2 gap-1.5"
        :disabled="store.isRunning || store.startingRun"
        @click="handleRunCi()"
      >
        <Play class="size-3.5" />
        <span>
          {{
            store.isRunning || store.startingRun
              ? $t('logs.running_label', {
                  suite: store.runningSuites[0] || store.targetSuite,
                })
              : $t('logs.run_btn')
          }}
        </span>
      </Button>
    </Empty>
  </div>
</template>
