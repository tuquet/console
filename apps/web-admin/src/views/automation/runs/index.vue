<script lang="ts" setup>
import type { AutomaCampaignRunItem } from '#/api';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Eye, Laptop, PlayCircle, RefreshCw } from '@lucide/vue';
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@tuquet/vue-ui';

import { calculateProgressPercentage, getCampaignRunsApi } from '#/api';
import { useDateFormat } from '#/composables';

defineOptions({ name: 'AutomationRuns' });

const route = useRoute();
const router = useRouter();
const { formatDate } = useDateFormat();

const loading = ref(true);
const runs = ref<AutomaCampaignRunItem[]>([]);

const VALID_STATUSES = new Set([
  'all',
  'cancelled',
  'completed',
  'failed',
  'pending',
  'queued',
  'running',
]);

const filterStatus = computed({
  get() {
    const s = route.query.status as string;
    return VALID_STATUSES.has(s) ? s : 'all';
  },
  set(val: string) {
    router.replace({
      query: {
        ...route.query,
        status: val === 'all' ? undefined : val,
      },
    });
  },
});

const filteredRuns = computed(() => {
  if (filterStatus.value === 'all') return runs.value;
  if (filterStatus.value === 'pending') {
    return runs.value.filter(
      (r) => r.status === 'pending' || r.status === 'queued',
    );
  }
  return runs.value.filter((r) => r.status === filterStatus.value);
});

async function loadRuns() {
  loading.value = true;
  try {
    const tenantId = (route.query.tenant as string) || undefined;
    const workflowId = (route.query.workflow as string) || undefined;
    runs.value = await getCampaignRunsApi({ tenantId, workflowId });
  } catch (error: any) {
    toast.error(error.message || 'Không thể tải danh sách phiên chạy');
  } finally {
    loading.value = false;
  }
}

function handleViewDetail(id: string) {
  router.push(`/automation/runs/${id}`);
}

watch(
  () => [route.query.tenant, route.query.workflow],
  () => {
    loadRuns();
  },
);

onMounted(() => {
  loadRuns();
});
</script>

