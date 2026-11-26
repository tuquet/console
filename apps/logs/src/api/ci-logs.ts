import type { KernelApiContext } from '@operon/kernel';

export interface CiCacheEntry {
  at: string;
  hash: string;
}

export interface CiLogFileEntry {
  content: string;
  name: string;
  sizeBytes: number;
  suite: string;
  updatedAt: string;
}

export type CiSuiteTarget = 'all' | 'console' | 'core' | 'docker' | 'glossary';

export interface CiLogsApiResponse {
  cache: Record<string, CiCacheEntry>;
  files: CiLogFileEntry[];
  logsDir: null | string;
  runnerAvailable?: boolean;
  runningSuites?: string[];
}

export interface CiRunTriggerResponse {
  started: boolean;
  suite: CiSuiteTarget;
}

export function createCiLogsApi(api: KernelApiContext) {
  return {
    fetchCiLogs: () =>
      api.localDaemonFetch<CiLogsApiResponse>('/api/v1/system/ci-logs'),
    triggerCiRun: (suite: CiSuiteTarget) =>
      api.localDaemonFetch<CiRunTriggerResponse>('/api/v1/system/ci-run', {
        body: JSON.stringify({ suite }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      }),
  };
}
