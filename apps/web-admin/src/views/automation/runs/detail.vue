<script lang="ts" setup>
import type { AutomaCampaignRunItem, AutomaExecutionLogItem } from '#/api';

import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  GitBranch,
  Laptop,
  PlayCircle,
  RefreshCw,
  Terminal,
  XCircle,
} from '@lucide/vue';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Button,
  toast,
} from '@tuquet/vue-ui';

import {
  calculateProgressPercentage,
  cancelCampaignRunApi,
  getCampaignRunDetailApi,
  getExecutionLogsApi,
  isRunActive,
} from '#/api';
import { useDateFormat } from '#/composables';

defineOptions({ name: 'AutomationRunDetail' });

const route = useRoute();
const router = useRouter();
const { formatDate } = useDateFormat();

const runId = computed(() => route.params.id as string);
const loading = ref(true);
const canceling = ref(false);
const run = ref<AutomaCampaignRunItem | null>(null);
const logs = ref<AutomaExecutionLogItem[]>([]);
const consoleRef = ref<HTMLElement | null>(null);

let pollTimer: null | ReturnType<typeof setInterval> = null;

const isActive = computed(() =>
  run.value ? isRunActive(run.value.status) : false,
);

const progressPct = computed(() => {
  if (!run.value) return 0;
  return calculateProgressPercentage(
    run.value.completed_tasks,
    run.value.total_tasks,
  );
});

function formatDuration(
  start: null | string | undefined,
  end: null | string | undefined,
): string {
  if (!start) return '—';
  const startTime = new Date(start).getTime();
  const endTime = end ? new Date(end).getTime() : Date.now();
  const diffSec = Math.max(0, Math.floor((endTime - startTime) / 1000));

  if (diffSec < 60) return `${diffSec}s`;
  const mins = Math.floor(diffSec / 60);
  const secs = diffSec % 60;
  return `${mins}m ${secs}s`;
}