<template>
  <div class="space-y-4 p-4 sm:space-y-5 sm:p-5">
    <!-- Top Header -->
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex items-center gap-2.5">
        <h1
          class="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
        >
          Phiên Chạy Chiến Dịch
        </h1>
        <Badge variant="secondary" class="font-mono text-xs uppercase">
          Campaign Runs
        </Badge>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          :disabled="loading"
          class="size-8 shrink-0"
          title="Làm mới"
          @click="loadRuns"
        >
          <RefreshCw
            class="size-3.5 shrink-0"
            :class="{ 'animate-spin': loading }"
          />
        </Button>
      </div>
    </div>

    <!-- Main Container -->
    <div
      class="rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm space-y-4"
    >
      <!-- Filter Bar -->
      <div
        class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4"
      >
        <div class="flex items-center gap-2">
          <PlayCircle class="size-4 shrink-0 text-muted-foreground" />
          <span class="text-sm font-semibold text-foreground">
            Danh Sách Phiên Chạy
          </span>
          <span class="text-xs text-muted-foreground">
            ({{ filteredRuns.length }} / {{ runs.length }})
          </span>
        </div>

        <div
          class="inline-flex flex-wrap rounded-lg border border-border/60 bg-muted/40 p-1"
        >
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs font-medium transition-all"
            :class="
              filterStatus === 'all'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="filterStatus = 'all'"
          >
            Tất Cả ({{ runs.length }})
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs font-medium transition-all"
            :class="
              filterStatus === 'running'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="filterStatus = 'running'"
          >
            Đang Chạy ({{ runs.filter((r) => r.status === 'running').length }})
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs font-medium transition-all"
            :class="
              filterStatus === 'completed'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="filterStatus = 'completed'"
          >
            Hoàn Thành ({{
              runs.filter((r) => r.status === 'completed').length
            }})
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs font-medium transition-all"
            :class="
              filterStatus === 'failed'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="filterStatus = 'failed'"
          >
            Thất Bại ({{ runs.filter((r) => r.status === 'failed').length }})
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs font-medium transition-all"
            :class="
              filterStatus === 'cancelled'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="filterStatus = 'cancelled'"
          >
            Đã Hủy ({{ runs.filter((r) => r.status === 'cancelled').length }})
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs font-medium transition-all"
            :class="
              filterStatus === 'pending'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="filterStatus = 'pending'"
          >
            Đang Chờ ({{
              runs.filter(
                (r) => r.status === 'pending' || r.status === 'queued',
              ).length
            }})
          </button>
        </div>
      </div>

      <!-- Desktop Table -->
      <div
        v-if="filteredRuns.length > 0"
        class="hidden md:block overflow-x-auto rounded-lg border border-border/60"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phiên Chạy & Quy Trình</TableHead>
              <TableHead>Máy Trạm Đảm Nhiệm</TableHead>
              <TableHead>Tiến Độ Thực Thi</TableHead>
              <TableHead>Trạng Thái</TableHead>
              <TableHead>Thời Gian Tạo</TableHead>
              <TableHead class="text-right">Thao Tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="r in filteredRuns" :key="r.id">
              <TableCell>
                <div class="flex items-center gap-2.5">
                  <div
                    class="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground"
                  >
                    <PlayCircle class="size-4" />
                  </div>
                  <div>
                    <div class="font-medium text-foreground">
                      {{ r.name }}
                    </div>
                    <div class="text-xs text-muted-foreground">
                      {{ r.workflow ? r.workflow.name : 'Chưa gắn quy trình' }}
                    </div>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <div
                  v-if="r.runner"
                  class="inline-flex items-center gap-1.5 text-xs text-foreground font-medium"
                >
                  <Laptop class="size-3.5 text-muted-foreground shrink-0" />
                  <span>{{ r.runner.name }}</span>
                </div>
                <span v-else class="text-xs text-muted-foreground">
                  Điều phối tự động
                </span>
              </TableCell>

              <TableCell>
                <div class="w-44 space-y-1">
                  <div
                    class="flex items-center justify-between text-xs font-mono"
                  >
                    <span class="text-foreground">
                      {{ r.completed_tasks }} / {{ r.total_tasks }} tasks
                    </span>
                    <span class="text-muted-foreground font-semibold">
                      {{
                        calculateProgressPercentage(
                          r.completed_tasks,
                          r.total_tasks,
                        )
                      }}%
                    </span>
                  </div>
                  <div
                    class="h-1.5 w-full rounded-full bg-muted overflow-hidden"
                  >
                    <div
                      class="h-full rounded-full transition-all"
                      :class="{
                        'bg-primary': r.status === 'running',
                        'bg-success': r.status === 'completed',
                        'bg-destructive': r.status === 'failed',
                        'bg-muted-foreground':
                          r.status === 'cancelled' ||
                          r.status === 'pending' ||
                          r.status === 'queued',
                      }"
                      :style="{
                        width: `${calculateProgressPercentage(r.completed_tasks, r.total_tasks)}%`,
                      }"
                    ></div>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <Badge variant="outline" class="text-xs font-normal">
                  <span
                    class="mr-1.5 size-1.5 rounded-full"
                    :class="{
                      'bg-primary animate-pulse': r.status === 'running',
                      'bg-success': r.status === 'completed',
                      'bg-destructive': r.status === 'failed',
                      'bg-muted-foreground': r.status === 'cancelled',
                      'bg-warning animate-pulse':
                        r.status === 'pending' || r.status === 'queued',
                    }"
                  ></span>
                  {{
                    r.status === 'running'
                      ? 'Đang Chạy'
                      : r.status === 'completed'
                        ? 'Hoàn Thành'
                        : r.status === 'failed'
                          ? 'Thất Bại'
                          : r.status === 'cancelled'
                            ? 'Đã Hủy'
                            : 'Đang Chờ'
                  }}
                </Badge>
              </TableCell>

              <TableCell class="text-xs text-muted-foreground">
                {{ formatDate(r.created_at) }}
              </TableCell>

              <TableCell class="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  class="h-7 text-xs flex items-center gap-1 inline-flex"
                  @click="handleViewDetail(r.id)"
                >
                  <Eye class="size-3 shrink-0" />
                  <span>Chi Tiết</span>
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <!-- Mobile Touch Cards -->
      <div v-if="filteredRuns.length > 0" class="block space-y-3 md:hidden">
        <div
          v-for="r in filteredRuns"
          :key="r.id"
          class="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-3"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <div
                class="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground"
              >
                <PlayCircle class="size-4.5" />
              </div>
              <div>
                <div class="font-semibold text-foreground text-sm">
                  {{ r.name }}
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ r.workflow ? r.workflow.name : 'Chưa gắn quy trình' }}
                </div>
              </div>
            </div>

            <Badge variant="outline" class="text-xs font-normal">
              <span
                class="mr-1.5 size-1.5 rounded-full"
                :class="{
                  'bg-primary animate-pulse': r.status === 'running',
                  'bg-success': r.status === 'completed',
                  'bg-destructive': r.status === 'failed',
                  'bg-muted-foreground': r.status === 'cancelled',
                  'bg-warning animate-pulse':
                    r.status === 'pending' || r.status === 'queued',
                }"
              ></span>
              {{
                r.status === 'running'
                  ? 'Đang Chạy'
                  : r.status === 'completed'
                    ? 'Hoàn Thành'
                    : r.status === 'failed'
                      ? 'Thất Bại'
                      : r.status === 'cancelled'
                        ? 'Đã Hủy'
                        : 'Đang Chờ'
              }}
            </Badge>
          </div>

          <!-- Progress Bar -->
          <div class="space-y-1">
            <div class="flex items-center justify-between text-xs font-mono">
              <span class="text-muted-foreground">
                {{ r.completed_tasks }} / {{ r.total_tasks }} tasks
              </span>
              <span class="text-foreground font-semibold">
                {{
                  calculateProgressPercentage(r.completed_tasks, r.total_tasks)
                }}%
              </span>
            </div>
            <div class="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="{
                  'bg-primary': r.status === 'running',
                  'bg-success': r.status === 'completed',
                  'bg-destructive': r.status === 'failed',
                  'bg-muted-foreground':
                    r.status === 'cancelled' ||
                    r.status === 'pending' ||
                    r.status === 'queued',
                }"
                :style="{
                  width: `${calculateProgressPercentage(r.completed_tasks, r.total_tasks)}%`,
                }"
              ></div>
            </div>
          </div>

          <div
            class="flex items-center justify-between border-t border-border/40 pt-2 text-xs text-muted-foreground"
          >
            <span>{{ r.runner ? r.runner.name : 'Tự động' }}</span>
            <Button
              variant="outline"
              size="sm"
              class="h-7 text-xs"
              @click="handleViewDetail(r.id)"
            >
              Chi Tiết
            </Button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="filteredRuns.length === 0 && !loading"
        class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-12 text-center"
      >
        <div
          class="flex size-12 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground"
        >
          <PlayCircle class="size-6" />
        </div>
        <h3 class="mt-3 text-sm font-semibold text-foreground">
          {{
            filterStatus === 'all'
              ? 'Chưa có phiên chạy nào'
              : 'Không có phiên chạy phù hợp bộ lọc'
          }}
        </h3>
        <p class="mt-1 max-w-sm text-xs text-muted-foreground">
          {{
            filterStatus === 'all'
              ? 'Các phiên chạy chiến dịch được phân phối và thực thi tự động qua các máy trạm Runner.'
              : 'Thử chuyển sang bộ lọc khác để kiểm tra trạng thái các phiên chạy.'
          }}
        </p>
      </div>
    </div>
  </div>
</template>
