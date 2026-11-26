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
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Label,
  ScrollArea,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '@operon-core/shadcn-ui';

import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  FileText,
  FilterX,
  Loader2,
  Play,
  RefreshCw,
  ScrollText,
  Search,
  Terminal,
  WifiOff,
  X,
  XCircle,
} from '@lucide/vue';

import { $t } from '../locales';
import { ALL_FILTER_VALUE, useCiLogsStore } from '../stores/ci-logs';
import { splitHighlightSegments } from '../utils/ci-log-parser';

defineOptions({ name: 'LogsLocalCiView' });

const kernel = useKernel();
const store = useCiLogsStore();
const daemon = useDaemonHeartbeat({ intervalMs: 5000 });

const openSteps = ref<Record<string, boolean>>({});
const rawLogOpen = ref(false);

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
      return 'text-primary';
    }
    case 'warn': {
      return 'bg-muted/60 text-foreground';
    }
    default: {
      return 'text-foreground/90';
    }
  }
}

function traceLineStatus(
  status: 'fail' | 'pass' | 'running',
): 'error' | 'running' | undefined {
  if (status === 'fail') return 'error';
  if (status === 'running') return 'running';
  return undefined;
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

async function copyText(text: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(text);
    kernel.events.notify('success', successMessage);
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
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2.5">
          <ScrollText class="size-5 text-primary" />
          <h1 class="text-xl font-semibold tracking-tight">
            {{ $t('logs.title') }}
          </h1>
        </div>
        <p class="text-sm text-muted-foreground">
          {{ $t('logs.description') }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2.5">
        <div v-if="store.runnerAvailable" class="flex items-center gap-2">
          <Select v-model="store.targetSuite">
            <SelectTrigger size="sm" class="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem
                  v-for="item in SUITE_TARGETS"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ $t(item.key) }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button
            size="sm"
            :disabled="store.isRunning || store.startingRun"
            @click="handleRunCi()"
          >
            <Loader2
              v-if="store.isRunning || store.startingRun"
              class="animate-spin"
              data-icon="inline-start"
            />
            <Play v-else data-icon="inline-start" />
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
          <Label for="ci-live-tail" class="cursor-pointer whitespace-nowrap">
            {{ $t('logs.live_tail') }}
          </Label>
        </div>

        <Button
          v-if="store.activeRun"
          size="sm"
          variant="outline"
          @click="rawLogOpen = true"
        >
          <FileText data-icon="inline-start" />
          <span>{{ $t('logs.view_raw_btn') }}</span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          :disabled="store.loading"
          @click="store.fetchLogs()"
        >
          <RefreshCw
            data-icon="inline-start"
            :class="[store.loading && 'animate-spin']"
          />
          <span>{{ $t('logs.refresh_btn') }}</span>
        </Button>
      </div>
    </div>

    <Separator />

    <!-- Daemon Offline Warning -->
    <Alert
      v-if="!daemon.isHealthy.value && store.error && !store.runnerAvailable"
      variant="destructive"
    >
      <WifiOff />
      <AlertTitle>{{ $t('logs.daemon_offline') }}</AlertTitle>
      <AlertDescription
        class="flex flex-wrap items-center justify-between gap-3"
      >
        <span>{{ $t('logs.daemon_offline_hint') }}</span>
        <Button size="sm" variant="outline" @click="store.fetchLogs()">
          {{ $t('logs.retry_btn') }}
        </Button>
      </AlertDescription>
    </Alert>

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
      <div class="flex flex-col gap-3">
        <Card
          v-for="run in store.runs"
          :key="run.suite"
          class="cursor-pointer transition-colors"
          :class="[
            store.activeRun?.suite === run.suite
              ? 'border-primary bg-accent/30'
              : 'hover:border-primary/40',
          ]"
          @click="store.selectSuite(run.suite)"
        >
          <CardHeader>
            <CardTitle>{{ run.suite }}</CardTitle>
            <CardDescription
              class="flex items-center justify-between gap-2 tabular-nums"
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
            </CardDescription>
            <CardAction>
              <Badge
                :variant="statusBadgeVariant(run.status)"
                class="uppercase"
              >
                {{ run.status }}
              </Badge>
            </CardAction>
          </CardHeader>

          <CardContent
            v-if="store.activeRun?.suite === run.suite && run.steps.length > 0"
            class="flex flex-col gap-3"
            @click.stop
          >
            <Separator />
            <div class="flex flex-col gap-1">
              <Button
                size="sm"
                :variant="
                  store.selectedStep === ALL_FILTER_VALUE
                    ? 'secondary'
                    : 'ghost'
                "
                class="w-full justify-between font-normal"
                @click="store.selectedStep = ALL_FILTER_VALUE"
              >
                <span class="truncate">
                  {{ $t('logs.all_steps', { count: run.steps.length }) }}
                </span>
                <span class="shrink-0 text-muted-foreground tabular-nums">
                  {{ run.lineCount }}L
                </span>
              </Button>

              <Button
                v-for="step in run.steps"
                :key="step.name"
                size="sm"
                :variant="
                  store.selectedStep === step.name ? 'secondary' : 'ghost'
                "
                class="w-full justify-between font-normal"
                :class="[step.status === 'fail' && 'text-destructive']"
                @click="store.selectedStep = step.name"
              >
                <span class="flex min-w-0 items-center gap-2 truncate">
                  <XCircle
                    v-if="step.status === 'fail'"
                    class="shrink-0 text-destructive"
                  />
                  <CheckCircle2
                    v-else-if="step.status === 'pass'"
                    class="shrink-0 text-primary"
                  />
                  <AlertTriangle
                    v-else
                    class="shrink-0 text-muted-foreground"
                  />
                  <span class="truncate">{{ step.name }}</span>
                </span>
                <span class="shrink-0 text-muted-foreground tabular-nums">
                  {{
                    step.seconds != null ? `${step.seconds.toFixed(1)}s` : '...'
                  }}
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Right Content: Filters & Step Accordions -->
      <div class="flex min-w-0 flex-col gap-4">
        <Card>
          <CardContent class="flex flex-col gap-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <Tabs
                :model-value="store.severityFilter"
                class="w-full sm:w-auto"
                @update:model-value="
                  (val) => (store.severityFilter = val as CiSeverityFilter)
                "
              >
                <TabsList
                  class="grid w-full grid-cols-4 sm:inline-flex sm:w-fit"
                >
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
                class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
              >
                <Badge v-if="store.activeRun.gitRef" variant="outline">
                  {{ store.activeRun.gitRef }}
                </Badge>
                <Separator
                  v-if="store.activeRun.gitRef && store.activeRun.timestamp"
                  orientation="vertical"
                  class="data-[orientation=vertical]:h-3.5"
                />
                <span v-if="store.activeRun.timestamp" class="tabular-nums">
                  {{ store.activeRun.timestamp }}
                </span>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2.5">
              <InputGroup class="min-w-[200px] flex-1">
                <InputGroupAddon
                  class="pointer-events-none absolute inset-y-0 left-0"
                >
                  <Search class="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  id="ci-search-input"
                  v-model="store.searchQuery"
                  :placeholder="$t('logs.search_placeholder')"
                  class="pr-9 pl-9"
                />
                <InputGroupAddon
                  v-if="store.searchQuery"
                  class="absolute inset-y-0 right-0 px-1.5"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    :aria-label="$t('logs.clear_filters')"
                    @click="store.searchQuery = ''"
                  >
                    <X />
                  </Button>
                </InputGroupAddon>
              </InputGroup>

              <Select v-model="store.scopeFilter">
                <SelectTrigger class="w-full sm:w-[200px]">
                  <SelectValue :placeholder="$t('logs.all_scopes')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
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
                  </SelectGroup>
                </SelectContent>
              </Select>

              <div class="flex shrink-0 items-center gap-3">
                <div class="flex items-center gap-1.5">
                  <Switch id="ci-regex-toggle" v-model="store.regexEnabled" />
                  <Label
                    for="ci-regex-toggle"
                    class="cursor-pointer whitespace-nowrap"
                  >
                    {{ $t('logs.regex_label') }}
                  </Label>
                </div>

                <div class="flex items-center gap-1.5">
                  <Switch id="ci-hide-noise" v-model="store.hideNoise" />
                  <Label
                    for="ci-hide-noise"
                    class="cursor-pointer whitespace-nowrap"
                  >
                    {{ $t('logs.hide_noise') }}
                  </Label>
                </div>
              </div>

              <Button
                v-if="hasActiveFilter"
                variant="ghost"
                @click="store.resetFilters()"
              >
                <FilterX data-icon="inline-start" />
                <span>{{ $t('logs.clear_filters') }}</span>
              </Button>
            </div>

            <p v-if="store.searchError" class="text-sm text-destructive">
              {{ store.searchError }}
            </p>
          </CardContent>
        </Card>

        <!-- Summary View -->
        <Card v-if="store.severityFilter === 'summary' && store.activeRun">
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <FileText class="size-4 text-primary" />
              <span>{{ $t('logs.summary_title') }}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="rounded-lg border bg-muted/30 p-3 font-mono text-sm">
              <p
                v-for="(line, idx) in store.activeRun.summaryLines"
                :key="idx"
                class="py-0.5"
                :class="[
                  line.includes('[FAIL') ? 'text-destructive' : 'text-primary',
                ]"
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

        <!-- Step Trace -->
        <template v-else>
          <Card v-if="visibleSteps.length > 0">
            <CardContent>
              <Trace class="gap-3">
                <TraceCollapsible
                  v-for="{ step, filteredLines } in visibleSteps"
                  :key="`${store.activeRun?.suite}-${step.name}`"
                  :open="isStepOpen(step.name, step.status)"
                  @update:open="(val) => setStepOpen(step.name, Boolean(val))"
                >
                  <div class="flex items-center justify-between gap-2">
                    <TraceCollapsibleTrigger class="min-w-0 flex-1">
                      <TraceLine
                        :status="traceLineStatus(step.status)"
                        class="min-w-0"
                      >
                        <TraceIcon>
                          <XCircle v-if="step.status === 'fail'" />
                          <Loader2
                            v-else-if="step.status === 'running'"
                            class="animate-spin"
                          />
                          <CheckCircle2 v-else class="text-primary" />
                        </TraceIcon>
                        <TraceTitle class="text-foreground font-medium">
                          {{ step.name }}
                        </TraceTitle>
                        <TraceDescription class="min-w-0 truncate">
                          {{ step.command }}
                        </TraceDescription>
                      </TraceLine>
                    </TraceCollapsibleTrigger>

                    <div class="flex shrink-0 items-center gap-2">
                      <Badge v-if="step.errorCount > 0" variant="destructive">
                        {{ step.errorCount }} err
                      </Badge>
                      <Badge variant="outline">
                        {{ filteredLines.length }} lines
                      </Badge>
                      <span
                        class="w-14 text-right text-sm text-muted-foreground tabular-nums"
                      >
                        {{
                          step.seconds != null
                            ? `${step.seconds.toFixed(1)}s`
                            : '...'
                        }}
                      </span>
                      <Button
                        size="xs"
                        variant="ghost"
                        @click="
                          copyText(step.command, $t('logs.copied_command'))
                        "
                      >
                        <Copy data-icon="inline-start" />
                        <span>{{ $t('logs.copy_btn') }}</span>
                      </Button>
                    </div>
                  </div>

                  <TraceCollapsibleContent class="pr-0">
                    <ScrollArea class="max-h-[420px] rounded-md border">
                      <div
                        v-if="filteredLines.length === 0"
                        class="p-4 text-center text-sm text-muted-foreground"
                      >
                        {{ $t('logs.no_matching_lines') }}
                      </div>
                      <div
                        v-else
                        class="divide-y divide-border/20 py-1 font-mono"
                      >
                        <div
                          v-for="line in filteredLines"
                          :key="line.lineNo"
                          class="text-ui-caption grid grid-cols-[52px_minmax(0,1fr)] gap-2 px-3 py-0.5 leading-5 hover:bg-muted/40"
                          :class="[lineClass(line.severity)]"
                        >
                          <span
                            class="select-none text-right text-muted-foreground/70 tabular-nums"
                          >
                            {{ line.lineNo }}
                          </span>
                          <span class="min-w-0 whitespace-pre-wrap break-words">
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
                  </TraceCollapsibleContent>
                </TraceCollapsible>
              </Trace>
            </CardContent>
          </Card>

          <Empty v-else class="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Terminal />
              </EmptyMedia>
              <EmptyTitle>{{ $t('logs.empty_title') }}</EmptyTitle>
              <EmptyDescription>{{ $t('logs.empty_desc') }}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </template>
      </div>
    </div>

    <!-- Empty Logs Directory -->
    <Empty v-else class="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ScrollText />
        </EmptyMedia>
        <EmptyTitle>{{ $t('logs.empty_title') }}</EmptyTitle>
        <EmptyDescription>{{ $t('logs.empty_desc') }}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent v-if="store.runnerAvailable">
        <Button
          size="sm"
          :disabled="store.isRunning || store.startingRun"
          @click="handleRunCi()"
        >
          <Loader2
            v-if="store.isRunning || store.startingRun"
            class="animate-spin"
            data-icon="inline-start"
          />
          <Play v-else data-icon="inline-start" />
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
      </EmptyContent>
    </Empty>

    <Dialog v-model:open="rawLogOpen">
      <DialogContent class="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {{ store.activeRun?.filename || $t('logs.view_raw_btn') }}
          </DialogTitle>
          <DialogDescription>
            {{ $t('logs.description') }}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea class="max-h-[70vh] rounded-md border">
          <pre
            class="text-ui-caption p-3 font-mono leading-5 whitespace-pre-wrap break-words text-foreground/90"
            >{{ store.activeRun?.rawContent }}</pre>
        </ScrollArea>
        <DialogFooter show-close-button>
          <Button
            v-if="store.activeRun"
            variant="outline"
            @click="copyText(store.activeRun.rawContent, $t('logs.copied_log'))"
          >
            <Copy data-icon="inline-start" />
            <span>{{ $t('logs.copy_btn') }}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