function scrollToBottom() {
  nextTick(() => {
    if (consoleRef.value) {
      consoleRef.value.scrollTop = consoleRef.value.scrollHeight;
    }
  });
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function fetchRunAndLogs() {
  if (!runId.value) return;
  try {
    const detail = await getCampaignRunDetailApi(runId.value);
    if (detail) {
      run.value = detail;
    }

    const latestId =
      logs.value.length > 0 ? logs.value[logs.value.length - 1]?.id : undefined;
    const newLogs = await getExecutionLogsApi(runId.value, {
      limit: 200,
      sinceId: latestId,
    });

    if (newLogs.length > 0) {
      logs.value = [...logs.value, ...newLogs];
      scrollToBottom();
    }

    if (run.value && !isRunActive(run.value.status)) {
      stopPolling();
    }
  } catch (error: any) {
    console.error('[Automa Detail] Failed polling:', error);
  }
}

function startPolling() {
  stopPolling();
  if (isActive.value) {
    pollTimer = setInterval(() => {
      fetchRunAndLogs();
    }, 3000);
  }
}

async function handleCancelRun() {
  if (!runId.value) return;
  canceling.value = true;
  try {
    await cancelCampaignRunApi(runId.value);
    toast.success('Đã gửi yêu cầu hủy phiên chạy');
    await fetchRunAndLogs();
  } catch (error: any) {
    toast.error(error.message || 'Hủy phiên chạy thất bại');
  } finally {
    canceling.value = false;
  }
}

function handleGoBack() {
  router.push('/automation/runs');
}

onMounted(async () => {
  loading.value = true;
  try {
    await fetchRunAndLogs();
    startPolling();
  } catch (error: any) {
    toast.error(error.message || 'Không thể tải chi tiết phiên chạy');
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  stopPolling();
});
</script>

<template>
  <div class="space-y-4 p-4 sm:space-y-5 sm:p-5">
    <!-- Navigation & Action Header -->
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          class="size-8 shrink-0"
          title="Quay lại"
          @click="handleGoBack"
        >
          <ArrowLeft class="size-4" />
        </Button>
        <div>
          <div class="flex items-center gap-2">
            <h1
              class="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
            >
              {{ run?.name || 'Chi Tiết Phiên Chạy' }}
            </h1>
            <Badge v-if="run" variant="outline" class="text-xs font-normal">
              <span
                class="mr-1.5 size-1.5 rounded-full"
                :class="{
                  'bg-primary animate-pulse': run.status === 'running',
                  'bg-success': run.status === 'completed',
                  'bg-destructive': run.status === 'failed',
                  'bg-muted-foreground': run.status === 'cancelled',
                  'bg-warning animate-pulse':
                    run.status === 'pending' || run.status === 'queued',
                }"
              ></span>
              {{
                run.status === 'running'
                  ? 'Đang Chạy'
                  : run.status === 'completed'
                    ? 'Hoàn Thành'
                    : run.status === 'failed'
                      ? 'Thất Bại'
                      : run.status === 'cancelled'
                        ? 'Đã Hủy'
                        : 'Đang Chờ'
              }}
            </Badge>
          </div>
          <div class="font-mono text-xs text-muted-foreground">
            Run ID: {{ runId }}
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Live Polling Indicator -->
        <div
          v-if="isActive"
          class="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs text-muted-foreground"
        >
          <span class="size-2 rounded-full bg-success animate-pulse"></span>
          <span>Live Polling (3s)</span>
        </div>

        <AlertDialog v-if="isActive">
          <AlertDialogTrigger as-child>
            <Button
              variant="destructive"
              size="sm"
              :disabled="canceling"
              class="gap-1.5 h-8 text-xs font-medium"
            >
              <XCircle class="size-3.5" />
              <span>Hủy Phiên Chạy</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hủy phiên chạy chiến dịch?</AlertDialogTitle>
              <AlertDialogDescription>
                Tiến trình tự động hóa đang thực thi trên máy trạm runner sẽ bị
                dừng lại lập tức.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Đóng</AlertDialogCancel>
              <AlertDialogAction @click="handleCancelRun">
                Xác Nhận Hủy
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button
          variant="outline"
          size="icon"
          :disabled="loading"
          class="size-8 shrink-0"
          title="Làm mới"
          @click="fetchRunAndLogs"
        >
          <RefreshCw
            class="size-3.5 shrink-0"
            :class="{ 'animate-spin': loading }"
          />
        </Button>
      </div>
    </div>

    <!-- Error Banner (if run failed) -->
    <div
      v-if="run?.error_message"
      class="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive"
    >
      <AlertCircle class="size-4 shrink-0 mt-0.5" />
      <div>
        <div class="font-semibold">Chi Tiết Lỗi Thực Thi:</div>
        <div class="mt-1 font-mono break-all">{{ run.error_message }}</div>
      </div>
    </div>

    <!-- Overview Specs Grid -->
    <div
      v-if="run"
      class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      <!-- Metric 1: Workflow -->
      <div
        class="rounded-xl border border-border/60 bg-card p-4 shadow-sm space-y-1"
      >
        <div
          class="flex items-center justify-between text-xs text-muted-foreground"
        >
          <span>Quy Trình</span>
          <GitBranch class="size-3.5 text-muted-foreground" />
        </div>
        <div class="text-sm font-semibold text-foreground truncate">
          {{ run.workflow ? run.workflow.name : 'Chưa gắn workflow' }}
        </div>
        <div class="text-xs text-muted-foreground">Bản vẽ quy trình Automa</div>
      </div>

      <!-- Metric 2: Runner Device -->
      <div
        class="rounded-xl border border-border/60 bg-card p-4 shadow-sm space-y-1"
      >
        <div
          class="flex items-center justify-between text-xs text-muted-foreground"
        >
          <span>Máy Trạm Thực Thi</span>
          <Laptop class="size-3.5 text-muted-foreground" />
        </div>
        <div class="text-sm font-semibold text-foreground truncate">
          {{ run.runner ? run.runner.name : 'Điều phối tự động' }}
        </div>
        <div class="text-xs text-muted-foreground">Runner Node</div>
      </div>

      <!-- Metric 3: Duration -->
      <div
        class="rounded-xl border border-border/60 bg-card p-4 shadow-sm space-y-1"
      >
        <div
          class="flex items-center justify-between text-xs text-muted-foreground"
        >
          <span>Thời Lượng</span>
          <Clock class="size-3.5 text-muted-foreground" />
        </div>
        <div class="text-sm font-semibold text-foreground font-mono">
          {{ formatDuration(run.started_at, run.ended_at) }}
        </div>
        <div class="text-xs text-muted-foreground">
          Bắt đầu: {{ formatDate(run.started_at) }}
        </div>
      </div>

      <!-- Metric 4: Tasks Progress -->
      <div
        class="rounded-xl border border-border/60 bg-card p-4 shadow-sm space-y-1"
      >
        <div
          class="flex items-center justify-between text-xs text-muted-foreground"
        >
          <span>Tiến Độ Tác Vụ</span>
          <CheckCircle2 class="size-3.5 text-success" />
        </div>
        <div class="flex items-baseline justify-between">
          <span class="text-sm font-semibold text-foreground font-mono">
            {{ run.completed_tasks }} / {{ run.total_tasks }} tasks
          </span>
          <span class="text-xs font-mono font-bold text-primary">
            {{ progressPct }}%
          </span>
        </div>
        <div class="h-1.5 w-full rounded-full bg-muted overflow-hidden mt-1">
          <div
            class="h-full rounded-full bg-primary transition-all"
            :style="{ width: `${progressPct}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Execution Logs Console Section -->
    <div
      class="rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm space-y-3"
    >
      <div
        class="flex items-center justify-between border-b border-border/40 pb-3"
      >
        <div class="flex items-center gap-2">
          <Terminal class="size-4 text-muted-foreground" />
          <span class="text-sm font-semibold text-foreground">
            Nhật Ký Thực Thi (Execution Logs)
          </span>
          <Badge variant="outline" class="font-mono text-xs">
            {{ logs.length }} dòng
          </Badge>
        </div>

        <div class="text-xs text-muted-foreground">
          {{ isActive ? 'Đang cập nhật thời gian thực...' : 'Đã hoàn tất' }}
        </div>
      </div>

      <!-- Terminal Output Window -->
      <div
        ref="consoleRef"
        class="max-h-[500px] min-h-[300px] overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-950 p-4 font-mono text-xs text-neutral-300 space-y-1.5"
      >
        <div
          v-for="log in logs"
          :key="log.id"
          class="flex items-start gap-2 hover:bg-neutral-900/50 py-0.5 px-1 rounded transition-colors"
        >
          <span class="text-neutral-500 shrink-0 select-none">
            {{ formatDate(log.logged_at) }}
          </span>
          <span
            class="font-semibold uppercase shrink-0 text-2xs px-1 py-0.5 rounded"
            :class="{
              'text-success bg-success/20': log.level === 'info',
              'text-warning bg-warning/20': log.level === 'warn',
              'text-destructive bg-destructive/20':
                log.level === 'error' || log.level === 'fatal',
              'text-primary bg-primary/20':
                log.level === 'debug' || log.level === 'trace',
            }"
          >
            {{ log.level }}
          </span>
          <span
            v-if="log.step_name"
            class="text-neutral-400 font-semibold shrink-0"
          >
            [{{ log.step_name }}]
          </span>
          <span class="text-neutral-200 break-all flex-1">
            {{ log.message }}
          </span>
        </div>

        <!-- Empty Logs State -->
        <div
          v-if="logs.length === 0 && !loading"
          class="flex h-48 flex-col items-center justify-center text-center text-neutral-500"
        >
          <PlayCircle class="size-6 text-neutral-600 mb-2" />
          <span>Chưa có nhật ký thực thi nào được ghi lại.</span>
        </div>
      </div>
    </div>
  </div>
</template>
