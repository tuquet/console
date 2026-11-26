import type { CiSuiteTarget } from '../api/ci-logs';
import type {
  CiLogLine,
  CiLogRun,
  CiSeverityFilter,
  CiStepBlock,
} from '../utils/ci-log-parser';

import { computed, ref } from 'vue';

import { useKernel } from '@operon/kernel';

import { defineStore } from 'pinia';

import { createCiLogsApi } from '../api/ci-logs';
import {
  buildSearchMatcher,
  lineMatchesFilter,
  parseCiLogsResponse,
} from '../utils/ci-log-parser';

export interface FilteredCiStep {
  filteredLines: CiLogLine[];
  step: CiStepBlock;
}

export const ALL_FILTER_VALUE = '__all__';

export const useCiLogsStore = defineStore('operon:ci-logs', () => {
  const kernel = useKernel();
  const api = createCiLogsApi(kernel.api);

  const logsDir = ref<null | string>(null);
  const runs = ref<CiLogRun[]>([]);
  const runnerAvailable = ref(false);
  const runningSuites = ref<string[]>([]);
  const targetSuite = ref<CiSuiteTarget>('all');
  const startingRun = ref(false);
  const loading = ref(false);
  const errorMessage = ref<null | string>(null);
  const lastFetchedAt = ref<null | string>(null);

  const selectedSuite = ref('');
  const selectedStep = ref(ALL_FILTER_VALUE);
  const severityFilter = ref<CiSeverityFilter>('all');
  const scopeFilter = ref(ALL_FILTER_VALUE);
  const searchQuery = ref('');
  const regexEnabled = ref(false);
  const hideNoise = ref(true);
  const liveTail = ref(false);

  let pollTimer: null | ReturnType<typeof setInterval> = null;

  const activeRun = computed<CiLogRun | null>(() => {
    if (runs.value.length === 0) return null;
    return (
      runs.value.find((run) => run.suite === selectedSuite.value) ??
      runs.value[0] ??
      null
    );
  });

  const availableScopes = computed<string[]>(() => {
    const run = activeRun.value;
    if (!run) return [];
    const tags = new Set<string>();
    for (const step of run.steps) {
      for (const line of step.lines) {
        if (line.packageTag) tags.add(line.packageTag);
      }
    }
    return [...tags].toSorted();
  });

  const searchState = computed(() =>
    buildSearchMatcher(searchQuery.value, regexEnabled.value),
  );

  const filteredSteps = computed<FilteredCiStep[]>(() => {
    const run = activeRun.value;
    if (!run) return [];

    const stepTarget =
      selectedStep.value === ALL_FILTER_VALUE ? '' : selectedStep.value;
    const scopeTarget =
      scopeFilter.value === ALL_FILTER_VALUE ? '' : scopeFilter.value;
    const steps = stepTarget
      ? run.steps.filter((step) => step.name === stepTarget)
      : run.steps;

    return steps.map((step) => ({
      step,
      filteredLines: step.lines.filter((line) =>
        lineMatchesFilter(line, {
          hideNoise: hideNoise.value,
          matcher: searchState.value.matcher,
          scope: scopeTarget,
          severity: severityFilter.value,
        }),
      ),
    }));
  });

  const totalMatchedLines = computed(() =>
    filteredSteps.value.reduce(
      (sum, entry) => sum + entry.filteredLines.length,
      0,
    ),
  );

  function pickDefaultSuite(list: CiLogRun[]) {
    if (list.some((r) => r.suite === selectedSuite.value)) return;
    const failed = list.find((r) => r.status === 'fail');
    selectedSuite.value = failed?.suite ?? list[0]?.suite ?? '';
  }

  async function fetchLogs(silent = false) {
    if (!silent) loading.value = true;
    errorMessage.value = null;
    try {
      const payload = await api.fetchCiLogs();
      logsDir.value = payload.logsDir;
      runnerAvailable.value = Boolean(payload.runnerAvailable);
      runningSuites.value = payload.runningSuites ?? [];
      runs.value = parseCiLogsResponse(payload);
      pickDefaultSuite(runs.value);
      lastFetchedAt.value = new Date().toISOString();
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Failed to load local CI logs';
    } finally {
      loading.value = false;
    }
  }

  function selectSuite(suite: string) {
    selectedSuite.value = suite;
    selectedStep.value = ALL_FILTER_VALUE;
    scopeFilter.value = ALL_FILTER_VALUE;
  }

  function resetFilters() {
    selectedStep.value = ALL_FILTER_VALUE;
    scopeFilter.value = ALL_FILTER_VALUE;
    severityFilter.value = 'all';
    searchQuery.value = '';
    regexEnabled.value = false;
    hideNoise.value = true;
  }

  function setLiveTail(enabled: boolean) {
    liveTail.value = enabled;
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    if (enabled) {
      pollTimer = setInterval(() => {
        void fetchLogs(true);
      }, 2000);
    }
  }

  const isRunning = computed(() => runningSuites.value.length > 0);

  async function runCi(suite: CiSuiteTarget = targetSuite.value) {
    startingRun.value = true;
    errorMessage.value = null;
    try {
      await api.triggerCiRun(suite);
      runningSuites.value = [suite];
      if (suite !== 'all') {
        selectedSuite.value = suite;
      }
      if (!liveTail.value) {
        setLiveTail(true);
      }
      await fetchLogs(true);
      return true;
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Failed to start local CI run';
      return false;
    } finally {
      startingRun.value = false;
    }
  }

  return {
    activeRun,
    availableScopes,
    error: errorMessage,
    fetchLogs,
    filteredSteps,
    hideNoise,
    isRunning,
    lastFetchedAt,
    liveTail,
    loading,
    logsDir,
    regexEnabled,
    resetFilters,
    runCi,
    runnerAvailable,
    runningSuites,
    runs,
    scopeFilter,
    searchError: computed(() => searchState.value.error),
    searchMatcher: computed(() => searchState.value.matcher),
    searchQuery,
    selectedStep,
    selectedSuite,
    selectSuite,
    setLiveTail,
    severityFilter,
    startingRun,
    targetSuite,
    totalMatchedLines,
  };
});
